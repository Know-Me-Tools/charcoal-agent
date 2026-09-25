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

// ---------------------------------------------------------------------------
// Fake Web Locks — supports exactly the two call shapes persistence-journal
// uses: a hold-forever request (this tab's own page-lifetime lock) and an
// `{ifAvailable: true}` probe (another tab's key, at replay time).
// ---------------------------------------------------------------------------
interface FakeLock {
  name: string;
  mode: string;
}
class FakeLockManager {
  private held = new Set<string>();

  /** Test helper: simulate another tab holding this name's lock indefinitely. */
  simulateLiveTab(name: string): void {
    this.held.add(name);
  }

  async request(
    name: string,
    optionsOrCallback: { ifAvailable?: boolean } | ((lock: FakeLock | null) => unknown),
    maybeCallback?: (lock: FakeLock | null) => unknown,
  ): Promise<unknown> {
    const isCallbackFirst = typeof optionsOrCallback === "function";
    const options = isCallbackFirst ? {} : (optionsOrCallback ?? {});
    const callback = (isCallbackFirst ? optionsOrCallback : maybeCallback) as (
      lock: FakeLock | null,
    ) => unknown;

    if (this.held.has(name)) {
      if (options.ifAvailable) return callback(null);
      throw new Error("FakeLockManager: blocking request against a held lock is not used by any test");
    }

    this.held.add(name);
    try {
      return await callback({ name, mode: "exclusive" });
    } finally {
      this.held.delete(name);
    }
  }
}

const fakeLocks = new FakeLockManager();
Object.defineProperty(window.navigator, "locks", {
  value: fakeLocks,
  configurable: true,
  writable: true,
});

const {
  enqueueWrite,
  flush,
  subscribeWriteFailures,
  hasFailedWrite,
} = await import("@/lib/db/write-queue");
const { JOURNAL_KEY_PREFIX, getTabId, journalKeyForTab, replayJournal, discardJournalAfterPurge } =
  await import("./persistence-journal");

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
  // Drain any pending-notice latch (write-queue.ts) left over from a
  // previous test — reportFailure() latches when no subscriber exists at
  // report time, and a test that triggers a failure without subscribing
  // (e.g. the quota-shrink test) would otherwise leak that notice into the
  // next test's first subscribeWriteFailures() call.
  subscribeWriteFailures(() => {})();
});

describe("persistence-journal: per-tab key", () => {
  it("writes and reads under this tab's own key, not the bare prefix", async () => {
    fakeDb.configure("touchThread", { delayMs: 30 });
    enqueueWrite({ kind: "touchThread", id: "t1" });

    window.dispatchEvent(new Event("pagehide"));

    expect(localStorage.getItem(JOURNAL_KEY_PREFIX)).toBeNull();
    expect(localStorage.getItem(OWN_KEY)).not.toBeNull();
    expect(OWN_KEY).toBe(`${JOURNAL_KEY_PREFIX}:${getTabId()}`);

    await flush();
  });
});

describe("persistence-journal: writing on page exit", () => {
  it("dispatching pagehide with two pending writes stores both descriptors, in order", async () => {
    fakeDb.configure("touchThread", { delayMs: 30 });

    enqueueWrite({ kind: "touchThread", id: "t1" });
    enqueueWrite({ kind: "upsertThread", thread: fakeThread("t2") });

    window.dispatchEvent(new Event("pagehide"));

    const raw = localStorage.getItem(OWN_KEY);
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

    expect(localStorage.getItem(OWN_KEY)).not.toBeNull();

    await flush();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  it("does not journal when nothing is pending", () => {
    window.dispatchEvent(new Event("pagehide"));
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });

  it("removes the journal key once the queue drains", async () => {
    fakeDb.configure("touchThread", { delayMs: 20 });
    enqueueWrite({ kind: "touchThread", id: "t1" });
    window.dispatchEvent(new Event("pagehide"));
    expect(localStorage.getItem(OWN_KEY)).not.toBeNull();

    await flush(); // drains to 0 -> the drain subscription clears the key

    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });

  it("rewrites the journal to the current pending set as writes settle, rather than leaving a stale snapshot", async () => {
    fakeDb.configure("touchThread", { delayMs: 20 });
    fakeDb.configure("upsertThread", { delayMs: 60 });

    const p1 = enqueueWrite({ kind: "touchThread", id: "t1" });
    enqueueWrite({ kind: "upsertThread", thread: fakeThread("t2") });
    window.dispatchEvent(new Event("pagehide"));

    const atHide = JSON.parse(localStorage.getItem(OWN_KEY) as string) as {
      descriptors: WriteDescriptor[];
    };
    expect(atHide.descriptors).toHaveLength(2);

    await p1; // first write settles; the second is still pending

    const afterFirstSettle = JSON.parse(localStorage.getItem(OWN_KEY) as string) as {
      descriptors: WriteDescriptor[];
    };
    expect(afterFirstSettle.descriptors).toEqual([{ kind: "upsertThread", thread: fakeThread("t2") }]);

    await flush();
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });
});

describe("persistence-journal: quota shrink", () => {
  it("drops the largest upserts first when the full journal doesn't fit, but always keeps deletes and thread rows", async () => {
    fakeDb.configure("upsertMessage", { delayMs: 40 });
    fakeDb.configure("deleteMessages", { delayMs: 40 });

    // A small delete (the one that makes Regenerate correct) plus two
    // upserts of very different size.
    enqueueWrite({ kind: "deleteMessages", threadId: "t1", ids: ["old-reply"] });
    enqueueWrite({ kind: "upsertMessage", threadId: "t1", message: fakeMessage("small", 4) });
    enqueueWrite({ kind: "upsertMessage", threadId: "t1", message: fakeMessage("huge", 5000) });

    const originalSetItem = Storage.prototype.setItem.bind(localStorage);
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      // Reject any payload that still contains the huge upsert — succeeds
      // only once it's been dropped, proving it (not the delete or the
      // small upsert) was dropped first.
      if (value.includes("huge")) {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      }
      return originalSetItem(key, value);
    });

    window.dispatchEvent(new Event("pagehide"));

    const raw = localStorage.getItem(OWN_KEY);
    expect(raw).not.toBeNull();
    const payload = JSON.parse(raw as string) as { descriptors: WriteDescriptor[] };
    const kinds = payload.descriptors.map((d) => d.kind);
    expect(kinds).toContain("deleteMessages");
    expect(payload.descriptors.some((d) => d.kind === "upsertMessage" && (d as { message: RichMessage }).message.id === "huge")).toBe(false);
    expect(payload.descriptors.some((d) => d.kind === "upsertMessage" && (d as { message: RichMessage }).message.id === "small")).toBe(true);

    setItem.mockRestore();
    await flush();
  });
});

