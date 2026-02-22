import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useChatMessageStore,
  selectIsStreaming,
} from "@/stores/chat-message-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { getDbInstance } from "@/lib/db/pglite";
import type { RichMessage } from "@/types/chat-content";

// Stable reference for empty thread — avoids triggering a re-render in
// useExternalStoreRuntime when the thread hasn't been initialised yet.
const EMPTY_MESSAGES: RichMessage[] = [];

// Shape returned by GET /api/sessions/:id/messages on the UAR
interface UarMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function uarMessageToRich(msg: UarMessage, index: number): RichMessage {
  return {
    id: `server-${index}`,
    role: msg.role,
    content: [{ type: "text", text: msg.content }],
    createdAt: new Date(),
    status: "complete",
  };
}

async function fetchSessionMessages(sessionId: string): Promise<UarMessage[]> {
  const res = await fetch(`/api/sessions/${sessionId}/messages`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as UarMessage[]) : [];
}

export function useChatMessages(threadId: string | null) {
  const initThread = useChatMessageStore((s) => s.initThread);

  // Use a stable selector — when the thread has no messages yet, return the
  // module-level EMPTY_MESSAGES constant (same reference every call) so that
  // useExternalStoreRuntime's getSnapshot doesn't see a new array each render.
  const messages = useChatMessageStore(
    (state) =>
      state.messagesByThread[threadId ?? "__none__"] ?? EMPTY_MESSAGES,
  );
  const isStreaming = useChatMessageStore(
    selectIsStreaming(threadId ?? "__none__"),
  );

  // Ephemeral threads haven't had a message sent yet and don't exist on the
  // UAR, so calling /api/sessions/{id}/messages would always 404. Skip the
  // server fallback until the thread has been promoted to persisted.
  const isEphemeral = useThreadRegistryStore(
    (s) => (threadId ? (s.threads[threadId]?.isEphemeral ?? true) : true),
  );

  // Whether we've already hydrated the store for this thread in this session.
  const hydratedRef = useRef<string | null>(null);

  const localIsEmpty = messages === EMPTY_MESSAGES || messages.length === 0;

  // ── 1. Load from PGLite (primary, fast, offline-capable) ─────────────────
  useEffect(() => {
    if (!threadId) return;
    if (hydratedRef.current === threadId) return;

    let cancelled = false;
    try {
      const db = getDbInstance();
      db.getMessages(threadId)
        .then((dbMessages) => {
          if (cancelled) return;
          if (dbMessages.length === 0) return;

          // Guard: don't overwrite if streaming already started
          const storeMessages =
            useChatMessageStore.getState().messagesByThread[threadId];
          if (storeMessages && storeMessages.length > 0) {
            hydratedRef.current = threadId;
            return;
          }

          hydratedRef.current = threadId;
          initThread(threadId, dbMessages);
        })
        .catch(console.error);
    } catch {
      // DB not ready yet — fall through to server fallback below
    }

    return () => { cancelled = true; };
  }, [threadId, initThread]);

  // Reset hydration guard when thread changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reset only on threadId change
  useEffect(() => {
    hydratedRef.current = null;
  }, [threadId]);

  // ── 2. Fall back to server when PGLite is also empty ─────────────────────
  // The query is enabled whenever local store is empty AND we haven't
  // already started hydrating from PGLite (give PGLite a tick to respond).
  const { data: serverMessages } = useQuery({
    queryKey: ["sessions", threadId, "messages-fallback"],
    queryFn: () => fetchSessionMessages(threadId ?? ""),
    enabled: !!threadId && localIsEmpty && !isStreaming && !isEphemeral,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!threadId) return;
    if (!serverMessages || serverMessages.length === 0) return;
    if (hydratedRef.current === threadId) return;

    const currentlyStreaming =
      useChatMessageStore.getState().streamingByThread[threadId]?.isStreaming;
    if (currentlyStreaming) return;

    // Double-check local store was not populated between query firing and now
    const storeMessages =
      useChatMessageStore.getState().messagesByThread[threadId];
    if (storeMessages && storeMessages.length > 0) {
      hydratedRef.current = threadId;
      return;
    }

    hydratedRef.current = threadId;
    const richMessages = serverMessages.map(uarMessageToRich);
    initThread(threadId, richMessages);
  }, [threadId, serverMessages, initThread]);

  return {
    messages,
    isStreaming,
    isLoading: localIsEmpty && !isStreaming,
  };
}
