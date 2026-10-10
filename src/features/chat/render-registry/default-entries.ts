import { createRenderRegistry, type RenderEntryDef } from "./registry";

/**
 * Default entries, from the event inventory
 * (`.kbd-orchestrator/phases/agui-rendering-functionality/evidence/
 * 03-agui-event-inventory.md`, UAR `src/uar/api/sse.rs`) and the public
 * allowlist audit (`10-public-allowlist-audit.md`). Anything not listed is
 * hidden by the registry's unknown default.
 */
export const DEFAULT_RENDER_ENTRIES: readonly RenderEntryDef[] = [
  // ── Events: render (handled by a store action and an existing block) ──────
  { kind: "event", name: "agui.stream.start", disposition: "render", reason: "Stream open; no block." },
  { kind: "event", name: "agui.message.delta", disposition: "render", reason: "Assistant text." },
  { kind: "event", name: "agui.thinking.delta", disposition: "render", reason: "Reasoning block." },
  { kind: "event", name: "agui.reasoning.delta", disposition: "render", reason: "Reasoning block." },
  { kind: "event", name: "agui.citation.added", disposition: "render", reason: "Citation block." },
  { kind: "event", name: "agui.rag_citations", disposition: "render", reason: "Citation block, one per retrieved chunk." },
  { kind: "event", name: "agui.tool_call.delta", disposition: "render", reason: "Accumulates tool arguments." },
  { kind: "event", name: "agui.tool_call.complete", disposition: "render", reason: "Tool-call block." },
  { kind: "event", name: "agui.tool_result", disposition: "render", reason: "Tool-call result." },
  { kind: "event", name: "agui.tool_call.denied", disposition: "render", reason: "Blocked tool call (FR-11)." },
  {
    kind: "event",
    name: "agui.tool_call.approval_required",
    disposition: "render",
    reason: "Read-only approval indicator; interactive approval is deferred (D-26).",
  },
  { kind: "event", name: "agui.skill.activated", disposition: "render", reason: "Skill block." },
  { kind: "event", name: "agui.context.update", disposition: "render", reason: "Context block when applied." },
  { kind: "event", name: "agui.memory.recall", disposition: "render", reason: "Memory recall block." },
  { kind: "event", name: "agui.memory.mutation", disposition: "render", reason: "Memory change block." },
  { kind: "event", name: "agui.artifact", disposition: "render", reason: "Routed again by artifact type." },
  { kind: "event", name: "agui.artifact_input_request", disposition: "render", reason: "Input form, routed by artifact type." },
  { kind: "event", name: "agui.subagent.*", disposition: "render", reason: "Subagent lifecycle as a tool-call block." },
  { kind: "event", name: "agui.cancelled", disposition: "render", reason: "Cancelled state, with usage when present." },
  { kind: "event", name: "agui.error", disposition: "render", reason: "Fails the message (terminal)." },
  { kind: "event", name: "agui.done", disposition: "render", reason: "Completes the message (terminal)." },

  // ── Events: adapt (may carry A2UI) ────────────────────────────────────────
  { kind: "event", name: "agui.custom", disposition: "adapt", reason: "May carry an A2UI envelope." },
  { kind: "event", name: "agui.raw", disposition: "adapt", reason: "May carry an A2UI envelope." },
  {
    kind: "event",
    name: "agui.state.patch",
    disposition: "adapt",
    reason: "Carries /a2ui/surfaces/* (consumed by the A2UI renderer change); other paths are internal.",
  },

  // ── Events: hide (informational or diagnostics) ───────────────────────────
  { kind: "event", name: "agui.memory.update", disposition: "hide", reason: "Informational." },
  { kind: "event", name: "agui.budget.alert", disposition: "hide", reason: "Diagnostic: spend." },
  { kind: "event", name: "agui.guardrail", disposition: "hide", reason: "Diagnostic: policy internals." },
  { kind: "event", name: "agui.mcp.state", disposition: "hide", reason: "Diagnostic: MCP lifecycle." },
  { kind: "event", name: "agui.quality.sycophancy", disposition: "hide", reason: "Diagnostic: quality scoring." },
  { kind: "event", name: "agui.quality.sycophancy_corrected", disposition: "hide", reason: "Diagnostic: quality scoring." },
  { kind: "event", name: "runtime.*", disposition: "hide", reason: "Run diagnostics (runtime.run, runtime.step)." },

  // ── Artifact types ────────────────────────────────────────────────────────
  { kind: "artifact", name: "code", disposition: "render", reason: "Display artifact." },
  { kind: "artifact", name: "diagram", disposition: "render", reason: "Display artifact (Mermaid when language is mermaid)." },
  { kind: "artifact", name: "display", disposition: "render", reason: "Display artifact; also the client's A2UI envelope fallback." },
  { kind: "artifact", name: "confirm", disposition: "render", reason: "Input form; a display-only copy is inferred into A2UI." },
  { kind: "artifact", name: "form", disposition: "render", reason: "Input form; a display-only copy is inferred into A2UI." },
  { kind: "artifact", name: "select", disposition: "render", reason: "Input form; a display-only copy is inferred into A2UI." },
  { kind: "artifact", name: "text_input", disposition: "render", reason: "Input form; a display-only copy is inferred into A2UI." },
  { kind: "artifact", name: "a2ui", disposition: "adapt", reason: "A2UI v0.9.1 messages (application/a2ui+json)." },
  { kind: "artifact", name: "provider_event", disposition: "hide", reason: "Diagnostic: provider internals." },
  { kind: "artifact", name: "attempt_manifest", disposition: "hide", reason: "Diagnostic: model and manifest hashes." },
  { kind: "artifact", name: "effective_run_policy", disposition: "hide", reason: "Diagnostic: run policy." },
  { kind: "artifact", name: "turn_manifest", disposition: "hide", reason: "Diagnostic: turn manifest." },

  // ── Activity types (AG-UI ACTIVITY_SNAPSHOT; UAR does not emit these yet) ─
  { kind: "activity", name: "a2ui-surface", disposition: "adapt", reason: "AG-UI A2UI middleware carrier." },
];

export const defaultRenderRegistry = createRenderRegistry(DEFAULT_RENDER_ENTRIES);
