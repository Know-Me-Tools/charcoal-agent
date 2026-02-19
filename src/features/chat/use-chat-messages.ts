import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  useChatMessageStore,
  selectThreadMessages,
  selectIsStreaming,
} from "@/stores/chat-message-store";
import {
  getMessagesByThread,
  upsertMessages,
} from "@/lib/db/message-queries";
import type { ThreadDetail, Message } from "@/types";
import type { RichMessage } from "@/types/chat-content";
import { textToRichMessage } from "@/types/chat-content";

function serverMessageToRich(msg: Message): RichMessage {
  // Messages from the server have a plain string content field
  // Convert to our rich content block format
  if (typeof msg.content === "string") {
    const rich = textToRichMessage(msg.id, msg.role, msg.content, new Date(msg.created_at));
    // Attach any tool_calls from the legacy format
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        rich.content.push({
          type: "tool-call",
          toolCallId: tc.id,
          toolName: tc.tool_name,
          args: tc.arguments,
          result: tc.result,
          status: tc.status === "calling" ? "running" : tc.status,
        });
      }
    }
    return rich;
  }
  // If content is already an array (future-proof)
  return {
    id: msg.id,
    role: msg.role,
    content: Array.isArray(msg.content)
      ? msg.content
      : [{ type: "text", text: String(msg.content) }],
    createdAt: new Date(msg.created_at),
    status: "complete",
  };
}

export function useChatMessages(threadId: string | null) {
  const initThread = useChatMessageStore((s) => s.initThread);
  const messages = useChatMessageStore(
    selectThreadMessages(threadId ?? "__none__"),
  );
  const isStreaming = useChatMessageStore(
    selectIsStreaming(threadId ?? "__none__"),
  );
  const hydratedFromPglite = useRef(false);
  const hydratedFromServer = useRef<string | null>(null);

  // Step 1: hydrate from PGLite (fast, instant)
  useEffect(() => {
    if (!threadId || hydratedFromPglite.current) return;
    hydratedFromPglite.current = true;

    getMessagesByThread(threadId)
      .then((cached) => {
        if (cached.length > 0) {
          // Only hydrate if the store is empty for this thread
          const storeMessages =
            useChatMessageStore.getState().messagesByThread[threadId];
          if (!storeMessages || storeMessages.length === 0) {
            initThread(threadId, cached);
          }
        }
      })
      .catch(() => {
        // PGLite not ready yet — server data will hydrate instead
      });
  }, [threadId, initThread]);

  // Step 2: fetch from server (canonical source)
  const { data: threadDetail } = useQuery({
    queryKey: ["threads", threadId],
    queryFn: () => api.get<ThreadDetail>(`/api/sessions/${threadId}`),
    enabled: !!threadId,
    staleTime: 30_000,
  });

  // Step 3: hydrate store from server data when received
  useEffect(() => {
    if (!threadId || !threadDetail?.messages) return;
    if (hydratedFromServer.current === threadId) return;

    // Don't overwrite if we're currently streaming
    const currentlyStreaming =
      useChatMessageStore.getState().streamingByThread[threadId]?.isStreaming;
    if (currentlyStreaming) return;

    hydratedFromServer.current = threadId;
    const richMessages = threadDetail.messages.map(serverMessageToRich);
    initThread(threadId, richMessages);

    // Sync to PGLite in background
    void upsertMessages(threadId, richMessages);
  }, [threadId, threadDetail, initThread]);

  // Reset hydration refs when thread changes
  useEffect(() => {
    hydratedFromPglite.current = false;
    hydratedFromServer.current = null;
  }, [threadId]);

  return {
    messages,
    isStreaming,
    threadDetail,
    isLoading: !threadDetail && messages.length === 0,
  };
}
