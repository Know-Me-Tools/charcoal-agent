# Plan: site-ci-gates-and-chat-polish

Date: 2026-10-19. Phase goals: `goals.md`. Assessment: `assessment.md` (assess stage complete). Decisions: `decision-log.md`.

OpenSpec available: YES (managed CLI). Changes to implement: 4. Tasks: 23 (5 + 4 + 6 + 8). Plan revision: 1. The PR workflow is named `Verify pull request` (the boundary packet looks it up by that name).

## Operator answers applied at plan time

The assessment asked five questions and the operator did not answer them. The standing instruction is to decide what can be decided. Each default is reversible and recorded in `decision-log.md`.

| Question | Default taken | Why it is safe |
|---|---|---|
| CI on pull requests | Build it, as its own workflow (`pr-verify.yml`) plus one shared reusable workflow for the server checks | It is the cause of the red `main` last phase. The deploy workflow is untouched by this change. A PR can be closed unmerged. |
| Branch protection (required checks) | No change | A repository setting; the operator's. Without it the new checks are visible but advisory. |
| Remote-image built-bundle sub-goal | Replace it with a producer search (task 1.5 of `qa-browser-matrix`); descope the coverage if nothing produces image blocks | The assessment found no producer by grep. Building a test for a path nothing reaches would be coverage without a user. |
| Install WebKit and Firefox | Yes, at execute, stated in the PR | A download of browser binaries into the Playwright cache; nothing leaves the machine. |
| Real-phone look | A short sheet, waivable | It needs the operator's phone. Last phase's lesson: decide at plan time that device checks are waivable and say so. |
| Monthly token ceiling | Not in this phase; unchanged at the default | Unanswered twice. It is not a goal of this phase. |

## Adversarial review

Skipped on the operator's standing instruction. No independent critic has read this plan; the ordering, scope and defaults are one author's reading.

## Recalled lessons that change ordering, scope or risk

- "Require OpenSpec spec deltas at plan time": all four changes carry a delta spec (`site-ci` twice, `chat-persistence`, `site-e2e-coverage`), so `verify` and `archive` are reachable.
- Previous reflection, corrective action 1: before opening any PR that adds or edits a test file, run the CI Verify sequence (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build). This is written into tasks 1.5 of `app-reset-notice-polish` and 1.8 of `qa-browser-matrix`, and into every dispatch prompt. For workflow PRs the equivalent is `actionlint`, `yamllint`, `check-pins.sh`, `check-manifests.sh` (tasks 1.3 of both CI changes).
- Previous reflection, corrective action 4: copy the OpenSpec change folder into a builder's worktree, or commit it with the work. The dispatch prompts say so.
- "A visual or security assertion is not evidence until a mutation check shows it fails on the bug": applied to the close-control measurement (3.4), the CI guard (2.2), the per-engine string checks (4.4) and the negative-control PR (1.5).
- "Boundary gates must launch the packaged artifact": the e2e gates run against the built app, not the dev server.
- "Put pinned runtime first on PATH": Node 24.21.0 and `cargo +1.98.1` in every gate.
- "Discover test environment state instead of encoding checkout assumptions": the server job sets `KNOWME_WEB_DIST_DIR` explicitly and reads the Rust version from `versions.toml`, not from a copy in the workflow.

## What is not planned, and why

- Making the checks required (branch protection): the operator's setting.
- Running Playwright in CI: a larger change (browsers on the runner, run time, flakiness budget). The matrix here is local.
- A Cargo or npm cache action: it would add an action to pin; revisit if the server job's cold run time is a problem.
- `cargo fmt --check` in the server job: not asked; the crate is currently format-clean, so adding it is cheap later.
- The smaller export review items, the reply-speed progress cue, the monthly token ceiling.
- Real-device coverage beyond the operator's sheet.

## CHANGE LIST (ordered)

