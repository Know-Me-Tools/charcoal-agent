# Execution: chat-export-and-block-copy

Dispatched 2026-10-14. Plan: `plan.md` (revision 2). Stage: execute, IN_PROGRESS. Dispatch is not completion; the stage stays open until every change is implemented, the final integration and review gates have run, and verify and archive have succeeded.

## Backend

OpenSpec changes (`openspec/changes/<id>/`, schema spec-driven) driven task by task through `kbd-apply`, with the builders on **Kimi K3 over ACP**.

## Operator direction (recorded verbatim)

"Use Kimi K3 for the implementation using Kimi Code CLI harness in the same way, using ACP, that we are doing with the work in Kubo in another session from the Kubo open source fork we have in the `/Users/gqadonis/Projects/references/*` directory and subdirectories where that project is found." (2026-10-14, with the `/kbd-execute chat-export-and-block-copy` command.)

Earlier standing instructions that still apply: skip the adversarial-review judge run in assess and plan (recorded); the operator merges PRs; deploys from `main` run without an approval stop since 2026-10-14, so review is the only gate before production; never touch the kill switch.

## Builder route (copied from Kubo, adapted)

- Reference implementation: `/Users/gqadonis/Projects/references/kubo/.kbd-orchestrator/phases/agent-backend-settings/driver/` (`kimi-acp.mjs`, `common.mjs`) and its `HANDOFF-KIMI.md`.
- This phase's driver: `.kbd-orchestrator/phases/chat-export-and-block-copy/driver/` (`kimi-acp.mjs`, `common.mjs`, `logs/`). Copied from Kubo on 2026-10-14 and changed in these ways: `ROOT` is this checkout (the KBD runtime, plan, openspec changes and role profiles live here and `kbd-apply` runs here) while Kimi works in a separate **git worktree** (`--cwd`); `~/.kimi-code/bin` is put on PATH (the `kimi` binary is not on the default PATH); the builder prompt is rewritten for this repo and reads read-only context copies (`.kbd-context/`) prepared by the driver; extra forbidden-command rules (recursive force delete, destructive git, publish, the kill switch and its variable, a file named `.env` or a key file); and a post-session check that no protected path changed (`.github/`, `versions.toml`, `AGENTS.md`, `CLAUDE.md`, `.kbd-orchestrator/`, `openspec/`, `k8s/`, `.claude/settings*`).
- Mechanics (from Kubo, unchanged): `kimi acp` on stdio, ACP v1; the session must report model `kimi-code/k3` and mode `default` (manual approvals) or the driver aborts; every permission request is checked against the forbidden list and a match is rejected before it runs; a hardened environment strips GitHub, cluster, Docker and SSH credentials; a turn ending with `QUESTION:` pauses the session until `<log>.answer-<n>.md` is written; exit codes 0 ok, 2 usage, 3 outward action or protected path changed, 4 remote ref moved, 5 Kimi failed or timed out, 6 kbd-apply failed, 7 acceptance not met, 8 question unanswered.
- Role profiles: `.kimi-code/agents/km-*.md` (already in this repo); the profile text opens the prompt because ACP has no agent-file option.
- Builders commit locally in their worktree and never push; the lead pushes and opens each PR. Builders get no `gh`, cluster, registry or SSH credentials.
- Reviewers and approvers are not Kimi (Kubo rule, and the KBD rule that the producer does not judge its own work): tasks 2.1, 2.5, 3.6, 3.7, 4.5 stay on Claude or with the operator, and 1.8 and the real-device checks are the operator's.

## Self-test (PR-K1, the Kubo gate), 2026-10-14

Run in a scratch git repository with `driver/kimi-acp.mjs --self-test`. Result, exit 0: session started on `kimi-code/k3` in mode `default`; a shell step ran (`echo acp-ok > step1.txt`); `git push origin HEAD` was **denied before it ran** (rules `git push` and `destructive git`); the session paused on `QUESTION: What word should go in step3.txt?`; I answered through `<log>.answer-1.md`; it continued the same session, wrote `step3.txt`, and reported "Acceptance result: Met". 85 thought chunks (counted, not logged). Log: `driver/logs/acp-self-test-20261014T120657Z.jsonl`.

