# Reflection: site-chat-follow-ups (2026-10-19)

## Delta (plan vs delivery)

1. **`main` went red and two of the three changes shipped one PR late.** The plan and the gates for the two client changes used narrow test directories. PR #129's new test file used an alias (`CharcoalDbType`) that the repo-wide product-naming guard (`src/test/brand-naming.test.ts`) rejects. CI Verify failed on `584f7bd` (1 failed, 1224 passed); build, deploy and smoke were skipped. Production ran the server-only build from #127 until PR #130 (`570b3f9`) fixed the alias and deployed. I had written "full suite not run" in the PR and opened it anyway. Evidence: Deploy site run 39266829322 (failure), run 39268527593 (success).
2. **Change 3's cause was misread first.** Task 1.2 concluded the CSP failure was one stale constant and I edited one test. The first task 1.5 gate showed three tests fail for one reason: the harness is documented to run against `KNOWME_WEB_DIST_DIR=tests/fixtures/web`, and the earlier "failure on a clean main" was a run without it. The edit was reverted (decision D-006). The plan's either-or ("stale test or real header drift") had a third answer, an environment mistake. The live header was read and is strict; the stop condition never triggered.
3. **The clippy count was wrong.** The plan said three errors. `--all-targets` found a fourth in `tests/common/mod.rs` only after the first three were fixed, because clippy stops at the library.
4. **The operator did not answer the four plan-time questions.** I took defaults (token ceiling unchanged, build both notices, housekeeping in scope) and recorded them as D-001 to D-003. The operator merged both string PRs, which is the approval for those. The token ceiling was never confirmed; it stays the lead's default.
5. **Two changes were built by subagents and their task boundaries were recorded after the fact**, and PR #129 was first opened without its OpenSpec folder (the builder worked from the main checkout). Fixed on the PR before merge.
6. **No cumulative adversarial review.** Skipped on the operator's standing instruction; recorded as `pending_review`. This does not satisfy the Execute completion checklist and there is no waiver. No independent critic has read the phase diff.
7. **Goal 1 closed on a one-line report.** "I validated all these operations on mobile iOS and android": no per-check detail, device models, browsers or zip Prepare time. Only one Android file was seen.
8. **Found, not fixed:** CI never runs clippy or the tests for `server/` (`site.yml` tests only `websearch/`; the Dockerfile builds the binary only). That is why the lints and the harness mistake stayed red unnoticed. Outside the three goals; decision D-007.

## Root Cause

1. `main` red (item 1): I treated "the narrow checks for my change pass" as enough to open a PR, when CI runs the whole suite, including guard tests that scan every file. The narrow-gate rule in AGENTS.md is about completion evidence for a change, not a substitute for the checks the merge will run.
2. CSP misread (item 2): I judged a test failure from one run in one environment, and read "fixture hash" in a constant as the whole story. The comment stating the required variable is in the header of `tests/common/mod.rs`, a file I had not opened when I decided the cause; I read it only after the first gate run failed.
3. Clippy miscount (item 3): the earlier count was taken from the lib target only.
4. Unanswered questions (item 4): the questions were asked once, at assess, and not repeated in a form that needed an answer at plan time.
5. Late ledger and missing folder (item 5): the dispatch prompts said "work only in this worktree" while the OpenSpec change folder existed only untracked in the main checkout.

## Recalled lessons

- "Run the narrow type check on a new test before merge" (previous phase): applied; `tsc` ran on both client changes. It did not cover the repo-wide guard, which is a new failure of the same kind (a check the merge runs that the author did not).
- "Run `kbd-apply reconcile` before stating a task is closed": applied each time; reconcile was clean at every report.
- "Put device checks early, or decide at plan time that they are waivable": applied; goal 1 ran first and was closed on report.
- "Require spec deltas before accepting /kbd-plan OpenSpec changes": applied; `verify` and `archive` succeeded for all three.
- Recurrence: the tier guard blocked an inline command that contained the word for a build mode inside decision text; fixed by using the edit tool. Known gotcha, hit again.

## Corrective actions

1. Before opening a PR that adds or renames a test file, run the CI Verify sequence from `.github/workflows/site.yml` (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build). Put that sequence in the dispatch prompt for client builders.
2. When a test fails on `main` and an earlier note says "fails on a clean main", read the harness header and the CI file for how it is meant to run before deciding the cause.
3. Run `cargo clippy --all-targets` first when counting lint errors.
4. Copy the OpenSpec change folder into a builder's worktree before dispatch, or say in the prompt that it lives in the main checkout and must be committed with the work.
5. Ask the operator for a decision a second time, in the plan handoff, when the first ask went unanswered and the default is a spend limit.

## Goal achievement

