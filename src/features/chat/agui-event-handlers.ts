import { useChatMessageStore } from "@/stores/chat-message-store";
import type { ArtifactContentBlock, ToolCallContentBlock } from "@/types/chat-content";
import { defaultRenderRegistry } from "@/features/chat/render-registry/default-entries";
import type { RenderRegistry } from "@/features/chat/render-registry/registry";
import {
  APPROVAL_PART,
  CANCELLED_PART,
  SUBAGENT_PART,
  type CancelledUsage,
  type SubagentStatus,
} from "@/features/chat/render-registry/pseudo-parts";

// ─── AG-UI event shapes (from UAR src/uar/api/sse.rs) ─────────────────────────

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
/** UAR `RagCitation` (src/uar/domain/events.rs). */
interface AguiRagCitations {
  kind: "rag_citations";
  phase: "added";
  request_id: string;
  citations: Array<{ marker: number; document_name: string; snippet: string }>;
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
interface AguiToolCallApprovalRequired {
  kind: "tool_call";
  phase: "approval_required";
  request_id: string;
  id: string;
  name: string;
  arguments_json: string;
  risk_reason?: string;
}
interface AguiError {
  kind: "error";
  request_id: string;
  message: string;
  code?: string;
}
/** `usage` is present only on UAR builds with PR #361, when usage was reported before the cancel. */
interface AguiCancelled {
  kind: "cancelled";
  request_id: string;
  usage?: CancelledUsage;
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
/** UAR `AgentLifecycle` (content-free projection; src/uar/domain/events.rs). */
interface AguiSubagent {
  kind: "subagent";
  phase: "started" | "updated" | "finished" | "error";
  request_id: string;
  lifecycle: {
    child_thread_id: string;
    canonical_path: string;
    status: "pending" | "running" | "waiting" | "completed" | "failed" | "cancelled";
  };
}

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

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export interface AguiDispatchContext {
  threadId: string;
  runId: string;
  /** Streaming tool-call argument fragments, keyed by tool_call_id. */
  pendingArgs: Map<string, string>;
  callbacks?: { onComplete?: () => void; onError?: (error: Error) => void };
  /** Defaults to the app's default registry; tests may pass their own. */
  registry?: RenderRegistry;
}

/** `stop` ends the stream (terminal event); `continue` reads the next block. */
export type AguiDispatchOutcome = "continue" | "stop";

type Handler = (payload: unknown, ctx: AguiDispatchContext, event: string) => AguiDispatchOutcome;

const store = () => useChatMessageStore.getState();

function hasToolCallBlock(threadId: string, toolCallId: string): boolean {
  return (
    store().messagesByThread[threadId]?.some((m) =>
      m.content.some((b) => b.type === "tool-call" && b.toolCallId === toolCallId),
    ) ?? false
  );
}

/** Artifacts are routed a second time, by artifact type: diagnostics never reach the store. */
function addArtifactIfShown(ctx: AguiDispatchContext, artifact: Omit<ArtifactContentBlock, "type">): void {
  const registry = ctx.registry ?? defaultRenderRegistry;
  const { disposition } = registry.resolve({ kind: "artifact", name: artifact.artifactType });
  if (disposition === "hide") return;
  // `adapt` (the `a2ui` carrier) keeps today's behaviour until the A2UI
  // renderer lands (app-a2ui-surface-renderer): stored as a display artifact.
  store().addArtifact(ctx.threadId, artifact);
}

const SUBAGENT_STATUS: Record<AguiSubagent["lifecycle"]["status"], SubagentStatus> = {
  pending: "running",
  running: "running",
  waiting: "running",
  completed: "complete",
  failed: "failed",
  cancelled: "cancelled",
};

const BLOCK_STATUS: Record<SubagentStatus, ToolCallContentBlock["status"]> = {
  running: "running",
  complete: "complete",
  failed: "failed",
  cancelled: "complete",
};

/** One handler per `render` or `adapt` event entry in the registry. */
export const AGUI_EVENT_HANDLERS: Readonly<Record<string, Handler>> = {
  // Store initialises on first delta; nothing to do here.
  "agui.stream.start": () => "continue",

  "agui.message.delta": (p, ctx) => {
    const e = p as AguiMessageDelta;
    if (e.delta?.text) store().appendTextDelta(ctx.threadId, ctx.runId, e.delta.text);
    return "continue";
  },

  "agui.thinking.delta": (p, ctx) => {
    const e = p as AguiThinkingDelta | AguiReasoningDelta;
    if (e.delta?.text) store().appendThinkingDelta(ctx.threadId, ctx.runId, e.delta.text);
    return "continue";
  },

  "agui.reasoning.delta": (p, ctx, event) => AGUI_EVENT_HANDLERS["agui.thinking.delta"](p, ctx, event),

  "agui.citation.added": (p, ctx) => {
    const c = (p as AguiCitationAdded).citation;
    if (c) {
      store().addCitation(ctx.threadId, {
        source: c.title ?? c.url ?? "Source",
        content: c.snippet ?? "",
        url: c.url,
      });
    }
    return "continue";
  },

  "agui.rag_citations": (p, ctx) => {
    for (const c of (p as AguiRagCitations).citations ?? []) {
      store().addCitation(ctx.threadId, { source: c.document_name, content: c.snippet ?? "" });
    }
    return "continue";
  },

  "agui.tool_call.delta": (p, ctx) => {
    // Accumulate streaming argument fragments locally
    const e = p as AguiToolCallDelta;
    ctx.pendingArgs.set(e.id, (ctx.pendingArgs.get(e.id) ?? "") + (e.delta?.arguments ?? ""));
    return "continue";
  },

  "agui.tool_call.complete": (p, ctx) => {
    const e = p as AguiToolCallComplete;
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(e.arguments_json) as Record<string, unknown>;
    } catch {
      args = { _raw: e.arguments_json };
    }
    store().addToolCall(ctx.threadId, {
      type: "tool-call",
      toolCallId: e.id,
      toolName: e.name,
      args,
      status: "running",
    });
    ctx.pendingArgs.delete(e.id);
    return "continue";
  },

