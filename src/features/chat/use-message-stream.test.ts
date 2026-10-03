import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

// PGlite is not available in jsdom; the store falls back to memory only.
// whenDbReady never resolving accurately models "no db, ever, in this
// environment" — the write queue then waits rather than dropping the write,
// but since it's never awaited by these tests, nothing hangs.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { useChatConnectivityStore, selectChatConnectivity } = await import(
  "@/stores/chat-connectivity-store"
);
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

/**
 * Public site build (VITE_SITE_AGENT_ID set): every chat request must be
 * pinned to the site agent, overriding both an explicit `agent_id` in the
 * payload and any agent registered against the thread — the agent picker is
 * hidden in that build, but this is the real enforcement point on the
 * client side (the nginx site proxy enforces it again server side).
 */
describe("useMessageStream — site build pins agent_id", () => {
  const SITE_THREAD = "thread-site-pinned";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("overrides an explicit payload agent_id and the thread's registered agent", async () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");

    useThreadRegistryStore.getState().registerThread(SITE_THREAD, "some-other-agent", "Some Other Agent");
    useChatMessageStore.getState().clearThread(SITE_THREAD);
    useChatMessageStore.getState().initThread(SITE_THREAD, []);

    const fetchMock: FetchMock = mockFetch({
      "POST /api/chat/completion": () => ({ status: 200, raw: successSse("Hi there") }),
    });

    const { result } = renderHook(() => useMessageStream());

    await act(async () => {
      await result.current.startStream(SITE_THREAD, { message: "hello", agent_id: "caller-requested-agent" });
    });

    const chatCall = fetchMock.calls.find((c) => c.path === "/api/chat/completion");
    expect((chatCall?.body as { agent_id?: string })?.agent_id).toBe("knowme-site");

    fetchMock.restore();
    useThreadRegistryStore.getState().removeThread(SITE_THREAD);
  });
});

/**
 * site-chat-offline-states task 1.3/1.4/1.5: a non-2xx response whose body
 * carries one of the known offline error codes (`server/src/error.rs`) sets
 * the thread's connectivity state instead of creating a failed assistant
 * message — no per-message error bubble, no status line or upstream text in
 * the thread (FR-27). `mockFetch` always answers with
 * `content-type: application/json` and no custom headers, so these use
 * `vi.spyOn(globalThis, "fetch")` directly to control the response body and
 * the `Retry-After` header.
 */
