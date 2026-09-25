import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

// A controllable fake CharcoalDb: deleteMessages resolves only when the test
// calls resolveDelete(), so the test can prove startStream's fetch waits
// for onReload's delete to settle instead of firing eagerly —
// chat-persistence-durability design decision 4.
let resolveDelete: () => void = () => {};
const deleteMessages = vi.fn(
  () => new Promise<void>((resolve) => { resolveDelete = resolve; }),
);
const insertMessage = vi.fn().mockResolvedValue(undefined);
const upsertThread = vi.fn().mockResolvedValue(undefined);
const touchThread = vi.fn().mockResolvedValue(undefined);
const getMessages = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ deleteMessages, insertMessage, upsertThread, touchThread, getMessages }),
}));

// Capture the config useChatRuntime passes to useExternalStoreRuntime so the
// test can call onReload directly, without driving assistant-ui's full
// runtime/UI layer — onReload is a plain closure and this is the seam
// useChatRuntime exposes it through.
let capturedOnReload: ((parentId: string | null) => Promise<void>) | null = null;
vi.mock("@assistant-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@assistant-ui/react")>();
  return {
    ...actual,
    // Mirrors useChatRuntime's own `as any` cast at the useExternalStoreRuntime call site.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useExternalStoreRuntime: (config: any) => {
      capturedOnReload = config.onReload;
      return actual.useExternalStoreRuntime(config);
    },
  };
});

const { useChatRuntime } = await import("./use-chat-runtime");

const THREAD = "22222222-3333-4444-8555-666666666666";
const USER_MSG_ID = "u1";

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

function seedThread() {
  useChatMessageStore.getState().clearThread(THREAD);
  useChatMessageStore.getState().initThread(THREAD, [
    { id: USER_MSG_ID, role: "user", content: [{ type: "text", text: "Plan my week" }], createdAt: new Date(), status: "complete" },
    { id: "a1", role: "assistant", content: [{ type: "error", message: "boom" }], createdAt: new Date(), status: "failed" },
  ]);
  useThreadRegistryStore.setState({
    threads: {
      [THREAD]: {
        id: THREAD,
        sessionId: THREAD,
        title: "Existing thread", // not "New conversation" — skips title generation
        isEphemeral: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    activeThreadId: null,
  });
}

describe("useChatRuntime onReload", () => {
  beforeEach(() => {
    capturedOnReload = null;
    deleteMessages.mockClear();
    insertMessage.mockClear();
    upsertThread.mockClear();
    touchThread.mockClear();
    seedThread();
  });

  it("calls startStream's fetch only after the delete settles", async () => {
    fetchMock = mockFetch({
      "POST /api/chat/completion": () => ({
        raw:
          'event: agui.message.delta\ndata: {"kind":"message","phase":"delta","request_id":"r1","delta":{"text":"Retried reply"}}\n\n' +
          'event: agui.done\ndata: {"kind":"done","request_id":"r1"}\n\n',
      }),
    });

    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    expect(capturedOnReload).not.toBeNull();

    let reloadPromise!: Promise<void>;
    act(() => {
      reloadPromise = capturedOnReload!(USER_MSG_ID);
    });

    // Let the synchronous store update and the delete's enqueue run, but the
    // delete itself is still pending (resolveDelete hasn't been called) —
    // startStream must not have posted yet.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(deleteMessages).toHaveBeenCalledWith(THREAD, ["a1"]);
    expect(fetchMock.calls).toHaveLength(0);

    await act(async () => {
      resolveDelete();
      await reloadPromise;
    });

    expect(fetchMock.calls).toHaveLength(1);
    expect(fetchMock.calls[0]).toMatchObject({ method: "POST", path: "/api/chat/completion" });
  });

  it("still calls startStream when the delete rejects", async () => {
    deleteMessages.mockImplementationOnce(() => Promise.reject(new Error("db unavailable")));
    fetchMock = mockFetch({
      "POST /api/chat/completion": () => ({
        raw: 'event: agui.done\ndata: {"kind":"done","request_id":"r1"}\n\n',
      }),
    });

    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    await act(async () => {
      await capturedOnReload!(USER_MSG_ID);
    });

    expect(fetchMock.calls).toHaveLength(1);
  });
});
