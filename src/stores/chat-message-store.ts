import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  ArtifactContentBlock,
  ContentBlock,
  ContextUpdateContentBlock,
  MemoryMutationContentBlock,
  MemoryRecallContentBlock,
  RichMessage,
  SkillActivationContentBlock,
  ToolCallContentBlock,
} from "@/types/chat-content";
import { enqueueWrite } from "@/lib/db/write-queue";

interface ChatMessageState {
  messagesByThread: Record<string, RichMessage[]>;
  streamingByThread: Record<string, StreamingState>;
}

interface StreamingState {
  isStreaming: boolean;
  runId: string | null;
  streamingMessageId: string | null;
  awaitingFirstToken: boolean;
  retryAttempt: number;
  retryMaxAttempts: number;
  retryDelayMs: number;
}

interface ChatMessageActions {
  initThread(threadId: string, messages: RichMessage[]): void;
  beginStream(threadId: string, runId: string): void;
  setAwaitingRetry(threadId: string, runId: string, attempt: number, maxAttempts: number, delayMs: number): void;
  markStreamStarted(threadId: string, runId: string): void;
  appendTextDelta(threadId: string, runId: string, text: string): void;
  appendThinkingDelta(threadId: string, runId: string, text: string): void;
  addToolCall(threadId: string, toolCall: ToolCallContentBlock): void;
  updateToolCall(
    threadId: string,
    toolCallId: string,
    update: Partial<Omit<ToolCallContentBlock, "type">>,
  ): void;
  addCitation(
    threadId: string,
    citation: { source: string; content: string; url?: string },
  ): void;
  addSkillActivation(
    threadId: string,
    skill: { skillId: string; skillName: string; selectionMethod?: string; status: "active" | "complete" },
  ): void;
  addContextUpdate(
    threadId: string,
    update: Omit<ContextUpdateContentBlock, "type">,
  ): void;
  addMemoryRecall(
    threadId: string,
    recall: Omit<MemoryRecallContentBlock, "type">,
  ): void;
  addMemoryMutation(
    threadId: string,
    mutation: Omit<MemoryMutationContentBlock, "type">,
  ): void;
  addArtifact(
    threadId: string,
    artifact: Omit<ArtifactContentBlock, "type">,
  ): void;
  finishStream(threadId: string): void;
  setStreamError(threadId: string, error: string): void;
  /**
   * Resets a thread's streaming state to idle without creating or touching
   * any message. Used for a pre-delta failure the UI shows as a thread-level
   * state instead of a per-message error — offline (UAR/meter/kill-switch)
   * and rate-limited (site-chat-offline-states) — so no assistant message
   * row, and therefore no `MessageError` bubble, is ever created for it.
   */
  clearStreaming(threadId: string): void;
  /**
   * Drops every message after `messageId` (exclusive) from the thread and
   * deletes those rows from PGlite. Used by retry/regenerate to remove a
   * superseded turn — the failed or stale assistant reply, and anything
   * after it — before re-streaming, so the resend replaces it instead of
   * appending a duplicate.
   */
  deleteMessagesAfter(threadId: string, messageId: string): Promise<void>;
  clearThread(threadId: string): void;
}

type ChatMessageStore = ChatMessageState & ChatMessageActions;

const defaultStreamingState: StreamingState = {
  isStreaming: false,
  runId: null,
  streamingMessageId: null,
  awaitingFirstToken: false,
  retryAttempt: 0,
  retryMaxAttempts: 0,
  retryDelayMs: 0,
};

function ensureThread(
  state: ChatMessageState,
  threadId: string,
): RichMessage[] {
  if (!state.messagesByThread[threadId]) {
    state.messagesByThread[threadId] = [];
  }
  return state.messagesByThread[threadId];
}

function ensureStreaming(
  state: ChatMessageState,
  threadId: string,
): StreamingState {
  if (!state.streamingByThread[threadId]) {
    state.streamingByThread[threadId] = { ...defaultStreamingState };
  }
  return state.streamingByThread[threadId];
}

