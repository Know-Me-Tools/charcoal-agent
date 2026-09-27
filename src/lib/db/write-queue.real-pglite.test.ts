/**
 * chat-persistence-durability task 3.2, rows 7, 8 and 17 of
 * openspec/changes/chat-persistence-durability/verification.md: the ordering
 * and idempotency guarantees the write queue makes (design decision 1) are
 * proven here against a REAL PGlite instance and its real schema (foreign
 * key, `ON CONFLICT DO UPDATE`, delete-by-id) — not `write-queue.test.ts`'s
 * fake `CharcoalDb`, which records call order but never runs any SQL.
 *
 * The only thing mocked is `@electric-sql/pglite`'s `PGlite` constructor,
 * so `CharcoalDb.open()` (src/lib/db/pglite.ts) gets a real in-memory
 * Postgres-in-WASM instance instead of one backed by `idb://` — jsdom has no
 * IndexedDB implementation, so the `idb://` DSN itself is unreachable here,
 * but every migration, constraint and query below is the genuine one
 * `CharcoalDb` ships. Confirmed working under this project's jsdom + vitest
 * setup by direct probe before writing these tests.
 */
import { describe, expect, it, vi } from "vitest";
import type { LocalThread } from "@/types";
import type { RichMessage } from "@/types/chat-content";
import type { WriteDescriptor } from "./write-queue";

vi.mock("@electric-sql/pglite", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@electric-sql/pglite")>();
  return {
    ...actual,
    // Ignore the `idb://...` DSN CharcoalDb.open() passes and always run
    // in-memory — the schema and every query are otherwise untouched.
    PGlite: class extends actual.PGlite {
      constructor() {
        super();
      }
    },
  };
});

const { CharcoalDb, setDbInstance } = await import("./pglite");
const { applyDescriptor, enqueueWrite } = await import("./write-queue");

// Every key reports as free — i.e. every journal key belongs to a "dead"
// tab — which is exactly the scenario the dead-tab replay guard tests below
// exercise. `persistence-journal.ts`'s own module-load side effect
// (`installPersistenceJournal`) and `ensureUniqueTabIdentity` both probe
// `navigator.locks`, which jsdom does not implement.
class AlwaysFreeLockManager {
  async request(
    name: string,
    optionsOrCallback: { ifAvailable?: boolean } | ((lock: { name: string } | null) => unknown),
    maybeCallback?: (lock: { name: string } | null) => unknown,
  ): Promise<unknown> {
    const isCallbackFirst = typeof optionsOrCallback === "function";
    const callback = (isCallbackFirst ? optionsOrCallback : maybeCallback) as (
      lock: { name: string } | null,
    ) => unknown;
    return callback({ name });
  }
}
Object.defineProperty(window.navigator, "locks", {
  value: new AlwaysFreeLockManager(),
  configurable: true,
  writable: true,
});

const { journalKeyForTab, replayJournal, scrubThreadFromJournals } = await import("./persistence-journal");

