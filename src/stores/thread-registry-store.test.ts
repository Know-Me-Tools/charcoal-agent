import { beforeEach, describe, expect, it, vi } from "vitest";
import { flush } from "@/lib/db/write-queue";

const upsertThread = vi.fn().mockResolvedValue(undefined);
const touchThread = vi.fn().mockResolvedValue(undefined);
const deleteThread = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ upsertThread, touchThread, deleteThread }),
}));

const { useThreadRegistryStore } = await import("./thread-registry-store");

const ID = "thread-registry-1";

function reset() {
  useThreadRegistryStore.setState({ threads: {}, activeThreadId: null });
  upsertThread.mockClear();
  touchThread.mockClear();
  deleteThread.mockClear();
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

    expect(touchThread).toHaveBeenCalledWith(ID);
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
});