describe("useMessageStream — offline and rate-limited classification", () => {
  function jsonErrorResponse(status: number, error: string, message: string, headers?: HeadersInit) {
    return new Response(JSON.stringify({ error, message }), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
  }

  const OFFLINE_THREAD = "thread-offline";

  it.each([
    ["upstream_unavailable", 502],
    ["upstream_timeout", 504],
    ["upstream_error", 502],
    ["budget_exhausted", 503],
    ["meter_unavailable", 503],
    ["kill_switch_on", 503],
  ] as const)(
    "sets offline connectivity for %s (%i) and creates no failed assistant message",
    async (code, status) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonErrorResponse(status, code, code.replace(/_/g, " ")),
      );

      useChatMessageStore.getState().clearThread(OFFLINE_THREAD);
      useChatMessageStore.getState().initThread(OFFLINE_THREAD, []);
      useChatConnectivityStore.getState().clear(OFFLINE_THREAD);

      const { result } = renderHook(() => useMessageStream());
      await act(async () => {
        await result.current.startStream(OFFLINE_THREAD, { message: "Plan my week" });
      });

      const connectivity = selectChatConnectivity(OFFLINE_THREAD)(
        useChatConnectivityStore.getState(),
      );
      expect(connectivity).toEqual({ kind: "offline" });

      const messages = useChatMessageStore.getState().messagesByThread[OFFLINE_THREAD] ?? [];
      expect(messages.some((m) => m.role === "assistant")).toBe(false);

      const streaming = useChatMessageStore.getState().streamingByThread[OFFLINE_THREAD];
      expect(streaming?.isStreaming).toBe(false);
    },
  );

  it("sets rate-limited connectivity with the Retry-After seconds when supplied", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonErrorResponse(429, "rate_limited", "rate limited", { "Retry-After": "30" }),
    );

    useChatMessageStore.getState().clearThread(OFFLINE_THREAD);
    useChatMessageStore.getState().initThread(OFFLINE_THREAD, []);
    useChatConnectivityStore.getState().clear(OFFLINE_THREAD);

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(OFFLINE_THREAD, { message: "Plan my week" });
    });

    const connectivity = selectChatConnectivity(OFFLINE_THREAD)(useChatConnectivityStore.getState());
    expect(connectivity).toEqual({ kind: "rate-limited", retryAfterSeconds: 30 });
  });

  it("sets rate-limited connectivity with no number when Retry-After is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonErrorResponse(429, "rate_limited", "rate limited"),
    );

    useChatMessageStore.getState().clearThread(OFFLINE_THREAD);
    useChatMessageStore.getState().initThread(OFFLINE_THREAD, []);
    useChatConnectivityStore.getState().clear(OFFLINE_THREAD);

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(OFFLINE_THREAD, { message: "Plan my week" });
    });

    const connectivity = selectChatConnectivity(OFFLINE_THREAD)(useChatConnectivityStore.getState());
    expect(connectivity).toEqual({ kind: "rate-limited", retryAfterSeconds: undefined });
  });

  it("a new send attempt clears a prior offline notice for the thread", async () => {
    useChatConnectivityStore.getState().setOffline(OFFLINE_THREAD);
    useChatMessageStore.getState().clearThread(OFFLINE_THREAD);
    useChatMessageStore.getState().initThread(OFFLINE_THREAD, []);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(successSse("Back online"), {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
    );

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(OFFLINE_THREAD, { message: "Plan my week" });
    });

    const connectivity = selectChatConnectivity(OFFLINE_THREAD)(useChatConnectivityStore.getState());
    expect(connectivity).toEqual({ kind: "online" });
  });

  it("an unrecognized non-2xx code still falls through to the generic failed-message path", async () => {
    // Unaffected by this change: a 500 with no known offline code behaves
    // exactly as before (see the pre-delta-failure suite above).
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonErrorResponse(500, "internal_error", "internal error"),
    );

    useChatMessageStore.getState().clearThread(OFFLINE_THREAD);
    useChatMessageStore.getState().initThread(OFFLINE_THREAD, []);
    useChatConnectivityStore.getState().clear(OFFLINE_THREAD);

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(OFFLINE_THREAD, { message: "Plan my week" });
    });

    const connectivity = selectChatConnectivity(OFFLINE_THREAD)(useChatConnectivityStore.getState());
    expect(connectivity).toEqual({ kind: "online" });

    const messages = useChatMessageStore.getState().messagesByThread[OFFLINE_THREAD] ?? [];
    const assistant = messages.find((m) => m.role === "assistant");
    expect(assistant?.status).toBe("failed");
  });
});

/**
 * site-chat-offline-states task 1.6/1.7 (FR-11 client case): a denied tool
 * call must always render, and always as "denied" — never stuck "running"
 * and never silently dropped — whether or not the model's arguments ever
 * finished streaming first.
 */
describe("useMessageStream — agui.tool_call.denied", () => {
  const DENIED_THREAD = "thread-denied-tool";

  function deniedSse(): string {
    const rid = "req-denied-test";
    const events = [
      { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
      {
        event: "agui.tool_call.denied",
        data: {
          kind: "tool_call",
          phase: "denied",
          request_id: rid,
          call_index: 0,
          id: "call-1",
          name: "activate_skill",
          reason: "Tool calls are disabled for this agent.",
        },
      },
      { event: "agui.done", data: { kind: "done", request_id: rid } },
    ];
    return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
  }

  it("creates a denied tool-call block carrying the policy reason", async () => {
    const fetchMock: FetchMock = mockFetch({
      "POST /api/chat/completion": () => ({ status: 200, raw: deniedSse() }),
    });

    useChatMessageStore.getState().clearThread(DENIED_THREAD);
    useChatMessageStore.getState().initThread(DENIED_THREAD, []);

    const { result } = renderHook(() => useMessageStream());
    await act(async () => {
      await result.current.startStream(DENIED_THREAD, { message: "Use a tool" });
    });

    const messages = useChatMessageStore.getState().messagesByThread[DENIED_THREAD] ?? [];
    const assistant = messages.find((m) => m.role === "assistant");
    const toolCall = assistant?.content.find(
      (b): b is Extract<typeof b, { type: "tool-call" }> => b.type === "tool-call",
    );

    expect(toolCall?.status).toBe("denied");
    expect(toolCall?.toolName).toBe("activate_skill");
    expect(toolCall?.result).toBe("Tool calls are disabled for this agent.");

    fetchMock.restore();
  });
});