function fakeThread(id: string, title = "New conversation"): LocalThread {
  return {
    id,
    sessionId: id,
    title,
    isEphemeral: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function fakeMessage(id: string, text: string): RichMessage {
  return { id, role: "assistant", content: [{ type: "text", text }], createdAt: new Date(), status: "complete" };
}

/**
 * Overrides a real `CharcoalDb` instance method with one that waits on a
 * manually-released gate before running the original implementation — so
 * "the write is still pending" is true by construction (an unsettled
 * promise this test controls), never by hoping a fixed delay was long
 * enough.
 */
type OpenedDb = Awaited<ReturnType<typeof CharcoalDb.open>>;

function gateMethod<M extends "deleteMessages" | "upsertThread">(
  db: OpenedDb,
  method: M,
): { release: () => void } {
  const original = db[method].bind(db) as (...args: unknown[]) => Promise<void>;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  Object.defineProperty(db, method, {
    configurable: true,
    value: async (...args: unknown[]) => {
      await gate;
      return original(...args);
    },
  });
  return { release };
}

describe("write-queue ordering against real PGlite (verification.md rows 7 and 8)", () => {
  it("row 7: applies a removal that is still pending before a replacement requested while it's in flight, and the real row set ends up correct", async () => {
    const db = await CharcoalDb.open();
    setDbInstance(db);

    const threadId = "row7-thread";
    await db.upsertThread(fakeThread(threadId));
    await db.insertMessage(threadId, fakeMessage("u1", "the user turn"));
    await db.insertMessage(threadId, fakeMessage("a1-old", "the failed reply being replaced"));

    const { release } = gateMethod(db, "deleteMessages");

    // Records which write SETTLES first — the real, order-sensitive claim
    // ("A removal made before a later write SHALL never take effect after
    // that write", spec.md). Checking only the final row set doesn't
    // distinguish a serialized queue from an unserialized one here, because
    // the delete and the replacement target different ids — either order
    // ends at the same rows. Settlement order does distinguish them: a
    // correctly serialized queue can only let the replacement's write START
    // once the removal's write has fully settled, so the removal's promise
    // MUST settle first, deterministically — not by how long the fake takes
    // (write-queue.test.ts's style), but against this real, gated
    // CharcoalDb instance.
    const settleOrder: string[] = [];

    // Enqueue the removal of the superseded turn — mirrors
    // `deleteMessagesAfter` on the retry/regenerate path
    // (src/stores/chat-message-store.ts).
    const removal = enqueueWrite({ kind: "deleteMessages", threadId, ids: ["a1-old"] });
    let removalSettled = false;
    removal.then(() => {
      removalSettled = true;
      settleOrder.push("deleteMessages");
    });

    // Let the queue's executor actually start (and hit the gate) without
    // letting it finish.
    await Promise.resolve();
    await Promise.resolve();
    expect(removalSettled).toBe(false);

    // The replacement is requested for the SAME conversation while the
    // removal above is, by construction, still unsettled — the spec's exact
    // WHEN clause.
    const replacement = enqueueWrite({
      kind: "upsertMessage",
      threadId,
      message: fakeMessage("a1-new", "the retried reply"),
    });
    replacement.then(() => {
      settleOrder.push("upsertMessage");
    });

    release();
    await Promise.all([removal, replacement]);

    expect(settleOrder).toEqual(["deleteMessages", "upsertMessage"]);

    const messages = await db.getMessages(threadId);
    expect(messages.map((m) => m.id)).toEqual(["u1", "a1-new"]);
  }, 20_000);

  it("row 8, negative control: the messages.thread_id foreign key is real — inserting for a thread that doesn't exist genuinely fails", async () => {
    const db = await CharcoalDb.open();
    setDbInstance(db);

    await expect(db.insertMessage("no-such-thread", fakeMessage("orphan", "x"))).rejects.toThrow();
  }, 20_000);

  it("row 8: a new conversation's thread row lands before its first message even when the thread write is still pending, with no message save rejected", async () => {
    const db = await CharcoalDb.open();
    setDbInstance(db);

    const threadId = "row8-thread";
    const thread = fakeThread(threadId);

    const { release } = gateMethod(db, "upsertThread");

    // registerThread's write (use-chat-runtime.ts mounts this on thread
    // detail — src/stores/thread-registry-store.ts).
    const threadWrite = enqueueWrite({ kind: "upsertThread", thread });
    let threadSettled = false;
    threadWrite.then(() => {
      threadSettled = true;
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(threadSettled).toBe(false);

    // The first reply finishes before the thread write above has settled —
    // its message save is requested here, while the thread row genuinely
    // doesn't exist in the database yet.
    const messageWrite = enqueueWrite({
      kind: "upsertMessage",
      threadId,
      message: fakeMessage("first-reply", "hello"),
    });

    release();

    // Neither write is rejected for lack of a thread record — the queue's
    // serial ordering made the thread row land first against the real FK.
    await expect(Promise.all([threadWrite, messageWrite])).resolves.toBeDefined();

    const threads = await db.getThreads();
    expect(threads.map((t) => t.id)).toContain(threadId);
    const messages = await db.getMessages(threadId);
    expect(messages.map((m) => m.id)).toEqual(["first-reply"]);
  }, 20_000);
});

describe("replay idempotency against real PGlite (verification.md row 17)", () => {
  it("replaying an already-applied upsertMessage leaves exactly one row, not a duplicate", async () => {
    const db = await CharcoalDb.open();
    const threadId = "row17-thread";
    await db.upsertThread(fakeThread(threadId));

    const descriptor = {
      kind: "upsertMessage",
      threadId,
      message: fakeMessage("already-saved", "already landed before the page closed"),
    } as const;

    // First application — this is the save that "had in fact completed
    // before the page closed" in the spec's wording.
    await applyDescriptor(db, descriptor);
    // Replaying the SAME descriptor, exactly as persistence-journal.ts's
    // replayKey() does for a journal entry that had already taken effect.
    await applyDescriptor(db, descriptor);

    const messages = await db.getMessages(threadId);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.id).toBe("already-saved");
  }, 20_000);

  it("replaying a deleteMessages descriptor for an already-removed turn is a harmless no-op — no removed turn reappears", async () => {
    const db = await CharcoalDb.open();
    const threadId = "row17-delete-thread";
    await db.upsertThread(fakeThread(threadId));
    await db.insertMessage(threadId, fakeMessage("to-be-removed", "superseded turn"));

    const descriptor: WriteDescriptor = { kind: "deleteMessages", threadId, ids: ["to-be-removed"] };

    // First application actually removes the row.
    await applyDescriptor(db, descriptor);
    expect((await db.getMessages(threadId)).map((m) => m.id)).toEqual([]);

    // Replaying the same delete for a turn that's already gone must not
    // throw, and must not resurrect it.
    await expect(applyDescriptor(db, descriptor)).resolves.toBeUndefined();
    expect((await db.getMessages(threadId)).map((m) => m.id)).toEqual([]);
  }, 20_000);
});

describe("dead-tab journal replay against real PGlite (operator decision 2026-09-26)", () => {
  it("does not recreate a thread that was deleted since a dead tab's journal was written", async () => {
    const db = await CharcoalDb.open();

    const threadId = "dead-tab-resurrect-thread";
    await db.upsertThread(fakeThread(threadId, "Original title"));

    const deadKey = journalKeyForTab("dead-tab-a");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          { kind: "upsertThread", thread: fakeThread(threadId, "Resurrected by a dead tab") },
        ] satisfies WriteDescriptor[],
      }),
    );

    // The user deletes the thread in a live tab: the app scrubs every journal
    // (thread-registry-store's removeThread), then deletes the row.
    scrubThreadFromJournals(threadId);
    await db.deleteThread(threadId);

    await replayJournal(db);

    const threads = await db.getThreads();
    expect(threads.map((t) => t.id)).not.toContain(threadId);
    expect(localStorage.getItem(deadKey)).toBeNull();
  }, 20_000);

  it("restores a new thread, and its messages, that a dead tab created but never saved", async () => {
    const db = await CharcoalDb.open();

    const threadId = "dead-tab-new-thread";
    const deadKey = journalKeyForTab("dead-tab-c");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          { kind: "upsertThread", thread: fakeThread(threadId, "Created in a tab that died") },
          { kind: "upsertMessage", threadId, message: fakeMessage("dead-tab-new-msg", "hello") },
        ] satisfies WriteDescriptor[],
      }),
    );

    await replayJournal(db);

    const threads = await db.getThreads();
    expect(threads.find((t) => t.id === threadId)?.title).toBe("Created in a tab that died");
    const messages = await db.getMessages(threadId);
    expect(messages.map((m) => m.id)).toEqual(["dead-tab-new-msg"]);
    expect(localStorage.getItem(deadKey)).toBeNull();
  }, 20_000);

  it("does not let a dead tab's older touch move a thread saved more recently", async () => {
    const db = await CharcoalDb.open();

    const threadId = "dead-tab-stale-touch-thread";
    await db.upsertThread({ ...fakeThread(threadId), updatedAt: "2026-06-01T00:00:00.000Z" });

    const deadKey = journalKeyForTab("dead-tab-d");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          { kind: "touchThread", id: threadId, at: "2025-01-01T00:00:00.000Z" },
        ] satisfies WriteDescriptor[],
      }),
    );

    await replayJournal(db);

    const thread = (await db.getThreads()).find((t) => t.id === threadId);
    expect(new Date(thread!.updatedAt).toISOString()).toBe("2026-06-01T00:00:00.000Z");
  }, 20_000);

  it("does not let a dead tab's older upsertThread overwrite a title saved more recently", async () => {
    const db = await CharcoalDb.open();

    const threadId = "dead-tab-stale-title-thread";
    await db.upsertThread({
      ...fakeThread(threadId, "Newer title, saved after the dead tab's journal"),
      updatedAt: "2026-06-01T00:00:00.000Z",
    });

    const deadKey = journalKeyForTab("dead-tab-b");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          {
            kind: "upsertThread",
            thread: {
              ...fakeThread(threadId, "Older title from the dead tab"),
              updatedAt: "2025-01-01T00:00:00.000Z",
            },
          },
        ] satisfies WriteDescriptor[],
      }),
    );

    await replayJournal(db);

    const threads = await db.getThreads();
    const thread = threads.find((t) => t.id === threadId);
    expect(thread?.title).toBe("Newer title, saved after the dead tab's journal");
    expect(localStorage.getItem(deadKey)).toBeNull();
  }, 20_000);
});
