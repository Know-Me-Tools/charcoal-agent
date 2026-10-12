## Why

The operator wants A2UI wherever appropriate, whether registered or inferable. Without inference only events that UAR already wraps in A2UI would render as components.

## What Changes

- Deterministic inference rules with caps on depth and size and full text escaping, using only the nine components.
- `adapt` registry entries for the known shapes; fallback to hide when over a cap.
- Lands in: this repo (`src/features/chat/render-registry/`). Owner: km-frontend-engineer.
- Depends on: app-a2ui-surface-renderer.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `a2ui-inference`.
- Client-only; ships in the web image (Train B).
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
