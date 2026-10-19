# Execution: site-chat-follow-ups

Date: 2026-10-19. Plan: `plan.md` (revision 1). Contract: `adopted-contract.json`, digest `4091114d…2c14`, readiness check READY at dispatch. Backend: `openspec` (hybrid with `kbd-apply` for task boundaries).

## Dispatch contract

| Change | Worktree | Branch | Route | Order |
|---|---|---|---|---|
| site-server-gates-green | `.claude/worktrees/c3-gates` | `fix/server-gates-green` | driver (this session), native Sonnet 5.5; km-security-officer read-only if the live CSP is weaker than intended | first |
| app-export-omission-note | `.claude/worktrees/c1-omission` | `feat/export-omission-note` | native km-frontend-engineer subagent, Sonnet 5.5; km-chief-content-officer read-only pre-review of the string | parallel |
| app-db-reset-notice | `.claude/worktrees/c2-reset` | `feat/db-reset-notice` | native km-frontend-engineer subagent, Sonnet 5.5; km-chief-content-officer read-only pre-review of the string | parallel |

All worktrees are cut from `origin/main` at `7eb995d`. Route per task is the row in `plan.md` under Task model assignments, keyed by phase path `site-chat-follow-ups`, change ID and task ID. No route is unresolved. No route was changed from the plan.

The driver owns `kbd-apply begin-task` and `end-task`. Subagents implement a whole change and report per task; the driver records the task boundaries from their reports. This differs from one-task-at-a-time dispatch and is recorded here as a deviation: the task boundaries in the ledger are written after the fact for the subagent changes, not live.

## Readiness gate

- `kbd_stage_gate execute` first failed: "readiness checker missing at <repo>/shared/scripts/kbd-phase-readiness-check.sh (broken install or payload drift)". The gate resolves the checker inside the project; the installed payload keeps it in the plugin cache.
- Remediation applied: a local symlink `shared/scripts` to the plugin's own `shared/scripts` (1.13.0), excluded from git through `.git/info/exclude`. The real checker runs; nothing was faked or skipped. The gate then passed and `bash shared/scripts/kbd-phase-readiness-check.sh --phase site-chat-follow-ups` printed READY.
- The root cause (the gate looks in the project, the payload lives in the plugin cache) is a tooling defect outside this repository. It is listed under debt for the reflection.

## Recalled lessons the dispatched work must respect

- Spec deltas exist for all three changes, so `verify` and `archive` are reachable.
- A security or privacy assertion is not evidence until a mutation check shows it fails on the bug (tasks 1.3 of change 1 and 1.4 of change 2).
- Run `tsc --noEmit` on any new test file before merge; a vitest pass does not check types.
- A worktree needs a real `node_modules` (not a symlink) for Playwright; Node 24.21.0 first on PATH (Node 26 breaks vitest).
- A merged client or server change deploys `knowme-web` with no approval stop: nothing merges except by the operator.
- Run `kbd-apply reconcile` before stating a task is closed.
- Standing constraints: never touch the kill switch or `SITE_CHAT_KILL_SWITCH_EXPECTED`; never read credential values; open PRs ready, never draft; new visitor strings are approved by the operator's merge and recorded in a review file; `tier-guard.sh` blocks inline commands that contain test-runner or release text, so use script files by path.

## Final gates (once, after all three changes are implemented)

One production-path integration gate per change as written in `tasks.md` (task 1.4 of change 1, 1.5 of change 2, 1.5 of change 3), then one cumulative review of the phase diff. The adversarial review is skipped on the operator's standing instruction and recorded as `pending_review`, not as a pass. Then `kbd-apply verify` and `kbd-apply archive` per change, then the contract's boundary packet after the operator merges.

## Outcome (2026-10-19)

| Change | PR | Merge commit | Merged by |
|---|---|---|---|
| site-server-gates-green | #127 | `4dff5e8` | GQAdonis |
| app-export-omission-note | #128 | `3b8c32d` | GQAdonis |
| app-db-reset-notice | #129 | `584f7bd` | GQAdonis |
| (fix found by CI) | #130 | `570b3f9` | GQAdonis |

Implementation is 3 of 3 changes and 18 of 18 tasks in the ledger; `kbd-apply reconcile` was clean after each batch and in the boundary packet. `kbd-apply verify` passed for all three changes, and all three were archived in the close-out worktree (`openspec/changes/archive/2026-10-19-*`) with their spec deltas merged into `openspec/specs/{chat-export,chat-persistence,site-server-quality}`.

## Deviations from the plan, as they happened

1. **Ledger boundaries for the two subagent-built changes were recorded after the work, not live** (stated at dispatch). Task 1.2 and 1.3 of the two string changes were closed after the content officer's pre-review and the builders' re-run.
2. **Change 3's cause was misread first.** Task 1.2 first concluded the CSP failure was one stale constant and fixed one test. The first gate run showed three tests fail for one reason (the harness is documented to run against `KNOWME_WEB_DIST_DIR=tests/fixtures/web`). The edit was reverted and replaced (decision D-006). One repair attempt of three was used.
3. **A merge turned `main` red.** PR #129's new test file used an alias `CharcoalDbType` that the product-naming guard (`src/test/brand-naming.test.ts`) rejects. CI Verify failed on `584f7bd`; build, deploy and smoke were skipped, so #128 and #129 did not ship until PR #130 fixed the alias. Production ran the #127 build (server-only) in between. Cause: the change was gated with narrow test directories, not the full unit suite, and the PR said so. The full suite, lint, pins, manifests and build were run for #130 and passed (119 files, 1225 tests passed).
4. **PR #129 was first opened without its OpenSpec change folder** (the builder had worked from the main checkout). Added in a follow-up commit on the same PR before merge.

## Final gates, as run

- Integration gate per change: change 1 task 1.4 (built bundle, Chromium: 18 passed, 2 skipped; dev server: 3 passed); change 2 task 1.5 (built app, Chromium: 3 passed twice, one unexplained flake in a fifth full run); change 3 task 1.5 (fmt, clippy `-D warnings`, full server suite 188 tests, negative control and guard control).
- Contract boundary packet: `evidence/2026-10-19/boundary-packet.md` (live CSP unchanged and strict, deployed digest from the PR #130 deploy, served bundle contains the new strings, reconcile clean).
- **Cumulative adversarial review: not run**, on the operator's standing instruction; recorded as `pending_review`. No independent critic has read the phase diff. This does not satisfy the Execute completion checklist's second condition and no signed waiver exists.
- Not covered anywhere: WebKit, Firefox, real devices for the two new strings, the remote-image export case on the built bundle, a 44 px close control for the reset notice.
