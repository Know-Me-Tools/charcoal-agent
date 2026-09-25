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

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => fakeDb,
}));

const { enqueueWrite, pendingWriteCount, pendingWriteDescriptors, flush, subscribeWriteQueue } =
  await import("./write-queue");

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
