/**
 * Page-exit journal for the write queue (chat-persistence-durability design
 * decision 5). Neither `pagehide` nor `visibilitychange` can hold the page
 * open for an async IndexedDB write, and `beforeunload` can only raise the
 * browser's leave-page prompt — so the only synchronous durable store
 * available at unload is `localStorage`.
 *
 * On `pagehide`, and on `visibilitychange` to "hidden" (the last reliable
 * signal on mobile browsers), the descriptors of every write still pending
 * are written to this tab's own key, in enqueue order. `DbProvider` replays
 * that key — plus any other tab's key whose Web Locks lock is free, i.e. a
 * dead tab — directly against the freshly opened database, before the app
 * is shown as ready. See `replayJournal` below.
 *
 * The journal is per tab (task 1.2 follow-up): `localStorage` is shared by
 * every same-origin tab, so one shared key would let any tab clear,
 * overwrite, or replay another live tab's pending writes. Each tab gets its
 * own key (`JOURNAL_KEY_PREFIX:<tabId>`, tab id from `sessionStorage`,
 * which is per-tab and survives a reload of that same tab) and holds a Web
 * Locks lock on that key for the page's lifetime, so another tab can tell
 * "this key's owner is still alive" apart from "this key's owner is gone
 * and its journal is orphaned" without any explicit liveness protocol.
 */
import {
  applyDescriptor,
  pendingWriteCount,
  pendingWriteDescriptors,
  reportFailure,
  subscribeWriteQueue,
  type WriteDescriptor,
} from "@/lib/db/write-queue";
import type { CharcoalDb } from "@/lib/db/pglite";

export const JOURNAL_KEY_PREFIX = "knowme-pending-writes-v1";
const TAB_ID_STORAGE_KEY = "knowme-tab-id";
const JOURNAL_VERSION = 1;

/** Kinds always kept when a journal has to be shrunk to fit storage quota — small, and what makes retry/regenerate and thread rows correct. */
const ALWAYS_KEEP_KINDS = new Set<WriteDescriptor["kind"]>([
  "deleteMessages",
  "deleteThread",
  "upsertThread",
  "touchThread",
]);

interface JournalPayload {
  version: number;
  descriptors: WriteDescriptor[];
}

// ---------------------------------------------------------------------------
// Tab identity
// ---------------------------------------------------------------------------

let cachedTabId: string | null = null;

/**
 * A random id for this tab, cached in `sessionStorage` so it survives a
 * reload of the SAME tab (sessionStorage is per-tab: a new tab, even same
 * origin, never sees it) but never a different one. Falls back to a fresh
 * id per call when `sessionStorage` itself is unavailable (Safari private
 * mode, storage disabled) — that only degrades cross-tab dead-key discovery
 * for this tab, which already requires the (separately guarded) Web Locks
 * API to do anything beyond this tab's own key.
 */
export function getTabId(): string {
  if (cachedTabId) return cachedTabId;
  try {
    let id = window.sessionStorage.getItem(TAB_ID_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, id);
    }
    cachedTabId = id;
  } catch {
    cachedTabId = crypto.randomUUID();
  }
  return cachedTabId;
}

export function journalKeyForTab(tabId: string): string {
  return `${JOURNAL_KEY_PREFIX}:${tabId}`;
}

function hasWebLocks(): boolean {
  return typeof navigator !== "undefined" && !!navigator.locks;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

/**
 * Guards every localStorage access. Quota errors and disabled storage
 * (Safari private mode, some embedded webviews) must not throw into a
 * `pagehide` handler or block startup — they are logged and treated as "no
 * journal available" rather than propagated.
 */
function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.error("[persistence-journal] localStorage unavailable", error);
    return null;
  }
}