| Goal | Result |
|---|---|
| Run the four waived device checks (real iPhone and Android) and record results | MET on the operator's report (iPhone and Android, 5 of 5). Thin: summary statement, one Android file read by the agent. WebKit and Firefox desktop and zip Prepare time on a phone remain unrecorded. |
| Fix export items that can lose or hide data (wipe on bundle-size error; cards dropped with no note) | MET for what was planned. The export omission line (#128) and the reset notice (#129) are live, confirmed in the served bundle on 2026-10-19. Not covered: the new strings on a real device, WebKit and Firefox, the remote-image case on the built bundle, a 44 px close control (about 14 px at 320 px), one unexplained e2e flake in 5 full runs. The wipe recovery itself is unchanged by design. |
| Decide the monthly token ceiling and housekeeping | PARTIAL. Ceiling unchanged at 20,000,000 (daily 2,000,000) as a lead default; the operator never answered. Housekeeping: four clippy errors fixed and the server tests now fail once with a clear message when run without the fixture dir (#127). Stale-worktree removal (72 candidates) and the probe-edit discard are scripts and commands handed to the operator; whether they were run is not recorded. The CI gap for `server/` is open. |

## Artifact quality summary

No artifact-refiner logs exist for this phase (`.refiner/artifacts/` absent). Quality evidence is the per-change mutation checks and gates:

| Check | Result |
|---|---|
| Change 1 mutation, detection disabled | 10 of 14 new tests failed; 14 of 14 after restore |
| Change 1 mutation, leak injected | 8 of 14 failed; 14 of 14 after restore |
| Change 2 mutation, unit | 2 of 4 failed; 4 of 4 after restore |
| Change 2 mutation, e2e | `desktop-dark` failed (expected 1, received 0); passed after restore |
| Change 3 negative control | loosened `object-src` failed the header test; 12 of 12 after restore |
| Change 3 guard control | 12 of 12 fail with the explanatory message when run without the fixture dir |
| CI Verify equivalent for #130, run locally before the PR | pins, manifests, tsc, lint (0 errors), full unit suite 1225 passed, build: all exit 0 |

Cumulative adversarial review was not run (item 6). That is a gap, stated here.

## Technical debt introduced or left

- CI does not run clippy or tests for `server/` (D-007). The next lint error will be invisible again.
- The reset notice's close control is about 14 px at 320 px wide (shared Toaster button, not styled to the tokens). One of five full e2e runs of `db-reset-notice.spec.ts` failed once, cause unknown.
- `tsc -p e2e/tsconfig.json` has one error on `main` (`chat-export-bundle-load.spec.ts`, TS2307), found by both builders; not fixed.
- Remote-image export is covered on the dev server only, not on the built bundle.
- The smaller export review items are still open: `console.warn` on every tab switch, `aria-describedby` for disabled export reasons, `)` escaping in image URLs, same-origin media L4. Also open: the export `description` taking an abandoned first message; the reply-speed progress cue.
- The execute gate looks for its readiness checker inside the project; the payload keeps it in the plugin cache. A local symlink `shared/scripts`, excluded from git, works around it (recorded in `execution.md`).
- Operator actions pending and unconfirmed: `evidence/2026-10-19/remove-stale-worktrees.sh` (72 removals), discarding the probe edits in the `stall` worktree (`probe-idle-mode.patch` saved).
- The main checkout is on `fix/site-copy-officer-edits`, behind `main`, with local modifications and a stray `node_modules/fflate`.
- pk memory writes are queued with `pk exited 1`. pk has pending promotion candidates that were not reviewed (they need the operator's decision).
- One builder used bare `git stash` / `git stash pop` once on a shared stack; it popped cleanly.

## Lessons captured

- A change that adds a test file can break a repo-wide guard test; narrow test directories cannot find it. Run the CI Verify sequence before opening the PR.
- The `server/` crate's tests are written against `KNOWME_WEB_DIST_DIR=tests/fixtures/web`; without it they embed the real bundle and three tests fail for that one reason. The harness now says so once.
- `cargo clippy` stops at the first failing target; use `--all-targets` and expect more errors after the first batch.
- PGlite's "bundle size" error is a size mismatch of the fetched `pglite.data` asset, not a corrupt IndexedDB; in production it means a stale cached asset after a deploy. The e2e reaches the reset path by serving a wrong-size file once.
- A change authored as untracked files in the main checkout does not exist in a builder's worktree; commit or copy it first.
- The product-naming guard allows only the exact identifier `CharcoalDb`; aliases built on it fail.

## Codify as Skill?

No.

## Recommended Next Phase

Seed: **site-ci-gates-and-chat-polish**. Candidates, in the order I would take them:
1. A CI step that runs clippy (`--all-targets`, warnings denied) and the `server/` tests with `KNOWME_WEB_DIST_DIR` set, pinned to Rust 1.98.1. Needs the operator's yes: it changes `.github/workflows/site.yml`.
2. The reset notice's close control: restyle to tokens and a 44 px target, and find the cause of the e2e flake.
3. A real-phone look at the two new strings, WebKit and Firefox runs of the two new e2e specs, and the remote-image export case on the built bundle.
4. The smaller export review items, in the order above.
5. The monthly token ceiling (needs an answer) and the reply-speed progress cue.
6. Operator housekeeping: run or reject the worktree script; review the pk promotion candidates.
