import { beforeEach, describe, expect, it, vi } from "vitest";
import { flush } from "@/lib/db/write-queue";
import type { RichMessage, ToolCallContentBlock } from "@/types/chat-content";

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

describe("chat-message-store persistMessages: only what changed this turn", () => {
  beforeEach(() => {
    insertMessage.mockReset();
    insertMessage.mockResolvedValue(undefined);
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
  });

  it("does not re-upsert messages that already persisted successfully in an earlier turn", async () => {
    const s = useChatMessageStore.getState();

    // Turn 1: a user message plus the streamed reply.
    s.initThread(THREAD, [
      { id: "u1", role: "user", content: [{ type: "text", text: "hi" }], createdAt: new Date(), status: "complete" },
    ]);
    s.beginStream(THREAD, "run-1");
    s.appendTextDelta(THREAD, "run-1", "hello");
    s.finishStream(THREAD);
    await flush();

    expect(insertMessage.mock.calls.map(([, m]: [string, { id: string }]) => m.id)).toEqual([
      "u1",
      expect.stringMatching(/^stream-run-1-/),
    ]);
    insertMessage.mockClear();

    // Turn 2: append a second user message and a second reply to the SAME
    // thread. Only the two NEW messages should be enqueued — re-upserting
    // "u1" and the first reply (the journal holding the whole history) is
    // exactly the defect this test guards against.
    const current = useChatMessageStore.getState().messagesByThread[THREAD];
    s.initThread(THREAD, [
      ...current,
      { id: "u2", role: "user", content: [{ type: "text", text: "again" }], createdAt: new Date(), status: "complete" },
    ]);
    s.beginStream(THREAD, "run-2");
    s.appendTextDelta(THREAD, "run-2", "world");
    s.finishStream(THREAD);
    await flush();

    const idsTurn2 = insertMessage.mock.calls.map(([, m]: [string, { id: string }]) => m.id);
    expect(idsTurn2).toEqual(["u2", expect.stringMatching(/^stream-run-2-/)]);
  });

  it("heals: a message whose upsert failed is retried on the next turn's persistMessages call", async () => {
    const s = useChatMessageStore.getState();

    s.initThread(THREAD, [
      { id: "u1", role: "user", content: [{ type: "text", text: "hi" }], createdAt: new Date(), status: "complete" },
    ]);
    insertMessage.mockRejectedValueOnce(new Error("transient failure"));
    s.beginStream(THREAD, "run-1");
    s.appendTextDelta(THREAD, "run-1", "hello");
    s.finishStream(THREAD);
    await flush();

    // "u1"'s upsert failed (the mock rejects the first call — u1 is
    // enqueued before the assistant reply). It must not be marked as
    // durably persisted, so the next successful turn retries it.
    insertMessage.mockReset();
    insertMessage.mockResolvedValue(undefined);

    const current = useChatMessageStore.getState().messagesByThread[THREAD];
    s.initThread(THREAD, [
      ...current,
      { id: "u2", role: "user", content: [{ type: "text", text: "again" }], createdAt: new Date(), status: "complete" },
    ]);
    s.beginStream(THREAD, "run-2");
    s.appendTextDelta(THREAD, "run-2", "world");
    s.finishStream(THREAD);
    await flush();

    const idsTurn2 = insertMessage.mock.calls.map(([, m]: [string, { id: string }]) => m.id);
    // "u1" heals (retried) alongside the genuinely new turn-2 messages —
    // the first reply (run-1's assistant message), which succeeded, is not
    // retried.
    expect(idsTurn2).toEqual(["u1", "u2", expect.stringMatching(/^stream-run-2-/)]);
  });
});

describe("chat-message-store updateToolCall: re-saves a message it mutates after it was already persisted (design.md Amendment)", () => {
  beforeEach(() => {
    insertMessage.mockReset();
    insertMessage.mockResolvedValue(undefined);
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
  });

  function toolCallBlock(status: ToolCallContentBlock["status"]): ToolCallContentBlock {
    return { type: "tool-call", toolCallId: "call-1", toolName: "search", args: {}, status };
  }

  it("re-enqueues the message when a tool-call block on it is updated after finishStream already saved it", async () => {
    const s = useChatMessageStore.getState();

    s.beginStream(THREAD, "run-1");
    s.addToolCall(THREAD, toolCallBlock("running"));
    s.finishStream(THREAD);
    await flush();

    expect(insertMessage).toHaveBeenCalledTimes(1);
    const savedId = (insertMessage.mock.calls[0] as [string, RichMessage])[1].id;
    insertMessage.mockClear();

    // A delayed agui.tool_result arrives after the message was already
    // finalized and durably saved — persistMessages' persistedMessageIds
    // guard (design.md's "only what changed" amendment) must not hide this
    // change forever, since nothing else re-saves an already-persisted
    // message.
    s.updateToolCall(THREAD, "call-1", { status: "complete", result: "done" });
    await flush();

    expect(insertMessage).toHaveBeenCalledTimes(1);
    const [, resaved] = insertMessage.mock.calls[0] as [string, RichMessage];
    expect(resaved.id).toBe(savedId);
    const block = resaved.content.find(
      (b): b is ToolCallContentBlock => b.type === "tool-call",
    );
    expect(block?.status).toBe("complete");
    expect(block?.result).toBe("done");
  });

  it("does not enqueue a write when the mutated message is still streaming", async () => {
    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, "run-1");
    s.addToolCall(THREAD, toolCallBlock("running"));

    s.updateToolCall(THREAD, "call-1", { status: "complete" });
    await flush();

    expect(insertMessage).not.toHaveBeenCalled();
  });

  it("does nothing when the toolCallId does not match any message", async () => {
    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, "run-1");
    s.addToolCall(THREAD, toolCallBlock("running"));
    s.finishStream(THREAD);
    await flush();
    insertMessage.mockClear();

    s.updateToolCall(THREAD, "no-such-call", { status: "complete" });
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
    // Assertions must NOT run inside the mock: a throw there rejects
    // insertMessage's promise, which the write queue catches and logs
    // (reportFailure) rather than propagating — so `await flush()` would
    // resolve regardless of whether the assertion actually passed, and this
    // test could never fail even against a regression. Collect the values
    // seen and assert after flush(), like the finishStream test above.
    const seen: Array<{ contentLength: number; status: string }> = [];
    insertMessage.mockImplementation(
      async (_threadId: string, message: { content: unknown[]; status: string }) => {
        // Touching properties here throws "Cannot perform 'get' on a proxy
        // that has been revoked" if `message` is still the immer draft.
        seen.push({ contentLength: message.content.length, status: message.status });
      },
    );

    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, RUN);
    s.setStreamError(THREAD, "boom");

    await flush();

    expect(seen).toEqual([{ contentLength: 1, status: "failed" }]);
    expect(insertMessage).toHaveBeenCalledTimes(1);
  });
});
