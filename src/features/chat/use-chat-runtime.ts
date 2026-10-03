import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useChatMessages } from "./use-chat-messages";
import { useMessageStream } from "./use-message-stream";
import { generateThreadTitle } from "./use-thread-naming";
import type { RichMessage, ContentBlock } from "@/types/chat-content";

/**
 * Convert our internal RichMessage to the ThreadMessageLike shape expected by
 * @assistant-ui/react's useExternalStoreRuntime.
 *
 * IMPORTANT: when no `convertMessage` is provided, the library stores these
 * objects DIRECTLY in its internal repository and later accesses
 * `message.metadata.submittedFeedback` without an optional-chain guard. Every
 * object we return MUST therefore have a `metadata` property, even if empty.
 */
export function richMessageToThreadMessageLike(msg: RichMessage): ThreadMessageLike {
  /** Minimal metadata shape that satisfies the library's internal accessor. */
  const baseMetadata = { custom: {} };

  const toDate = (d: Date | string): Date =>
    d instanceof Date ? d : new Date(d);

  if (msg.role === "user") {
    const textContent = msg.content
      .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("");
    return {
      role: "user",
      id: msg.id,
      content: [{ type: "text", text: textContent }],
      createdAt: toDate(msg.createdAt),
      // MessagePrimitive.Attachments reads .attachments.length — must be an array.
      attachments: [],
      metadata: baseMetadata,
    };
  }

  if (msg.role === "system") {
    const textContent = msg.content
      .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("");
    return {
      role: "system",
      id: msg.id,
      content: [{ type: "text", text: textContent }],
      createdAt: toDate(msg.createdAt),
      metadata: baseMetadata,
    };
  }

  // Assistant — map rich blocks to assistant-ui content parts.
  // Only pass types the library's fromThreadMessageLike knows: text, reasoning, tool-call.
  // Skip citation, error, skill-activation — they're rendered via our own UI.
  // biome-ignore lint/suspicious/noExplicitAny: assistant-ui content-part union is not exported
  const parts: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const block of msg.content) {
    switch (block.type) {
      case "text":
        parts.push({ type: "text", text: block.text });
        break;
      case "reasoning":
        parts.push({ type: "reasoning", text: block.text });
        break;
      case "tool-call":
        if (block.status === "denied") {
          // assistant-ui's ToolCallMessagePartStatus has no "denied"/policy
          // reason (only cancelled/length/content-filter/other/error), so
          // this is encoded as a pseudo-tool-call like skill-activation and
          // context-update below — ToolCallPart routes it to a block that
          // always reads "Blocked by policy", never "running" or "Failed".
          parts.push({
            type: "tool-call",
            toolCallId: block.toolCallId,
            toolName: "__denied__",
            args: { toolName: block.toolName, reason: block.result },
            result: undefined,
            isError: false,
          });
          break;
        }
        parts.push({
          type: "tool-call",
          toolCallId: block.toolCallId,
          toolName: block.toolName,
          args: block.args,
          result: block.result,
          isError: block.status === "failed",
        });
        break;
      case "skill-activation":
        // Encode as a pseudo-tool-call so assistant-ui routes it to SkillActivationPart
        parts.push({
          type: "tool-call",
          toolCallId: `skill-${block.skillId}`,
          toolName: "__skill__",
          args: {
            skillId: block.skillId,
            skillName: block.skillName,
            selectionMethod: block.selectionMethod,
            status: block.status,
          },
          result: undefined,
          isError: false,
        });
        break;
      case "context-update":
        // Encode as a pseudo-tool-call so assistant-ui routes it to ContextUpdatePart
        parts.push({
          type: "tool-call",
          toolCallId: `ctx-${block.strategy}-${block.messagesRemoved}`,
          toolName: "__context__",
          args: {
            strategy: block.strategy,
            messagesRemoved: block.messagesRemoved,
            tokensSaved: block.tokensSaved,
            wasApplied: block.wasApplied,
            summaryGenerated: block.summaryGenerated,
          },
          result: undefined,
          isError: false,
        });
        break;
      case "citation":
        // Encode as a pseudo-tool-call so assistant-ui routes it to CitationBlock
        parts.push({
          type: "tool-call",
          toolCallId: `citation-${block.source}-${parts.length}`,
          toolName: "__citation__",
          args: {
            source: block.source,
            content: block.content,
            url: block.url,
          },
          result: undefined,
          isError: false,
        });
        break;
      case "memory-recall":
        parts.push({
          type: "tool-call",
          toolCallId: `memory-recall-${parts.length}`,
          toolName: "__memory_recall__",
          args: { items: block.items, count: block.count },
          result: undefined,
          isError: false,
        });
        break;
      case "memory-mutation":
        parts.push({
          type: "tool-call",
          toolCallId: `memory-mutation-${block.memoryId}`,
          toolName: "__memory_mutation__",
          args: {
            operation: block.operation,
            memoryId: block.memoryId,
            content: block.content,
            scope: block.scope,
            memoryType: block.memoryType,
          },
          result: undefined,
          isError: false,
        });
        break;
      case "artifact":
        parts.push({
          type: "tool-call",
          toolCallId: `artifact-${block.artifactId}`,
          toolName: block.isInputRequest ? "__artifact_input__" : "__artifact__",
          args: {
            artifactId: block.artifactId,
            artifactType: block.artifactType,
            title: block.title,
            content: block.content,
            language: block.language,
            isInputRequest: block.isInputRequest,
            runId: block.runId,
            metadata: block.metadata ?? {},
          },
          result: undefined,
          isError: false,
        });
        break;
      default:
        // image, error — intentionally skipped (no assistant-ui equivalent)
        break;
    }
  }

  // The library filters out empty text parts; keep at least one so the message
  // renders as a visible (even if empty) assistant turn while streaming.
  if (parts.length === 0) {
    parts.push({ type: "text", text: "" });
  }

  return {
    role: "assistant",
    id: msg.id,
    content: parts,
    createdAt: toDate(msg.createdAt),
    status:
      msg.status === "in_progress"
        ? { type: "running" }
        : msg.status === "failed"
          ? { type: "incomplete", reason: "error" }
          : { type: "complete", reason: "stop" as const },
    metadata: {
      ...baseMetadata,
      unstable_state: null,
      unstable_annotations: [],
      unstable_data: [],
      steps: [],
    },
  };
}