function trySetJournal(storage: Storage, key: string, descriptors: WriteDescriptor[]): boolean {
  try {
    const payload: JournalPayload = { version: JOURNAL_VERSION, descriptors };
    storage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function clearJournalKey(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error("[persistence-journal] failed to clear journal", key, error);
  }
}

/**
 * Writes `descriptors` to `key`, shrinking if the full set doesn't fit
 * (typically `QuotaExceededError`). Drops the largest `upsertMessage`
 * entries first — deletes and thread rows are small and are what makes
 * retry/regenerate correct (design decision 5's honest residual for this
 * case), so they are kept until nothing else is left to drop. Relative
 * order among the survivors is preserved, since decision 1 depends on it.
 * Reports the loss once (the failure toast) when anything had to be
 * dropped, or when nothing fit at all.
 */
function writeJournalToKey(storage: Storage, key: string, descriptors: WriteDescriptor[]): void {
  if (descriptors.length === 0) return;
  if (trySetJournal(storage, key, descriptors)) return;

  const droppableLargestFirst = descriptors
    .filter((d) => !ALWAYS_KEEP_KINDS.has(d.kind))
    .sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length);

  const dropped = new Set<WriteDescriptor>();
  for (const candidate of droppableLargestFirst) {
    dropped.add(candidate);
    const kept = descriptors.filter((d) => !dropped.has(d));
    if (trySetJournal(storage, key, kept)) {
      console.error(
        `[persistence-journal] journal exceeded storage quota; dropped ${dropped.size} of ${descriptors.length} pending write(s) to fit`,
      );
      reportFailure(
        candidate,
        new Error("journal exceeded storage quota; this write was dropped from the page-exit journal"),
      );
      return;
    }
  }

  console.error(
    "[persistence-journal] failed to write journal even after dropping every droppable entry",
    descriptors.length,
  );
  const representative = descriptors[0];
  if (representative) {
    reportFailure(representative, new Error("journal exceeded storage quota"));
  }
}

// ---------------------------------------------------------------------------
// Write on page exit; keep in sync while hidden; clear on drain
// ---------------------------------------------------------------------------

/** Synchronously records the unsettled suffix of the queue to this tab's own key, if any is pending. */
function writeJournal(): void {
  const descriptors = pendingWriteDescriptors();
  if (descriptors.length === 0) return;
  const storage = safeLocalStorage();
  if (!storage) return;
  writeJournalToKey(storage, journalKeyForTab(getTabId()), descriptors);
}

/**
 * Keeps an already-written journal current. The journal is only ever
 * written eagerly on `pagehide`/hidden; without this, a snapshot taken
 * while N writes were pending would still describe all N after some of them
 * settle, so a crash before the next hide/pagehide would replay writes that
 * had already landed (safe, since every write is idempotent, but stale and
 * wasteful, and it can re-surface a failure that already resolved). Called
 * on every queue change: if this tab's key currently holds a journal,
 * rewrite it to the CURRENT pending set — clearing it once that's empty —
 * so it only ever holds the unsettled suffix (chat-persistence-durability
 * task 1.2 follow-up).
 */
// Re-entrancy guard: writeJournalToKey's quota-shrink path calls
// reportFailure, whose emitChange synchronously re-invokes every
// subscribeWriteQueue listener — including this one — before the outer
// call has returned. Without this guard that's unbounded mutual recursion
// (syncJournalIfPresent -> writeJournalToKey -> reportFailure ->
// emitChange -> syncJournalIfPresent -> ...) and a stack overflow.
let syncingJournal = false;

function syncJournalIfPresent(): void {
  if (syncingJournal) return;
  syncingJournal = true;
  try {
    const storage = safeLocalStorage();
    if (!storage) return;
    const key = journalKeyForTab(getTabId());

    let hasJournal: boolean;
    try {
      hasJournal = storage.getItem(key) !== null;
    } catch {
      return;
    }
    if (!hasJournal) return;

    const pending = pendingWriteDescriptors();
    if (pending.length === 0) {
      clearJournalKey(storage, key);
      return;
    }
    writeJournalToKey(storage, key, pending);
  } finally {
    syncingJournal = false;
  }
}

function handlePageHide(): void {
  writeJournal();
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden") writeJournal();
}

let installed = false;

/**
 * Wires the `pagehide`/`visibilitychange` listeners, the
 * keep-the-journal-current subscription, and — where Web Locks are
 * available — acquires this tab's lock for its journal key, held for the
 * page's lifetime (the lock's executor promise never resolves; it is only
 * released when the tab navigates away, closes, or crashes). That lock is
 * what lets another tab's startup replay tell this tab's key apart from a
 * dead tab's orphaned one, without any explicit liveness protocol.
 *
 * Idempotent, and a no-op outside a browser environment (SSR, node-based
 * unit tests). Runs once at module load below; exported so a test can
 * assert it was installed without depending on import order.
 */
export function installPersistenceJournal(): void {
  if (installed) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;
  window.addEventListener("pagehide", handlePageHide);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  subscribeWriteQueue(syncJournalIfPresent);

  if (hasWebLocks()) {
    const key = journalKeyForTab(getTabId());
    navigator.locks.request(key, () => new Promise<void>(() => {})).catch(() => {
      // Request aborted (e.g. a dev-mode hot reload tearing the module
      // down) — nothing to clean up; the lock is simply not held.
    });
  }
}

