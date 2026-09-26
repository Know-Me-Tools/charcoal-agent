import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalThread } from "@/types";
import type { RichMessage } from "@/types/chat-content";

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

// Toggled by the "waits for db readiness" tests below to simulate the db
// not being open yet; every other test leaves this at its default (ready
// immediately), matching write-queue.ts's fast path.
let dbReady = true;
let readyPromise: Promise<ReturnType<typeof makeFakeDb>> = Promise.resolve(fakeDb);

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    if (!dbReady) throw new Error("db not ready yet");
    return fakeDb;
  },
  whenDbReady: () => readyPromise,
}));

const {
  enqueueWrite,
  pendingWriteCount,
  pendingWriteDescriptors,
  flush,
  subscribeWriteQueue,
  subscribeWriteFailures,
  reportFailure,
} = await import("./write-queue");

function fakeMessage(id: string): RichMessage {
  return { id, role: "assistant", content: [{ type: "text", text: id }], createdAt: new Date(), status: "complete" };
}

function fakeThread(id: string): LocalThread {
  return {
    id,
    sessionId: id,
    title: "New conversation",
    isEphemeral: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  fakeDb = makeFakeDb();
  dbReady = true;
  readyPromise = Promise.resolve(fakeDb);
});

describe("write-queue ordering", () => {
  it("applies a delete enqueued before an insert first, even when the delete's fake call is slower", async () => {
    fakeDb.configure("deleteMessages", { delayMs: 30 });

    const p1 = enqueueWrite({ kind: "deleteMessages", threadId: "t1", ids: ["m1"] });
    const p2 = enqueueWrite({ kind: "upsertMessage", threadId: "t1", message: fakeMessage("m2") });

    await Promise.all([p1, p2]);

    expect(fakeDb.calls.map((c) => c.kind)).toEqual(["deleteMessages", "upsertMessage"]);
  });

  it("applies an upsertThread enqueued before an upsertMessage first", async () => {
    fakeDb.configure("upsertMessage", { delayMs: 20 });

    const p1 = enqueueWrite({ kind: "upsertThread", thread: fakeThread("t1") });
    const p2 = enqueueWrite({ kind: "upsertMessage", threadId: "t1", message: fakeMessage("m1") });

    await Promise.all([p1, p2]);

    expect(fakeDb.calls.map((c) => c.kind)).toEqual(["upsertThread", "upsertMessage"]);
  });
});

describe("write-queue failure isolation", () => {
  it("does not stop later writes when one fails", async () => {
    fakeDb.configure("upsertThread", { shouldFail: true });

    const p1 = enqueueWrite({ kind: "upsertThread", thread: fakeThread("t1") });
    const p2 = enqueueWrite({ kind: "touchThread", id: "t1" });

    await expect(p1).rejects.toThrow("upsertThread failed");
    await expect(p2).resolves.toBeUndefined();

    expect(fakeDb.calls.map((c) => c.kind)).toEqual(["upsertThread", "touchThread"]);
  });

  it("reports the failure to the enqueuer's own promise, not to later callers", async () => {
    fakeDb.configure("deleteThread", { shouldFail: true });

    await expect(enqueueWrite({ kind: "deleteThread", id: "t1" })).rejects.toThrow();
    await expect(enqueueWrite({ kind: "touchThread", id: "t2" })).resolves.toBeUndefined();
  });
});

describe("write-queue flush()", () => {
  it("resolves after all prior writes settle, and resolves even when one failed", async () => {
    fakeDb.configure("upsertThread", { shouldFail: true, delayMs: 10 });

    enqueueWrite({ kind: "upsertThread", thread: fakeThread("t1") }).catch(() => undefined);
    enqueueWrite({ kind: "touchThread", id: "t1" });

    await expect(flush()).resolves.toBeUndefined();
    expect(fakeDb.calls.map((c) => c.kind)).toEqual(["upsertThread", "touchThread"]);
  });

  it("pendingWriteCount() goes to 0 after flush()", async () => {
    enqueueWrite({ kind: "touchThread", id: "t1" });
    enqueueWrite({ kind: "touchThread", id: "t2" });

    expect(pendingWriteCount()).toBeGreaterThan(0);
    await flush();
    expect(pendingWriteCount()).toBe(0);
  });
});