1. ci-pr-checks: every pull request runs the web checks and the server lint and tests, with a read-only token and no deploy.
   - Scope: CI (new `server-verify.yml` reusable workflow, new `pr-verify.yml`)
   - Depends on: NONE
   - Recommended agent: km-devops-engineer (native, Sonnet 5.5)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH (it is the missing gate that let `main` go red)
   - Details: one shared reusable workflow for the server job (Rust version read from `versions.toml`, clippy `-D warnings`, tests, fixture web dir), one PR workflow that repeats the web Verify steps and calls it. The PR carrying it is its own live test; a throwaway stacked PR with a deliberate clippy error is the negative control.

2. ci-server-gate-on-deploy: the deploy workflow runs the same server job and the image build waits for it; a small guard keeps it that way.
   - Scope: CI (`site.yml`, new `scripts/check-ci-gates.sh`)
   - Depends on: ci-pr-checks
   - Recommended agent: km-devops-engineer (native, Sonnet 5.5)
   - Est. complexity: S
   - Complexity score: Medium (it edits the deploy path)
   - Model class: medium
   - Customer value: HIGH
   - Details: a `server` job calling the reusable workflow, `image.needs: [verify, server]`, and a guard script run in both workflows' Verify steps. The wiring is first exercised by the push after the merge, so it should merge when the operator can watch the run.

3. app-reset-notice-polish: a 44 px close control for the reset notice, and the flake explained or recorded.
   - Scope: ui + e2e (`sonner.tsx`, `e2e/db-reset-notice.spec.ts`)
   - Depends on: NONE
   - Recommended agent: km-frontend-engineer (native, Sonnet 5.5)
   - Est. complexity: M
   - Complexity score: Medium (the flake investigation is open-ended)
   - Model class: medium
   - Customer value: MEDIUM (a persistent notice that is hard to dismiss on a phone)
   - Details: size and place the `closeButton` in the unstyled Toaster in tokens; measure it in the e2e at 320 and 1440; reproduce the flake with repeat runs and kept traces and fix a found cause or record "not reproducible in N runs".

4. qa-browser-matrix: the two new specs run in desktop WebKit and Firefox, plus the loose ends around them.
   - Scope: e2e config and specs, notes
   - Depends on: app-reset-notice-polish
   - Recommended agent: km-qa-engineer (native, Sonnet 5.5)
   - Est. complexity: M
   - Complexity score: Medium (engine differences can surface real defects)
   - Model class: medium
   - Customer value: MEDIUM
   - Details: install the browsers, add two Playwright projects, run and classify, mutation-check per engine, settle the image-block question by search, fix the existing e2e type error, write the operator's phone sheet, run the CI Verify sequence, open the PR.

## EXECUTION ROUND ORDER

Round 1 (parallel, separate worktrees): ci-pr-checks, app-reset-notice-polish.
Round 2 (parallel, after the Round 1 PRs are merged by the operator): ci-server-gate-on-deploy, qa-browser-matrix.
Phase-boundary gate: archive each change after its merge; the contract's boundary packet after the last merge.

Operator merge order: `ci-pr-checks`, then `app-reset-notice-polish`, then `ci-server-gate-on-deploy` (when the operator can watch the run), then `qa-browser-matrix`.

## TASK MODEL ASSIGNMENTS

All routes are native Claude Code subagents on Claude Sonnet 5.5; reasoning effort is the harness default (no setting recorded). Evidence is task profile only, no repository benchmark, dated 2026-10-19. No external worker or liter-llm route is used, so there are no unresolved prerequisites. The native alternative is the same route.

Route legend: DEVOPS = km-devops-engineer; FE = km-frontend-engineer; QA = km-qa-engineer; SELF = the driver session (PRs, throwaway proof PR, operator hand-off).

