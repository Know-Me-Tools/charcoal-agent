## Why

Part of the phase `site-chat-hardening-and-polish` (change 7 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- privacy gate, pool, generator, ranker, chips. Depends: 06, and 14.1 to 14.2 (the local build and eval of the expanded KB, not its publication). Agents: km-conversational-designer, km-frontend-engineer, km-security-officer, km-devops-engineer. L. MEDIUM.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: signed-off privacy decision; every pool prompt retrieves its expected document in the eval; chips work by keyboard at 320 px.
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
