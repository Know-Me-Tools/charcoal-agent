## Why

The operator's goal is for an A2UI component to be assignable to an AG-UI event. That needs a registry first (the goals). Today dispatch is hard-coded, the client ignores 12 of UAR's 32 events, and internal artifacts render as code blocks (assessment F1, F2, F15).

## What Changes

- A `RenderRegistry` with keyed entries (`event`, `artifact`, `activity`) and dispositions `render`, `hide`, `adapt`.
- Default entries from the event inventory; diagnostics hidden by allowlist; unknown hidden with a development warning.
- `use-message-stream.ts` and `enhanced-thread.tsx` dispatch through the registry; `agui.cancelled`, `agui.subagent.*`, `agui.rag_citations` and a read-only approval chip render with existing blocks.
- Lands in: this repo (`src/features/chat/`). Owner: km-frontend-engineer.
- Depends on: NONE.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `agui-render-registry`.
- Unblocks `app-a2ui-surface-renderer` and `agui-inferred-a2ui`.
- Ships in the web image (Train B).
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