/** Extract the plain text from all text blocks of a message. */
function extractText(msg: RichMessage): string {
  return msg.content
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export interface ChatRuntimeOptions {
  /** Session-level prompt-caching override forwarded to every chat request. */
  promptCachingEnabled?: boolean;
}

export function useChatRuntime(threadId: string, options: ChatRuntimeOptions = {}) {
  const consumePendingPrompt = useChatIntentStore((s) => s.consumePendingPrompt);
  const { startStream, cancelStream } = useMessageStream();
  const { messages, isStreaming } = useChatMessages(threadId);
  const initialMessageSent = useRef(false);

  // Track whether we've already generated a title for this thread session
  const titleGeneratedRef = useRef(false);

  // Individual selectors — stable function references, avoid full-store re-renders
  const setActive = useThreadRegistryStore((s) => s.setActive);
  const registerThread = useThreadRegistryStore((s) => s.registerThread);
  const markPersisted = useThreadRegistryStore((s) => s.markPersisted);
  const setTitle = useThreadRegistryStore((s) => s.setTitle);
  const touch = useThreadRegistryStore((s) => s.touch);

  // Set the active thread and ensure it exists in the registry whenever
  // the thread detail page mounts or threadId changes.
  useEffect(() => {
    setActive(threadId);
    // Handle direct URL navigation — register as ephemeral if unknown
    const existing = useThreadRegistryStore.getState().threads[threadId];
    if (!existing) {
      registerThread(threadId);
    }
  }, [threadId, setActive, registerThread]);

  /**
   * After a stream completes:
   *  1. Mark the thread as persisted (first message was sent).
   *  2. On the first exchange only, generate an LLM title and persist it.
   *  3. Touch updatedAt so the thread sorts to the top of the sidebar.
   */
  const afterStreamComplete = useCallback(
    async (userMsgText: string) => {
      markPersisted(threadId);
      touch(threadId);

      // Generate title only once per thread (check current title first)
      if (titleGeneratedRef.current) return;
      const currentThread = useThreadRegistryStore.getState().threads[threadId];
      if (currentThread && currentThread.title !== "New conversation") return;

      titleGeneratedRef.current = true;

      // Find the first complete assistant message to use as context
      const storeMessages =
        useChatMessageStore.getState().messagesByThread[threadId] ?? [];
      const firstAssistant = storeMessages.find(
        (m) => m.role === "assistant" && m.status === "complete",
      );
      const assistantText = firstAssistant ? extractText(firstAssistant) : "";
      if (!assistantText.trim()) return;

      const title = await generateThreadTitle(userMsgText, assistantText);
      setTitle(threadId, title);
    },
    [threadId, markPersisted, touch, setTitle],
  );

  const onNew = useCallback(
    async (msg: AppendMessage) => {
      const textPart = msg.content.find(
        (p): p is Extract<(typeof msg.content)[number], { type: "text" }> =>
          p.type === "text",
      );
      if (!textPart) return;

      // biome-ignore lint/suspicious/noExplicitAny: text part type is not narrowed by the library
      const userText = (textPart as any).text as string; // eslint-disable-line @typescript-eslint/no-explicit-any

      // Include agent_id if this thread has one associated
      const thread = useThreadRegistryStore.getState().threads[threadId];

      await startStream(
        threadId,
        {
          message: userText,
          agent_id: thread?.agentId,
          prompt_caching_enabled: options.promptCachingEnabled,
        },
        {
          onComplete: () => {
            void afterStreamComplete(userText);
          },
        },
      );
    },
    [threadId, startStream, afterStreamComplete, options.promptCachingEnabled],
  );

  /**
   * Wires assistant-ui's "Try again" / "Regenerate" action
   * (`ActionBarPrimitive.Reload` — `MessageError` on a failed message, and
   * `AssistantActionBar` on the last assistant message generally) to the
   * same send path as a new message. `useExternalStoreRuntime` only enables
   * reload (`capabilities.reload`) when `onReload` is provided — without it
   * the button renders disabled. `parentId` is the id of the message
   * immediately before the reloaded one in `messages` (assistant-ui's
   * default flat-array repository parents each message to its predecessor —
   * see `external-store-thread-runtime-core.ts`), which is always the user
   * message that triggered the reloaded assistant turn.
   *
   * Reload must not duplicate that user message: `startStream` always
   * appends a new optimistic user message on its own, and assistant-ui's
   * external-store `startRun` leaves removing superseded messages entirely
   * to the store (it does not do so itself). So before resending, every
   * message after `parentId` — the failed/old assistant reply, and anything
   * after it — is deleted from the store *and* PGlite
   * (`deleteMessagesAfter`), and `startStream` is called with
   * `skipUserMessage: true` to reuse the existing user message instead of
   * appending a duplicate. Net effect for both "Try again" on a failed
   * reply and "Regenerate" on a good one: the turn is replaced in place,
   * not duplicated.
   */
  const onReload = useCallback(
    async (parentId: string | null) => {
      if (!parentId) return;

      const storeMessages =
        useChatMessageStore.getState().messagesByThread[threadId] ?? [];
      const parentMessage = storeMessages.find((m) => m.id === parentId);
      if (!parentMessage || parentMessage.role !== "user") return;

      const userText = extractText(parentMessage);
      if (!userText.trim()) return;

      // Await the delete of the superseded turn so a failed removal is known
      // before the replacement starts streaming (chat-persistence-durability
      // design decision 4). Still regenerate when the delete rejects — the
      // user asked for it and the screen already shows the right thing; the
      // write queue has already logged the raw error for diagnosis, and the
      // failure notice (task 1.2) discloses that the stale row may
      // resurrect on reload.
      await useChatMessageStore
        .getState()
        .deleteMessagesAfter(threadId, parentId)
        .catch(() => undefined);

      const thread = useThreadRegistryStore.getState().threads[threadId];

      await startStream(
        threadId,
        {
          message: userText,
          agent_id: thread?.agentId,
          prompt_caching_enabled: options.promptCachingEnabled,
        },
        {
          onComplete: () => {
            void afterStreamComplete(userText);
          },
        },
        { skipUserMessage: true },
      );
    },
    [threadId, startStream, afterStreamComplete, options.promptCachingEnabled],
  );

  const onCancel = useCallback(async () => {
    cancelStream();
    useChatMessageStore.getState().finishStream(threadId);
  }, [threadId, cancelStream]);

  // Auto-send any prompt that was queued in the intent store before navigation.
  // consumePendingPrompt() reads and clears atomically, so a refresh or
  // back-navigation never re-sends the same message.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on threadId change — omitting changing deps to avoid re-sending
  useEffect(() => {
    if (initialMessageSent.current || messages.length > 0 || isStreaming) return;

    const pending = consumePendingPrompt();
    if (!pending) return;

    initialMessageSent.current = true;
    const threadForPending = useThreadRegistryStore.getState().threads[threadId];
    void startStream(
      threadId,
      {
        message: pending,
        agent_id: threadForPending?.agentId,
        prompt_caching_enabled: options.promptCachingEnabled,
      },
      {
        onComplete: () => {
          void afterStreamComplete(pending);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]); // run once on mount — intentionally omit changing deps

  // Memoize so useExternalStoreRuntime's getSnapshot sees a stable reference
  // when messages haven't changed (prevents the "infinite loop" warning).
  const threadMessageLikes = useMemo(
    () => messages.map(richMessageToThreadMessageLike),
    [messages],
  );

  return useExternalStoreRuntime({
    messages: threadMessageLikes,
    isRunning: isStreaming,
    onNew,
    onReload,
    onCancel,
  // biome-ignore lint/suspicious/noExplicitAny: useExternalStoreRuntime props type is overly strict
  } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
