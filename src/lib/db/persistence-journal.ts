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
  descriptorThreadId,
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
// Scrub on delete (operator decision 2026-09-26)
// ---------------------------------------------------------------------------

/**
 * Removes every descriptor referencing `threadId` from every
 * `knowme-pending-writes-v1:*` key currently in `localStorage` — this tab's
 * own key and any other tab's, live or dead. Called synchronously when a
 * thread is deleted, so a journal written before the delete (by this tab or
 * another) can never resurrect the thread or restore a stale field on
 * replay. A key left with no descriptors after scrubbing is removed
 * entirely. Deliberately does not distinguish live from dead keys — unlike
 * replay, scrubbing a live tab's key is intended: the accepted residual is
 * that a live tab which still holds the deleted thread in memory can write
 * it back through its own next save (design.md, "Accepted residual").
 */
export function scrubThreadFromJournals(threadId: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;

  const prefix = `${JOURNAL_KEY_PREFIX}:`;
  const keys: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
  } catch (error) {
    console.error("[persistence-journal] failed to enumerate journal keys while scrubbing a deleted thread", error);
    return;
  }

  for (const key of keys) {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      continue;
    }
    if (!raw) continue;

    let payload: JournalPayload;
    try {
      payload = JSON.parse(raw) as JournalPayload;
    } catch {
      continue;
    }
    if (payload?.version !== JOURNAL_VERSION || !Array.isArray(payload.descriptors)) continue;

    const kept = payload.descriptors.filter((d) => descriptorThreadId(d) !== threadId);
    if (kept.length === payload.descriptors.length) continue;

    if (kept.length === 0) {
      clearJournalKey(storage, key);
    } else {
      trySetJournal(storage, key, kept);
    }
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
 * Keeps the journal current on every write-queue change: if this tab's key
 * currently holds a journal, rewrite it to the CURRENT pending set —
 * clearing it once that's empty — so it only ever holds the unsettled
 * suffix (chat-persistence-durability task 1.2 follow-up), rather than a
 * stale snapshot from the last hide/pagehide that a crash would replay
 * pointlessly (safe, since every write is idempotent, but wasteful, and it
 * can re-surface a failure that already resolved).
 *
 * While the page is currently hidden, this ALSO creates a journal that
 * doesn't exist yet, for any write newly enqueued while hidden. Without
 * this, a write queued after the hidden transition already fired has no
 * event left to journal it on: `visibilitychange` only fires on the
 * transition into "hidden", not again while the page stays hidden, so a
 * page that crashes or is killed while backgrounded would lose a save that
 * was never journaled at all (spec: "while saves are pending, the system
 * SHALL record those pending saves synchronously" — task item 2 fix). While
 * visible, a journal is still only ever kept in sync, never created
 * pre-emptively — creating one is reserved for the hidden case and for the
 * explicit pagehide/hidden-transition handlers below.
 */
// Re-entrancy guard: writeJournalToKey's quota-shrink path calls
// reportFailure, whose emitChange synchronously re-invokes every
// subscribeWriteQueue listener — including this one — before the outer
// call has returned. Without this guard that's unbounded mutual recursion
// (syncJournalOnQueueChange -> writeJournalToKey -> reportFailure ->
// emitChange -> syncJournalOnQueueChange -> ...) and a stack overflow.
let syncingJournal = false;

function syncJournalOnQueueChange(): void {
  if (syncingJournal) return;
  syncingJournal = true;
  try {
    const storage = safeLocalStorage();
    if (!storage) return;
    const key = journalKeyForTab(getTabId());
    const pending = pendingWriteDescriptors();

    if (pending.length === 0) {
      clearJournalKey(storage, key);
      return;
    }

    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      writeJournalToKey(storage, key, pending);
      return;
    }

    let hasJournal: boolean;
    try {
      hasJournal = storage.getItem(key) !== null;
    } catch {
      return;
    }
    if (!hasJournal) return;
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

// ---------------------------------------------------------------------------
// Duplicated-tab detection (task item 3)
// ---------------------------------------------------------------------------

/**
 * Resolves once this tab's id (`getTabId()`) is confirmed not to collide
 * with a still-live tab's. Chrome's (and other browsers') "duplicate tab"
 * copies `sessionStorage` verbatim into the new tab, so the duplicate
 * inherits the SAME `knowme-tab-id` — and so the same journal key — as the
 * tab it was duplicated from, which is still alive. Without this check, the
 * duplicate would treat that shared key as its own and replay/clear it
 * unconditionally on startup (`replayJournal`'s own-key path), destroying
 * the original tab's live pending state.
 *
 * Detection: probe the inherited id's journal-key lock with
 * `{ifAvailable: true}`. If it's already held, a live tab owns that id, so
 * this tab mints a fresh one (persisted to `sessionStorage`) and adopts it
 * instead. A no-op without Web Locks — there is then no way to detect the
 * collision at all, same as the rest of this module's Web-Locks fallback.
 *
 * Memoized: every caller within this tab's lifetime awaits the same
 * resolution, and `installPersistenceJournal`'s page-lifetime lock request
 * (below) is only issued once it settles, so that request always targets
 * the final, de-duplicated id.
 *
 * Not awaited by `writeJournal`/`syncJournalOnQueueChange` (the
 * `pagehide`/hidden-write paths): those must stay synchronous, so a
 * pagehide firing before this promise resolves — vanishingly rare, since it
 * requires closing a just-duplicated tab within the time a single Web Locks
 * round trip takes — is an accepted residual, not one this module can close
 * without giving up the synchronous unload write itself.
 */
let tabIdentityReady: Promise<void> | null = null;

function ensureUniqueTabIdentity(): Promise<void> {
  if (tabIdentityReady) return tabIdentityReady;
  tabIdentityReady = (async () => {
    if (!hasWebLocks()) return;

    const inheritedKey = journalKeyForTab(getTabId());
    const isFree = await new Promise<boolean>((resolve) => {
      navigator.locks
        .request(inheritedKey, { ifAvailable: true }, (lock) => {
          resolve(lock !== null);
        })
        .catch(() => resolve(true)); // Locks API erroring — proceed as this tab's own id, same as the no-Web-Locks fallback elsewhere.
    });
    if (isFree) return;

    // Another live tab already holds this id's lock — this tab inherited it
    // via a duplicated sessionStorage. Mint a fresh id so it gets its own
    // key and lock instead of sharing the original's.
    const freshId = crypto.randomUUID();
    try {
      window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, freshId);
    } catch {
      // sessionStorage unavailable — cachedTabId below still takes effect
      // for this tab's lifetime; only the reload-keeps-the-same-id property
      // is lost for it, same as getTabId()'s own fallback.
    }
    cachedTabId = freshId;
  })();
  return tabIdentityReady;
}

/**
 * Wires the `pagehide`/`visibilitychange` listeners, the
 * keep-the-journal-current subscription, and — where Web Locks are
 * available — acquires this tab's lock for its (de-duplicated, see
 * `ensureUniqueTabIdentity`) journal key, held for the page's lifetime (the
 * lock's executor promise never resolves; it is only released when the tab
 * navigates away, closes, or crashes). That lock is what lets another tab's
 * startup replay tell this tab's key apart from a dead tab's orphaned one,
 * without any explicit liveness protocol.
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
  subscribeWriteQueue(syncJournalOnQueueChange);

  if (hasWebLocks()) {
    void ensureUniqueTabIdentity().then(() => {
      const key = journalKeyForTab(getTabId());
      navigator.locks.request(key, () => new Promise<void>(() => {})).catch(() => {
        // Request aborted (e.g. a dev-mode hot reload tearing the module
        // down) — nothing to clean up; the lock is simply not held.
      });
    });
  }
}

installPersistenceJournal();

// ---------------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------------

/**
 * Whether a descriptor from ANOTHER (dead) tab's journal is safe to apply
 * against the current database state (operator decision 2026-09-26):
 * - `"skip-missing"`: the descriptor's thread no longer exists (deleted
 *   since that tab's journal was written) — applying it would either
 *   resurrect the thread (`upsertThread`/`touchThread`) or throw on the
 *   `messages.thread_id` foreign key (`upsertMessage`). `deleteThread` and
 *   `deleteMessages` are exempt: deleting an already-gone row is a harmless
 *   no-op, not a resurrection risk.
 * - `"skip-stale"`: the thread still exists, but an `upsertThread`'s own
 *   `updatedAt`, or (for `touchThread`, which carries no timestamp of its
 *   own) the current time, is older than the stored row's `updated_at` — a
 *   newer save already applied since that tab's journal was written.
 * - `"apply"`: safe to apply as-is.
 * This tab's own journal is exempt from all of this (see `replayKey`'s
 * `guard` parameter) — the single-tab ordering argument already covers it.
 */
async function checkForeignThreadGuard(
  db: CharcoalDb,
  descriptor: WriteDescriptor,
): Promise<"apply" | "skip-missing" | "skip-stale"> {
  const threadId = descriptorThreadId(descriptor);
  const storedUpdatedAt = await db.getThreadUpdatedAt(threadId);

  if (storedUpdatedAt === null) {
    // No row: an upsertThread is a creation (a new thread whose row never
    // landed before that tab died) and must apply. Resurrecting a deleted
    // thread is prevented by the scrub on delete, not here. Deletes are
    // harmless no-ops. Anything else targets a thread that neither exists
    // nor was created earlier in this journal, so it is skipped.
    return descriptor.kind === "upsertThread" ||
      descriptor.kind === "deleteThread" ||
      descriptor.kind === "deleteMessages"
      ? "apply"
      : "skip-missing";
  }

  if (descriptor.kind === "upsertThread") {
    return descriptor.thread.updatedAt < storedUpdatedAt ? "skip-stale" : "apply";
  }
  if (descriptor.kind === "touchThread") {
    // A foreign touch with no recorded time can't be proven newer: skip it.
    // A touch only reorders the list, so skipping loses nothing else.
    if (!descriptor.at) return "skip-stale";
    return descriptor.at < storedUpdatedAt ? "skip-stale" : "apply";
  }
  return "apply";
}

/**
 * Applies one descriptor during replay, honouring `checkForeignThreadGuard`
 * when `guard` is true. A skip is logged like any other diagnostic, never
 * reported through `reportFailure` — the spec treats it as a correctly
 * defeated stale/orphaned write, not a save failure.
 */
async function replayDescriptor(
  db: CharcoalDb,
  descriptor: WriteDescriptor,
  guard: boolean,
): Promise<void> {
  if (guard) {
    const outcome = await checkForeignThreadGuard(db, descriptor);
    if (outcome === "skip-missing") {
      console.error(
        "[persistence-journal] skipping replay of a descriptor for a thread that no longer exists",
        descriptor,
      );
      return;
    }
    if (outcome === "skip-stale") {
      console.error(
        "[persistence-journal] skipping stale replay: a newer save already applied",
        descriptor,
      );
      return;
    }
  }
  await applyDescriptor(db, descriptor);
}

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
 *
 * `guard` is true for another tab's (dead) key, false for this tab's own —
 * see `checkForeignThreadGuard`.
 */
async function replayKey(db: CharcoalDb, storage: Storage, key: string, guard: boolean): Promise<void> {
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
      await replayDescriptor(db, descriptor, guard);
    } catch (error) {
      reportFailure(descriptor, error);
    }
  }

  clearJournalKey(storage, key);
}

