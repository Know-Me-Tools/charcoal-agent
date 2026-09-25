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

afterEach(() => {
  vi.restoreAllMocks();
});

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

    fetchMock.restore();
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

    fetchMock.restore();
  });
});
