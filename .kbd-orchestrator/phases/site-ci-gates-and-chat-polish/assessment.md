ASSESSMENT: site-ci-gates-and-chat-polish
Project: KnowMe site (charcoal-agent)
Date: 2026-10-19
Codebase baseline: `origin/main` at `38285ac` (PR #131, docs only, `[skip ci]`). Production runs the PR #130 image `sha256:97e00ae3…` (Deploy site run 39268527593, all five jobs succeeded). All code facts below were read from `origin/main` with `git show` and `git grep`; the main checkout is on a stale branch and was not used.
Cross-tool progress: none. `progress.json` shows 0 of 0 changes.

Adversarial review: skipped (`--skip-adversarial-review`, the operator's standing instruction). No independent critic has read this assessment. `detect_sycophancy` was not run (the server is not connected this session); the self-check is manual, at the end.

## Recalled lessons that apply

From `prior-context.md`:
- "Boundary gates must launch the packaged artifact": applies to goal 3 (the remote-image and WebKit/Firefox checks) and to goal 1 (the CI step must build the server the way the Dockerfile does, with a prebuilt web dir).
- "Put pinned runtime first on PATH before running gates": applies to every local gate (Node 24.21.0; Rust 1.98.1 through `cargo +1.98.1`).
- "Discover test environment state instead of encoding checkout assumptions": directly relevant to goal 1; the server tests encode one assumption (`KNOWME_WEB_DIST_DIR=tests/fixtures/web`) and #127 made that fail loudly.
- From the previous reflection: "Before opening a PR that adds or renames a test file, run the CI Verify sequence" (corrective action 1) and "read the harness header and the CI file for how it is meant to run" (corrective action 2). Both shape how this phase's gates are written.
- "Ask once at phase boundary for operator-only actions": the questions at the end of this file are the operator-only ones; defaults are stated so a non-answer does not stall the phase.

Knowledge gaps: none recorded. No `/learn-goal` offers.

## IMPLEMENTATION STATUS

- **CI for the server crate (goal 1): MISSING.**
  - `.github/workflows/site.yml` has jobs `verify` (pins, manifests, Node 24 from `.nvmrc`, `npm ci --ignore-scripts`, lint, `npm test`, build), `image`, `websearch-image`, `deploy`, `smoke`. Nothing runs `cargo clippy` or `cargo test` for `server/`. The only `cargo test` is for `websearch/` inside `websearch-image` (`rustup toolchain install 1.98.1 --profile minimal`, then `cargo +1.98.1 test --locked --manifest-path websearch/Cargo.toml`). That job built and tested green in the #130 deploy run, so that install pattern works on the runner.
  - The Rust pin is `"rust" = "1.98.1"` in `versions.toml`; the Dockerfile server stage uses `rust:1.98.1-slim-trixie@sha256:…`; `server/Cargo.lock` is committed.
  - `image` depends on `verify` only. A new server job would have to be added to `image`'s `needs` to block the deploy.
- **CI on pull requests (not in the goals; found while reading the trigger): MISSING.**
  - `site.yml` triggers on `push` to `main` and `workflow_dispatch` only. There is no `pull_request` trigger anywhere in `.github/workflows/` (the other workflow is `site-content.yml`). CI has never run on a PR in this repository.
  - Consequence: every check runs after the merge, on `main`. That is how PR #129 turned `main` red, and why PR #131 showed no status checks. Nothing in CI could have stopped that merge.
  - `main` has no branch protection (`gh api …/branches/main/protection` returns 404 "Branch not protected") and no rulesets (empty list). Even with PR-time checks, nothing would stop a merge; the checks would only be visible.
  - `site.yml` uses `concurrency: group: knowme-site-deploy, cancel-in-progress: false`. A PR run placed in that group would queue behind deploys. A PR check therefore wants its own workflow or its own concurrency group, not a shared one.
- **Reset notice close control (goal 2): PARTIAL.**
  - `persistence-notices.tsx` shows the notice with `duration: Infinity` and `closeButton: true` (stable id `knowme-db-reset`). The behaviour works (builder's screenshots, 3 e2e passes twice).
  - Cause of the small control: `src/components/ui/sonner.tsx` builds the Toaster in sonner's `unstyled` mode. In that mode sonner's own stylesheet does not size or place the close button. The only class on it is `closeButton: "border-0 bg-transparent text-fg-secondary hover:text-fg"`, so it is a plain button the size of its icon (about 14 px by the builder's measurement), placed by flex order at the top-left. No `size-11`/44 px class exists on it. Only the reset notice uses `closeButton`, so a change to this one class string affects nothing else. The repo's tap-target convention (44 px) is applied in `e2e/block-copy.spec.ts`; I did not find a token or helper for it in `tokens.css` or `button.tsx`.
- **The e2e flake (goal 2): CAUSE UNKNOWN.**
  - `playwright.config.ts` already sets `expect.timeout: 15_000` and `trace: "retain-on-failure"`. The error text was lost only because the builder's mutation run wiped `test-results`, so the trace was deleted. Nothing was reproduced since.
  - `e2e/db-reset-notice.spec.ts` waits on at least three PGlite starts per run (the failing open, the reopen after the purge, and the final reload), plus a 6 s fixed `waitForTimeout`, in a spec that runs fully parallel with the rest of the suite (`fullyParallel: true`). The purge helper has a 2 s fallback timer (`setTimeout(resolve, 2000)`) when `deleteDatabase` neither succeeds nor errors. These are candidate causes read from the code; none was shown to cause the failure.
- **WebKit and Firefox (goal 3): MISSING.**
  - Projects: `chromium` (all specs) and `webkit-iphone` (`testMatch` limited to `stream-load`, `block-copy`, `chat-export`). No Firefox project. Neither new spec (`chat-export-omission.spec.ts`, `db-reset-notice.spec.ts`) is in `webkit-iphone`'s list.
  - The local Playwright browser cache holds only Chromium (`chromium-1208/1248`, headless shells, ffmpeg). No WebKit and no Firefox are installed on this machine, so those runs need a browser download before they can happen.
  - CI runs no Playwright e2e at all (`verify` is unit tests and build only), so these specs have never run in CI in any browser.
  - `db-reset-notice.spec.ts` sets `test.use({ viewport: 1440x900 })` at file level, which overrides the iPhone device viewport if the spec were added to `webkit-iphone`.
- **Remote-image export case (goal 3): PROBABLY UNREACHABLE.**
  - `ImageContentBlock` is defined in `src/types/chat-content.ts` and is read only by the export (`okf-blocks.ts`). A grep of `src` (non-test files) for `type: "image"` and for other users of `ImageContentBlock` found no code that creates one. The only other `"image"` hit is the attachment type in `use-attachment-src.ts`, which is a different object.
  - So no current client path appears to produce an image block; a stored chat could hold one only from an older client or a future producer. If that holds, the built-bundle gap the builder reported (it cannot seed an image block without importing `/src`) is a gap in a path the product does not currently reach. The unit tests and the dev-server e2e already cover the line. The method is a grep, which can miss a block built by a spread or a JSON parse; it is stated as probable, not proven.
- **Real-phone look at the two new strings (goal 3): NOT DONE.** Needs the operator's phone. The strings are live (served bundle checked 2026-10-19).

## CROSS-TOOL PROGRESS
NONE: no cross-tool activity recorded.

## SPEC GAP SUMMARY

- G-1 (goal 1): no CI gate for `server/` lint or tests; the deploy path cannot be blocked by them. Spec to add: `site-server-quality` already states the intent ("clippy clean on a clean checkout", "header test passes"); it has no requirement that CI enforces it.
- G-2 (found, outside the written goals): no CI on pull requests; checks run only after a merge, and `main` has no branch protection. This is the larger gap. It is the reason the last phase's red `main` was possible.
- G-3 (goal 2): the close control is below the 44 px target because the Toaster is `unstyled` and its `closeButton` class carries no size.
- G-4 (goal 2): the flake is unexplained; the evidence (trace) was deleted before it was read.
- G-5 (goal 3): Firefox has no project; WebKit lists only three specs; no browsers are installed locally; CI runs no e2e.
- G-6 (goal 3): the remote-image export case may have no producer, which would make its built-bundle coverage moot.
- G-7 (not assessed): the smaller export review items, the reply-speed progress cue, the monthly token ceiling (still the default).

## BUILD HEALTH

- build check: UNKNOWN. No build, type check or test ran in this stage (read-only). Last known: Deploy site run for `570b3f9` green on all five jobs; `npm test` 1225 passed on `38285ac`'s parent (`570b3f9`) and on the close-out branch.
- known violations: `tsc -p e2e/tsconfig.json` has one error on `main` (`chat-export-bundle-load.spec.ts(32,43)`, TS2307), found by both builders last phase, not fixed. It matters here because any e2e work touches that tsconfig.
- test coverage: PARTIAL. Unit coverage for the reset notice (4 tests) and the omission line (14 tests). No CI e2e. No test for a workflow file (the pins and manifests checkers cover `uses:` pinning and YAML parsing only).

## CONSTRAINT CHECK

- AGENTS.md violations: NONE found in what was read.
- constraints.md violations: N/A (not read).
- Constraints that bind plan and execute: never touch the kill switch or `SITE_CHAT_KILL_SWITCH_EXPECTED`; never read credential values; open PRs ready, never draft; the operator merges; a merge to `main` without `[skip ci]` deploys `knowme-web` immediately, and a merge that changes `.github/workflows/` is a CI change that takes effect on that merge; new visitor strings carry a review record (this phase adds none unless the close control gets a label); `check-pins.sh` requires every `uses:` to be a full 40-hex commit SHA, so a new workflow can reuse only the SHAs already in `site.yml`; changing repository settings (branch protection) is the operator's.

## ADOPTED-OUTCOME INPUTS

- User operation: a red lint or test for the server, or for the web app, is visible before a merge and blocks a deploy after one; a visitor who gets the reset notice can close it with a normal tap; the new strings and the export work on WebKit and Firefox engines and on a real phone.
- Observed baseline: server lint and tests pass on `main` when run as documented (#127). CI does not run them. CI runs only after a merge. The close control is about 14 px. The flake occurred once in five full runs. UNKNOWN: how long a cold CI build of the server takes (one local cold build of the test profile took 2 m 14 s on this machine; a CI runner is slower and has no cache); whether the Firefox engine renders the new toast and export acceptably; whether anything produces remote image blocks.
- Desired observable result: (a) a push to `main` runs server clippy (`--all-targets`, warnings denied) and the server tests with the fixture dir on Rust 1.98.1, and `image` waits for them; (b) a pull request runs the Verify steps and the server job without deploying; (c) the close control measures at least 44 px at 320 px wide and the flake is explained or recorded as not reproducible with the evidence kept; (d) the two new e2e specs have run in WebKit and Firefox with results recorded; (e) the operator's real-phone look is recorded.
- Supported environments: GitHub-hosted `ubuntu-latest` runners for CI; macOS aarch64 for local gates; Chromium, WebKit and Firefox engines through Playwright; the operator's iPhone and Android for goal 3.
- Required safety checks: pins and manifests checks stay green (`check-pins.sh`, `check-manifests.sh`); a workflow change cannot widen token permissions (read-only `contents`); the PR workflow runs untrusted code, so it gets no secrets and `npm ci --ignore-scripts`; the kill switch stays untouched; the export privacy proofs stay green.
- Exclusions and deferred (proposed, not adopted): requiring the checks through branch protection (a settings change, the operator's); a Cargo/npm cache action (would add an action to pin); e2e in CI (a bigger change: browsers, runtime, time); the smaller export review items; the reply-speed cue; the token ceiling.
- Risk acceptance: a new required job lengthens every deploy if it is slower than `verify`; run in parallel with `verify` and the added wall time is the difference. A CI change takes effect on merge and can fail a deploy for a reason that has nothing to do with the code being deployed (for example a runner toolchain install failure); the first merge to `main` after it lands is the real test, so it should land when the operator can watch it.
- Decision owner: the operator (Travis James). Branch protection: operator only.

## GOAL PROGRESS

1. CI gates the server crate: NOT MET. Assessed above; nothing built. G-2 widens it.
2. Close control and flake: NOT MET. Close control cause found (G-3); flake cause not found (G-4).
3. Phone look, WebKit and Firefox, remote-image case: NOT MET. Browsers not installed; remote-image case probably unreachable; the phone look needs the operator.

## Open questions for plan (operator)

1. Add CI on pull requests as a separate workflow, in this phase? Default: yes, as its own change, because it addresses the cause of the red `main` and keeps the deploy workflow untouched. It goes beyond the written goal 1.
2. Require the checks with branch protection? Default: no change; this is the operator's setting. The PR checks would then be visible but advisory.
3. Drop the remote-image built-bundle sub-goal, given no producer was found? Default: yes, with the reasoning and the grep method recorded; revisit if a producer appears.
4. Install the WebKit and Firefox browsers locally (a download of a few hundred MB through `npx playwright install webkit firefox`) and add a `firefox` project plus the two new specs to the WebKit list? Default: yes, at execute, noted in the dispatch; the specs that set a desktop viewport run in a desktop WebKit project, not the iPhone one.
5. Real-phone look: the plan will write a short sheet for you; it cannot be done by the agent.

## Sycophancy self-check (manual)

- S-03: gaps surfaced (G-1 to G-7), including one I found that is not in the written goals (G-2) and one that undercuts a goal (G-6).
- S-02: the largest unverified claim is G-6 (no producer for image blocks); it rests on a grep and is labelled probable. The flake causes are candidates read from code, not findings.
- Weakest part: the CI time estimate (no CI-side measurement exists).

ASSESSMENT COMPLETE
