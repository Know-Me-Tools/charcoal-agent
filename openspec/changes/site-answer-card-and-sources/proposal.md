## Why

Part of the phase `site-chat-hardening-and-polish` (change 5 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- duplication fix, Sources block, snippet and display-name cleanup, W3 caption. Depends: 01; 5.1 depends on 02.4 (agent sync path) and is published only in the Train C window. Agents: km-conversational-designer, km-frontend-engineer, km-chief-content-officer, km-qa-engineer. L. HIGH.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: caption test fails when a model caption fills the slot; 20-prompt local measurement recorded; captures looked at.
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