  "agui.tool_result": (p, ctx) => {
    const e = p as AguiToolResult;
    store().updateToolCall(ctx.threadId, e.id, {
      result: e.content,
      status: e.success ? "complete" : "failed",
    });
    return "continue";
  },

  "agui.tool_call.denied": (p, ctx) => {
    // The launch run policy denies the call before it ever runs, so there is
    // usually no existing tool-call block to update — only
    // `agui.tool_call.delta` (streamed arguments) may have run first. Add one
    // if none exists yet; otherwise mark the existing one denied.
    const e = p as AguiToolCallDenied;
    if (hasToolCallBlock(ctx.threadId, e.id)) {
      store().updateToolCall(ctx.threadId, e.id, { status: "denied", result: e.reason });
    } else {
      store().addToolCall(ctx.threadId, {
        type: "tool-call",
        toolCallId: e.id,
        toolName: e.name,
        args: {},
        result: e.reason,
        status: "denied",
      });
    }
    ctx.pendingArgs.delete(e.id);
    return "continue";
  },

  // Read-only indicator (D-26: interactive approvals are deferred). Its own
  // id so a later tool_call.complete for the same call adds its own block.
  "agui.tool_call.approval_required": (p, ctx) => {
    const e = p as AguiToolCallApprovalRequired;
    store().addToolCall(ctx.threadId, {
      type: "tool-call",
      toolCallId: `approval-${e.id}`,
      toolName: APPROVAL_PART,
      args: { toolName: e.name, reason: e.risk_reason },
      status: "running",
    });
    return "continue";
  },

  "agui.subagent.*": (p, ctx) => {
    const { lifecycle } = p as AguiSubagent;
    if (!lifecycle?.child_thread_id) return "continue";
    const id = `subagent-${lifecycle.child_thread_id}`;
    const status = SUBAGENT_STATUS[lifecycle.status] ?? "running";
    const args = { path: lifecycle.canonical_path, status };
    if (hasToolCallBlock(ctx.threadId, id)) {
      store().updateToolCall(ctx.threadId, id, { args, status: BLOCK_STATUS[status] });
    } else {
      store().addToolCall(ctx.threadId, {
        type: "tool-call",
        toolCallId: id,
        toolName: SUBAGENT_PART,
        args,
        status: BLOCK_STATUS[status],
      });
    }
    return "continue";
  },

  "agui.error": (p, ctx) => {
    const e = p as AguiError;
    store().setStreamError(ctx.threadId, e.message);
    ctx.callbacks?.onError?.(new Error(e.message));
    return "stop";
  },

