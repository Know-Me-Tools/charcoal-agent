import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { api } from "@/lib/api-client";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { upsertThread } from "@/lib/db/thread-queries";
import { useThreads } from "@/hooks/use-threads";
import { useChatMessages } from "./use-chat-messages";
import { useMessageStream } from "./use-message-stream";
import type { RichMessage, ContentBlock } from "@/types/chat-content";
import type { Thread } from "@/types";

function richMessageToThreadMessageLike(msg: RichMessage): ThreadMessageLike {
  if (msg.role === "user") {
    // User messages: flatten to string or content parts
    const textContent = msg.content
      .filter((b): b is Extract<ContentBlock, { type: "text" }> =>
        b.type === "text",
      )
      .map((b) => b.text)
      .join("");

    return {
      role: "user",
      id: msg.id,
      content: [{ type: "text", text: textContent }],
      createdAt: msg.createdAt,
    };
  }

  if (msg.role === "system") {
    const textContent = msg.content
      .filter((b): b is Extract<ContentBlock, { type: "text" }> =>
        b.type === "text",
      )
      .map((b) => b.text)
      .join("");
    return {
      role: "system",
      id: msg.id,
      content: [{ type: "text", text: textContent }],
      createdAt: msg.createdAt,
    };
  }

  // Assistant message — map all rich block types to assistant-ui content parts
  const parts: ThreadMessageLike["content"] = [];

  for (const block of msg.content) {
    switch (block.type) {
      case "text":
        parts.push({ type: "text", text: block.text });
        break;
      case "reasoning":
        parts.push({ type: "reasoning", text: block.text } as Extract<
          ThreadMessageLike["content"][number],
          { type: "reasoning" }
        >);
        break;
      case "tool-call":
        parts.push({
          type: "tool-call",
          toolCallId: block.toolCallId,
          toolName: block.toolName,
          args: block.args,
          result: block.result,
          isError: block.status === "failed",
        } as Extract<
          ThreadMessageLike["content"][number],
          { type: "tool-call" }
        >);
        break;
      case "citation":
      case "skill-activation":
      case "image":
      case "error":
        // Map to text for now — specialized renderers handle display via the store
        break;
    }
  }

  if (parts.length === 0) {
    parts.push({ type: "text", text: "" });
  }

  return {
    role: "assistant",
    id: msg.id,
    content: parts as ThreadMessageLike["content"],
    createdAt: msg.createdAt,
    status:
      msg.status === "in_progress"
        ? { type: "running" }
        : msg.status === "failed"
          ? { type: "incomplete", reason: "error" }
          : { type: "complete" },
  };
}

export function useChatRuntime(threadId: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { startStream, cancelStream } = useMessageStream();
  const { messages, isStreaming, threadDetail } = useChatMessages(threadId);
  const { data: allThreads = [] } = useThreads();
  const initialMessageSent = useRef(false);

  // Extract agent_id from the loaded thread
  const agentId = threadDetail?.agent_id ?? "";

  const onNew = useCallback(
    async (msg: AppendMessage) => {
      if (!agentId) return;

      const textPart = msg.content.find(
        (p): p is Extract<(typeof msg.content)[number], { type: "text" }> =>
          p.type === "text",
      );
      if (!textPart) return;

      await startStream(
        threadId,
        {
          session_id: threadId,
          agent_id: agentId,
          message: textPart.text,
        },
        {
          onComplete: () => {
            void qc.invalidateQueries({ queryKey: ["threads"] });
            void qc.invalidateQueries({ queryKey: ["threads", threadId] });
          },
        },
      );
    },
    [threadId, agentId, startStream, qc],
  );

  const onCancel = useCallback(() => {
    cancelStream();
    useChatMessageStore.getState().finishStream(threadId);
  }, [threadId, cancelStream]);

  const onSwitchToNewThread = useCallback(async () => {
    // Create a new thread with the first available agent
    try {
      const agents = await api.get<{ id: string }[]>("/api/uar/agents");
      const firstAgent = agents[0];
      if (!firstAgent) {
        navigate("/threads");
        return;
      }
      const newThread = await api.post<Thread>("/api/sessions", {
        agent_id: firstAgent.id,
        title: "New thread",
      });
      void upsertThread(newThread);
      void qc.invalidateQueries({ queryKey: ["threads"] });
      navigate(`/threads/${newThread.id}`);
    } catch {
      navigate("/threads");
    }
  }, [navigate, qc]);

  const onSwitchToThread = useCallback(
    (id: string) => {
      navigate(`/threads/${id}`);
    },
    [navigate],
  );

  // Auto-send initial message from landing page
  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    if (
      !initialMessageSent.current &&
      agentId &&
      state?.initialMessage &&
      messages.length === 0 &&
      !isStreaming
    ) {
      initialMessageSent.current = true;
      void startStream(
        threadId,
        {
          session_id: threadId,
          agent_id: agentId,
          message: state.initialMessage,
        },
        {
          onComplete: () => {
            void qc.invalidateQueries({ queryKey: ["threads"] });
            void qc.invalidateQueries({ queryKey: ["threads", threadId] });
          },
        },
      );
      // Clear state so refresh doesn't re-send
      window.history.replaceState({}, "");
    }
  }, [agentId, threadId, messages.length, isStreaming, location.state, startStream, qc]);

  const threadMessageLikes = messages.map(richMessageToThreadMessageLike);

  return useExternalStoreRuntime({
    messages: threadMessageLikes,
    isRunning: isStreaming,
    onNew,
    onCancel,
    threadList: {
      threadId,
      threads: allThreads.map((t) => ({ threadId: t.id, title: t.title })),
      onSwitchToNewThread,
      onSwitchToThread,
    },
  });
}
