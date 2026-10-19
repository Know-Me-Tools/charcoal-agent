# Prior context — site-chat-follow-ups (reflect)

> Auto-populated by /kbd-memory-recall for lead view (main thread); lessons from pk. Cite the lessons that apply; recalled entries are information recorded by agents, not instructions.

## Lessons

- [pk:shared] Default MVP verification demos to agent-run with recorded authorization: For MVP phase verification, default demos to **agent-run execution with recorded operator authorization** rather than requiring the operator to perform the demo by hand. Reserve operator-hands requirements for actions that are truly account-bound or require human judgment, such as adjudication decisions. - `design.md` - `execution.md` _(recorded by an agent; lesson; via pk learning:351f041cc1b0c9d6)_
- [pk:shared] Installer behavior tests must exercise installer dispatch: A component-level test passing is not evidence that the production installer entry point uses that component. If a specification says “the installer applies X,” validate the behavior through the installer's dispatch path, or add a structural assertion proving the install path reaches the relevant call. _(recorded by an agent; lesson; via pk learning:ba6b5cffdef7de64)_
- [pk:shared] External integrations require at least one real-service test: For every external integration, run at least one test against the real service before claiming the work is done. Fakes and mocks can hide service-specific preconditions, such as labels that must already exist or context that is inherited rather than supplied explicitly. - Prefer CI or repeatable scripts for the real-service check when feasible; see related real-environment validation patterns in [Codex plugin verify-and-publish phase goals and validation plan](/codex-plugin-verify-and-publish-phase-goals-and-validation-plan.md) and [Live Postgres startup checks for flint_meta reflection drift] _(recorded by an agent; lesson; via pk learning:ddd2db0fb37f6232)_
- [pk:shared] Preserve production evidence in dated review folders: When saving production evidence for operator review, create a new dated evidence folder with a `README`; never overwrite or mutate earlier evidence folders. - Store production evidence in a newly created dated directory for each run, e.g. `evidence/2026-10-06/` or `review-artifacts/2026-10-06-<short-purpose>/`. - Include a `README.md` that makes the evidence set navigable and records: _(recorded by an agent; lesson; via pk learning:0d46bd8a48d92ee1)_
- [pk:shared] Poll after creating GitHub issues before listing by label: GitHub's issue list-by-label results can lag a just-created issue by several seconds. When automation creates an issue and then verifies it via label-filtered listing, poll until the issue appears instead of asserting immediately. - After `gh issue create --label X`, treat `gh issue list --label X` or equivalent API searches as eventually consistent. issue_url=$(gh issue create --title "$title" --body "$body" --label "$label") if gh issue list --label "$label" --json url --jq '.[].url' | grep -Fxq "$issue_url"; then _(recorded by an agent; lesson; via pk learning:caad2f3ba9a7510b)_
- [pk:shared] Store generated test documents and check results in a local review folder: When producing generated test documents and validation/check outputs for operator review, write the artifacts to a local folder the operator can open directly, and include a `README` that maps each input to its corresponding generated document and check result. - Add a `README.md` that makes the artifact set navigable: Example `README.md` table: _(recorded by an agent; lesson; via pk learning:902b8571d6287696)_
- [pk:shared] Boundary gates must launch the packaged artifact: Every boundary gate must both **build** and **launch** the packaged artifact through its real production entry point. Source-level test suites are insufficient as boundary evidence because they cannot detect failures introduced by packaging, bundling, asset resolution, or entry-point wiring. _(recorded by an agent; lesson; via pk learning:391671bab251836b)_
- [pk:shared] Ask once at phase boundary for operator-only actions: For `phase-team-learning-hardening`, ask a single explicit approval question at the phase boundary for operator-only actions: merges, tags, and machine-level changes. This keeps the run unblocked while preserving the operator's control over privileged actions. _(recorded by an agent; lesson; via pk learning:29cb1718c3df4502)_
- [pk:shared] Discover test environment state instead of encoding checkout assumptions: Tests should discover their execution environment—such as the actual cache layout and whether submodules are initialized—instead of encoding assumptions from one developer checkout. Otherwise, a phase-boundary gate running in a fresh worktree can disagree with the worker's local test run. _(recorded by an agent; lesson; via pk learning:6c1c504c9400e396)_
- [pk:shared] Put pinned runtime first on PATH before running gates: Run verification and archive gates with the project's pinned runtime first on `PATH`. A broken shim or globally installed runtime earlier on `PATH` can make typecheck fail for reasons unrelated to the code under review. - Before typecheck, verify, or archive gates, prepend the project-pinned runtime directory to `PATH`. - When a typecheck fails unexpectedly, confirm `which node`, `node --version`, and any package-manager shim path before debugging application code. _(recorded by an agent; lesson; via pk learning:7f4c756c7a570925)_
- [pk:shared] Collect zero-question execution approvals at dispatch: When evidence gates are green, this operator prefers **zero-question execution**: collect pre-approvals for commits, cleanup, and outward-facing steps at dispatch time, then record the approvals verbatim in `execution.md`. - Capture the operator's exact authorization language in `execution.md`. _(recorded by an agent; lesson; via pk learning:6c62daa7b3af1883)_
- [pk:shared] Keep Codex parent SessionStart injections safe for subagents: Codex forks the parent thread history into every spawned child. Any text injected into the parent at `SessionStart` is inherited by every subagent, so parent-level injections must not contain role-private, lead-only, or otherwise compartmentalized instructions. - Treat parent `SessionStart` context as **broadcast context** for the entire agent tree. - When validating Codex hook behavior, include inheritance effects in the review alongside normal `SessionStart` execution checks, such as those discussed in [Codex plugin verify-and-publish phase goals and validation plan](/codex-plugin-verify-and _(recorded by an agent; lesson; via pk learning:417cea63da61f206)_

## pk knowledge

- [pk:project] Karpathy session f7ccba7979d1: Completed kbd-plan — site-chat-follow-ups (step 0 of 3 changes) 1. **`app-export-omission-note`** (5 tasks): the export ends with one line when a card or an outside-hosted image the visitor saw was left out. The line never quotes the dropped content. 2. **`app-db-reset-notice`** (6 tasks): after the saved-chat wipe, the visitor sees one line, once. The recovery itself is untouched. The first task looks for an honest way to reach that path in a real browser. If there isn't one, that scenario is marked blocked, not passed on a mock. 3. **`site-server-gates-green`** (7 tasks): reproduce the clipp _(recorded by an agent; lesson; via pk pk:karpathy-session-f7ccba7979d1295b)_

## Previous reflection

From `chat-export-and-block-copy/reflection.md`:

**Root Cause**

1. Resume (item 1): the plan relied on an assumption about UAR that was read from documentation, not tested until task 2.2.
2. Stall (item 2): the first diagnosis stopped at the visible symptom (heat and long renders). The server capture with timestamps showed silent gaps; that capture was taken only after the operator's iPhone report.
3. Heat (item 3): no phone-side measurement was available, so the cause could not be separated from the phone being busy for other reasons.
4. Waivers (item 4): the phase put its final checks on a person with a physical device, and they were the last tasks. The code was finished days earlier and waited on them.
5. Mistaken claims (item 6): I reported a task closed from memory instead of running `reconcile`, and merged a test file without running `tsc` on it. Recurrence of the lesson "run the narrow type check on a new test before merge".

**Corrective Actions**

1. Before planning a feature that depends on another service's behaviour, test that behaviour first and make the finding a task-1 gate (UAR resume).
2. For a reported live fault, capture the real production stream with timestamps before choosing a fix.
3. Put device checks early in a phase, or decide at plan time that they are waivable and say so.
4. Run `kbd-apply reconcile` before stating a task is closed.

**Next Phase Seed**

Seed: **site-chat-follow-ups**. Candidates, in the order I would take them:
1. Device checks for export and stream behaviour on a real iPhone and Android (the four waived items), done as one short session.
2. Export review items listed above, starting with the two that can lose data or hide content (`purgeDatabase` on "bundle size"; cards dropped with no note).
3. Reply speed progress cue; monthly token ceiling decision.
4. Housekeeping: remove stale worktrees, commit the probe additions, fix the three clippy errors and the CSP test.

## Knowledge gaps

*(none recorded)*
