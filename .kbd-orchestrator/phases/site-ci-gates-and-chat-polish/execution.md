# Execution: site-ci-gates-and-chat-polish

Date: 2026-10-19. Plan: `plan.md` (revision 1). Contract: `adopted-contract.json`, digest `e94e5cb8…1181`, readiness check READY at dispatch. Backend: `openspec` (hybrid with `kbd-apply` for task boundaries). Base: `origin/main` at `38285ac`.

## Dispatch contract

| Change | Worktree | Branch | Route | Round |
|---|---|---|---|---|
| ci-pr-checks | `.claude/worktrees/ci-pr` | `feat/ci-pr-checks` | tasks 1.1 to 1.3: native km-devops-engineer subagent, Sonnet 5.5; tasks 1.4 and 1.5 (open the PR, watch its run, throwaway proof PR): the driver | 1 |
| app-reset-notice-polish | `.claude/worktrees/reset-polish` | `feat/reset-notice-polish` | tasks 1.1 to 1.5: native km-frontend-engineer subagent, Sonnet 5.5; task 1.6 (open the PR): the driver | 1 |
| ci-server-gate-on-deploy | cut after `ci-pr-checks` is merged | | km-devops-engineer, Sonnet 5.5; PR by the driver | 2 |
| qa-browser-matrix | cut after `app-reset-notice-polish` is merged | | km-qa-engineer, Sonnet 5.5; phone sheet and PR by the driver | 2 |

Route per task is the row in `plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID and task ID. No route is unresolved and none was changed from the plan.

The driver owns `kbd-apply begin-task` and `end-task`. Subagents implement tasks and report per task; the driver records the task boundaries from their reports (not live), as in the previous phase. The OpenSpec change folder is copied into each builder's worktree by the driver before dispatch, and the builder commits it with the work.

## Readiness gate

`kbd_stage_gate execute` passed and `bash shared/scripts/kbd-phase-readiness-check.sh --phase site-ci-gates-and-chat-polish` printed READY. The checker is reached through the local `shared/scripts` symlink to the plugin's own copy, excluded from git (set up last phase; the root cause, that the gate looks inside the project, is a tooling defect outside this repository).

## Recalled lessons the dispatched work must respect

- Before a pull request that adds or edits a test file, or a workflow, is opened, run the CI Verify sequence from `.github/workflows/site.yml` (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build). For workflow files add `actionlint` and `yamllint`. A narrow test directory cannot find a repo-wide guard test (last phase's red `main`).
- A mutation check must show an assertion fails on the bug before it counts as evidence.
- Boundary gates run against the built app, not the dev server. Node 24.21.0 first on `PATH`; `cargo +1.98.1` for Rust. Port 4174 is occupied on this machine: use `E2E_PORT` with another port.
- The server tests are written against `KNOWME_WEB_DIST_DIR=tests/fixtures/web`; without it three tests fail for that one reason (the harness now says so).
- Single-writer cargo discipline: one cargo invocation at a time in the one shared target directory. Only the ci-pr-checks builder runs cargo in Round 1.
- `tier-guard` blocks inline commands that contain test-runner or build-mode text: use script files by path.
- Constraints: never touch the kill switch; never read credential values; PRs are opened ready and the operator merges; no secrets in any pull-request workflow; every `uses:` a full 40-hex SHA.

## Revisions 2 and 3: three changes added at execute time (7 changes, 37 tasks)

The dispatch above covered four changes and 23 tasks. Three more were added after the operator found problems in use, each by a plan revision and a re-adoption of the contract (digest `cc53bbc8…4ac`, readiness READY):

| Change | Why it was added | Tasks | PR |
|---|---|---|---|
| app-first-send-thread-order | The first send could write a message before its thread row (diagnosis in `evidence/2026-10-19/first-send-order-diagnosis.md`). Operator: "Yes. Fix it." | 5 | #137 |
| app-home-resume-chat | Operator asked for a front-page button to the latest saved conversation when history exists. New visitor-facing string, approved by operator merge and recorded in `docs/content/reviews/`. | 6 | #138 |
| app-persist-loss | Reading stored threads reverted a saved conversation to a draft (`initFromDb` overwrote a registered thread). My first hypothesis, a reload race, was wrong; the real cause is in the PR. | 3 | #139 |

All three were built by the driver in their own worktrees off `origin/main`. Their `Verify pull request` and deploy runs are green (see `evidence/2026-10-19/boundary-packet.md`); I did not re-read the per-PR local gate output when writing this section.

## Waivers and open items at the execute boundary

- Real-phone look: waived by the operator "for now" (`evidence/2026-10-19/real-phone-sheet.md`).
- Independent review: skipped on the operator's standing instruction; recorded `pending_review`, not a pass. No independent critic has read the persistence code in `use-chat-runtime.ts` or `thread-registry-store.ts`.
- WebKit and Firefox: the reset-notice and export-omission specs were run once in each engine (`qa-browser-matrix`), not repeated. CLS was not measured in those engines.
- Branch protection for `Verify pull request`: not changed; the operator's setting. Without it the check is visible but advisory.

## Final gates (once, after all seven changes are implemented)

One integration gate per change as written in each `tasks.md`; then the contract's boundary packet after the operator merges; adversarial review skipped on the operator's standing instruction and recorded as `pending_review`, not as a pass. `kbd-apply verify` and `archive` per change after its merge.
