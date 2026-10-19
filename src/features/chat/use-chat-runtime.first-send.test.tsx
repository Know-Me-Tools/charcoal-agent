import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppendMessage, ExternalStoreAdapter, ThreadMessageLike } from "@assistant-ui/react";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import type { LocalThread } from "@/types";

// app-first-send-thread-order. What is real: the thread registry, the chat
// message store, the write queue (its strict enqueue order) and the stream
// hook. What is stubbed: the database. The fake below records every write in
// the order it runs and enforces the one rule that matters here, the
// messages.thread_id foreign key: a message for a thread with no row throws,
// as PGlite does. Stored threads are rows the fake already holds.
const rows = new Set<string>();
const log: string[] = [];
const upsertedThreads: LocalThread[] = [];

const insertMessage = vi.fn(async (threadId: string, message: { id: string }) => {
  if (!rows.has(threadId)) {
    log.push(`insertMessage(${message.id}) FK FAIL`);
    throw new Error('violates foreign key constraint "messages_thread_id_fkey"');
  }
  log.push(`insertMessage(${message.id})`);
});
const upsertThread = vi.fn(async (thread: LocalThread) => {
  rows.add(thread.id);
  upsertedThreads.push(thread);
  log.push(`upsertThread(ephemeral=${thread.isEphemeral})`);
});
const touchThread = vi.fn().mockResolvedValue(undefined);
const deleteMessages = vi.fn().mockResolvedValue(undefined);
const getMessages = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ insertMessage, upsertThread, touchThread, deleteMessages, getMessages }),
}));

// Capture onNew so the test can send without driving assistant-ui's UI layer
// (same seam as use-chat-runtime.onreload.test.tsx).
let capturedOnNew: ((msg: AppendMessage) => Promise<void>) | null = null;
vi.mock("@assistant-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@assistant-ui/react")>();
  return {
    ...actual,
    useExternalStoreRuntime: (config: ExternalStoreAdapter<ThreadMessageLike>) => {
      capturedOnNew = config.onNew as unknown as (msg: AppendMessage) => Promise<void>;
      return actual.useExternalStoreRuntime(config);
    },
  };
});

const { useChatRuntime } = await import("./use-chat-runtime");

const THREAD = "33333333-4444-4555-8666-777777777777";
const REPLY_SSE =
  'event: agui.message.delta\ndata: {"kind":"message","phase":"delta","request_id":"r1","delta":{"text":"A reply"}}\n\n' +
  'event: agui.done\ndata: {"kind":"done","request_id":"r1"}\n\n';

let fetchMock: FetchMock;
/** Whether the thread was in the registry at the moment the chat request went out. */
let registeredAtStreamStart: boolean | null = null;

function send(text = "What does KnowMe do?"): Promise<void> {
  return capturedOnNew!({ content: [{ type: "text", text }] } as unknown as AppendMessage);
}

function storedThread(): LocalThread {
  const now = new Date().toISOString();
  return { id: THREAD, sessionId: THREAD, title: "Stored title", isEphemeral: false, createdAt: now, updatedAt: now };
}

function threadInRegistry(): LocalThread | undefined {
  return useThreadRegistryStore.getState().threads[THREAD];
}

beforeEach(() => {
  rows.clear();
  log.length = 0;
  upsertedThreads.length = 0;
  capturedOnNew = null;
  insertMessage.mockClear();
  upsertThread.mockClear();
  useChatMessageStore.getState().clearThread(THREAD);
  useChatIntentStore.setState({ pendingPrompt: null });
  useThreadRegistryStore.setState({ threads: {}, activeThreadId: null, hydrated: false });
  registeredAtStreamStart = null;
  fetchMock = mockFetch({
    "POST /api/chat/completion": () => {
      registeredAtStreamStart ??= Boolean(threadInRegistry());
      return { raw: REPLY_SSE };
    },
  });
});

afterEach(() => {
  fetchMock.restore();
  vi.useRealTimers();
});