/**
 * Every `JOURNAL_KEY_PREFIX:*` key in storage other than `ownKey`. Guarded
 * (task item 4): `storage.length`/`storage.key()` enumeration failing here
 * must not propagate — `DbProvider` awaits `replayJournal` before it will
 * ever render the app, so an uncaught throw here would take the whole app
 * down the fatal "Database error" path over what is, at worst, a missed
 * cross-tab replay this one time. Own-key replay has already completed by
 * the time this runs (see `replayJournal`), so startup still finishes.
 */
function listOtherJournalKeys(storage: Storage, ownKey: string): string[] {
  const keys: string[] = [];
  const prefix = `${JOURNAL_KEY_PREFIX}:`;
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key !== ownKey && key.startsWith(prefix)) keys.push(key);
    }
  } catch (error) {
    console.error("[persistence-journal] failed to enumerate other tabs' journal keys — skipping cross-tab replay", error);
    return [];
  }
  return keys;
}

/**
 * Claims `key` only if nothing currently holds its Web Locks lock (i.e. its
 * owning tab is gone), replays it if so (guarded — see
 * `checkForeignThreadGuard`), and never touches it otherwise — a live tab's
 * journal is left strictly alone.
 */
async function tryReplayDeadTabKey(db: CharcoalDb, storage: Storage, key: string): Promise<void> {
  try {
    await navigator.locks.request(key, { ifAvailable: true }, async (lock) => {
      if (!lock) return; // held by a live tab
      await replayKey(db, storage, key, true);
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
 *
 * Awaits `ensureUniqueTabIdentity` first (task item 3): "this tab's own
 * key" must mean this tab's DE-DUPLICATED id, never an id inherited from a
 * still-live original tab — replaying that unconditionally would destroy
 * the original's live pending state.
 */
export async function replayJournal(db: CharcoalDb): Promise<void> {
  const storage = safeLocalStorage();
  if (!storage) return;

  await ensureUniqueTabIdentity();

  const ownKey = journalKeyForTab(getTabId());
  await replayKey(db, storage, ownKey, false);

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
 *
 * Awaits `ensureUniqueTabIdentity` first, for the same reason `replayJournal`
 * does (task item 3): "this tab's own key" must be resolved to this tab's
 * de-duplicated id before it's discarded.
 */
export async function discardJournalAfterPurge(): Promise<void> {
  const storage = safeLocalStorage();
  if (!storage) return;
  await ensureUniqueTabIdentity();
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
