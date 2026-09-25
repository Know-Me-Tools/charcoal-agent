import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";

// PGlite is not available in jsdom; the store falls back to memory only.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { useMessageStream } = await import("./use-message-stream");

const THREAD = "thread-pre-delta-fail";
const RETRY_THREAD = "thread-retry";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Minimal valid SSE body: start, one text delta, done. */
function successSse(text: string): string {
  const rid = "req-retry-test";
  const events = [
    { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
    {
      event: "agui.message.delta",
      data: { kind: "message", phase: "delta", request_id: rid, delta: { text } },
    },
    { event: "agui.done", data: { kind: "done", request_id: rid } },
  ];
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

/**
 * docs/qa/chat-surfaces-flat2.md §6.6: if the completion request fails
 * before the first content delta (HTTP 500/502, a network error, or the SSE
 * stream closing with no events), the streaming assistant message was never
 * created (`getOrCreateStreamingMessage` only runs from a block handler), so
 * `setStreamError` — which only updates an *existing* streaming message —
 * was a no-op. No assistant message meant no error UI at all: MessageError
 * only renders once an assistant message with `status: "failed"` exists in
 * the thread.
 */
describe("useMessageStream — pre-delta failure surfaces an errored assistant message", () => {
  it("HTTP 500 before any SSE event still produces a failed assistant message", async () => {
    const fetchMock: FetchMock = mockFetch({
      "POST /api/chat/completion": () => ({ status: 500, body: "Internal Server Error" }),
    });

    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());

    await act(async () => {
      await result.current.startStream(THREAD, { message: "Plan my week" });
    });

    const messages = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
    const assistant = messages.find((m) => m.role === "assistant");

    expect(assistant).toBeDefined();
    expect(assistant?.status).toBe("failed");
  });

  it("a rejected fetch (network error) before any SSE event still produces a failed assistant message", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"));

    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());

    await act(async () => {
      await result.current.startStream(THREAD, { message: "Plan my week" });
    });

    const messages = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
    const assistant = messages.find((m) => m.role === "assistant");

    expect(assistant).toBeDefined();
    expect(assistant?.status).toBe("failed");
  });

  it("a 200 stream that closes with zero SSE events still produces a failed assistant message", async () => {
    const fetchMock: FetchMock = mockFetch({
      // A 200 whose body closes immediately, with no agui.stream.start, no
      // deltas, and no agui.done — e.g. a dropped connection or a proxy
      // that swallows the response.
      "POST /api/chat/completion": () => ({ status: 200, raw: "" }),
    });

    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());

    await act(async () => {
      await result.current.startStream(THREAD, { message: "Plan my week" });
    });

    const messages = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
    const assistant = messages.find((m) => m.role === "assistant");

    expect(assistant).toBeDefined();
    expect(assistant?.status).toBe("failed");
  });
});

/**
 * CRITICAL 1 (adversarial review): `onReload` (use-chat-runtime.ts) must not
 * duplicate the user message it resends. It calls
 * `deleteMessagesAfter(threadId, parentId)` to drop the superseded turn (the
 * failed/old assistant reply and anything after it), then `startStream` with
 * `{ skipUserMessage: true }` to resend without appending a second copy of
 * the user message. These tests exercise that same two-step sequence
 * directly at the store/stream boundary `onReload` sits on top of.
 */
describe("useMessageStream — retry/regenerate reuses the existing user message", () => {
  it("reload of a failed reply leaves exactly [user, new assistant]", async () => {
    useChatMessageStore.getState().clearThread(RETRY_THREAD);
    useChatMessageStore.getState().initThread(RETRY_THREAD, [
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

    useChatMessageStore.getState().deleteMessagesAfter(RETRY_THREAD, "u1");

    const fetchMock: FetchMock = mockFetch({
      "POST /api/chat/completion": () => ({ status: 200, raw: successSse("Here's your plan") }),
    });

    const { result } = renderHook(() => useMessageStream());

    await act(async () => {
      await result.current.startStream(
        RETRY_THREAD,
        { message: "Plan my week" },
        undefined,
        { skipUserMessage: true },
      );
    });

    const messages = useChatMessageStore.getState().messagesByThread[RETRY_THREAD] ?? [];
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(messages[0]?.id).toBe("u1");
    expect(messages[1]?.status).toBe("complete");

    fetchMock.restore();
  });

  it("regenerating a good answer replaces it, keeping the same message count", async () => {
    useChatMessageStore.getState().clearThread(RETRY_THREAD);
    useChatMessageStore.getState().initThread(RETRY_THREAD, [
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
        content: [{ type: "text", text: "Old answer" }],
        createdAt: new Date(),
        status: "complete",
      },
    ]);

    useChatMessageStore.getState().deleteMessagesAfter(RETRY_THREAD, "u1");

    const fetchMock: FetchMock = mockFetch({
      "POST /api/chat/completion": () => ({ status: 200, raw: successSse("New answer") }),
    });

    const { result } = renderHook(() => useMessageStream());

    await act(async () => {
      await result.current.startStream(
        RETRY_THREAD,
        { message: "Plan my week" },
        undefined,
        { skipUserMessage: true },
      );
    });

    const messages = useChatMessageStore.getState().messagesByThread[RETRY_THREAD] ?? [];
    expect(messages).toHaveLength(2);
    expect(messages[0]?.id).toBe("u1");
    expect(messages[1]?.id).not.toBe("a1");
    expect(messages[1]?.status).toBe("complete");

    fetchMock.restore();
  });
});