| Phase path | Change ID | Backend task ID | Requirements | Provider/model | Reasoning effort | Rationale and dated evidence | Harness and route | Worker launch and handoff | Native alternative | Availability and verification | Prerequisites |
|---|---|---|---|---|---|---|---|---|---|---|---|
| site-ci-gates-and-chat-polish | ci-pr-checks | 1.1 | one reusable workflow; read `versions.toml`; no new action | Claude Sonnet 5.5 | harness default | small YAML plus shell; mirrors the existing websearch Rust step; task profile only | Claude Code, native | DEVOPS; scope `.github/workflows/`; worktree off `origin/main`; result: diff | same | native, configured | none |
| site-ci-gates-and-chat-polish | ci-pr-checks | 1.2 | PR workflow; permissions and concurrency care | Claude Sonnet 5.5 | harness default | security-relevant defaults (read-only token, no secrets); a km-security-officer read is optional | Claude Code, native | DEVOPS; same scope; result: diff | same | native, configured | none |
| site-ci-gates-and-chat-polish | ci-pr-checks | 1.3 | actionlint, yamllint, pins, manifests, run the server commands by hand | Claude Sonnet 5.5 | harness default | the gate commands are already installed locally | Claude Code, native | DEVOPS; one cargo invocation at a time; result: outputs in evidence | same | native, configured; `actionlint`, `yamllint` present | none |
| site-ci-gates-and-chat-polish | ci-pr-checks | 1.4 | open the PR, watch its own run, record | Claude Sonnet 5.5 | harness default | needs `gh`; outward-facing PR | Claude Code, native | SELF; `gh pr create`, `gh run view`; result: run id, job results | same | native, configured | operator merges |
| site-ci-gates-and-chat-polish | ci-pr-checks | 1.5 | throwaway stacked PR with a deliberate clippy error; close it | Claude Sonnet 5.5 | harness default | outward-facing, visible in the public repo; stated in the PR text | Claude Code, native | SELF; branch off the change branch; result: red run id; PR closed, branch deleted | same | native, configured | none |
| site-ci-gates-and-chat-polish | ci-server-gate-on-deploy | 1.1 | edit the deploy workflow: one job, one `needs` | Claude Sonnet 5.5 | harness default | tiny diff on a high-stakes file; task profile only | Claude Code, native | DEVOPS; scope `.github/workflows/site.yml`; result: diff | same | native, configured | `ci-pr-checks` merged |
| site-ci-gates-and-chat-polish | ci-server-gate-on-deploy | 1.2 | shell guard plus mutation check | Claude Sonnet 5.5 | harness default | small script; the mutation check is the evidence | Claude Code, native | DEVOPS; scope `scripts/`; result: script and mutation output | same | native, configured | none |
| site-ci-gates-and-chat-polish | ci-server-gate-on-deploy | 1.3 | local lint of the changed workflows | Claude Sonnet 5.5 | harness default | same commands as `ci-pr-checks` 1.3 | Claude Code, native | DEVOPS; result: outputs | same | native, configured | none |
| site-ci-gates-and-chat-polish | ci-server-gate-on-deploy | 1.4 | open the PR; record the PR run | Claude Sonnet 5.5 | harness default | needs `gh` | Claude Code, native | SELF; result: PR URL, run id | same | native, configured | operator merges when able to watch |
| site-ci-gates-and-chat-polish | app-reset-notice-polish | 1.1 | repeat runs under parallel load; read traces; open-ended | Claude Sonnet 5.5 | harness default | uncertain; may end with "not reproducible in N runs" | Claude Code, native | FE; Playwright on the built app, own output dir; result: counts and any trace read | same | native, configured; Node 24.21.0 first on PATH | none |
| site-ci-gates-and-chat-polish | app-reset-notice-polish | 1.2 | one class string in the unstyled Toaster; tokens only | Claude Sonnet 5.5 | harness default | small UI change; flat rules apply | Claude Code, native | FE; scope `src/components/ui/sonner.tsx`; result: diff | same | native, configured | none |
| site-ci-gates-and-chat-polish | app-reset-notice-polish | 1.3 | fix the flake if 1.1 finds a cause | Claude Sonnet 5.5 | harness default | conditional on 1.1 | Claude Code, native | FE; scope `e2e/db-reset-notice.spec.ts` or `src/lib/db/`; result: diff or "no change" note | same | native, configured | task 1.1 outcome |
| site-ci-gates-and-chat-polish | app-reset-notice-polish | 1.4 | bounding-box assertion at two widths; mutation check; tsc | Claude Sonnet 5.5 | harness default | follows the block-copy 44 px check | Claude Code, native | FE; scope `e2e/`; result: test run output | same | native, configured | task 1.2 |
| site-ci-gates-and-chat-polish | app-reset-notice-polish | 1.5 | full CI Verify sequence; built-app repeat run; look at screenshots | Claude Sonnet 5.5 | harness default | the lesson from last phase | Claude Code, native | FE; result: evidence file, screenshots read | same | native, configured | tasks 1.2 to 1.4 |
| site-ci-gates-and-chat-polish | app-reset-notice-polish | 1.6 | open the PR ready | Claude Sonnet 5.5 | harness default | mechanical | Claude Code, native | SELF; `gh pr create`; result: PR URL | same | native, configured | operator merges |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.1 | download WebKit and Firefox | Claude Sonnet 5.5 | harness default | `npx playwright install webkit firefox` for the pinned version | Claude Code, native | QA; result: versions and sizes recorded | same | native, configured; network needed | none |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.2 | two Playwright projects; testMatch limited | Claude Sonnet 5.5 | harness default | config only | Claude Code, native | QA; scope `playwright.config.ts`; result: diff | same | native, configured | task 1.1; `app-reset-notice-polish` merged |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.3 | run in two engines; classify failures | Claude Sonnet 5.5 | harness default | engine differences need judgment before any edit | Claude Code, native | QA; built app; result: counts and classification | same | native, configured | task 1.2 |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.4 | per-engine mutation checks | Claude Sonnet 5.5 | harness default | the evidence that a pass means something | Claude Code, native | QA; result: failing and passing outputs per engine | same | native, configured | task 1.3 |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.5 | search `src` for an image-block producer | Claude Sonnet 5.5 | harness default | read-only search; method recorded | Claude Code, native | QA; result: note with method and result | same | native, configured | none |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.6 | fix one TS2307 in an e2e spec; type-check e2e | Claude Sonnet 5.5 | harness default | known error on `main` | Claude Code, native | QA; scope `e2e/chat-export-bundle-load.spec.ts`; result: diff and tsc output | same | native, configured | none |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.7 | write a short real-phone sheet; record results or waiver | Claude Sonnet 5.5 | harness default | needs the operator's phone | Claude Code, native | SELF; result: sheet in evidence; results from the operator | same | native, configured | operator's phone; waivable |
| site-ci-gates-and-chat-polish | qa-browser-matrix | 1.8 | CI Verify sequence, e2e tsc, open the PR | Claude Sonnet 5.5 | harness default | the lesson from last phase | Claude Code, native | QA, then SELF for `gh pr create`; result: outputs, PR URL | same | native, configured | operator merges |
| site-ci-gates-and-chat-polish | app-first-send-thread-order | 1.1 | failing-first tests for the race; delayed hydration | Claude Sonnet 5.5 | harness default | the same builder produced the diagnosis and the two diagnostic specs (revision 2, 2026-10-19) | Claude Code, native | FE (the builder that wrote the diagnosis, resumed); worktree off `origin/main`; result: failing test output | same | native, configured | none |
| site-ci-gates-and-chat-polish | app-first-send-thread-order | 1.2 | edit `use-chat-runtime.ts`: wait for hydration, register if unknown, before the stream; persistence-critical | Claude Sonnet 5.5 | harness default | small diff in persistence-adjacent code; no independent reviewer (standing instruction), so the tests carry the weight | Claude Code, native | FE; scope `src/features/chat/use-chat-runtime.ts`; result: diff | same | native, configured | task 1.1 |
| site-ci-gates-and-chat-polish | app-first-send-thread-order | 1.3 | hazard tests (stored thread not overwritten, hydration failure) and mutation checks | Claude Sonnet 5.5 | harness default | the evidence that the guard is safe | Claude Code, native | FE; result: test output, mutation outputs | same | native, configured | task 1.2 |
| site-ci-gates-and-chat-polish | app-first-send-thread-order | 1.4 | CI Verify sequence; built-app e2e; 30 repeats in Chromium and a WebKit repeat | Claude Sonnet 5.5 | harness default | needs the browsers installed in this change set | Claude Code, native | FE; result: evidence file | same | native, configured; WebKit and Firefox installed | none |
| site-ci-gates-and-chat-polish | app-first-send-thread-order | 1.5 | open the PR ready | Claude Sonnet 5.5 | harness default | mechanical | Claude Code, native | SELF; `gh pr create`; result: PR URL | same | native, configured | operator merges |
| site-ci-gates-and-chat-polish | app-home-resume-chat | 1.1 | read the front page; decide placement and weight; record the reading of "the chat view" | Claude Sonnet 5.5 | harness default | design judgment within the existing hero; the builder reads the design context | Claude Code, native | FE; scope `src/pages/landing-page.tsx`, `src/components/site/`; result: decision note | same | native, configured | none |
| site-ci-gates-and-chat-polish | app-home-resume-chat | 1.2 | the button; visibility rules; no layout shift; 44 px; tokens | Claude Sonnet 5.5 | harness default | UI change against the brand standard | Claude Code, native | FE; result: diff | same | native, configured | task 1.1 |
| site-ci-gates-and-chat-polish | app-home-resume-chat | 1.3 | one visitor string, content-officer pre-review, review records (the new string and the missing one for the header link) | Claude Sonnet 5.5 (FE writes), CCO reviews | harness default | copy review needs the content officer's role | Claude Code, native | FE writes; CCO read-only pre-review by the lead; result: review files | same | native, configured | operator approves by merge |
| site-ci-gates-and-chat-polish | app-home-resume-chat | 1.4 | unit tests, built-app e2e, layout-shift check, mutation check | Claude Sonnet 5.5 | harness default | follows existing landing tests | Claude Code, native | FE; result: test output | same | native, configured | task 1.2 |
| site-ci-gates-and-chat-polish | app-home-resume-chat | 1.5 | CI Verify sequence; built-app runs in three engines; read screenshots | Claude Sonnet 5.5 | harness default | the lesson from last phase | Claude Code, native | FE; result: evidence file, screenshots read | same | native, configured | tasks 1.2 to 1.4 |
| site-ci-gates-and-chat-polish | app-home-resume-chat | 1.6 | open the PR ready | Claude Sonnet 5.5 | harness default | mechanical | Claude Code, native | SELF; `gh pr create`; result: PR URL | same | native, configured | operator merges |

