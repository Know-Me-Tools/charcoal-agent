import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch } from "@/test/utils/mock-fetch";
import type { ContentBlock, RichMessage } from "@/types/chat-content";

// PGlite is not available in jsdom; see use-message-stream.test.ts.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { useMessageStream } = await import("./use-message-stream");

const RID = "req-coalescing";

interface SseEvent {
  event: string;
  data: Record<string, unknown>;
}

function sse(events: SseEvent[]): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

const START: SseEvent = {
  event: "agui.stream.start",
  data: { kind: "stream", phase: "start", request_id: RID },
};
const DONE: SseEvent = { event: "agui.done", data: { kind: "done", request_id: RID } };

function delta(text: string): SseEvent {
  return {
    event: "agui.message.delta",
    data: { kind: "message", phase: "delta", request_id: RID, delta: { text } },
  };
}

function textOf(message: RichMessage | undefined): string {
  return (message?.content ?? [])
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function assistantOf(threadId: string): RichMessage | undefined {
  return (useChatMessageStore.getState().messagesByThread[threadId] ?? []).find(
    (m) => m.role === "assistant",
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/**
 * app-mobile-stream-reliability-and-heat task 1.2: text deltas are buffered
 * in the reader and committed at most once per frame; the buffer always
 * flushes, in order, before any non-text event and before done/error/abort.
 */
describe("use-message-stream delta coalescing", () => {
  it("many deltas in one burst produce exactly one text-changing store commit, content fully preserved", async () => {
    const THREAD = "t-coalesce-one-commit";
    mockFetch({
      "POST /api/chat/completion": () => ({
        status: 200,
        raw: sse([START, delta("Hello"), delta(" brave"), delta(" new"), delta(" world"), delta("!"), DONE]),
      }),
    });
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    // Count store commits that change the assistant message's text.
    let textChanges = 0;
    let lastText = "";
    const unsubscribe = useChatMessageStore.subscribe((state) => {
      const text = textOf(
        state.messagesByThread[THREAD]?.find((m) => m.role === "assistant"),
      );
      if (text !== lastText) {
        lastText = text;
        textChanges += 1;
      }
    });

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(THREAD, { message: "hi" });
    });
    unsubscribe();

    expect(textChanges).toBe(1);
    expect(lastText).toBe("Hello brave new world!");
    expect(assistantOf(THREAD)?.status).toBe("complete");
  });

  it("flushes buffered text before a non-text event, preserving block order exactly", async () => {
    const THREAD = "t-coalesce-order";
    const step: SseEvent = {
      event: "agui.step",
      data: { kind: "step", phase: "started", index: 0, label: "Thinking" },
    };
    mockFetch({
      "POST /api/chat/completion": () => ({
        status: 200,
        raw: sse([START, delta("a"), delta("b"), step, delta("c"), DONE]),
      }),
    });
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(THREAD, { message: "hi" });
    });

    expect(assistantOf(THREAD)?.content).toEqual([
      { type: "text", text: "ab" },
      { type: "step", index: 0, phase: "started", label: "Thinking" },
      { type: "text", text: "c" },
    ]);
  });

  it("flushes the buffer before an agui.error, so text precedes the error block", async () => {
    const THREAD = "t-coalesce-error-event";
    mockFetch({
      "POST /api/chat/completion": () => ({
        status: 200,
        raw: sse([
          START,
          delta("a"),
          delta("b"),
          { event: "agui.error", data: { kind: "error", request_id: RID, message: "boom" } },
        ]),
      }),
    });
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(THREAD, { message: "hi" });
    });

    const assistant = assistantOf(THREAD);
    expect(assistant?.status).toBe("failed");
    expect(assistant?.content).toEqual([
      { type: "text", text: "ab" },
      { type: "error", message: "boom" },
    ]);
  });

  it("flushes the buffer when the stream errors mid-reply", async () => {
    const THREAD = "t-coalesce-stream-error";
    const encoder = new TextEncoder();
    let ctrl!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        ctrl = c;
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(body, { status: 200 }));

    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());
    let streamPromise!: Promise<void>;
    await act(async () => {
      streamPromise = result.current.startStream(THREAD, { message: "hi" });
    });

    ctrl.enqueue(encoder.encode(sse([START, delta("a"), delta("b")])));
    ctrl.error(new Error("net down"));

    await act(async () => {
      await streamPromise;
    });

    const assistant = assistantOf(THREAD);
    expect(assistant?.status).toBe("failed");
    expect(assistant?.content).toEqual([
      { type: "text", text: "ab" },
      { type: "error", message: "net down" },
    ]);
  });

  it("flushes the buffer on abort: cancelStream commits received text to the existing message", async () => {
    vi.useFakeTimers();
    const THREAD = "t-coalesce-abort";
    const encoder = new TextEncoder();
    let ctrl!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        ctrl = c;
      },
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      init?.signal?.addEventListener("abort", () => {
        ctrl.error(new DOMException("The operation was aborted.", "AbortError"));
      });
      return new Response(body, { status: 200 });
    });

    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());
    let streamPromise!: Promise<void>;
    await act(async () => {
      streamPromise = result.current.startStream(THREAD, { message: "hi" });
    });

    ctrl.enqueue(encoder.encode(sse([START, delta("a"), delta("b")])));
    // Let the read loop consume the chunk; the scheduled flush (faked frame
    // or timer) must NOT fire, so the text stays buffered.
    await act(async () => {
      for (let i = 0; i < 5; i += 1) await vi.advanceTimersByTimeAsync(0);
    });
    expect(textOf(assistantOf(THREAD))).toBe("");

    act(() => {
      result.current.cancelStream();
    });

    // The buffered text was committed, to the one streaming message — no
    // zombie second assistant message, no lost text.
    expect(textOf(assistantOf(THREAD))).toBe("ab");
    expect(
      (useChatMessageStore.getState().messagesByThread[THREAD] ?? []).filter(
        (m) => m.role === "assistant",
      ),
    ).toHaveLength(1);

    await act(async () => {
      await streamPromise;
    });
  });

  it("uses the 50 ms timer path while the page is hidden", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);

    const THREAD = "t-coalesce-hidden";
    const encoder = new TextEncoder();
    let ctrl!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        ctrl = c;
      },
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      init?.signal?.addEventListener("abort", () => {
        ctrl.error(new DOMException("The operation was aborted.", "AbortError"));
      });
      return new Response(body, { status: 200 });
    });

    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);

    const { result } = renderHook(() => useMessageStream());
    let streamPromise!: Promise<void>;
    await act(async () => {
      streamPromise = result.current.startStream(THREAD, { message: "hi" });
    });

    ctrl.enqueue(encoder.encode(sse([START, delta("a"), delta("b")])));
    // Let the read loop consume the chunk; the hidden-mode timer (50 ms)
    // must not fire during these zero-length pumps.
    await act(async () => {
      for (let i = 0; i < 5; i += 1) await vi.advanceTimersByTimeAsync(0);
    });
    expect(textOf(assistantOf(THREAD))).toBe("");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(49);
    });
    expect(textOf(assistantOf(THREAD))).toBe("");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(textOf(assistantOf(THREAD))).toBe("ab");

    act(() => {
      result.current.cancelStream();
    });
    await act(async () => {
      await streamPromise;
    });
  });
});
