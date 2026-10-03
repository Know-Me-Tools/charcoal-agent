import { create } from "zustand";

/**
 * Per-thread connectivity state for a chat request that failed before any
 * content reached the thread (site-chat-offline-states). Kept separate from
 * `chat-message-store.ts` because these are not per-message failures: FR-27
 * and FR-28 ask for a thread-level notice, not a failed assistant bubble, so
 * no message is ever created for them (see `clearStreaming` in
 * chat-message-store.ts).
 */
export type ChatConnectivityState =
  | { kind: "online" }
  | { kind: "offline" }
  | { kind: "rate-limited"; retryAfterSeconds?: number };

const ONLINE: ChatConnectivityState = { kind: "online" };

interface ChatConnectivityStore {
  byThread: Record<string, ChatConnectivityState>;
  setOffline(threadId: string): void;
  setRateLimited(threadId: string, retryAfterSeconds?: number): void;
  clear(threadId: string): void;
}

export const useChatConnectivityStore = create<ChatConnectivityStore>((set) => ({
  byThread: {},

  setOffline: (threadId) =>
    set((state) => ({
      byThread: { ...state.byThread, [threadId]: { kind: "offline" } },
    })),

  setRateLimited: (threadId, retryAfterSeconds) =>
    set((state) => ({
      byThread: {
        ...state.byThread,
        [threadId]: { kind: "rate-limited", retryAfterSeconds },
      },
    })),

  // A new send attempt (and a successful stream start) clears any prior
  // notice — the visitor is trying again, or it already worked.
  clear: (threadId) =>
    set((state) => {
      if (!(threadId in state.byThread)) return state;
      const byThread = { ...state.byThread };
      delete byThread[threadId];
      return { byThread };
    }),
}));

/** Stable selector — avoids a new object on every render for an idle thread. */
export function selectChatConnectivity(threadId: string) {
  return (state: ChatConnectivityStore): ChatConnectivityState =>
    state.byThread[threadId] ?? ONLINE;
}