function getOrCreateStreamingMessage(
  state: ChatMessageState,
  threadId: string,
  runId: string,
): RichMessage {
  const messages = state.messagesByThread[threadId];
  const streaming = state.streamingByThread[threadId];

  if (streaming?.streamingMessageId) {
    const existing = messages?.find(
      (m) => m.id === streaming.streamingMessageId,
    );
    if (existing) return existing;
  }

  // Create a new streaming assistant message
  const msgId = `stream-${runId}-${Date.now()}`;
  const newMsg: RichMessage = {
    id: msgId,
    role: "assistant",
    content: [],
    createdAt: new Date(),
    status: "in_progress",
  };

  if (!state.messagesByThread[threadId]) {
    state.messagesByThread[threadId] = [];
  }
  state.messagesByThread[threadId].push(newMsg);
  state.streamingByThread[threadId] = {
    isStreaming: true,
    runId,
    streamingMessageId: msgId,
    awaitingFirstToken: false,
    retryAttempt: 0,
    retryMaxAttempts: 0,
    retryDelayMs: 0,
  };

  return newMsg;
}

/**
 * The assistant message receiving the active stream, created on the first
 * event of any kind so blocks that precede the first text/thinking token
 * (skill activation, context update, memory recall, tool calls…) are kept in
 * arrival order. Returns null when no stream is active for the thread.
 */
function activeStreamingMessage(
  state: ChatMessageState,
  threadId: string,
): RichMessage | null {
  const streaming = state.streamingByThread[threadId];
  if (!streaming?.isStreaming || !streaming.runId) return null;
  ensureThread(state, threadId);
  const message = getOrCreateStreamingMessage(state, threadId, streaming.runId);
  // Any block counts as the first token for loading/retry indicators.
  const current = state.streamingByThread[threadId];
  current.awaitingFirstToken = false;
  current.retryAttempt = 0;
  current.retryMaxAttempts = 0;
  current.retryDelayMs = 0;
  return message;
}

/**
 * Message ids already durably upserted this session, per thread. Guards
 * against re-enqueuing the whole thread history on every turn (the pending
 * set — and so the page-exit journal — must hold only what changed, not
 * every message ever sent in the thread: chat-persistence-durability task
 * 1.2 follow-up). Populated only on a SUCCESSFUL settle (see
 * `persistMessages` below): a message whose write fails is left unmarked,
 * so the next call retries it — the existing "a failed insert heals on the
 * next turn" guarantee, now scoped to the message that actually failed
 * instead of blanket-retrying the entire history.
 */
const persistedMessageIds: Record<string, Set<string>> = {};

/**
 * Enqueue a durable, ordered write for every complete message in a thread
 * that isn't already known to be durably saved. `messages` MUST be
 * post-`set()` committed state (from `get()`), never an immer draft — see
 * chat-persistence-durability design decision 2 and
 * src/lib/db/write-queue.ts's module doc.
 */
function persistMessages(threadId: string, messages: RichMessage[]): void {
  const alreadyPersisted = persistedMessageIds[threadId];
  const complete = messages.filter(
    (m) => m.status !== "in_progress" && !alreadyPersisted?.has(m.id),
  );
  for (const msg of complete) {
    enqueueWrite({ kind: "upsertMessage", threadId, message: msg }).then(
      () => {
        (persistedMessageIds[threadId] ??= new Set()).add(msg.id);
      },
      () => {
        // Left unmarked — retried the next time persistMessages runs for
        // this thread. The write queue has already logged/reported it.
      },
    );
  }
}

