/**
 * chat-persistence-durability task item 3 (review finding on task 3.2):
 * "duplicate tab" (Chrome's context-menu action, and equivalents in other
 * browsers) copies `sessionStorage` verbatim into the new tab, so the
 * duplicate inherits the SAME `knowme-tab-id` — and so the same journal
 * key — as the still-live tab it was duplicated from. Without detecting
 * this, the duplicate's `replayJournal` would treat that shared key as its
 * own and replay/clear it unconditionally on startup, destroying the
 * original tab's live pending writes.
 *
 * This needs its own file (rather than a describe block in
 * persistence-journal.test.ts) because it depends on `getTabId()`'s
 * module-level `cachedTabId` and the module-level `tabIdentityReady` latch
 * being unset — i.e. a genuinely fresh module instance — which
 * `vi.resetModules()` plus a fresh dynamic `import()` provides, but only
 * cleanly in a file that does not already share a live import of the
 * module with other tests.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CharcoalDb } from "@/lib/db/pglite";
import type { WriteDescriptor } from "@/lib/db/write-queue";

const TAB_ID_STORAGE_KEY = "knowme-tab-id";
const JOURNAL_KEY_PREFIX = "knowme-pending-writes-v1";

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("not used in this test");
  },
  whenDbReady: () => new Promise(() => {}),
}));

interface FakeLock {
  name: string;
}

/**
 * Reports exactly one key's lock as already held by a live tab (the
 * original tab this test's duplicate inherited its id from); every other
 * key is free, matching a freshly minted id always being available.
 */
class DuplicateTabLockManager {
  constructor(private readonly heldKey: string) {}

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

    if (name === this.heldKey) {
      if (options.ifAvailable) return callback(null);
      // A blocking request against the live original's lock — this test
      // never issues one (installPersistenceJournal only does that for
      // THIS tab's own, de-duplicated key), so hanging forever here would
      // only matter if that assumption stopped holding.
      return new Promise(() => {});
    }
    return callback({ name });
  }
}

function fakeDb(calls: string[]): CharcoalDb {
  return {
    insertMessage: async () => {
      calls.push("upsertMessage");
    },
    deleteMessages: async () => {
      calls.push("deleteMessages");
    },
    upsertThread: async () => {
      calls.push("upsertThread");
    },
    touchThread: async (id: string) => {
      calls.push(`touchThread:${id}`);
    },
    deleteThread: async () => {
      calls.push("deleteThread");
    },
    getThreadUpdatedAt: async () => null,
  } as unknown as CharcoalDb;
}

describe("persistence-journal: a duplicated tab does not share the original's journal key", () => {
  const sharedKey = `${JOURNAL_KEY_PREFIX}:shared-id`;

  beforeEach(() => {
    localStorage.clear();
    window.sessionStorage.clear();
  });

  it("mints a fresh tab id instead of replaying or clearing the original's live key", async () => {
    // The duplicate's sessionStorage, inherited from the original tab.
    window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, "shared-id");
    Object.defineProperty(window.navigator, "locks", {
      value: new DuplicateTabLockManager(sharedKey),
      configurable: true,
      writable: true,
    });

    // The ORIGINAL live tab's own journal — must survive this tab's
    // startup untouched: not replayed, not cleared.
    localStorage.setItem(
      sharedKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "original-t1" }] satisfies WriteDescriptor[],
      }),
    );

    vi.resetModules();
    const mod = await import("./persistence-journal");

    const calls: string[] = [];
    await mod.replayJournal(fakeDb(calls));

    // The duplicate never replayed or cleared the original's live key.
    expect(calls).toEqual([]);
    expect(localStorage.getItem(sharedKey)).not.toBeNull();

    // It minted its own id instead of reusing the inherited one.
    const newId = window.sessionStorage.getItem(TAB_ID_STORAGE_KEY);
    expect(newId).not.toBeNull();
    expect(newId).not.toBe("shared-id");
    expect(mod.getTabId()).toBe(newId);
  });

  it("replays its own (freshly minted) key normally once it no longer collides", async () => {
    window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, "shared-id");
    Object.defineProperty(window.navigator, "locks", {
      value: new DuplicateTabLockManager(sharedKey),
      configurable: true,
      writable: true,
    });

    vi.resetModules();
    const mod = await import("./persistence-journal");

    // Wait for the id to be minted before writing a journal under it —
    // mirrors a duplicate tab that then queues and journals its own writes
    // after startup, under its own (now-unique) key.
    await mod.replayJournal(fakeDb([])); // resolves ensureUniqueTabIdentity as a side effect
    const ownId = mod.getTabId();
    expect(ownId).not.toBe("shared-id");

    const ownKey = mod.journalKeyForTab(ownId);
    localStorage.setItem(
      ownKey,
      JSON.stringify({
        version: 1,
        descriptors: [{ kind: "touchThread", id: "own-t2" }] satisfies WriteDescriptor[],
      }),
    );

    const calls: string[] = [];
    await mod.replayJournal(fakeDb(calls));

    expect(calls).toEqual(["touchThread:own-t2"]);
    expect(localStorage.getItem(ownKey)).toBeNull();
  });
});
