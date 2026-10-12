## Why

Nothing should be built before a component the nine cannot express is shown to be needed. The spike makes the need, or its absence, a recorded finding.

## What Changes

- A gap table: agent-authored surfaces (the public template and any other recorded need) against the nine components and the v0.9.1 basic catalog.
- If a gap exists, a UAR PR adding only the needed non-URL components with tests; URL-bearing components (Image, Video, `openUrl`) only behind a recorded URL policy.
- Lands in: UAR repo (separate worktree and PR, per the project constraint). Owner: km-rust-engineer; operator merges the UAR PR.
- Depends on: site-agent-a2ui-policy.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `uar-a2ui-validator`.
- Touches the UAR repo only through a separate worktree and PR.
- May close with no code change.
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
