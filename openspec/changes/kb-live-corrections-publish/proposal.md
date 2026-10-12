## Why

Part of the phase `site-chat-hardening-and-polish` (change 13 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- publish the corrected existing KB files (tasks 9.1 to 9.3 only) through the content workflow. Depends: 02, 9.1 to 9.3. Agents: km-qa-engineer, km-devops-engineer. S. HIGH (fixes wrong answers visitors get today).
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: indexed in the seed log; the corrected questions answered correctly on the live site; FR-8 passed.
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
