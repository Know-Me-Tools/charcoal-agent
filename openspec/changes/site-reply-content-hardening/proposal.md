## Why

Part of the phase `site-chat-hardening-and-polish` (change 3 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- sanitizer image/link policy, isolating CSP in previews, Mermaid strict, CSP code, browser proof under the enforcing header. Depends: NONE. Agents: km-security-officer, km-frontend-engineer, km-rust-engineer, km-qa-engineer. L. HIGH.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: failing-then-passing tests with mutation checks; the 3.5 browser-proof table recorded; security review passed; server tests green with `KNOWME_WEB_DIST_DIR=tests/fixtures/web`.
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