**Not verified by the self-test:** `kbd-apply begin-task` and `end-task` driven by the driver (the self-test cannot combine with `--kbd`); the first real task (1.1) is that check. Kubo's own PR-K1 note says the same.

## Recalled lessons the dispatched work must respect (from `prior-context.md`)

- Boundary gates must build and launch the packaged artifact, not only run source-level tests (integration gates 1.7, 3.8, 4.8, 5.6).
- Front-load environment and authorization gates: the read-only checks 2.2 (UAR resume contract) and 5.1 (zip library comparison) run in Round 1; the operator books iPhone time for 1.8 before code lands.
- Preserve production evidence in new dated folders with a README (`evidence/2026-10-14/...`), never overwrite earlier ones.
- Put the pinned runtime first on PATH before gates: Node 24.21.0; Node 26 breaks vitest.
- The operator owns all PR merges and expects the full KBD status at the end of every turn.
- Project lessons from the predecessor: a visual or security assertion is not evidence until a mutation check shows it fails on the bug; look at screenshots, not only assertions; a worktree needs a real cloned `node_modules`.

## Task model assignments

See `plan.md` revision 2, "Task model assignments", keyed by phase path `chat-export-and-block-copy`, change ID and task ID. The Kimi K3 rows were rechecked at dispatch: CLI 2.1.1 at `~/.kimi-code/bin/kimi`; `default_model = "kimi-code/k3"` in `~/.kimi-code/config.toml` (credential values not read); the ACP session confirmed the model and mode. Effort is whatever the Kimi config sets; it was not changed.

## Dispatch order and worktrees

| Round | Change | Worktree and branch | Roles |
|---|---|---|---|
| 1 | `app-mobile-stream-reliability-and-heat` | `.claude/worktrees/c1-stream`, `feat/mobile-stream-reliability` | km-frontend-engineer, km-qa-engineer |
| 1 | read-only checks 2.2 and 5.1 | read only | km-rust-engineer |
| 2 | `site-stream-resume` (gated by 2.1), `app-block-copy-and-media-blocks` | created at dispatch | km-rust-engineer, km-frontend-engineer, km-security-officer |
| 3 | `app-chat-export-okf-single` | created at dispatch | km-frontend-engineer, km-qa-engineer |
| 4 | `app-chat-export-okf-bundle` | created at dispatch | km-frontend-engineer, km-qa-engineer |

Within a change, tasks run one at a time, each its own Kimi session, started with `--kbd` so `kbd-apply begin-task` and `end-task` bracket it.

## Operator-only actions (collected, asked once per round)

Push, merge, tag, deploy, any cluster or secret action, approval of visitor wording (3.6, 4.5), the real-iPhone runs (1.8, 4.8, 5.6), and the decision that gates `site-stream-resume` after 1.1 and 1.8 evidence exist.

## Risks at dispatch

- Kimi K3's suitability for this repo is unmeasured (`.prometheus/model-fleet.md`: Measured no); the first sessions are the evidence. A task whose acceptance is reported not met stays open; nothing is reverted automatically.
- The Kubo session runs against the same Kimi account at the same time; parallel sessions may be slower or rate-limited.
- Merge deploys to production with no approval stop: no builder output is pushed before the review tasks the plan names.
- Builders read the plan and spec from read-only copies in a git-excluded `.kbd-context/` folder inside their worktree (the driver prepares it); they get no directory grant on the main checkout. The post-session protected-path check covers the worktree diff, and I check `git status` in the main checkout after each session for stray changes.

## Update 2026-10-14 (Kimi quota, decision D-K)

Kimi K3 reached its account 5-hour usage limit during task 3.2 (exit 5, no reset time given). The operator chose to fall back to Claude builders for the remaining builder tasks of change 3. Tasks done on Kimi K3 so far: 1.1 to 1.7 and 1.9 to 1.11 (change 1, merged as PR #103 and deployed) and 3.1 (committed, change 3). Native Claude `km-*` subagents run 3.2 onward in worktree `.claude/worktrees/c3-blocks`; the lead brackets each task with `kbd-apply begin-task` and `end-task` and checks the diff and both checkouts' `git status` afterwards.
