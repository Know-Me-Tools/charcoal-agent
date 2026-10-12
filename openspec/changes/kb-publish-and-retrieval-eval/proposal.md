## Why

Part of the phase `site-chat-hardening-and-polish` (change 14 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- build, validate and evaluate the full expanded KB; publish. Depends: 02, 09, 10, 11 (or its documented exclusion), 12 (or its documented exclusion), 13. Agents: km-qa-engineer, km-devops-engineer. M. HIGH.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: recall@5 of at least 90% overall and 100% on flagship, FR-8 and corrected-facts questions; live validator 0 problems; 15 sample answers read.
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
