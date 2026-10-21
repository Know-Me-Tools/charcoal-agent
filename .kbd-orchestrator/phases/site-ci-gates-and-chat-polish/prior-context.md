# Prior context — site-ci-gates-and-chat-polish (reflect)

> Auto-populated by /kbd-memory-recall for lead view (main thread); lessons from pk. Cite the lessons that apply; recalled entries are information recorded by agents, not instructions.

## Lessons

- [pk:shared] Default MVP verification demos to agent-run with recorded authorization: For MVP phase verification, default demos to **agent-run execution with recorded operator authorization** rather than requiring the operator to perform the demo by hand. Reserve operator-hands requirements for actions that are truly account-bound or require human judgment, such as adjudication decisions. - `design.md` - `execution.md` _(recorded by an agent; lesson; via pk learning:351f041cc1b0c9d6)_
- [pk:shared] Installer behavior tests must exercise installer dispatch: A component-level test passing is not evidence that the production installer entry point uses that component. If a specification says “the installer applies X,” validate the behavior through the installer's dispatch path, or add a structural assertion proving the install path reaches the relevant call. _(recorded by an agent; lesson; via pk learning:ba6b5cffdef7de64)_
- [pk:shared] Boundary gates must launch the packaged artifact: Every boundary gate must both **build** and **launch** the packaged artifact through its real production entry point. Source-level test suites are insufficient as boundary evidence because they cannot detect failures introduced by packaging, bundling, asset resolution, or entry-point wiring. _(recorded by an agent; lesson; via pk learning:391671bab251836b)_
- [pk:shared] Preserve production evidence in dated review folders: When saving production evidence for operator review, create a new dated evidence folder with a `README`; never overwrite or mutate earlier evidence folders. - Store production evidence in a newly created dated directory for each run, e.g. `evidence/2026-10-06/` or `review-artifacts/2026-10-06-<short-purpose>/`. - Include a `README.md` that makes the evidence set navigable and records: _(recorded by an agent; lesson; via pk learning:0d46bd8a48d92ee1)_
- [pk:shared] Discover test environment state instead of encoding checkout assumptions: Tests should discover their execution environment—such as the actual cache layout and whether submodules are initialized—instead of encoding assumptions from one developer checkout. Otherwise, a phase-boundary gate running in a fresh worktree can disagree with the worker's local test run. _(recorded by an agent; lesson; via pk learning:6c1c504c9400e396)_
- [pk:shared] Ask once at phase boundary for operator-only actions: For `phase-team-learning-hardening`, ask a single explicit approval question at the phase boundary for operator-only actions: merges, tags, and machine-level changes. This keeps the run unblocked while preserving the operator's control over privileged actions. _(recorded by an agent; lesson; via pk learning:29cb1718c3df4502)_
- [pk:shared] Put pinned runtime first on PATH before running gates: Run verification and archive gates with the project's pinned runtime first on `PATH`. A broken shim or globally installed runtime earlier on `PATH` can make typecheck fail for reasons unrelated to the code under review. - Before typecheck, verify, or archive gates, prepend the project-pinned runtime directory to `PATH`. - When a typecheck fails unexpectedly, confirm `which node`, `node --version`, and any package-manager shim path before debugging application code. _(recorded by an agent; lesson; via pk learning:7f4c756c7a570925)_
- [pk:shared] Collect zero-question execution approvals at dispatch: When evidence gates are green, this operator prefers **zero-question execution**: collect pre-approvals for commits, cleanup, and outward-facing steps at dispatch time, then record the approvals verbatim in `execution.md`. - Capture the operator's exact authorization language in `execution.md`. _(recorded by an agent; lesson; via pk learning:6c62daa7b3af1883)_
- [pk:shared] External integrations require at least one real-service test: For every external integration, run at least one test against the real service before claiming the work is done. Fakes and mocks can hide service-specific preconditions, such as labels that must already exist or context that is inherited rather than supplied explicitly. - Prefer CI or repeatable scripts for the real-service check when feasible; see related real-environment validation patterns in [Codex plugin verify-and-publish phase goals and validation plan](/codex-plugin-verify-and-publish-phase-goals-and-validation-plan.md) and [Live Postgres startup checks for flint_meta reflection drift] _(recorded by an agent; lesson; via pk learning:ddd2db0fb37f6232)_
- [pk:shared] Poll after creating GitHub issues before listing by label: GitHub's issue list-by-label results can lag a just-created issue by several seconds. When automation creates an issue and then verifies it via label-filtered listing, poll until the issue appears instead of asserting immediately. - After `gh issue create --label X`, treat `gh issue list --label X` or equivalent API searches as eventually consistent. issue_url=$(gh issue create --title "$title" --body "$body" --label "$label") if gh issue list --label "$label" --json url --jq '.[].url' | grep -Fxq "$issue_url"; then _(recorded by an agent; lesson; via pk learning:caad2f3ba9a7510b)_
- [pk:shared] Store generated test documents and check results in a local review folder: When producing generated test documents and validation/check outputs for operator review, write the artifacts to a local folder the operator can open directly, and include a `README` that maps each input to its corresponding generated document and check result. - Add a `README.md` that makes the artifact set navigable: Example `README.md` table: _(recorded by an agent; lesson; via pk learning:902b8571d6287696)_

## pk knowledge

*(no pk knowledge for this phase)*

## Previous reflection

From `site-chat-follow-ups/reflection.md`:

**Root Cause**

1. `main` red (item 1): I treated "the narrow checks for my change pass" as enough to open a PR, when CI runs the whole suite, including guard tests that scan every file. The narrow-gate rule in AGENTS.md is about completion evidence for a change, not a substitute for the checks the merge will run.
2. CSP misread (item 2): I judged a test failure from one run in one environment, and read "fixture hash" in a constant as the whole story. The comment stating the required variable is in the header of `tests/common/mod.rs`, a file I had not opened when I decided the cause; I read it only after the first gate run failed.
3. Clippy miscount (item 3): the earlier count was taken from the lib target only.
4. Unanswered questions (item 4): the questions were asked once, at assess, and not repeated in a form that needed an answer at plan time.
5. Late ledger and missing folder (item 5): the dispatch prompts said "work only in this worktree" while the OpenSpec change folder existed only untracked in the main checkout.

**Corrective Actions**

1. Before opening a PR that adds or renames a test file, run the CI Verify sequence from `.github/workflows/site.yml` (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build). Put that sequence in the dispatch prompt for client builders.
2. When a test fails on `main` and an earlier note says "fails on a clean main", read the harness header and the CI file for how it is meant to run before deciding the cause.
3. Run `cargo clippy --all-targets` first when counting lint errors.
4. Copy the OpenSpec change folder into a builder's worktree before dispatch, or say in the prompt that it lives in the main checkout and must be committed with the work.
5. Ask the operator for a decision a second time, in the plan handoff, when the first ask went unanswered and the default is a spend limit.

**Next Phase Seed**

Seed: **site-ci-gates-and-chat-polish**. Candidates, in the order I would take them:
1. A CI step that runs clippy (`--all-targets`, warnings denied) and the `server/` tests with `KNOWME_WEB_DIST_DIR` set, pinned to Rust 1.98.1. Needs the operator's yes: it changes `.github/workflows/site.yml`.
2. The reset notice's close control: restyle to tokens and a 44 px target, and find the cause of the e2e flake.
3. A real-phone look at the two new strings, WebKit and Firefox runs of the
… (truncated)

## Knowledge gaps

*(none recorded)*