describe("write-queue journal shape (for task 1.2)", () => {
  it("pendingWriteDescriptors() returns the unsettled suffix in enqueue order", async () => {
    fakeDb.configure("touchThread", { delayMs: 20 });
    const d1 = { kind: "touchThread", id: "t1" } as const;
    const d2 = { kind: "touchThread", id: "t2" } as const;

    enqueueWrite(d1);
    enqueueWrite(d2);

    expect(pendingWriteDescriptors()).toEqual([d1, d2]);

    await flush();

    expect(pendingWriteDescriptors()).toEqual([]);
  });
});

describe("write-queue change subscription", () => {
  it("notifies subscribers when the queue changes and stops after unsubscribing", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeWriteQueue(listener);

    await enqueueWrite({ kind: "touchThread", id: "t1" });
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    await enqueueWrite({ kind: "touchThread", id: "t2" });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("write-queue waits for the database to become ready", () => {
  it("does not drop a write enqueued before the db is ready — it waits and then applies", async () => {
    dbReady = false;
    let resolveReady!: (db: ReturnType<typeof makeFakeDb>) => void;
    readyPromise = new Promise((resolve) => {
      resolveReady = resolve;
    });

    const write = enqueueWrite({ kind: "touchThread", id: "t1" });

    // Not ready yet: the write must be waiting, not executed-and-forgotten
    // (the pre-1.2 behaviour silently no-opped here instead).
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(fakeDb.calls).toEqual([]);
    expect(pendingWriteCount()).toBe(1);

    dbReady = true;
    resolveReady(fakeDb);
    await write;

    expect(fakeDb.calls.map((c) => c.kind)).toEqual(["touchThread"]);
    expect(pendingWriteCount()).toBe(0);
  });

  it("keeps write order even when the first write has to wait for readiness", async () => {
    dbReady = false;
    let resolveReady!: (db: ReturnType<typeof makeFakeDb>) => void;
    readyPromise = new Promise((resolve) => {
      resolveReady = resolve;
    });

    const p1 = enqueueWrite({ kind: "upsertThread", thread: fakeThread("t1") });
    const p2 = enqueueWrite({ kind: "touchThread", id: "t1" });

    await Promise.resolve();
    await Promise.resolve();
    expect(fakeDb.calls).toEqual([]);

    dbReady = true;
    resolveReady(fakeDb);
    await Promise.all([p1, p2]);

    expect(fakeDb.calls.map((c) => c.kind)).toEqual(["upsertThread", "touchThread"]);
  });
});

describe("write-queue pending-notice latch", () => {
  it("delivers a failure reported before any subscriber existed to the first subscriber that mounts afterward", () => {
    // Mirrors journal replay: it calls reportFailure directly (never
    // through enqueueWrite), and it can run before anything has ever
    // subscribed to failures — e.g. DbProvider replays before
    // PersistenceNotices has mounted at the app root.
    const descriptor = { kind: "touchThread", id: "latched-1" } as const;
    reportFailure(descriptor, new Error("replay failure, no subscriber yet"));

    const received: unknown[] = [];
    const unsubscribe = subscribeWriteFailures((d) => received.push(d));

    expect(received).toEqual([descriptor]);
    unsubscribe();
  });

  it("delivers the latched failure only once — a second, later subscriber does not get a stale redelivery", () => {
    const descriptor = { kind: "touchThread", id: "latched-2" } as const;
    reportFailure(descriptor, new Error("no subscriber yet"));

    const first: unknown[] = [];
    const unsubFirst = subscribeWriteFailures((d) => first.push(d));
    expect(first).toEqual([descriptor]);

    const second: unknown[] = [];
    const unsubSecond = subscribeWriteFailures((d) => second.push(d));
    expect(second).toEqual([]);

    unsubFirst();
    unsubSecond();
  });

  it("broadcasts normally (no latch replay) once a subscriber already exists", () => {
    const received: unknown[] = [];
    const unsubscribe = subscribeWriteFailures((d) => received.push(d));

    const descriptor = { kind: "touchThread", id: "latched-3" } as const;
    reportFailure(descriptor, new Error("live failure, subscriber present"));

    expect(received).toEqual([descriptor]);

    // Subscribing again afterward must not get a second delivery — there
    // was no latch, because a subscriber was already present when it fired.
    const late: unknown[] = [];
    const unsubLate = subscribeWriteFailures((d) => late.push(d));
    expect(late).toEqual([]);

    unsubscribe();
    unsubLate();
  });
});
