# Reflection: chat-export-and-block-copy (2026-10-17)

## Delta (plan vs delivery)

1. **Change 2 (`site-stream-resume`) was cancelled.** The plan assumed a lost reply could be resumed. UAR cancels a run 250 ms after the last SSE subscriber disconnects, so there is nothing to resume. Evidence: `evidence/2026-10-14/2.2-uar-resume-contract.md`, `evidence/2026-10-17/2.1-gate-decision.md`. Change archived with `--skip-specs`.
2. **The iPhone "stuck, no final answer" fault was not caused by what change 1 assumed.** Change 1 targeted render cost (delta coalescing, memoised conversion, throttled parse). The reproduced fault was a connection with no bytes for 29 s and 18 s and no page-side detection. The real fix was PR #125 (server keep-alive every 10 s, client stall watchdog at 45 s), which was not in the plan. Confirmed by the operator on an iPhone 17 and an iPhone 18: "it works!". Server side measured from a Mac: keep-alives at 13.9 s and 31.8 s, no gap over 12 s.
3. **Phone heat was reported again after #125 ("does make the phone heat up"), then withdrawn ("seems to have gone away and could have been something else").** Never reproduced. Chromium at 6x CPU throttle showed 1.6 s of CPU per reply at 1x and about 1% idle, with no running animations. The cause of the heat report is unknown. Nothing was changed for it.
4. **Four device checks were waived, not passed.** Task 1.8 closed on a one-line verdict. Tasks 4.8 and 5.6 closed on the operator's instruction to skip. Record: `evidence/2026-10-17/4.8-5.6-device-checks-waived.md`. Unverified: real-iPhone and Android Save, Copy as Markdown, zip Prepare then Save, image Copy; WebKit and Firefox runs; the lock-screen and app-switch tests of the 1.8 protocol.
5. **User-message Copy was already shipped (#108) when the operator asked for it again.** It is hover-only on desktop. Either it was not discovered or it does not behave as expected; the operator did not say which. No change made.
6. **Three of my own steps needed a correction.** I claimed task 4.5 was closed when `reconcile` showed it open (fixed with the review record in #122). I merged a test with a mock typing error that failed `tsc` (fixed in #125). Two existing image-copy tests asserted the old await-first behaviour and had to be rewritten for the synchronous clipboard write.

## Root Cause

1. Resume (item 1): the plan relied on an assumption about UAR that was read from documentation, not tested until task 2.2.
2. Stall (item 2): the first diagnosis stopped at the visible symptom (heat and long renders). The server capture with timestamps showed silent gaps; that capture was taken only after the operator's iPhone report.
3. Heat (item 3): no phone-side measurement was available, so the cause could not be separated from the phone being busy for other reasons.
4. Waivers (item 4): the phase put its final checks on a person with a physical device, and they were the last tasks. The code was finished days earlier and waited on them.
5. Mistaken claims (item 6): I reported a task closed from memory instead of running `reconcile`, and merged a test file without running `tsc` on it. Recurrence of the lesson "run the narrow type check on a new test before merge".

## Recalled lessons

None from `prior-context.md` changed an outcome. The recurrence is the lesson above (type-check a new test), noted in Root Cause 5.

## Corrective actions

1. Before planning a feature that depends on another service's behaviour, test that behaviour first and make the finding a task-1 gate (UAR resume).
2. For a reported live fault, capture the real production stream with timestamps before choosing a fix.
3. Put device checks early in a phase, or decide at plan time that they are waivable and say so.
4. Run `kbd-apply reconcile` before stating a task is closed.

## Goal achievement

| Goal | Result |
|---|---|
| Per-block Copy for code, Mermaid, SVG, table, image, video, A2UI card with one shared CopyButton | MET (#104, #124; image Copy on a real iPhone unverified) |
| SVG, own-host-only media, sanitizer, reply policy, CSP, security review | MET (#104; security review claim not re-checked for this reflection) |
| Export current conversation as one OKF v0.2 document, client-side, allowlist | MET (merged through #124; real-phone Save and Copy as Markdown unverified) |
| Export all as a zip OKF bundle, client-side | MET (#121; Chromium gate at 1, 50, 300 conversations; real iPhone unverified) |
| Privacy: no network request, proven by test, operator-approved wording | MET (zero-request tests with mutation checks for both exports; wording approved by operator merge, review records in `docs/content/reviews/`) |
| Constraints: no unreviewed security change merged, dependency version read from registry, kill switch untouched, no secrets in exports | MET (fflate version and licence recorded in `5.1-zip-library-comparison.md`; leak test with mutation check) |

Added, not in the plan: keep-alive and stall watchdog (#125), Mermaid routing for diagrams (#120), product map in the agent prompt (#119).

## Artifact quality summary

No artifact-refiner logs exist for this phase (`.refiner/artifacts/` absent). Quality evidence is the per-change mutation checks (coalescing, privacy proof, leak test) and the Chromium gate. Cumulative adversarial review was not run in this phase: the operator declined judge runs in earlier KBD stages. That is a gap, stated here.

## Technical debt introduced or left

- Review items not changed: A2UI, UI and logo cards are dropped from export with no note; `purgeDatabase` wipes saved chats on a "bundle size" error; `console.warn` on every tab switch; `aria-describedby` for disabled export reasons; `)` escaping in image URLs; same-origin media L4.
- Probe `e2e/real-stream-probe.spec.ts` has uncommitted idle-profile and running-animations additions in the `stall` worktree.
- Pre-existing and left alone: three clippy errors; the CSP test in `server/tests/meter_and_headers.rs` fails on a clean `origin/main`.
- Monthly token ceiling is still 20,000,000 (daily 2,000,000); not decided.
- pk memory writes are queued with `pk exited 1`.
- Leftover worktrees: `c5-bundle`, `stall`, `mainchk`, `inert`, `title`, `rev45`, `pmap`, `mmd`, `usercopy`. The main checkout is on `fix/site-copy-officer-edits` and has a stray `node_modules/fflate`.

## Lessons captured

- UAR cancels a run 250 ms after the last SSE subscriber leaves, so a dropped connection loses the reply; the defence is to keep the connection alive and detect death quickly, not to resume.
- A silent SSE connection of 18 to 30 seconds is enough to stall an iPhone reply; a 10-second comment frame fixes it.
- iOS drops the user gesture across an await: build the file or start the clipboard write before the tap, then call share, download or `clipboard.write` synchronously.
- Run `tsc` on any new test file before merge; a vitest pass does not check types.
- `kbd-apply begin-task` with the backend ordinal fails when the ledger registered the task as `1.8`; use the registered ID. A task with an outstanding start receipt needs only `end-task`.

## Codify as Skill?

No.

## Recommended Next Phase

Seed: **site-chat-follow-ups**. Candidates, in the order I would take them:
1. Device checks for export and stream behaviour on a real iPhone and Android (the four waived items), done as one short session.
2. Export review items listed above, starting with the two that can lose data or hide content (`purgeDatabase` on "bundle size"; cards dropped with no note).
3. Reply speed progress cue; monthly token ceiling decision.
4. Housekeeping: remove stale worktrees, commit the probe additions, fix the three clippy errors and the CSP test.
