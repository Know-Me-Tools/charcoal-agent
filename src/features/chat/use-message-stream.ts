import { useCallback, useRef } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import type { ToolCallContentBlock } from "@/types/chat-content";

const UAR_URL = "/api/chat/completion";

export interface UarChatPayload {
  message: string;
}

export interface StreamCallbacks {
  onComplete?: () => void;
  onError?: (error: Error) => void;
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

type AguiPayload =
  | AguiStreamStart
  | AguiMessageDelta
  | AguiThinkingDelta
  | AguiReasoningDelta
  | AguiCitationAdded
  | AguiToolCallDelta
  | AguiToolCallComplete
  | AguiToolResult
  | AguiError
  | AguiDone
  | AguiStatePatch
  | AguiSkillActivated
  | AguiContextUpdate
  | AguiMemoryUpdate;

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
    ): Promise<void> => {
      cancelStream();

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

      const controller = new AbortController();
      abortRef.current = controller;

      // Stable run ID for this assistant turn
      const runId = `run-${Date.now()}`;

      // Accumulate streaming tool-call arguments keyed by tool_call_id
      const pendingArgs = new Map<string, string>();

      try {
        const res = await fetch(UAR_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UAR-Session-ID": threadId,
          },
          body: JSON.stringify({
            message: payload.message,
            stream: true,
            stream_mode: "dual",
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "Request failed");
          throw new Error(`POST /api/chat/completion ${res.status}: ${text}`);
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

                case "agui.done":
                  finishStream(threadId);
                  callbacks?.onComplete?.();
                  return;

                // agui.state.patch, agui.memory.update — informational, no UI action yet
                default:
                  break;
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

        // Reader exhausted without agui.done / [DONE] — finish gracefully
        useChatMessageStore.getState().finishStream(threadId);
        callbacks?.onComplete?.();
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