export const useChatMessageStore = create<ChatMessageStore>()(
  immer((set, get) => ({
    messagesByThread: {},
    streamingByThread: {},

    initThread: (threadId, messages) =>
      set((state) => {
        state.messagesByThread[threadId] = messages;
        if (!state.streamingByThread[threadId]) {
          state.streamingByThread[threadId] = { ...defaultStreamingState };
        }
      }),

    beginStream: (threadId, runId) =>
      set((state) => {
        ensureThread(state, threadId);
        state.streamingByThread[threadId] = {
          isStreaming: true,
          runId,
          streamingMessageId: null,
          awaitingFirstToken: true,
          retryAttempt: 0,
          retryMaxAttempts: 0,
          retryDelayMs: 0,
        };
      }),

    setAwaitingRetry: (threadId, runId, attempt, maxAttempts, delayMs) =>
      set((state) => {
        ensureThread(state, threadId);
        const streaming = ensureStreaming(state, threadId);
        if (streaming.runId !== runId) return;
        streaming.awaitingFirstToken = true;
        streaming.retryAttempt = attempt;
        streaming.retryMaxAttempts = maxAttempts;
        streaming.retryDelayMs = delayMs;
      }),

    markStreamStarted: (threadId, runId) =>
      set((state) => {
        const streaming = ensureStreaming(state, threadId);
        if (streaming.runId !== runId) return;
        streaming.awaitingFirstToken = false;
        streaming.retryAttempt = 0;
        streaming.retryMaxAttempts = 0;
        streaming.retryDelayMs = 0;
      }),

    appendTextDelta: (threadId, runId, text) =>
      set((state) => {
        ensureThread(state, threadId);
        const streaming = ensureStreaming(state, threadId);

        if (!streaming.isStreaming || streaming.runId !== runId) {
          // Initialize new streaming session
          state.streamingByThread[threadId] = {
            isStreaming: true,
            runId,
            streamingMessageId: null,
            awaitingFirstToken: false,
            retryAttempt: 0,
            retryMaxAttempts: 0,
            retryDelayMs: 0,
          };
        } else {
          // First token arrived — clear the loading state
          streaming.awaitingFirstToken = false;
          streaming.retryAttempt = 0;
          streaming.retryMaxAttempts = 0;
          streaming.retryDelayMs = 0;
        }

        const msg = getOrCreateStreamingMessage(state, threadId, runId);
        const messages = state.messagesByThread[threadId];
        const idx = messages.findIndex((m) => m.id === msg.id);
        if (idx === -1) return;

        const lastBlock = messages[idx].content[messages[idx].content.length - 1];
        if (lastBlock?.type === "text") {
          (lastBlock as { type: "text"; text: string }).text += text;
        } else {
          messages[idx].content.push({ type: "text", text });
        }
      }),

    appendThinkingDelta: (threadId, runId, text) =>
      set((state) => {
        ensureThread(state, threadId);
        const streaming = ensureStreaming(state, threadId);

        if (!streaming.isStreaming || streaming.runId !== runId) {
          state.streamingByThread[threadId] = {
            isStreaming: true,
            runId,
            streamingMessageId: null,
            awaitingFirstToken: false,
            retryAttempt: 0,
            retryMaxAttempts: 0,
            retryDelayMs: 0,
          };
        } else {
          // First token arrived — clear the loading state
          streaming.awaitingFirstToken = false;
          streaming.retryAttempt = 0;
          streaming.retryMaxAttempts = 0;
          streaming.retryDelayMs = 0;
        }

        const msg = getOrCreateStreamingMessage(state, threadId, runId);
        const messages = state.messagesByThread[threadId];
        const idx = messages.findIndex((m) => m.id === msg.id);
        if (idx === -1) return;

        const lastBlock = messages[idx].content[messages[idx].content.length - 1];
        if (lastBlock?.type === "reasoning") {
          (lastBlock as { type: "reasoning"; text: string }).text += text;
        } else {
          messages[idx].content.push({ type: "reasoning", text });
        }
      }),

    addToolCall: (threadId, toolCall) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;
        message.content.push(toolCall as ContentBlock);
      }),

    updateToolCall: (threadId, toolCallId, update) => {
      // Captured by the set() producer below as a plain message id (never a
      // draft object), then used to look up committed state for the
      // re-persist below — see write-queue.ts's module doc.
      let updatedMessageId: string | null = null;

      set((state) => {
        const messages = state.messagesByThread[threadId];
        if (!messages) return;

        for (const msg of messages) {
          const block = msg.content.find(
            (b): b is ToolCallContentBlock =>
              b.type === "tool-call" && b.toolCallId === toolCallId,
          );
          if (block) {
            Object.assign(block, update);
            updatedMessageId = msg.id;
            return;
          }
        }
      });

      if (!updatedMessageId) return;

      // A tool-call block can be updated (e.g. a delayed agui.tool_result)
      // after its message was already finalized and durably saved by
      // finishStream/setStreamError — persistMessages' persistedMessageIds
      // guard (design.md's "only what changed" amendment) would otherwise
      // hide this change forever, since nothing else re-saves an
      // already-persisted message. Skip a still-streaming message:
      // finishStream's own persistMessages call will pick it up once it
      // completes, same as any first-time save.
      const message = get().messagesByThread[threadId]?.find(
        (m) => m.id === updatedMessageId,
      );
      if (!message || message.status === "in_progress") return;

      persistedMessageIds[threadId]?.delete(message.id);
      enqueueWrite({ kind: "upsertMessage", threadId, message }).then(
        () => {
          (persistedMessageIds[threadId] ??= new Set()).add(message.id);
        },
        () => {
          // Left unmarked — retried the next time persistMessages runs for
          // this thread, same as persistMessages' own failure handling.
        },
      );
    },

    addCitation: (threadId, citation) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;

        message.content.push({
          type: "citation",
          source: citation.source,
          content: citation.content,
          url: citation.url,
        });
      }),

    addSkillActivation: (threadId, skill) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;

        message.content.push({
          type: "skill-activation",
          skillId: skill.skillId,
          skillName: skill.skillName,
          selectionMethod: skill.selectionMethod,
          status: skill.status,
        });
      }),

    addContextUpdate: (threadId, update) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;

        message.content.push({ type: "context-update", ...update });
      }),

    addMemoryRecall: (threadId, recall) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;

        message.content.push({ type: "memory-recall", ...recall });
      }),

    addMemoryMutation: (threadId, mutation) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;

        message.content.push({ type: "memory-mutation", ...mutation });
      }),

    addArtifact: (threadId, artifact) =>
      set((state) => {
        const message = activeStreamingMessage(state, threadId);
        if (!message) return;

        message.content.push({ type: "artifact", ...artifact });
      }),

    finishStream: (threadId) => {
      // `shouldPersist` mirrors the producer's early return: nothing to
      // persist when no stream was active for this thread.
      let shouldPersist = false;

      set((state) => {
        const streaming = state.streamingByThread[threadId];
        if (!streaming) return;
        shouldPersist = true;

        const messages = state.messagesByThread[threadId];
        if (messages && streaming.streamingMessageId) {
          const idx = messages.findIndex(
            (m) => m.id === streaming.streamingMessageId,
          );
          if (idx !== -1) {
            messages[idx].status = "complete";
            // Finalize any skill-activation blocks that are still "active"
            for (const block of messages[idx].content) {
              if (block.type === "skill-activation" && block.status === "active") {
                (block as SkillActivationContentBlock).status = "complete";
              }
            }
          }
        }

        state.streamingByThread[threadId] = { ...defaultStreamingState };
      });

      if (!shouldPersist) return;

      // Write-through: persist all complete messages to PGLite, built from
      // committed state (get()) — never from the producer's immer draft,
      // which is revoked by the time the queued write runs.
      const messages = get().messagesByThread[threadId];
      if (messages) {
        persistMessages(threadId, messages);
      }
    },

    setStreamError: (threadId, error) => {
      let shouldPersist = false;

      set((state) => {
        const streaming = state.streamingByThread[threadId];
        if (!streaming) return;
        shouldPersist = true;

        // A pre-delta failure (non-2xx response, a rejected fetch, or the
        // stream closing with zero events) never reaches a block handler, so
        // `streamingMessageId` is still null here — no assistant message was
        // ever created for this run. Without creating one now, the error has
        // nothing to attach to: it silently vanishes when the streaming
        // state resets below, and MessageError (gated on an existing
        // message's status) never renders. Create the message the same way
        // `activeStreamingMessage` does for the first content block.
        ensureThread(state, threadId);
        const message = streaming.runId
          ? getOrCreateStreamingMessage(state, threadId, streaming.runId)
          : null;

        const messages = state.messagesByThread[threadId];
        if (messages && message) {
          const idx = messages.findIndex((m) => m.id === message.id);
          if (idx !== -1) {
            messages[idx].status = "failed";
            messages[idx].content.push({ type: "error", message: error });
          }
        }

        state.streamingByThread[threadId] = { ...defaultStreamingState };
      });

      if (!shouldPersist) return;

      // Write-through, from committed state — see finishStream above.
      const messages = get().messagesByThread[threadId];
      if (messages) {
        persistMessages(threadId, messages);
      }
    },

    clearStreaming: (threadId) =>
      set((state) => {
        if (!state.streamingByThread[threadId]) return;
        state.streamingByThread[threadId] = { ...defaultStreamingState };
      }),

    deleteMessagesAfter: (threadId, messageId) => {
      // Captured by the set() producer below as plain string ids (never a
      // draft object), then used for the queued write once the (synchronous)
      // store update has applied.
      let removedIds: string[] = [];

      set((state) => {
        const messages = state.messagesByThread[threadId];
        if (!messages) return;
        const idx = messages.findIndex((m) => m.id === messageId);
        if (idx === -1) return;
        const removed = messages.slice(idx + 1);
        if (removed.length === 0) return;
        removedIds = removed.map((m) => m.id);
        state.messagesByThread[threadId] = messages.slice(0, idx + 1);
      });

      if (removedIds.length === 0) return Promise.resolve();

      // These ids are gone from the thread and will never reappear (every
      // message id is freshly generated), so they should never be treated
      // as "already persisted" again — mainly tidiness, since a stale
      // marker for a deleted id is otherwise harmless.
      for (const id of removedIds) persistedMessageIds[threadId]?.delete(id);

      return enqueueWrite({ kind: "deleteMessages", threadId, ids: removedIds });
    },

    clearThread: (threadId) =>
      set((state) => {
        delete state.messagesByThread[threadId];
        delete state.streamingByThread[threadId];
        delete persistedMessageIds[threadId];
      }),
  })),
);

// Selector hooks — components must use these through feature hooks, not directly
export const selectThreadMessages =
  (threadId: string) => (state: ChatMessageStore) =>
    state.messagesByThread[threadId] ?? [];

export const selectStreamingState =
  (threadId: string) => (state: ChatMessageStore) =>
    state.streamingByThread[threadId] ?? defaultStreamingState;

export const selectIsStreaming =
  (threadId: string) => (state: ChatMessageStore) =>
    state.streamingByThread[threadId]?.isStreaming ?? false;

export const selectIsAwaitingFirstToken =
  (threadId: string) => (state: ChatMessageStore) =>
    state.streamingByThread[threadId]?.awaitingFirstToken ?? false;

export const selectRetryAttempt =
  (threadId: string) => (state: ChatMessageStore) =>
    state.streamingByThread[threadId]?.retryAttempt ?? 0;

export const selectRetryMaxAttempts =
  (threadId: string) => (state: ChatMessageStore) =>
    state.streamingByThread[threadId]?.retryMaxAttempts ?? 0;

export const selectRetryDelayMs =
  (threadId: string) => (state: ChatMessageStore) =>
    state.streamingByThread[threadId]?.retryDelayMs ?? 0;
