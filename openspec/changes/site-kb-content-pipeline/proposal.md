## Why

Part of the phase `site-chat-hardening-and-polish` (change 2 of 15). The reasons, the operator's decisions and the trade-offs are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` and `assessment.md`; this change is the vertical slice named below.

## What Changes

- OKF bundle skeleton, OKF to flat-KB build, validator, content workflow with `sync` and `dry_run` inputs and the `production` environment, eval harness, committed live validator. Depends: NONE. Agents: km-devops-engineer, km-qa-engineer, km-security-officer. L. HIGH.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` (round order and the Task model assignments for this change).

## Impact

- Exit evidence: a dry run on a branch checkout passes; building a tree with no OKF sources leaves `content/knowledge/` byte-identical; the validator rejects a planted fake secret, a planted banned assertion and a missing FR-8 file (mutation checks).
- Deploy: production image changes ship only in the operator-approved Train C; content and agent/template changes use the `site-content.yml` workflow after the operator merges the PR and dispatches it. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); no CopilotKit; pin official A2UI exactly.
- Decisions: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md`.
