import { useCallback, useRef } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { api } from "@/lib/api-client";
import { upsertMessage } from "@/lib/db/message-queries";
import type { Run } from "@/types";
import type { StartRunPayload } from "@/types";

interface MessageDeltaData {
  content: string;
  run_id: string;
}

interface ThinkingDeltaData {
  content: string;
  run_id: string;
}

interface ToolCallCompleteData {
  tool_call_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  run_id: string;
}

interface ToolResultData {
  tool_call_id: string;
  tool_name: string;
  result: string;
  run_id: string;
}

interface CitationData {
  source: string;
  content: string;
  url?: string;
  run_id: string;
}

interface SkillActivationData {
  skill_name: string;
  status: "active" | "complete";
  run_id: string;
}

interface ErrorData {
  message: string;
  run_id: string;
}

export interface StreamCallbacks {
  onRunStarted?: (run: Run) => void;
  onComplete?: (run: Run) => void;
  onError?: (error: Error) => void;
}

export function useMessageStream() {
  const store = useChatMessageStore.getState;
  const eventSourceRef = useRef<EventSource | null>(null);

  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    async (
      threadId: string,
      payload: StartRunPayload,
      callbacks?: StreamCallbacks,
    ): Promise<void> => {
      // Close any existing stream
      cancelStream();

      const {
        appendTextDelta,
        appendThinkingDelta,
        addToolCall,
        updateToolCall,
        addCitation,
        addSkillActivation,
        finishStream,
        setStreamError,
      } = useChatMessageStore.getState();

      // First, add the user message to the store
      const userMsgId = `user-${Date.now()}`;
      useChatMessageStore.getState().initThread(threadId, [
        ...useChatMessageStore.getState().messagesByThread[threadId] ?? [],
        {
          id: userMsgId,
          role: "user",
          content: [{ type: "text", text: payload.message }],
          createdAt: new Date(),
          status: "complete",
        },
      ]);

      // Save user message to PGLite
      void upsertMessage(threadId, {
        id: userMsgId,
        role: "user",
        content: [{ type: "text", text: payload.message }],
        createdAt: new Date(),
        status: "complete",
      });

      let run: Run;
      try {
        run = await api.post<Run>("/api/uar/runs", payload);
        callbacks?.onRunStarted?.(run);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to start run");
        callbacks?.onError?.(error);
        return;
      }

      const eventSource = new EventSource(`/api/uar/runs/${run.id}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("message.delta", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as MessageDeltaData;
        appendTextDelta(threadId, run.id, data.content);
      });

      eventSource.addEventListener("thinking.delta", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as ThinkingDeltaData;
        appendThinkingDelta(threadId, run.id, data.content);
      });

      eventSource.addEventListener(
        "tool_call.complete",
        (e: MessageEvent) => {
          const data = JSON.parse(e.data) as ToolCallCompleteData;
          const toolCallId = data.tool_call_id ?? crypto.randomUUID();
          addToolCall(threadId, {
            type: "tool-call",
            toolCallId,
            toolName: data.tool_name,
            args: data.arguments ?? {},
            status: "running",
          });
        },
      );

      eventSource.addEventListener("tool_result", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as ToolResultData;
        if (data.tool_call_id) {
          updateToolCall(threadId, data.tool_call_id, {
            result: data.result,
            status: "complete",
          });
        }
      });

      eventSource.addEventListener("citation", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as CitationData;
        addCitation(threadId, {
          source: data.source,
          content: data.content,
          url: data.url,
        });
      });

      eventSource.addEventListener("skill.activation", (e: MessageEvent) => {
        const data = JSON.parse(e.data) as SkillActivationData;
        addSkillActivation(threadId, {
          skillName: data.skill_name,
          status: data.status,
        });
      });

      eventSource.addEventListener("error", (e: Event) => {
        if (e instanceof MessageEvent) {
          const data = JSON.parse(e.data) as ErrorData;
          setStreamError(threadId, data.message ?? "Unknown stream error");
          callbacks?.onError?.(new Error(data.message));
        }
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.addEventListener("done", () => {
        const currentMessages =
          useChatMessageStore.getState().messagesByThread[threadId] ?? [];
        const streaming =
          useChatMessageStore.getState().streamingByThread[threadId];

        // Save the completed assistant message to PGLite
        if (streaming?.streamingMessageId) {
          const completedMsg = currentMessages.find(
            (m) => m.id === streaming.streamingMessageId,
          );
          if (completedMsg) {
            void upsertMessage(threadId, completedMsg);
          }
        }

        finishStream(threadId);
        eventSource.close();
        eventSourceRef.current = null;
        callbacks?.onComplete?.(run);
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) return;
        setStreamError(threadId, "Connection to stream lost");
        callbacks?.onError?.(new Error("EventSource connection failed"));
        eventSource.close();
        eventSourceRef.current = null;
      };
    },
    [cancelStream],
  );

  // Suppress unused variable warning — store is used via getState() in closures
  void store;

  return { startStream, cancelStream };
}
