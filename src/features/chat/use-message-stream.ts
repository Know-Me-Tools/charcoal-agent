import { useCallback, useRef } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useChatConnectivityStore } from "@/stores/chat-connectivity-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { buildUrl, buildHeaders } from "@/lib/api-client";
import { getSiteAgentId } from "@/hooks/use-site-config";
import type { ToolCallContentBlock } from "@/types/chat-content";

const UAR_PATH = "/api/chat/completion";

export interface UarChatPayload {
  message: string;
  /** Optional UAR agent ID to route this conversation to a specific agent. */
  agent_id?: string;
  /**
   * Session-level prompt-caching override. When true/false, overrides user and
   * global settings for this request. When undefined, the server falls back to
   * user → agent → global hierarchy.
   */
  prompt_caching_enabled?: boolean;
}

export interface StreamCallbacks {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface StartStreamOptions {
  /**
   * Skip appending a new optimistic user message — reuse the one already in
   * the store. Used by retry/regenerate (`onReload` in use-chat-runtime.ts),
   * which resends an existing user message rather than creating a duplicate
   * (the caller is expected to have already removed the superseded reply
   * via `deleteMessagesAfter`).
   */
  skipUserMessage?: boolean;
}

// ─── AG-UI event shapes (from UAR src/uar/api/sse.rs) ─────────────────────────

interface AguiStreamStart {
  kind: "stream";
  phase: "start";
  request_id: string;
}
interface AguiMessageDelta {
  kind: "message";
  phase: "delta";
  request_id: string;
  delta: { text: string };
}
interface AguiThinkingDelta {
  kind: "thinking";
  phase: "delta";
  request_id: string;
  delta: { text: string };
}
interface AguiReasoningDelta {
  kind: "reasoning";
  phase: "delta";
  request_id: string;
  delta: { text: string };
}
interface AguiCitationAdded {
  kind: "citation";
  phase: "added";
  request_id: string;
  citation: { index: number; url?: string; title?: string; snippet?: string };
}
interface AguiToolCallDelta {
  kind: "tool_call";
  phase: "delta";
  request_id: string;
  call_index: number;
  id: string;
  delta: { arguments: string };
}
interface AguiToolCallComplete {
  kind: "tool_call";
  phase: "complete";
  request_id: string;
  call_index: number;
  id: string;
  name: string;
  arguments_json: string;
}
interface AguiToolResult {
  kind: "tool_result";
  request_id: string;
  call_index: number;
  id: string;
  name: string;
  content: string;
  success: boolean;
}
/** The launch run policy denies every tool call (site-chat-offline-states, FR-11 client case). */
interface AguiToolCallDenied {
  kind: "tool_call";
  phase: "denied";
  request_id: string;
  call_index: number;
  id: string;
  name: string;
  reason: string;
}
interface AguiError {
  kind: "error";
  request_id: string;
  message: string;
  code?: string;
}
interface AguiDone {
  kind: "done";
  request_id: string;
}
interface AguiStatePatch {
  kind: "state";
  phase: "patch";
  request_id: string;
  patch: unknown;
}
interface AguiSkillActivated {
  kind: "skill";
  phase: "activated";
  request_id: string;
  skill: { id: string; title: string };
  selection_method: string;
}
interface AguiContextUpdate {
  kind: "context";
  phase: "update";
  strategy: string;
  messages_removed: number;
  tokens_saved: number;
  was_applied: boolean;
  summary_generated: boolean;
}
interface AguiMemoryUpdate {
  kind: "memory";
  phase: "update";
  request_id: string;
  key: string;
  value: string;
  operation: string;
}

interface AguiMemoryRecall {
  kind: "memory";
  phase: "recall";
  request_id: string;
  items: Array<{
    key: string;
    value: string;
    source: string;
    scope?: string;
    memory_type?: string;
    importance?: number;
  }>;
  count: number;
}

interface AguiMemoryMutation {
  kind: "memory";
  phase: "mutation";
  request_id: string;
  operation: string;
  memory_id: string;
  content: string;
  scope: string;
  memory_type: string;
}

interface AguiArtifact {
  kind: "artifact";
  phase: "complete";
  request_id: string;
  artifact_id: string;
  artifact_type: string;
  title: string;
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

interface AguiArtifactInputRequest {
  kind: "artifact_input_request";
  request_id: string;
  artifact_id: string;
  artifact_type: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface AguiRaw {
  kind: "raw";
  event?: unknown;
  source?: string;
}
interface AguiCustom {
  kind: "custom";
  name?: string;
  value?: unknown;
  data?: unknown;
}

type AguiPayload =
  | AguiStreamStart
  | AguiMessageDelta
  | AguiThinkingDelta
  | AguiReasoningDelta
  | AguiCitationAdded
  | AguiToolCallDelta
  | AguiToolCallComplete
  | AguiToolResult
  | AguiToolCallDenied
  | AguiError
  | AguiDone
  | AguiStatePatch
  | AguiSkillActivated
  | AguiContextUpdate
  | AguiMemoryUpdate
  | AguiMemoryRecall
  | AguiMemoryMutation
  | AguiArtifact
  | AguiArtifactInputRequest
  | AguiRaw
  | AguiCustom
  | { kind: string; [k: string]: unknown };

// ─── A2UI envelope extractor ─────────────────────────────────────────────────
// Recursively unwraps agui.raw / agui.custom payloads to find a known A2UI
// envelope (surfaceUpdate, dataModelUpdate, beginRendering, deleteSurface).

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractA2uiEnvelope(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const directKeys = ["surfaceUpdate", "dataModelUpdate", "beginRendering", "deleteSurface"];
  if (directKeys.some((k) => k in value)) return value;
  if ("event" in value) {
    const nested = extractA2uiEnvelope(value.event);
    if (nested) return nested;
  }
  if ("value" in value) {
    const nested = extractA2uiEnvelope(value.value);
    if (nested) return nested;
  }
  if ("data" in value) {
    const nested = extractA2uiEnvelope(value.data);
    if (nested) return nested;
  }
  return null;
}

// ─── SSE block parser ─────────────────────────────────────────────────────────
// SSE blocks are separated by blank lines (\n\n).
// Each block contains lines of the form "field: value".
// The default event type when no "event:" line is present is "message".

interface SseBlock {
  event: string;
  data: string;
  id?: string;
}

function parseSseBlock(raw: string): SseBlock | null {
  let event = "message";
  let data = "";
  let id: string | undefined;

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data = line.slice(5).trim();
    } else if (line.startsWith("id:")) {
      id = line.slice(3).trim();
    }
    // Ignore comment lines (":") and retry lines
  }