installPersistenceJournal();

// ---------------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------------

/**
 * Reads and replays the journal at `key`, in order, directly against `db` —
 * not through `enqueueWrite`/the module singleton, because replay runs
 * inside `CharcoalDb.open()`'s caller before `setDbInstance()` is called
 * (see `DbProvider`). Every descriptor kind is an upsert (`ON CONFLICT DO
 * UPDATE`) or a delete-by-id, so replaying an already-applied suffix over
 * itself is a no-op. A failing entry is reported (`reportFailure`, which
 * also drives the failure toast) and skipped; the rest still apply. An
 * unknown key version is discarded. The key is always removed when replay
 * finishes, whether or not anything failed.
 */
async function replayKey(db: CharcoalDb, storage: Storage, key: string): Promise<void> {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    console.error("[persistence-journal] failed to read journal", key, error);
    return;
  }
  if (!raw) return;

  let payload: JournalPayload;
  try {
    payload = JSON.parse(raw) as JournalPayload;
  } catch (error) {
    console.error("[persistence-journal] journal is not valid JSON — discarding", key, error);
    clearJournalKey(storage, key);
    return;
  }

  if (payload?.version !== JOURNAL_VERSION || !Array.isArray(payload.descriptors)) {
    console.error("[persistence-journal] unknown journal version — discarding", key, payload?.version);
    clearJournalKey(storage, key);
    return;
  }

  for (const descriptor of payload.descriptors) {
    try {
      await applyDescriptor(db, descriptor);
    } catch (error) {
      reportFailure(descriptor, error);
    }
  }

  clearJournalKey(storage, key);
}

/** Every `JOURNAL_KEY_PREFIX:*` key in storage other than `ownKey`. */
function listOtherJournalKeys(storage: Storage, ownKey: string): string[] {
  const keys: string[] = [];
  const prefix = `${JOURNAL_KEY_PREFIX}:`;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key !== ownKey && key.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

/**
 * Claims `key` only if nothing currently holds its Web Locks lock (i.e. its
 * owning tab is gone), replays it if so, and never touches it otherwise —
 * a live tab's journal is left strictly alone.
 */
async function tryReplayDeadTabKey(db: CharcoalDb, storage: Storage, key: string): Promise<void> {
  try {
    await navigator.locks.request(key, { ifAvailable: true }, async (lock) => {
      if (!lock) return; // held by a live tab
      await replayKey(db, storage, key);
    });
  } catch (error) {
    // Locks API erroring for this call — leave the key for a later
    // successful replay rather than risk a live tab's journal.
    console.error("[persistence-journal] lock request failed for", key, error);
  }
}

/**
 * Replays this tab's own journal unconditionally, then — only where Web
 * Locks are available — every other tab's journal key whose lock is
 * currently free. Without Web Locks there is no safe way to tell a dead
 * tab's orphaned key apart from a live one's, so only this tab's own key is
 * replayed (guard for browsers without `navigator.locks`).
 */
export async function replayJournal(db: CharcoalDb): Promise<void> {
  const storage = safeLocalStorage();
  if (!storage) return;

  const ownKey = journalKeyForTab(getTabId());
  await replayKey(db, storage, ownKey);

  if (!hasWebLocks()) return;

  for (const key of listOtherJournalKeys(storage, ownKey)) {
    await tryReplayDeadTabKey(db, storage, key);
  }
}

/**
 * After a corrupt-database purge and reopen (`DbProvider`'s retry path),
 * this tab's pending journal describes writes queued against the database
 * that was just deleted — replaying them onto the freshly recreated one
 * isn't safe (their thread rows may no longer exist, and the data those
 * writes referred to is gone regardless of what the journal says). Discard
 * this tab's journal instead of replaying it, and report the loss once.
 * Other tabs' keys are left untouched — this purge is local to this tab's
 * recovery path, and a live tab's journal must never be touched from here.
 */
export function discardJournalAfterPurge(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  const key = journalKeyForTab(getTabId());

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return;
  }
  if (!raw) return;

  let payload: JournalPayload | null = null;
  try {
    payload = JSON.parse(raw) as JournalPayload;
  } catch {
    // Already unreadable — nothing meaningful to report beyond the discard.
  }
  clearJournalKey(storage, key);

  const descriptor = payload?.descriptors?.[0];
  if (descriptor) {
    reportFailure(
      descriptor,
      new Error("local database was reset after a corruption recovery; pending saves were discarded"),
    );
  }
}