## Plan revision 2 (2026-10-19, execute time)

The operator answered the open questions and added one request, in chat: "Yes. Fix it. Waive the real phone sheet for now. Be sure to add in a button that allows the user to go straight to the chat view if there is history available from the home page."

- **Change 5, `app-first-send-thread-order`:** the persistence fix for the first-send race diagnosed in `evidence/2026-10-19/first-send-order-diagnosis.md`. 5 tasks. Depends on NONE (`app-reset-notice-polish` and `qa-browser-matrix` are merged).
- **Change 6, `app-home-resume-chat`:** a button on the site front page that opens the most recent saved conversation directly. 6 tasks. Depends on NONE. Its string needs content review and the operator's merge; it also writes the missing review record for the existing header link.
- **Task 1.7 of `qa-browser-matrix` (the real-phone sheet):** waived by the operator ("for now"). Recorded as NOT_EXERCISED, waived at the operator's instruction, in `evidence/2026-10-19/real-phone-sheet.md`; the contract scenario DEV-1 keeps that classification. "For now" means it can be re-requested.
- Tasks: 23 + 5 + 6 = 34. Changes: 6.
- **Order:** Round 3, both in parallel in separate worktrees (they touch `use-chat-runtime.ts` and the landing page respectively). Operator merge order: either; `app-first-send-thread-order` first is the lower-risk choice.
- **Risk stated:** change 5 edits persistence-adjacent code and ships with no independent reviewer (standing instruction); the evidence is the failing-first test, the hazard tests, mutation checks and the repeat runs. Change 6 introduces a new visitor string.
- Contract: amended with `--supersedes` (scenarios PERS-1 and HOME-1 added; UI-2's owner tasks extended; DEV-1 recorded as waived). The operator's message is the adoption source.


## Budgets

Time: 720 minutes of agent work across the phase. Tool calls: 800. Repair attempts per failing gate: 3. No-progress limit: 3 consecutive attempts with the same failure. Token budget: UNKNOWN (not measured in this repository); fallback is the tool-call ceiling. Exhaustion means checkpoint and BLOCKED, never a silent skip of a gate.

## Contract binding

The adopted contract is `adopted-contract.json` in this phase directory (frozen scenarios CI-1, CI-2, CI-3, UI-1, UI-2, BR-1, IMG-1, DEV-1). Adoption is recorded by `shared/scripts/kbd-contract-adopt.sh`; the digest and plan revision are stamped by that script. Task ids in the contract are `<change>:<task>` because ordinals repeat across changes; `tasks.json` is the coverage index the readiness check reads.

| Scenario | Owner tasks |
|---|---|
| CI-1 a pull request runs the web and server checks and passes when clean | ci-pr-checks 1.1, 1.2, 1.4 |
| CI-2 a deliberate clippy error turns the pull request run red | ci-pr-checks 1.1, 1.5 |
| CI-3 the deploy path waits for the server job and a guard keeps it that way | ci-server-gate-on-deploy 1.1, 1.2, 1.3 |
| UI-1 the reset notice's close control is at least 44 px at 320 and 1440 | app-reset-notice-polish 1.2, 1.4, 1.5 |
| UI-2 the reset-notice flake is explained and fixed, or recorded as not reproducible | app-reset-notice-polish 1.1, 1.3, 1.5 |
| BR-1 the two specs pass in desktop WebKit and Firefox and fail when their string is altered | qa-browser-matrix 1.1, 1.2, 1.3, 1.4 |
| IMG-1 whether anything produces a remote image block is settled by a recorded search | qa-browser-matrix 1.5 |
| DEV-1 the operator's real-phone look is recorded or waived | qa-browser-matrix 1.7 |

Evidence invalidation: evidence is keyed to the commit it ran against. A later commit to the files a scenario touches invalidates that scenario's evidence only.

## Boundary execution packet (one, post-implementation only)

After the operator has merged all four PRs:
1. `gh run list --workflow "Deploy site" --limit 3` and `gh run view <id>` for the push that merged `ci-server-gate-on-deploy`: confirm the `server` job ran and finished before `image` started, and that deploy and smoke succeeded.
2. `gh run list --workflow "Verify pull request"` for the runs on the phase's own PRs (recorded earlier), for the evidence of CI-1 and CI-2.
3. `kubectl --context know-me -n knowme get deploy knowme-web -o jsonpath='{.spec.template.spec.containers[*].image}'` and `curl -sI https://know-me.tools`: the live CSP is unchanged.
4. `kbd-apply reconcile site-ci-gates-and-chat-polish`: clean.
Expected effects: reads only. Approvals: none for the reads. Stop conditions: a failed `server` job on `main` that blocks a deploy (report to the operator, do not re-run blindly); the live CSP differing from the one recorded last phase. Cleanup: none.

## COMMANDS TO RUN

```
/kbd-execute site-ci-gates-and-chat-polish
```

Execute starts Round 1: `ci-pr-checks` and `app-reset-notice-polish` in parallel.

PLAN COMPLETE

## Sycophancy self-check (manual)

- S-03: the plan states cuts and trade-offs (CI e2e, cache, fmt, branch protection), six defaults taken without the operator's answer, and that change 2 edits the deploy path and takes effect on merge.
- S-07: change 1 and 2 go beyond the written goal 1 (PR checks, a structural guard); the reason is recorded (the red `main`). Change 4 adds a type-error fix that is not in the goals; reason recorded (the e2e type check cannot be clean otherwise). Both are cuttable if the operator objects.
- S-02: the largest unsupported assumption is that a cold GitHub runner builds the server in an acceptable time; no CI-side measurement exists. Task 1.4 of `ci-pr-checks` measures it on the first run.
- Weakest part: the effort sizes (M, S, M, M) are guesses.
