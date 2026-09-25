import { beforeEach, describe, expect, it, vi } from "vitest";
import { flush } from "@/lib/db/write-queue";

// A working (fake) DB whose insertMessage reads a nested property one
// microtask after finishStream's/setStreamError's set() producer returns —
// exactly the window where a captured immer draft's proxy has already been
// revoked. This is the "descriptors built from committed state, not immer
// drafts" regression guard (chat-persistence-durability design decision 2).
const insertMessage = vi.fn();

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ insertMessage }),
}));

const { useChatMessageStore } = await import("./chat-message-store");

const THREAD = "thread-write-queue";
const RUN = "run-1";

describe("chat-message-store finishStream persistence", () => {
  beforeEach(() => {
    insertMessage.mockReset();
    insertMessage.mockResolvedValue(undefined);
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
  });

  it("builds the persisted message from committed state, not an immer draft", async () => {
    const seenContentLengths: number[] = [];
    insertMessage.mockImplementation(
      async (_threadId: string, message: { content: unknown[] }) => {
        // Touching a property here throws "Cannot perform 'get' on a proxy
        // that has been revoked" if `message` is still the immer draft
        // instead of the plain object committed by set().
        seenContentLengths.push(message.content.length);
      },
    );

    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, RUN);
    s.appendTextDelta(THREAD, RUN, "hello");
    s.finishStream(THREAD);

    await flush();

    expect(seenContentLengths).toEqual([1]);
    expect(insertMessage).toHaveBeenCalledTimes(1);
  });

  it("persists every complete message, skipping the still-streaming one", async () => {
    const s = useChatMessageStore.getState();
    s.initThread(THREAD, [
      {
        id: "u1",
        role: "user",
        content: [{ type: "text", text: "hi" }],
        createdAt: new Date(),
        status: "complete",
      },
    ]);
    s.beginStream(THREAD, RUN);
    s.appendTextDelta(THREAD, RUN, "hello");
    s.finishStream(THREAD);

    await flush();

    const ids = insertMessage.mock.calls.map(([, m]: [string, { id: string }]) => m.id);
    expect(ids).toEqual(["u1", expect.stringMatching(/^stream-/)]);
  });

  it("does nothing when no stream was active", async () => {
    useChatMessageStore.getState().finishStream(THREAD);
    await flush();
    expect(insertMessage).not.toHaveBeenCalled();
  });
});

describe("chat-message-store setStreamError persistence", () => {
  beforeEach(() => {
    insertMessage.mockReset();
    insertMessage.mockResolvedValue(undefined);
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
  });

  it("builds the failed message from committed state, not an immer draft", async () => {
    insertMessage.mockImplementation(
      async (_threadId: string, message: { content: unknown[]; status: string }) => {
        // Same revoked-proxy guard as above, applied to the error path.
        expect(message.content.length).toBeGreaterThan(0);
        expect(message.status).toBe("failed");
      },
    );

    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, RUN);
    s.setStreamError(THREAD, "boom");

    await expect(flush()).resolves.toBeUndefined();
    expect(insertMessage).toHaveBeenCalledTimes(1);
  });
});
