## Why

The read-only rule `reference-folders-read-only` names UAR, artifact-refiner and openfang. PEM is not named and is not registered as writable, so nothing records the operator's authority to change it (D-30).

## What Changes

- Add a `prometheus-entity-management` entry to `workspace.folders` in `.kbd-orchestrator/project.json` with `write_access: true`.
- Amend `.kbd-orchestrator/constraints.md` so the read-only rule is scoped to UAR, artifact-refiner and openfang, with a note that UAR changes are separate-worktree PRs and PEM is writable by operator direction.
- Lands in: this repo (`.kbd-orchestrator/`). Owner: driver.
- Depends on: NONE.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `kbd-workspace-registry`.
- Unblocks `pem-a2ui-official-0-12-0`.
- No production effect; the PR title carries `[skip ci]`.
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
