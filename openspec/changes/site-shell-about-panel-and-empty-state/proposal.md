## Why

Part of the phase `site-chat-hardening-and-polish` (change 6 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- infra status hidden on site, About/Sources panel, empty state. Depends: 01. Agents: km-frontend-engineer, km-creative-director, km-chief-content-officer, km-qa-engineer. M. HIGH.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: captures at four widths and both themes looked at; keyboard and reduced-motion checks recorded; new e2e specs fail on the mutated build.
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