describe("persistence-journal: cross-tab replay", () => {
  it("own-key replay after reload: applies and clears this tab's own journal", async () => {
    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "own-t1" }] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => {},
      touchThread: async () => {
        calls.push("touchThread");
      },
      deleteThread: async () => {},
    } as unknown as CharcoalDb;

    await replayJournal(db);

    expect(calls).toEqual(["touchThread"]);
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });

  it("replays a dead tab's key (its lock is free) and removes it", async () => {
    const deadKey = journalKeyForTab("dead-tab-id");
    localStorage.setItem(
      deadKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "dead-t1" }] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => {},
      touchThread: async () => {
        calls.push("touchThread");
      },
      deleteThread: async () => {},
    } as unknown as CharcoalDb;

    await replayJournal(db);

    expect(calls).toEqual(["touchThread"]);
    expect(localStorage.getItem(deadKey)).toBeNull();
  });

  it("never touches a live tab's key (its lock is held)", async () => {
    const liveKey = journalKeyForTab("live-tab-id");
    localStorage.setItem(
      liveKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "live-t1" }] satisfies WriteDescriptor[],
      }),
    );
    fakeLocks.simulateLiveTab(liveKey);

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => {},
      touchThread: async () => {
        calls.push("touchThread");
      },
      deleteThread: async () => {},
    } as unknown as CharcoalDb;

    await replayJournal(db);

    expect(calls).toEqual([]);
    expect(localStorage.getItem(liveKey)).not.toBeNull();
  });

  it("falls back to own-key-only without navigator.locks — another tab's key is left untouched", async () => {
    const otherKey = journalKeyForTab("some-other-tab");
    localStorage.setItem(
      otherKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "other-t1" }] satisfies WriteDescriptor[],
      }),
    );
    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "own-t2" }] satisfies WriteDescriptor[],
      }),
    );

    const original = window.navigator.locks;
    Object.defineProperty(window.navigator, "locks", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const calls: string[] = [];
    const db = {
      insertMessage: async () => {},
      deleteMessages: async () => {},
      upsertThread: async () => {},
      touchThread: async (id: string) => {
        calls.push(id);
      },
      deleteThread: async () => {},
    } as unknown as CharcoalDb;

    try {
      await replayJournal(db);
    } finally {
      Object.defineProperty(window.navigator, "locks", {
        value: original,
        configurable: true,
        writable: true,
      });
    }

    // Own key replayed; the other tab's key was never touched — without
    // Web Locks there is no safe way to know whether it's a dead tab's
    // orphaned journal or a live tab's.
    expect(calls).toEqual(["own-t2"]);
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
    expect(localStorage.getItem(otherKey)).not.toBeNull();
  });
});

describe("persistence-journal: replay correctness", () => {
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
      OWN_KEY,
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
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
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

    localStorage.setItem(OWN_KEY, JSON.stringify({ version: 1, descriptors }));
    await replayJournal(db);
    expect(state.title).toBe("Weekly plan");

    // Replay the SAME already-applied descriptor again, simulating a second
    // open where the write had, in fact, already landed before the journal
    // was cleared — an upsert is idempotent, so the result is unchanged.
    localStorage.setItem(OWN_KEY, JSON.stringify({ version: 1, descriptors }));
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
      OWN_KEY,
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
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });

  it("discards an unknown key version", async () => {
    const { db, calls } = fakeReplayDb();

    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 99,
        descriptors: [{ kind: "upsertThread", thread: fakeThread("t1") }],
      }),
    );

    await replayJournal(db);

    expect(calls).toEqual([]);
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });

  it("does nothing when there is no journal", async () => {
    const { db, calls } = fakeReplayDb();
    await replayJournal(db);
    expect(calls).toEqual([]);
  });
});

describe("persistence-journal: discard after a corruption-purge retry", () => {
  it("discards this tab's journal without replaying it, and reports one failure", async () => {
    localStorage.setItem(
      OWN_KEY,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "t1" }] satisfies WriteDescriptor[],
      }),
    );

    const failures: unknown[] = [];
    const unsubscribe = subscribeWriteFailures((descriptor) => failures.push(descriptor));

    discardJournalAfterPurge();
    unsubscribe();

    expect(localStorage.getItem(OWN_KEY)).toBeNull();
    expect(failures).toEqual([{ kind: "touchThread", id: "t1" }]);
  });

  it("does nothing when there is no journal to discard", () => {
    expect(() => discardJournalAfterPurge()).not.toThrow();
    expect(localStorage.getItem(OWN_KEY)).toBeNull();
  });
});