  "agui.cancelled": (p, ctx) => {
    const { usage } = p as AguiCancelled;
    // Token counts only: the model name and cost estimate stay out of the thread.
    const tokens: CancelledUsage | undefined = usage && {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_tokens: usage.total_tokens,
    };
    store().addToolCall(ctx.threadId, {
      type: "tool-call",
      toolCallId: `cancelled-${ctx.runId}`,
      toolName: CANCELLED_PART,
      args: tokens ? { usage: tokens } : {},
      status: "complete",
    });
    store().finishStream(ctx.threadId);
    ctx.callbacks?.onComplete?.();
    return "stop";
  },

  "agui.skill.activated": (p, ctx) => {
    const e = p as AguiSkillActivated;
    store().addSkillActivation(ctx.threadId, {
      skillId: e.skill.id,
      skillName: e.skill.title,
      selectionMethod: e.selection_method,
      status: "active",
    });
    return "continue";
  },

  "agui.context.update": (p, ctx) => {
    const e = p as AguiContextUpdate;
    // Only record when the strategy was actually applied
    if (e.was_applied) {
      store().addContextUpdate(ctx.threadId, {
        strategy: e.strategy,
        messagesRemoved: e.messages_removed,
        tokensSaved: e.tokens_saved,
        wasApplied: e.was_applied,
        summaryGenerated: e.summary_generated,
      });
    }
    return "continue";
  },

  "agui.memory.recall": (p, ctx) => {
    const e = p as AguiMemoryRecall;
    store().addMemoryRecall(ctx.threadId, {
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
    return "continue";
  },

  "agui.memory.mutation": (p, ctx) => {
    const e = p as AguiMemoryMutation;
    store().addMemoryMutation(ctx.threadId, {
      operation: e.operation,
      memoryId: e.memory_id,
      content: e.content,
      scope: e.scope,
      memoryType: e.memory_type,
    });
    return "continue";
  },

  "agui.artifact": (p, ctx) => {
    const e = p as AguiArtifact;
    addArtifactIfShown(ctx, {
      artifactId: e.artifact_id,
      artifactType: e.artifact_type,
      title: e.title,
      content: e.content,
      language: e.language,
      isInputRequest: false,
      metadata: e.metadata ?? {},
    });
    return "continue";
  },

  "agui.artifact_input_request": (p, ctx) => {
    const e = p as AguiArtifactInputRequest;
    addArtifactIfShown(ctx, {
      artifactId: e.artifact_id,
      artifactType: e.artifact_type,
      title: e.title,
      content: e.content,
      isInputRequest: true,
      runId: e.request_id,
      metadata: e.metadata ?? {},
    });
    return "continue";
  },

  // ── adapt ──
  "agui.custom": (p, ctx, event) => {
    // Extract any embedded A2UI envelope and surface as a display artifact
    const envelope = extractA2uiEnvelope(p);
    if (envelope) {
      store().addArtifact(ctx.threadId, {
        artifactId: `agui-${event}-${Date.now()}`,
        artifactType: "display",
        title: event === "agui.custom" ? "Custom Event" : "Raw Event",
        content: JSON.stringify(envelope, null, 2),
        language: "json",
        isInputRequest: false,
        metadata: {},
      });
    }
    return "continue";
  },

  "agui.raw": (p, ctx, event) => AGUI_EVENT_HANDLERS["agui.custom"](p, ctx, event),

  // Typed seam: `/a2ui/` surface patches are consumed by the A2UI renderer
  // (change app-a2ui-surface-renderer). Today nothing is shown, as before.
  "agui.state.patch": () => "continue",

  "agui.done": (_p, ctx) => {
    store().finishStream(ctx.threadId);
    ctx.callbacks?.onComplete?.();
    return "stop";
  },
};

/** Handler for an event name: exact, then the registry's wildcard family. */
function handlerFor(event: string): Handler | undefined {
  if (AGUI_EVENT_HANDLERS[event]) return AGUI_EVENT_HANDLERS[event];
  return event.startsWith("agui.subagent.") ? AGUI_EVENT_HANDLERS["agui.subagent.*"] : undefined;
}

/**
 * Routes one named SSE event (`agui.*`, `runtime.*`, ...) through the render
 * registry, then to its handler. Hidden and unknown events are dropped before
 * their JSON is parsed.
 */
export function dispatchAguiEvent(event: string, data: string, ctx: AguiDispatchContext): AguiDispatchOutcome {
  const registry = ctx.registry ?? defaultRenderRegistry;
  const { disposition } = registry.resolve({ kind: "event", name: event });
  if (disposition === "hide") return "continue";

  const handler = handlerFor(event);
  if (!handler) return "continue";

  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    return "continue";
  }
  return handler(payload, ctx, event);
}
