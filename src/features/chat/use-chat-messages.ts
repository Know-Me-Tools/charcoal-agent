import { useEffect, useRef } from "react";
import {
  useChatMessageStore,
  selectIsStreaming,
} from "@/stores/chat-message-store";
import { getDbInstance } from "@/lib/db/pglite";
import type { RichMessage } from "@/types/chat-content";

// Stable reference for empty thread — avoids triggering a re-render in
// useExternalStoreRuntime when the thread hasn't been initialised yet.
const EMPTY_MESSAGES: RichMessage[] = [];

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

  // Whether we've already hydrated the store for this thread in this session.
  const hydratedRef = useRef<string | null>(null);

  // ── Load from PGLite (the only transcript source; UAR has no live
  // GET /api/sessions/{id}/messages route — see site-proxy-hardening) ──────
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
      // DB not ready yet.
    }

    return () => { cancelled = true; };
  }, [threadId, initThread]);

  // Reset hydration guard when thread changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reset only on threadId change
  useEffect(() => {
    hydratedRef.current = null;
  }, [threadId]);

  return {
    messages,
    isStreaming,
  };
}
