import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

// A 413 on send. assistant-ui clears the composer when it dispatches a send
// and gives the text back only when onNew rejects with MessageNotSentError.
// This drives the real runtime and composer (no onNew shortcut), so it proves
// the draft survives a refused send, which the runtime would not do on its own.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({
    insertMessage: vi.fn().mockResolvedValue(undefined),
    upsertThread: vi.fn().mockResolvedValue(undefined),
    touchThread: vi.fn().mockResolvedValue(undefined),
    deleteMessages: vi.fn().mockResolvedValue(undefined),
    getMessages: vi.fn().mockResolvedValue([]),
  }),
}));

const { useChatRuntime } = await import("./use-chat-runtime");

const THREAD = "44444444-5555-4666-8777-888888888888";
const LONG_TEXT = "word ".repeat(820);

let fetchMock: FetchMock;

beforeEach(() => {
  useChatMessageStore.getState().clearThread(THREAD);
  useChatIntentStore.setState({ pendingPrompt: null });
  useThreadRegistryStore.setState({ threads: {}, activeThreadId: null, hydrated: true });
  fetchMock = mockFetch({
    "POST /api/chat/completion": () => ({
      status: 413,
      body: { error: "payload_too_large", message: "`message` is longer than 4000 characters" },
    }),
  });
});

afterEach(() => {
  fetchMock.restore();
});

describe("useChatRuntime: a message the server refuses as too long", () => {
  it("puts the text back in the composer and leaves no message in the thread", async () => {
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useChatRuntime(THREAD), { wrapper });
    const composer = result.current.thread.composer;

    act(() => composer.setText(LONG_TEXT));
    act(() => composer.send());
    // The composer empties at dispatch; the refused text comes back afterwards.
    expect(composer.getState().text).toBe("");

    await waitFor(() => expect(composer.getState().text).toBe(LONG_TEXT));
    expect(fetchMock.calls.filter((call) => call.path === "/api/chat/completion")).toHaveLength(1);
    expect(useChatMessageStore.getState().messagesByThread[THREAD] ?? []).toEqual([]);
  });

  it("does not overwrite what the visitor typed in the meantime", async () => {
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useChatRuntime(THREAD), { wrapper });
    const composer = result.current.thread.composer;

    act(() => composer.setText(LONG_TEXT));
    act(() => {
      composer.send();
      composer.setText("a shorter version");
    });
    await waitFor(() =>
      expect(fetchMock.calls.filter((call) => call.path === "/api/chat/completion")).toHaveLength(1),
    );
    // Let the refusal settle, then check the newer text was not overwritten.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(composer.getState().text).toBe("a shorter version");
  });
});
