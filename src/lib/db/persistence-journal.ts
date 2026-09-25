/**
 * Page-exit journal for the write queue (chat-persistence-durability design
 * decision 5). Neither `pagehide` nor `visibilitychange` can hold the page
 * open for an async IndexedDB write, and `beforeunload` can only raise the
 * browser's leave-page prompt — so the only synchronous durable store
 * available at unload is `localStorage`.
 *
 * On `pagehide`, and on `visibilitychange` to "hidden" (the last reliable
 * signal on mobile browsers), the descriptors of every write still pending
 * are written to one versioned key, in enqueue order. `DbProvider` replays
 * that key, in order, directly against the freshly opened database, before
 * the app is shown as ready — see `replayJournal` below.
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

export const JOURNAL_KEY = "knowme-pending-writes-v1";
const JOURNAL_VERSION = 1;

interface JournalPayload {
  version: number;
  descriptors: WriteDescriptor[];
}

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

/** Synchronously records the unsettled suffix of the queue, if any. */
function writeJournal(): void {
  const descriptors = pendingWriteDescriptors();
  if (descriptors.length === 0) return;

  const storage = safeLocalStorage();
  if (!storage) return;

  try {
    const payload: JournalPayload = { version: JOURNAL_VERSION, descriptors };
    storage.setItem(JOURNAL_KEY, JSON.stringify(payload));
  } catch (error) {
    // Quota exceeded, or storage disabled. The page is unloading — there is
    // no way to show this to the user now; log for diagnosis and accept the
    // loss (the spec's MAY-be-lost case for this failure mode).
    console.error("[persistence-journal] failed to write journal", error);
  }
}

/**
 * Removes the journal key once nothing is pending — covers a page that was
 * hidden and came back (including a bfcache restore) without ever closing,
 * so a later real close/reopen doesn't replay writes that already landed.
 */
function clearJournalIfDrained(): void {
  if (pendingWriteCount() > 0) return;
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(JOURNAL_KEY);
  } catch (error) {
    console.error("[persistence-journal] failed to clear journal", error);
  }
}

function clearJournalKey(storage: Storage): void {
  try {
    storage.removeItem(JOURNAL_KEY);
  } catch (error) {
    console.error("[persistence-journal] failed to clear journal after replay", error);
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
 * Wires the `pagehide`/`visibilitychange` listeners and the
 * drain-clears-journal subscription. Idempotent, and a no-op outside a
 * browser environment (SSR, node-based unit tests). Runs once at module
 * load below; exported so a test can assert it was installed without
 * depending on import order.
 */
export function installPersistenceJournal(): void {
  if (installed) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  installed = true;
  window.addEventListener("pagehide", handlePageHide);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  subscribeWriteQueue(clearJournalIfDrained);
}

installPersistenceJournal();

/**
 * Reads and replays the journal, in order, directly against `db` — not
 * through `enqueueWrite`/the module singleton, because replay runs inside
 * `CharcoalDb.open()`'s caller before `setDbInstance()` is called (see
 * `DbProvider`). Every descriptor kind is an upsert (`ON CONFLICT DO
 * UPDATE`) or a delete-by-id, so replaying an already-applied suffix over
 * itself is a no-op. A failing entry is reported (`reportFailure`, which
 * also drives the failure toast) and skipped; the rest still apply. An
 * unknown key version is discarded. The key is always removed when replay
 * finishes, whether or not anything failed.
 */
export async function replayJournal(db: CharcoalDb): Promise<void> {
  const storage = safeLocalStorage();
  if (!storage) return;

  let raw: string | null;
  try {
    raw = storage.getItem(JOURNAL_KEY);
  } catch (error) {
    console.error("[persistence-journal] failed to read journal", error);
    return;
  }
  if (!raw) return;

  let payload: JournalPayload;
  try {
    payload = JSON.parse(raw) as JournalPayload;
  } catch (error) {
    console.error("[persistence-journal] journal is not valid JSON — discarding", error);
    clearJournalKey(storage);
    return;
  }

  if (payload?.version !== JOURNAL_VERSION || !Array.isArray(payload.descriptors)) {
    console.error(
      "[persistence-journal] unknown journal version — discarding",
      payload?.version,
    );
    clearJournalKey(storage);
    return;
  }

  for (const descriptor of payload.descriptors) {
    try {
      await applyDescriptor(db, descriptor);
    } catch (error) {
      reportFailure(descriptor, error);
    }
  }

  clearJournalKey(storage);
}
