/**
 * chat-persistence-durability review-defect fixes (task 3.2), split out of
 * persistence-journal.test.ts to keep that file under the project's 800-line
 * cap:
 *
 * - item 1: scrubbing a deleted thread out of every tab's journal, and the
 *   dead-tab replay guard ("skip a missing thread", "newer wins").
 * - item 2: a write enqueued while the page is ALREADY hidden (no fresh
 *   `visibilitychange` to journal it on) must still be journaled.
 * - item 4: `listOtherJournalKeys` enumeration failing must not take down
 *   `replayJournal` — startup always finishes.
 *
 * Setup mirrors persistence-journal.test.ts: a fake `CharcoalDb` that
 * records call order and can be told to delay/fail, and a fake Web Locks
 * manager (jsdom has no `navigator.locks`) that always grants a lock — every
 * key here is meant to look like it belongs to a dead tab.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalThread } from "@/types";
import type { RichMessage } from "@/types/chat-content";
import type { CharcoalDb } from "@/lib/db/pglite";
import type { WriteDescriptor } from "@/lib/db/write-queue";

interface FakeCall {
  kind: string;
  args: unknown[];
}

interface FakeBehavior {
  delayMs?: number;
  shouldFail?: boolean;
}

function makeFakeDb() {
  const calls: FakeCall[] = [];
  const behaviors: Partial<Record<string, FakeBehavior>> = {};

  function configure(kind: string, behavior: FakeBehavior): void {
    behaviors[kind] = behavior;
  }

  async function record(kind: string, args: unknown[]): Promise<void> {
    const behavior = behaviors[kind];
    if (behavior?.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, behavior.delayMs));
    }
    calls.push({ kind, args });
    if (behavior?.shouldFail) {
      throw new Error(`${kind} failed`);
    }
  }

  return {
    calls,
    configure,
    insertMessage: (threadId: string, message: RichMessage) =>
      record("upsertMessage", [threadId, message]),
    deleteMessages: (threadId: string, ids: string[]) =>
      record("deleteMessages", [threadId, ids]),
    upsertThread: (thread: LocalThread) => record("upsertThread", [thread]),
    touchThread: (id: string) => record("touchThread", [id]),
    deleteThread: (id: string) => record("deleteThread", [id]),
  };
}

let fakeDb = makeFakeDb();

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => fakeDb,
  whenDbReady: () => Promise.resolve(fakeDb),
}));

interface FakeLock {
  name: string;
}
class AlwaysFreeLockManager {
  async request(
    name: string,
    optionsOrCallback: { ifAvailable?: boolean } | ((lock: FakeLock | null) => unknown),
    maybeCallback?: (lock: FakeLock | null) => unknown,
  ): Promise<unknown> {
    const isCallbackFirst = typeof optionsOrCallback === "function";
    const callback = (isCallbackFirst ? optionsOrCallback : maybeCallback) as (
      lock: FakeLock | null,
    ) => unknown;
    return callback({ name });
  }
}
Object.defineProperty(window.navigator, "locks", {
  value: new AlwaysFreeLockManager(),
  configurable: true,
  writable: true,
});

const { enqueueWrite, flush, subscribeWriteFailures } = await import("@/lib/db/write-queue");
const { getTabId, journalKeyForTab, replayJournal, scrubThreadFromJournals } = await import(
  "./persistence-journal"
);

const OWN_KEY = journalKeyForTab(getTabId());

function fakeThread(id: string): LocalThread {
  return {
    id,
    sessionId: id,
    title: "New conversation",
    isEphemeral: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function fakeMessage(id: string, size = 8): RichMessage {
  return {
    id,
    role: "assistant",
    content: [{ type: "text", text: "x".repeat(size) }],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    status: "complete",
  };
}

beforeEach(() => {
  fakeDb = makeFakeDb();
  localStorage.clear();
  subscribeWriteFailures(() => {})(); // drain any pending-notice latch left over from a previous test
});

describe("persistence-journal: scrub on thread delete (item 1)", () => {
  it("removes only the deleted thread's descriptors from every tab's key, and removes a key left empty", () => {
    const otherTabKey = journalKeyForTab("other-tab-id");

    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [
          { kind: "touchThread", id: "t1" },
          { kind: "upsertMessage", threadId: "t2", message: fakeMessage("keep-me") },
        ] satisfies WriteDescriptor[],
      }),
    );
    localStorage.setItem(
      otherTabKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "upsertThread", thread: fakeThread("t1") }] satisfies WriteDescriptor[],
      }),
    );

    scrubThreadFromJournals("t1");

    // Own key: t1's descriptor is gone, t2's survives. Compared against a
    // JSON round trip of the expected descriptor, since `createdAt` comes
    // back as a string once it's been through localStorage, not the `Date`
    // `fakeMessage` builds it with.
    const ownPayload = JSON.parse(localStorage.getItem(OWN_KEY) as string) as {
      descriptors: WriteDescriptor[];
    };
    expect(ownPayload.descriptors).toEqual([
      JSON.parse(
        JSON.stringify({ kind: "upsertMessage", threadId: "t2", message: fakeMessage("keep-me") }),
      ),
    ]);

    // Other tab's key: its only descriptor was for t1, so the whole key is removed.
    expect(localStorage.getItem(otherTabKey)).toBeNull();
  });

  it("is a no-op when no journal references the thread", () => {
    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "unrelated" }] satisfies WriteDescriptor[],
      }),
    );

    expect(() => scrubThreadFromJournals("t1")).not.toThrow();
    expect(localStorage.getItem(OWN_KEY)).not.toBeNull();
  });
});

describe("persistence-journal: dead-tab replay guard (item 1)", () => {
  it("skips (and does not report as a failure) a descriptor for a thread that no longer exists", async () => {
    const deadKey = journalKeyForTab("dead-tab-missing-thread");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          // A child write for a thread that neither exists nor is created
          // earlier in the journal. (An upsertThread for a missing row is a
          // creation and applies; the scrub on delete is what blocks resurrection.)
          { kind: "touchThread", id: "gone-thread", at: "2026-01-01T00:00:00.000Z" },
        ] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    const failures: unknown[] = [];
    const unsubscribe = subscribeWriteFailures((descriptor) => failures.push(descriptor));

    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => { calls.push("upsertThread"); },
      touchThread: async () => {},
      deleteThread: async () => {},
      getThreadUpdatedAt: async () => null, // the thread was deleted
    } as unknown as CharcoalDb;

    await replayJournal(db);
    unsubscribe();

    expect(calls).toEqual([]); // never applied
    // Skipped, not reported as a save failure: proven directly against this
    // test's own failure subscription rather than the module-wide
    // hasFailedWrite() latch, which an earlier test in this file may already
    // have set (it only clears on a later SUCCESSFUL write settling, which
    // this test deliberately never issues).
    expect(failures).toEqual([]);
    expect(localStorage.getItem(deadKey)).toBeNull();
  });

  it("skips an upsertThread older than the stored row, so a dead tab cannot overwrite a newer title", async () => {
    const deadKey = journalKeyForTab("dead-tab-stale-title");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          {
            kind: "upsertThread",
            thread: { ...fakeThread("t1"), title: "Stale title", updatedAt: "2020-01-01T00:00:00.000Z" },
          },
        ] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    const failures: unknown[] = [];
    const unsubscribe = subscribeWriteFailures((descriptor) => failures.push(descriptor));

    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => { calls.push("upsertThread"); },
      touchThread: async () => {},
      deleteThread: async () => {},
      getThreadUpdatedAt: async () => "2025-06-01T00:00:00.000Z", // newer than the descriptor
    } as unknown as CharcoalDb;

    await replayJournal(db);
    unsubscribe();

    expect(calls).toEqual([]);
    expect(failures).toEqual([]); // skipped, not reported as a save failure
    expect(localStorage.getItem(deadKey)).toBeNull();
  });

  it("still applies an upsertThread that is not older than the stored row", async () => {
    const deadKey = journalKeyForTab("dead-tab-fresh-title");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [
          {
            kind: "upsertThread",
            thread: { ...fakeThread("t1"), title: "Fresh title", updatedAt: "2025-06-01T00:00:00.000Z" },
          },
        ] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => { calls.push("upsertThread"); },
      touchThread: async () => {},
      deleteThread: async () => {},
      getThreadUpdatedAt: async () => "2020-01-01T00:00:00.000Z", // older than the descriptor
    } as unknown as CharcoalDb;

    await replayJournal(db);

    expect(calls).toEqual(["upsertThread"]);
    expect(localStorage.getItem(deadKey)).toBeNull();
  });

  it("applies a deleteThread against an already-missing thread as a harmless no-op, not a skip", async () => {
    const deadKey = journalKeyForTab("dead-tab-delete-missing");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "deleteThread", id: "already-gone" }] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => {},
      touchThread: async () => {},
      deleteThread: async () => { calls.push("deleteThread"); },
      getThreadUpdatedAt: async () => null,
    } as unknown as CharcoalDb;

    await replayJournal(db);

    expect(calls).toEqual(["deleteThread"]);
    expect(localStorage.getItem(deadKey)).toBeNull();
  });
});

describe("persistence-journal: journals a write enqueued while already hidden (item 2)", () => {
  afterEach(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("journals immediately, without waiting for another hidden transition", async () => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });

    fakeDb.configure("touchThread", { delayMs: 30 });
    // No pagehide/visibilitychange dispatched here — the page was ALREADY
    // hidden before this write was even enqueued, so there is no fresh
    // transition event to journal it on. Only the write-queue's own change
    // subscription (syncJournalOnQueueChange) can catch this.
    enqueueWrite({ kind: "touchThread", id: "t1" });

    expect(localStorage.getItem(OWN_KEY)).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(OWN_KEY) as string)).toEqual({
      version: 1,
      descriptors: [{ kind: "touchThread", id: "t1" }],
    });

    await flush();
  });

  it("does not pre-emptively create a journal for a write enqueued while visible", async () => {
    fakeDb.configure("touchThread", { delayMs: 30 });
    enqueueWrite({ kind: "touchThread", id: "t1" });

    expect(localStorage.getItem(OWN_KEY)).toBeNull();

    await flush();
  });
});

describe("persistence-journal: replay is fully guarded against enumeration failures (item 4)", () => {
  it("still replays this tab's own journal and finishes, even when enumerating other tabs' keys throws", async () => {
    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "own-t1" }] satisfies WriteDescriptor[],
      }),
    );

    const keySpy = vi.spyOn(Storage.prototype, "key").mockImplementation(() => {
      throw new Error("boom: storage.key failed");
    });

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => {},
      touchThread: async (id: string) => { calls.push(id); },
      deleteThread: async () => {},
      getThreadUpdatedAt: async () => null,
    } as unknown as CharcoalDb;

    await expect(replayJournal(db)).resolves.toBeUndefined();

    expect(calls).toEqual(["own-t1"]);
    expect(localStorage.getItem(OWN_KEY)).toBeNull();

    keySpy.mockRestore();
  });
});