  if (!data) return null;
  return { event, data, id };
}

// ─── Response-failure classification (site-chat-offline-states) ──────────────
//
// The generic `{ "error", "message" }` body from `server/src/error.rs`. The
// client keys on `error` (a stable code), never on `message` text, which can
// change independently of behaviour.
interface ErrorResponseBody {
  error?: string;
  message?: string;
}

/**
 * `error` codes that mean "the agent itself is unreachable right now" rather
 * than a request-specific failure: UAR down (`upstream_unavailable` 502,
 * `upstream_timeout` 504, `upstream_error` 502 — any other UAR non-2xx), the
 * token budget spent (`budget_exhausted`), the spend meter's own store down
 * — it fails closed (`meter_unavailable`), or the operator's kill switch
 * (`kill_switch_on`). All four show the same static offline notice (FR-27);
 * none of them should ever reach the thread as a per-message error.
 */
const OFFLINE_ERROR_CODES: ReadonlySet<string> = new Set([
  "upstream_unavailable",
  "upstream_timeout",
  "upstream_error",
  "budget_exhausted",
  "meter_unavailable",
  "kill_switch_on",
]);

type ChatRequestFailure =
  | { kind: "offline" }
  | { kind: "rate-limited"; retryAfterSeconds?: number }
  /** Anything else — a generic, per-message failure (existing behaviour). */
  | { kind: "generic" };

function parseRetryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function classifyResponseFailure(
  status: number,
  body: ErrorResponseBody | null,
  retryAfterHeader: string | null,
): ChatRequestFailure {
  if (status === 429) {
    return { kind: "rate-limited", retryAfterSeconds: parseRetryAfterSeconds(retryAfterHeader) };
  }
  if (body?.error && OFFLINE_ERROR_CODES.has(body.error)) {
    return { kind: "offline" };
  }
  return { kind: "generic" };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessageStream() {
  const abortRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const startStream = useCallback(
    async (
      threadId: string,
      payload: UarChatPayload,
      callbacks?: StreamCallbacks,
      options?: StartStreamOptions,
    ): Promise<void> => {
      cancelStream();

      if (!options?.skipUserMessage) {
        // Optimistically add the user message to the store
        const userMsgId = `user-${Date.now()}`;
        useChatMessageStore.getState().initThread(threadId, [
          ...(useChatMessageStore.getState().messagesByThread[threadId] ?? []),
          {
            id: userMsgId,
            role: "user",
            content: [{ type: "text", text: payload.message }],
            createdAt: new Date(),
            status: "complete",
          },
        ]);
      }

      const controller = new AbortController();
      abortRef.current = controller;

      // Stable run ID for this assistant turn
      const runId = `run-${Date.now()}`;

      // Mark that we're waiting for the first token (loading state). A new
      // attempt clears any prior offline/rate-limited notice for this
      // thread — the visitor is retrying, so the stale notice shouldn't
      // linger if this attempt gets further than the last one.
      useChatMessageStore.getState().beginStream(threadId, runId);
      useChatConnectivityStore.getState().clear(threadId);

      // Accumulate streaming tool-call arguments keyed by tool_call_id
      const pendingArgs = new Map<string, string>();

      // Resolve the agent associated with this thread (if any). On the
      // public site build every request is pinned to the site agent,
      // regardless of what the caller or thread registry requested — the
      // agent picker is hidden in that build, but this is the actual
      // enforcement point (the site's nginx proxy also enforces it server
      // side; this keeps behaviour consistent when running against a
      // non-proxied UAR in dev/tests).
      const threadAgent = useThreadRegistryStore.getState().threads[threadId];
      const agentId = getSiteAgentId() ?? payload.agent_id ?? threadAgent?.agentId;

      try {
        const res = await fetch(buildUrl(UAR_PATH), {
          method: "POST",
          headers: buildHeaders({ "X-UAR-Session-ID": threadId }),
          body: JSON.stringify({
            message: payload.message,
            stream: true,
            stream_mode: "dual",
            ...(agentId ? { agent_id: agentId } : {}),
            ...(payload.prompt_caching_enabled !== undefined
              ? { prompt_caching_enabled: payload.prompt_caching_enabled }
              : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let body: ErrorResponseBody | null = null;
          try {
            body = (await res.json()) as ErrorResponseBody;
          } catch {
            body = null;
          }
          const failure = classifyResponseFailure(
            res.status,
            body,
            res.headers.get("Retry-After"),
          );

          if (failure.kind === "offline") {
            useChatConnectivityStore.getState().setOffline(threadId);
            useChatMessageStore.getState().clearStreaming(threadId);
            callbacks?.onError?.(new Error("offline"));
            return;
          }
          if (failure.kind === "rate-limited") {
            useChatConnectivityStore
              .getState()
              .setRateLimited(threadId, failure.retryAfterSeconds);
            useChatMessageStore.getState().clearStreaming(threadId);
            callbacks?.onError?.(new Error("rate_limited"));
            return;
          }

          // Generic failure — unchanged behaviour: surfaces as a failed
          // assistant message via the catch block below (setStreamError
          // never echoes this text to the user; see MessageError).
          throw new Error(`POST /api/chat/completion ${res.status}`);
        }

        if (!res.body) {
          throw new Error("Response body is null — cannot read SSE stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE blocks are delimited by double newlines
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const raw of blocks) {
            if (!raw.trim()) continue;

            const block = parseSseBlock(raw);
            if (!block) continue;

            const { event, data } = block;

            // ── AG-UI named events (primary channel in dual mode) ──────────────
            if (event.startsWith("agui.")) {
              let agui: AguiPayload;
              try {
                agui = JSON.parse(data) as AguiPayload;
              } catch {
                continue;
              }

              const {
                appendTextDelta,
                appendThinkingDelta,
                addToolCall,
                updateToolCall,
                addCitation,
                addSkillActivation,
                addContextUpdate,
                addMemoryRecall,
                addMemoryMutation,
                addArtifact,
                finishStream,
                setStreamError,
              } = useChatMessageStore.getState();

              switch (event) {
                case "agui.stream.start":
                  // Store initialises on first delta; nothing to do here
                  break;

                case "agui.message.delta": {
                  const e = agui as AguiMessageDelta;
                  if (e.delta?.text) appendTextDelta(threadId, runId, e.delta.text);
                  break;
                }

                case "agui.thinking.delta":
                case "agui.reasoning.delta": {
                  const e = agui as AguiThinkingDelta | AguiReasoningDelta;
                  if (e.delta?.text) appendThinkingDelta(threadId, runId, e.delta.text);
                  break;
                }

                case "agui.citation.added": {
                  const e = agui as AguiCitationAdded;
                  const c = e.citation;
                  if (c) {
                    addCitation(threadId, {
                      source: c.title ?? c.url ?? "Source",
                      content: c.snippet ?? "",
                      url: c.url,
                    });
                  }
                  break;
                }

                case "agui.tool_call.delta": {
                  // Accumulate streaming argument fragments locally
                  const e = agui as AguiToolCallDelta;
                  pendingArgs.set(
                    e.id,
                    (pendingArgs.get(e.id) ?? "") + (e.delta?.arguments ?? ""),
                  );
                  break;
                }

                case "agui.tool_call.complete": {
                  const e = agui as AguiToolCallComplete;
                  let args: Record<string, unknown>;
                  try {
                    args = JSON.parse(e.arguments_json) as Record<string, unknown>;
                  } catch {
                    args = { _raw: e.arguments_json };
                  }
                  const toolCall: ToolCallContentBlock = {
                    type: "tool-call",
                    toolCallId: e.id,
                    toolName: e.name,
                    args,
                    status: "running",
                  };
                  addToolCall(threadId, toolCall);
                  pendingArgs.delete(e.id);
                  break;
                }

                case "agui.tool_result": {
                  const e = agui as AguiToolResult;
                  updateToolCall(threadId, e.id, {
                    result: e.content,
                    status: e.success ? "complete" : "failed",
                  });
                  break;
                }

                case "agui.tool_call.denied": {
                  // The launch run policy denies the call before it ever
                  // runs, so there is usually no existing tool-call block to
                  // update — only `agui.tool_call.delta` (streamed
                  // arguments) may have run first. Add one if none exists
                  // yet; otherwise mark the existing one denied.
                  const e = agui as AguiToolCallDenied;
                  const hasExistingBlock = useChatMessageStore
                    .getState()
                    .messagesByThread[threadId]
                    ?.some((m) =>
                      m.content.some(
                        (b) => b.type === "tool-call" && b.toolCallId === e.id,
                      ),
                    );
                  if (hasExistingBlock) {
                    updateToolCall(threadId, e.id, { status: "denied", result: e.reason });
                  } else {
                    addToolCall(threadId, {
                      type: "tool-call",
                      toolCallId: e.id,
                      toolName: e.name,
                      args: {},
                      result: e.reason,
                      status: "denied",
                    });
                  }
                  pendingArgs.delete(e.id);
                  break;
                }

                case "agui.error": {
                  const e = agui as AguiError;
                  setStreamError(threadId, e.message);
                  callbacks?.onError?.(new Error(e.message));
                  return;
                }

                case "agui.skill.activated": {
                  const e = agui as AguiSkillActivated;
                  addSkillActivation(threadId, {
                    skillId: e.skill.id,
                    skillName: e.skill.title,
                    selectionMethod: e.selection_method,
                    status: "active",
                  });
                  break;
                }

                case "agui.context.update": {
                  const e = agui as AguiContextUpdate;
                  // Only record when the strategy was actually applied
                  if (e.was_applied) {
                    addContextUpdate(threadId, {
                      strategy: e.strategy,
                      messagesRemoved: e.messages_removed,
                      tokensSaved: e.tokens_saved,
                      wasApplied: e.was_applied,
                      summaryGenerated: e.summary_generated,
                    });
                  }
                  break;
                }

                case "agui.memory.recall": {
                  const e = agui as AguiMemoryRecall;
                  addMemoryRecall(threadId, {
                    items: (e.items ?? []).map((item) => ({
                      key: item.key,
                      value: item.value,
                      source: item.source,
                      scope: item.scope,
                      memoryType: item.memory_type,
                      importance: item.importance,
                    })),
                    count: e.count ?? 0,
                  });
                  break;
                }

                case "agui.memory.mutation": {
                  const e = agui as AguiMemoryMutation;
                  addMemoryMutation(threadId, {
                    operation: e.operation,
                    memoryId: e.memory_id,
                    content: e.content,
                    scope: e.scope,
                    memoryType: e.memory_type,
                  });
                  break;
                }

                case "agui.artifact": {
                  const e = agui as AguiArtifact;
                  addArtifact(threadId, {
                    artifactId: e.artifact_id,
                    artifactType: e.artifact_type,
                    title: e.title,
                    content: e.content,
                    language: e.language,
                    isInputRequest: false,
                    metadata: e.metadata ?? {},
                  });
                  break;
                }

                case "agui.artifact_input_request": {
                  const e = agui as AguiArtifactInputRequest;
                  addArtifact(threadId, {
                    artifactId: e.artifact_id,
                    artifactType: e.artifact_type,
                    title: e.title,
                    content: e.content,
                    isInputRequest: true,
                    runId: e.request_id,
                    metadata: e.metadata ?? {},
                  });
                  break;
                }

                case "agui.custom":
                case "agui.raw": {
                  // Extract any embedded A2UI envelope and surface as a display artifact
                  const envelope = extractA2uiEnvelope(agui);
                  if (envelope) {
                    addArtifact(threadId, {
                      artifactId: `agui-${event}-${Date.now()}`,
                      artifactType: "display",
                      title: event === "agui.custom" ? "Custom Event" : "Raw Event",
                      content: JSON.stringify(envelope, null, 2),
                      language: "json",
                      isInputRequest: false,
                      metadata: {},
                    });
                  }
                  break;
                }

                case "agui.done": {
                  finishStream(threadId);
                  callbacks?.onComplete?.();
                  return;
                }

                // agui.memory.update and agui.state.patch are informational only
                case "agui.memory.update":
                case "agui.state.patch":
                default: {
                  break;
                }
              }

              // Handled by AG-UI path; skip OpenAI fallback
              continue;
            }

            // ── Anonymous data events (OpenAI chunks) ─────────────────────────
            // In dual mode, text is already covered by agui.message.delta.
            // Only watch for [DONE] as a safety-net terminator.
            if (event === "message") {
              if (data === "[DONE]") {
                useChatMessageStore.getState().finishStream(threadId);
                callbacks?.onComplete?.();
                return;
              }
              // OpenAI text chunks intentionally skipped — agui handles content
            }
          }
        }

        // Reader exhausted without agui.done / [DONE]. `streamingMessageId`
        // is set only once a block that actually creates the assistant
        // message has been handled — a text/thinking delta, tool call,
        // citation, skill activation, etc. (getOrCreateStreamingMessage /
        // activeStreamingMessage in chat-message-store.ts). A bare
        // agui.stream.start does not create one, so it still counts as "no
        // events" below. When the id is set, treat this as a graceful
        // finish — unchanged behavior. When it is still null, the
        // connection closed before anything was ever shown: a pre-delta
        // failure like an HTTP error or a rejected fetch, so it must
        // surface the same way (docs/qa/chat-surfaces-flat2.md §6.6).
        if (useChatMessageStore.getState().streamingByThread[threadId]?.streamingMessageId) {
          useChatMessageStore.getState().finishStream(threadId);
          callbacks?.onComplete?.();
        } else {
          const error = new Error("The connection closed before the agent replied.");
          useChatMessageStore.getState().setStreamError(threadId, error.message);
          callbacks?.onError?.(error);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const error = err instanceof Error ? err : new Error("Stream failed");
        useChatMessageStore.getState().setStreamError(threadId, error.message);
        callbacks?.onError?.(error);
      }
    },
    [cancelStream],
  );

  return { startStream, cancelStream };
}
