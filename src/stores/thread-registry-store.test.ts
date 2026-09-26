import { beforeEach, describe, expect, it, vi } from "vitest";
import { flush } from "@/lib/db/write-queue";

const upsertThread = vi.fn().mockResolvedValue(undefined);
const touchThread = vi.fn().mockResolvedValue(undefined);
const deleteThread = vi.fn().mockResolvedValue(undefined);
const scrubThreadFromJournals = vi.fn();

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ upsertThread, touchThread, deleteThread }),
}));

// scrubThreadFromJournals' own correctness (localStorage side effects
// across own/other-tab keys) is covered directly in
// persistence-journal.test.ts; this file only proves removeThread calls it,
// with the right id, before the delete is enqueued (chat-persistence-durability
// operator decision 2026-09-26).
vi.mock("@/lib/db/persistence-journal", () => ({
  scrubThreadFromJournals,
}));

const { useThreadRegistryStore } = await import("./thread-registry-store");

const ID = "thread-registry-1";

function reset() {
  useThreadRegistryStore.setState({ threads: {}, activeThreadId: null });
  upsertThread.mockClear();
  touchThread.mockClear();
  deleteThread.mockClear();
  scrubThreadFromJournals.mockClear();
}

describe("thread-registry-store write-through", () => {
  beforeEach(reset);

  it("registerThread writes the new thread through, once", async () => {
    useThreadRegistryStore.getState().registerThread(ID, "agent-1", "Agent One");
    // Idempotent — calling again for an existing id must not enqueue a
    // second write.
    useThreadRegistryStore.getState().registerThread(ID, "agent-1", "Agent One");

    await flush();

    expect(upsertThread).toHaveBeenCalledTimes(1);
    expect(upsertThread).toHaveBeenCalledWith(
      expect.objectContaining({
        id: ID,
        agentId: "agent-1",
        agentName: "Agent One",
        isEphemeral: true,
      }),
    );
  });

  it("markPersisted writes the updated (non-ephemeral) thread", async () => {
    useThreadRegistryStore.getState().registerThread(ID);
    await flush();
    upsertThread.mockClear();

    useThreadRegistryStore.getState().markPersisted(ID);
    await flush();

    expect(upsertThread).toHaveBeenCalledTimes(1);
    expect(upsertThread).toHaveBeenCalledWith(
      expect.objectContaining({ id: ID, isEphemeral: false }),
    );
  });

  it("markPersisted on an unknown thread does not write", async () => {
    useThreadRegistryStore.getState().markPersisted("no-such-thread");
    await flush();
    expect(upsertThread).not.toHaveBeenCalled();
  });

  it("setTitle writes the updated thread", async () => {
    useThreadRegistryStore.getState().registerThread(ID);
    await flush();
    upsertThread.mockClear();

    useThreadRegistryStore.getState().setTitle(ID, "Weekly plan");
    await flush();

    expect(upsertThread).toHaveBeenCalledWith(
      expect.objectContaining({ id: ID, title: "Weekly plan" }),
    );
  });

  it("touch calls touchThread only, not a full upsert", async () => {
    useThreadRegistryStore.getState().registerThread(ID);
    await flush();
    upsertThread.mockClear();

    useThreadRegistryStore.getState().touch(ID);
    await flush();

    expect(touchThread).toHaveBeenCalledWith(ID, expect.any(String));
    expect(upsertThread).not.toHaveBeenCalled();
  });

  it("touch on an unknown thread does not write", async () => {
    useThreadRegistryStore.getState().touch("no-such-thread");
    await flush();
    expect(touchThread).not.toHaveBeenCalled();
  });

  it("removeThread deletes from PGlite unconditionally", async () => {
    useThreadRegistryStore.getState().removeThread("no-such-thread");
    await flush();
    expect(deleteThread).toHaveBeenCalledWith("no-such-thread");
  });

  it("removeThread scrubs the thread out of every tab's journal before enqueuing the delete", async () => {
    useThreadRegistryStore.getState().removeThread(ID);

    // Called synchronously, before the (async) delete write even settles.
    expect(scrubThreadFromJournals).toHaveBeenCalledWith(ID);
    expect(scrubThreadFromJournals).toHaveBeenCalledTimes(1);

    await flush();
    expect(deleteThread).toHaveBeenCalledWith(ID);
  });
});
