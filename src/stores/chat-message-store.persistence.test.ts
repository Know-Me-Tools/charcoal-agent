import { beforeEach, describe, expect, it, vi } from "vitest";

// A working (fake) DB, unlike chat-message-store.test.ts's "no db" mock —
// this file specifically verifies that deleteMessagesAfter's store mutation
// is paired with a real write-through delete, so a retried/regenerated turn
// doesn't resurrect the superseded rows on the next PGlite hydration.
const deleteMessages = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ deleteMessages }),
}));

const { useChatMessageStore } = await import("./chat-message-store");

const THREAD = "thread-delete-after";

describe("chat-message-store deleteMessagesAfter", () => {
  beforeEach(() => {
    deleteMessages.mockClear();
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, [
      {
        id: "u1",
        role: "user",
        content: [{ type: "text", text: "Plan my week" }],
        createdAt: new Date(),
        status: "complete",
      },
      {
        id: "a1",
        role: "assistant",
        content: [{ type: "error", message: "boom" }],
        createdAt: new Date(),
        status: "failed",
      },
    ]);
  });

  it("removes every message after the given id from the store", () => {
    useChatMessageStore.getState().deleteMessagesAfter(THREAD, "u1");

    const msgs = useChatMessageStore.getState().messagesByThread[THREAD];
    expect(msgs.map((m) => m.id)).toEqual(["u1"]);
  });

  it("deletes the removed rows from PGlite — no orphaned rows left behind", () => {
    useChatMessageStore.getState().deleteMessagesAfter(THREAD, "u1");

    expect(deleteMessages).toHaveBeenCalledWith(THREAD, ["a1"]);
  });

  it("removes multiple trailing messages in one call", () => {
    useChatMessageStore.getState().initThread(THREAD, [
      ...useChatMessageStore.getState().messagesByThread[THREAD],
      {
        id: "u2",
        role: "user",
        content: [{ type: "text", text: "duplicate" }],
        createdAt: new Date(),
        status: "complete",
      },
      {
        id: "a2",
        role: "assistant",
        content: [{ type: "text", text: "duplicate reply" }],
        createdAt: new Date(),
        status: "complete",
      },
    ]);

    useChatMessageStore.getState().deleteMessagesAfter(THREAD, "u1");

    const msgs = useChatMessageStore.getState().messagesByThread[THREAD];
    expect(msgs.map((m) => m.id)).toEqual(["u1"]);
    expect(deleteMessages).toHaveBeenCalledWith(THREAD, ["a1", "u2", "a2"]);
  });

  it("does nothing when the given id is already the last message", () => {
    useChatMessageStore.getState().deleteMessagesAfter(THREAD, "a1");

    const msgs = useChatMessageStore.getState().messagesByThread[THREAD];
    expect(msgs.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(deleteMessages).not.toHaveBeenCalled();
  });

  it("does nothing for an unknown thread or message id", () => {
    useChatMessageStore.getState().deleteMessagesAfter("no-such-thread", "u1");
    useChatMessageStore.getState().deleteMessagesAfter(THREAD, "no-such-id");

    const msgs = useChatMessageStore.getState().messagesByThread[THREAD];
    expect(msgs.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(deleteMessages).not.toHaveBeenCalled();
  });
});
