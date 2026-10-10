## Why

The client cannot render A2UI at all today (assessment F1). The renderer is the point of the phase.

## What Changes

- Dependencies with exact pins: `@prometheus-ags/a2ui-react` (version from the PEM release) and the official packages; the PEM alias bumped to match.
- A carrier adapter from UAR's `agui.artifact` type `a2ui` and `agui.state.patch` surface ops into the PEM processor.
- `A2uiSurfaceBlock` (lazy chunk) and a shadcn catalog for `Text`, `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `Row`, `Column`, `Card`, `Divider`.
- Lands in: this repo (`src/`). Owner: km-frontend-engineer; km-security-officer reviews the action policy.
- Depends on: pem-a2ui-official-0-12-0, agui-render-registry.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `a2ui-surface-rendering`.
- Adds a lazy JS chunk; measured against the app budget.
- Ships in the web image (Train B).
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