describe("useChatRuntime: a send before the thread registry is hydrated", () => {
  it("writes the thread row ahead of the first message when the id is unknown", async () => {
    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    let sent!: Promise<void>;
    act(() => {
      sent = send();
    });
    // Hydration finishes a moment after the send (the measured gap is 100 to 500 ms).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
      useThreadRegistryStore.getState().initFromDb([]);
      await sent;
    });
    await waitFor(() => expect(threadInRegistry()?.isEphemeral).toBe(false));

    // The row is registered before the stream starts, not left to the effect's timing.
    expect(registeredAtStreamStart).toBe(true);
    expect(log.filter((l) => l.includes("FK FAIL"))).toEqual([]);
    expect(log[0]).toBe("upsertThread(ephemeral=true)");
    expect(log).toContain("upsertThread(ephemeral=false)");
    expect(log.filter((l) => l.startsWith("insertMessage"))).toHaveLength(2);
  });

  it("does the same for a prompt queued by another page (pending-prompt path)", async () => {
    useChatIntentStore.getState().setPendingPrompt("Queued question");
    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
      useThreadRegistryStore.getState().initFromDb([]);
    });
    await waitFor(() => expect(threadInRegistry()?.isEphemeral).toBe(false));

    expect(registeredAtStreamStart).toBe(true);
    expect(log.filter((l) => l.includes("FK FAIL"))).toEqual([]);
    expect(log[0]).toBe("upsertThread(ephemeral=true)");
    expect(log.filter((l) => l.startsWith("insertMessage"))).toHaveLength(2);
  });

  it("keeps a stored thread's title and row: it is never re-registered as ephemeral", async () => {
    rows.add(THREAD);
    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    let sent!: Promise<void>;
    act(() => {
      sent = send();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
      useThreadRegistryStore.getState().initFromDb([storedThread()]);
      await sent;
    });
    await waitFor(() => expect(log.filter((l) => l.startsWith("insertMessage"))).toHaveLength(2));

    expect(threadInRegistry()?.title).toBe("Stored title");
    expect(upsertedThreads.filter((t) => t.isEphemeral)).toEqual([]);
    expect(log.filter((l) => l.includes("FK FAIL"))).toEqual([]);
  });

  it("starts the stream and replies when hydration never completes (bounded wait)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    let sent!: Promise<void>;
    act(() => {
      sent = send();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    // Still waiting: the cap has not passed and nothing hydrated.
    expect(fetchMock.calls).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
      await sent;
    });

    expect(fetchMock.calls.length).toBeGreaterThan(0); // the stream, then the title request
    const reply = useChatMessageStore.getState().messagesByThread[THREAD]?.find((m) => m.role === "assistant");
    expect(reply?.status).toBe("complete");
    // Not registered early: the registration effect still waits for hydration.
    expect(threadInRegistry()).toBeUndefined();
  });

  it("registers and sends when a failed read flips hydrated with an empty list", async () => {
    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    let sent!: Promise<void>;
    act(() => {
      sent = send();
    });
    await act(async () => {
      useThreadRegistryStore.getState().initFromDb([]); // what use-db-hydration does on a failed read
      await sent;
    });
    await waitFor(() => expect(threadInRegistry()?.isEphemeral).toBe(false));

    expect(fetchMock.calls.length).toBeGreaterThan(0);
    expect(log.filter((l) => l.includes("FK FAIL"))).toEqual([]);
  });

  it("does not delay a thread that is already registered (the landing, sidebar and threads-page paths)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    useThreadRegistryStore.getState().registerThread(THREAD); // as the landing page does before navigating
    const { wrapper } = createGraphTestHarness();
    renderHook(() => useChatRuntime(THREAD), { wrapper });

    act(() => {
      void send();
    });
    // No timer advance, registry not hydrated: the request still goes out.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock.calls.length).toBeGreaterThan(0);
    expect(upsertedThreads.filter((t) => t.isEphemeral)).toHaveLength(1);
    expect(log[0]).toBe("upsertThread(ephemeral=true)");
  });
});
