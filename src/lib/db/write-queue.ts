/**
 * App-wide serial write queue for local persistence (chat-persistence-durability).
 *
 * Every local write to threads or messages is described as plain,
 * serialisable data (a `WriteDescriptor`) and enqueued here instead of being
 * fired directly at `CharcoalDb`. One promise chain runs the writes in the
 * order they were enqueued — never in parallel, and never out of order —
 * because the `messages.thread_id` foreign key needs a thread's row to
 * exist before its messages, and a retry/regenerate's delete must land
 * before the replacement's insert. See design decision 1 in
 * openspec/changes/chat-persistence-durability/design.md.
 *
 * A descriptor MUST be built from state already committed by `set()`
 * (read back via `get()`), never from an immer draft (design decision 2):
 * the executor below runs asynchronously, after the producer that created
 * the draft has already returned and immer has revoked its proxy. Reading a
 * draft's property from inside a queued write throws
 * "Cannot perform 'get' on a proxy that has been revoked".
 */
import { getDbInstance } from "@/lib/db/pglite";
import type { CharcoalDb } from "@/lib/db/pglite";
import type { LocalThread } from "@/types";
import type { RichMessage } from "@/types/chat-content";

export type WriteDescriptor =
  | { kind: "upsertMessage"; threadId: string; message: RichMessage }
  | { kind: "deleteMessages"; threadId: string; ids: string[] }
  | { kind: "upsertThread"; thread: LocalThread }
  | { kind: "touchThread"; id: string }
  | { kind: "deleteThread"; id: string };

function tryDb(): CharcoalDb | null {
  try {
    return getDbInstance();
  } catch {
    return null;
  }
}

function descriptorLabel(descriptor: WriteDescriptor): string {
  switch (descriptor.kind) {
    case "upsertMessage":
      return `upsertMessage(${descriptor.threadId}, ${descriptor.message.id})`;
    case "deleteMessages":
      return `deleteMessages(${descriptor.threadId}, [${descriptor.ids.join(",")}])`;
    case "upsertThread":
      return `upsertThread(${descriptor.thread.id})`;
    case "touchThread":
      return `touchThread(${descriptor.id})`;
    case "deleteThread":
      return `deleteThread(${descriptor.id})`;
  }
}

/**
 * Maps a descriptor to the existing `CharcoalDb` method — the SQL and row
 * shapes are unchanged, this only decides which method runs. Silently
 * no-ops when the database isn't open yet, matching the `tryDb()?.write(...)`
 * behaviour every store action used before this module existed: the caller
 * already tolerates a not-yet-ready database.
 */
async function executeWrite(descriptor: WriteDescriptor): Promise<void> {
  const db = tryDb();
  if (!db) return;

  switch (descriptor.kind) {
    case "upsertMessage":
      return db.insertMessage(descriptor.threadId, descriptor.message);
    case "deleteMessages":
      return db.deleteMessages(descriptor.threadId, descriptor.ids);
    case "upsertThread":
      return db.upsertThread(descriptor.thread);
    case "touchThread":
      return db.touchThread(descriptor.id);
    case "deleteThread":
      return db.deleteThread(descriptor.id);
  }
}

// ---------------------------------------------------------------------------
// Queue state
// ---------------------------------------------------------------------------

/**
 * Tail of the serial chain. Resolves once every write enqueued so far has
 * settled. By construction this promise NEVER rejects — each write's own
 * failure is caught before the chain advances, so one failed write never
 * blocks the writes enqueued after it.
 */
let tail: Promise<void> = Promise.resolve();

/**
 * Writes enqueued but not yet settled, keyed by an insertion-order id (a
 * `Map` preserves insertion order). Read by `pendingWriteDescriptors()` for
 * the page-exit journal (task 1.2) and by `pendingWriteCount()` for the
 * save-state indicator.
 */
const pending = new Map<number, WriteDescriptor>();
let nextId = 0;

const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

/**
 * Enqueues a write and returns a promise for THAT write's own outcome — it
 * can reject. Writes always run in enqueue order: this write's executor
 * does not start until every write enqueued before it has settled,
 * regardless of how long any of them take.
 */
export function enqueueWrite(descriptor: WriteDescriptor): Promise<void> {
  const id = nextId++;
  pending.set(id, descriptor);
  emitChange();

  const settle = (): void => {
    pending.delete(id);
    emitChange();
  };

  const result = tail.then(() => executeWrite(descriptor));
  result.then(settle, settle);

  // Advance the chain to a continuation that never rejects, so a failure in
  // this write can't block the writes enqueued after it.
  tail = result.then(
    () => undefined,
    (error: unknown) => {
      console.error(`[write-queue] ${descriptorLabel(descriptor)} failed`, error);
    },
  );

  return result;
}

/** Number of writes enqueued but not yet settled (succeeded or failed). */
export function pendingWriteCount(): number {
  return pending.size;
}

/**
 * The descriptors of every write enqueued but not yet settled, in enqueue
 * order — the unsettled suffix the page-exit journal (task 1.2) records to
 * `localStorage` before the page tears down.
 */
export function pendingWriteDescriptors(): WriteDescriptor[] {
  return Array.from(pending.values());
}

/**
 * Resolves once every write enqueued so far has settled — including any
 * that failed. Never rejects.
 */
export function flush(): Promise<void> {
  return tail;
}

/**
 * Notified whenever a write is enqueued or settles (used to derive the
 * `saving | saved | failed` indicator in task 1.2). Returns an unsubscribe
 * function.
 */
export function subscribeWriteQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
