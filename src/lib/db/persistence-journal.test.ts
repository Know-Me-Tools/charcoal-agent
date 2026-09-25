import { beforeEach, describe, expect, it, vi } from "vitest";
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

const { enqueueWrite, flush, subscribeWriteFailures, hasFailedWrite } = await import(
  "@/lib/db/write-queue"
);
const { JOURNAL_KEY, replayJournal } = await import("./persistence-journal");

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

beforeEach(() => {
  fakeDb = makeFakeDb();
  localStorage.clear();
});

describe("persistence-journal: writing on page exit", () => {
  it("dispatching pagehide with two pending writes stores both descriptors, in order", async () => {
    fakeDb.configure("touchThread", { delayMs: 30 });

    enqueueWrite({ kind: "touchThread", id: "t1" });
    enqueueWrite({ kind: "upsertThread", thread: fakeThread("t2") });

    window.dispatchEvent(new Event("pagehide"));

    const raw = localStorage.getItem(JOURNAL_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      version: 1,
      descriptors: [
        { kind: "touchThread", id: "t1" },
        { kind: "upsertThread", thread: fakeThread("t2") },
      ],
    });

    await flush();
  });

  it("visibilitychange to hidden also journals pending writes", async () => {
    fakeDb.configure("touchThread", { delayMs: 30 });
    enqueueWrite({ kind: "touchThread", id: "t1" });

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(localStorage.getItem(JOURNAL_KEY)).not.toBeNull();

    await flush();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  it("does not journal when nothing is pending", () => {
    window.dispatchEvent(new Event("pagehide"));
    expect(localStorage.getItem(JOURNAL_KEY)).toBeNull();
  });

  it("removes the journal key once the queue drains", async () => {
    fakeDb.configure("touchThread", { delayMs: 20 });
    enqueueWrite({ kind: "touchThread", id: "t1" });
    window.dispatchEvent(new Event("pagehide"));
    expect(localStorage.getItem(JOURNAL_KEY)).not.toBeNull();

    await flush(); // drains to 0 -> the drain subscription clears the key

    expect(localStorage.getItem(JOURNAL_KEY)).toBeNull();
  });
});

describe("persistence-journal: replay", () => {
  function fakeReplayDb(overrides: Partial<Record<string, () => Promise<void>>> = {}) {
    const calls: string[] = [];
    const base: CharcoalDb = {
      insertMessage: async () => {
        calls.push("upsertMessage");
      },
      deleteMessages: async () => {
        calls.push("deleteMessages");
      },
      upsertThread: async () => {
        calls.push("upsertThread");
      },
      touchThread: async () => {
        calls.push("touchThread");
      },
      deleteThread: async () => {
        calls.push("deleteThread");
      },
      // Minimal fake: only the write methods above are exercised by replayJournal.
    } as unknown as CharcoalDb;
    for (const [key, fn] of Object.entries(overrides)) {
      if (fn) (base as unknown as Record<string, unknown>)[key] = fn;
    }
    return { db: base, calls };
  }

  it("applies descriptors in order", async () => {
    const { db, calls } = fakeReplayDb();

    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [
          { kind: "upsertThread", thread: fakeThread("t1") },
          { kind: "touchThread", id: "t1" },
        ] satisfies WriteDescriptor[],
      }),
    );

    await replayJournal(db);

    expect(calls).toEqual(["upsertThread", "touchThread"]);
    expect(localStorage.getItem(JOURNAL_KEY)).toBeNull();
  });

  it("replaying an already-applied suffix leaves the fake store unchanged (idempotent)", async () => {
    const state = { title: "" };
    const { db } = fakeReplayDb({
      upsertThread: async (...args: unknown[]) => {
        state.title = (args[0] as LocalThread).title;
      },
    });

    const descriptors: WriteDescriptor[] = [
      { kind: "upsertThread", thread: { ...fakeThread("t1"), title: "Weekly plan" } },
    ];

    localStorage.setItem(JOURNAL_KEY, JSON.stringify({ version: 1, descriptors }));
    await replayJournal(db);
    expect(state.title).toBe("Weekly plan");

    // Replay the SAME already-applied descriptor again, simulating a second
    // open where the write had, in fact, already landed before the journal
    // was cleared — an upsert is idempotent, so the result is unchanged.
    localStorage.setItem(JOURNAL_KEY, JSON.stringify({ version: 1, descriptors }));
    await replayJournal(db);
    expect(state.title).toBe("Weekly plan");
  });

  it("skips a failing descriptor, applies the rest, and reports exactly one failure", async () => {
    const { db, calls } = fakeReplayDb({
      deleteMessages: async () => {
        throw new Error("delete failed");
      },
    });

    const failures: Array<{ descriptor: WriteDescriptor; error: unknown }> = [];
    const unsubscribe = subscribeWriteFailures((descriptor, error) =>
      failures.push({ descriptor, error }),
    );

    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [
          { kind: "upsertThread", thread: fakeThread("t1") },
          { kind: "deleteMessages", threadId: "t1", ids: ["m1"] },
          { kind: "touchThread", id: "t1" },
        ] satisfies WriteDescriptor[],
      }),
    );

    await replayJournal(db);
    unsubscribe();

    expect(calls).toEqual(["upsertThread", "touchThread"]);
    expect(failures).toHaveLength(1);
    expect(failures[0].descriptor).toEqual({ kind: "deleteMessages", threadId: "t1", ids: ["m1"] });
    expect(hasFailedWrite()).toBe(true);
    expect(localStorage.getItem(JOURNAL_KEY)).toBeNull();
  });

  it("discards an unknown key version", async () => {
    const { db, calls } = fakeReplayDb();

    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify({
        version: 99,
        descriptors: [{ kind: "upsertThread", thread: fakeThread("t1") }],
      }),
    );

    await replayJournal(db);

    expect(calls).toEqual([]);
    expect(localStorage.getItem(JOURNAL_KEY)).toBeNull();
  });

  it("does nothing when there is no journal", async () => {
    const { db, calls } = fakeReplayDb();
    await replayJournal(db);
    expect(calls).toEqual([]);
  });
});
