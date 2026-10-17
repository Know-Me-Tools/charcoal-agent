import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));
// The stall watchdog runs on the site build only.
vi.mock("@/hooks/use-site-config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-site-config")>()),
  getSiteAgentId: () => "knowme-site",
  isSiteBuild: () => true,
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { useMessageStream } = await import("./use-message-stream");

const THREAD = "thread-stall";
const enc = new TextEncoder();

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** A response that sends `first` and then goes silent until the request is aborted, like a dead connection. */
function silentAfter(first: string): typeof fetch {
  return ((_url: unknown, init?: RequestInit) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode(first));
        init?.signal?.addEventListener("abort", () =>
          controller.error(new DOMException("The operation was aborted.", "AbortError")),
        );
      },
    });
    return Promise.resolve(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } }));
  }) as typeof fetch;
}

const FIRST =
  'event: agui.stream.start\ndata: {"kind":"stream","phase":"start","request_id":"r"}\n\n' +
  'event: agui.message.delta\ndata: {"kind":"message","phase":"delta","request_id":"r","delta":{"text":"Partial answer"}}\n\n';

describe("useMessageStream: a connection that stops delivering bytes", () => {
  it("ends as a failed reply (Try again) instead of streaming forever, keeping the text received", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(silentAfter(FIRST));
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
    const { result } = renderHook(() => useMessageStream());
    const onError = vi.fn();

    let finished = false;
    const run = result.current.startStream(THREAD, { message: "hello" }, { onError }).then(() => {
      finished = true;
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(finished, "still waiting 30 s in: the silence is not yet a stall").toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    await run;

    expect(onError).toHaveBeenCalledOnce();
    const assistant = (useChatMessageStore.getState().messagesByThread[THREAD] ?? []).find((m) => m.role === "assistant");
    expect(assistant?.status).toBe("failed");
    expect(JSON.stringify(assistant?.content)).toContain("Partial answer");
    expect(useChatMessageStore.getState().streamingByThread[THREAD]?.isStreaming ?? false).toBe(false);
  });
});
