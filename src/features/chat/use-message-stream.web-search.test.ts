/**
 * site-web-search toggle: the completion request carries `web_search: true`
 * only when the visitor's toggle is on, read at send time, and only on the
 * site build. The field is omitted (not `false`) when off.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { useWebSearchPreferenceStore } = await import("@/stores/web-search-preference-store");
const { useMessageStream } = await import("./use-message-stream");

const THREAD = "thread-web-search-body";

function sse(): string {
  const rid = "req-web-search";
  return [
    { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
    { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: "ok" } } },
    { event: "agui.done", data: { kind: "done", request_id: rid } },
  ]
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");
}

let fetchMock: FetchMock;

async function send(message: string): Promise<Record<string, unknown>> {
  const { result } = renderHook(() => useMessageStream());
  await act(async () => {
    await result.current.startStream(THREAD, { message });
  });
  const calls = fetchMock.calls.filter((c) => c.path === "/api/chat/completion");
  return calls[calls.length - 1].body as Record<string, unknown>;
}

beforeEach(() => {
  localStorage.clear();
  useWebSearchPreferenceStore.setState({ enabled: false });
  useChatMessageStore.getState().clearThread(THREAD);
  useChatMessageStore.getState().initThread(THREAD, []);
  fetchMock = mockFetch({ "POST /api/chat/completion": () => ({ status: 200, raw: sse() }) });
});

afterEach(() => {
  fetchMock.restore();
  vi.unstubAllEnvs();
});

describe("useMessageStream: web_search on the site build", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
  });

  it("omits the field when the toggle is off", async () => {
    const body = await send("hello");
    expect("web_search" in body).toBe(false);
  });

  it("sends web_search: true when the toggle is on", async () => {
    useWebSearchPreferenceStore.getState().setEnabled(true);
    const body = await send("what changed in rust?");
    expect(body.web_search).toBe(true);
  });

  it("reads the toggle at send time, so an earlier request is not rewritten", async () => {
    useWebSearchPreferenceStore.getState().setEnabled(true);
    const first = await send("one");
    useWebSearchPreferenceStore.getState().setEnabled(false);
    const second = await send("two");
    expect(first.web_search).toBe(true);
    expect("web_search" in second).toBe(false);
  });
});

describe("useMessageStream: web_search on the app build", () => {
  it("never sends the field, even with a stored preference", async () => {
    useWebSearchPreferenceStore.setState({ enabled: true });
    const body = await send("hello");
    expect("web_search" in body).toBe(false);
  });
});
