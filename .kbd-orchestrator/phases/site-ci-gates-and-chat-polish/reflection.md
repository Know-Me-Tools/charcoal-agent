# Reflection: site-ci-gates-and-chat-polish (2026-10-21)

## Delta (plan vs delivery)

1. **The plan had four changes; seven shipped.** Three were added at execute time: `app-first-send-thread-order` (#137), `app-home-resume-chat` (#138) and `app-persist-loss` (#139). The first two came from the operator's reply to my flake diagnosis ("Yes. Fix it." plus the front-page button). The third came out of testing the resume button. Two plan revisions and a contract re-adoption (digest `cc53bbc8…4ac`) were needed. The plan's goal 2 said "found and fixed or recorded as not reproducible"; it was found in the product, so it became product work the plan had not sized.
2. **The flake was not what the plan said it was.** The plan named the 6 s fixed wait and the 2 s purge timer as suspects. Neither was supported by a trace. Two of three failures in 90 runs were a product defect: on a fresh database the first message was written before its thread row (`messages_thread_id_fkey`, 10 to 40 ms after Enter). The third was a stalled 4.9 MB `pglite` download under 4 workers, read from the trace only, not proven.
3. **My first explanation of the follow-on bug was wrong.** After #137, a saved conversation could still revert to a draft. I attributed it to a reload race. That was disproved; the cause was `initFromDb` overwriting a thread already in the registry (fixed in #139 with `if (!state.threads[t.id]) …` and two unit tests). I said "reload race" to the operator before I had a reproduction.
4. **I made a false claim about GitHub and retracted it.** I said runners were slow. `ci-runs.md` shows `gh run list` status lagging while job timestamps were fine. D-008 in the decision log still carries the original sentence; it is superseded by D-013 below.
5. **Merge order differed from the plan.** #134 merged before #132, so #134 never had a pull-request check. No harm found. Recorded as D-008.
6. **The real-phone look did not happen.** The operator waived it "for now" (`evidence/2026-10-19/real-phone-sheet.md`, verdict `NOT_EXERCISED`). Nothing in this phase was observed on a phone.
7. **No independent review.** The cumulative adversarial review was skipped on the operator's standing instruction and is recorded `pending_review`, no waiver. This does not satisfy the Execute completion checklist as written. The persistence code (`use-chat-runtime.ts`, `thread-registry-store.ts`) was written and judged by one author in a phase where that author misjudged its cause once already.
8. **A contract wording does not match what was done.** The BR-1 negative control says "alter each string constant". Both specs import the string from source, so altering it changes app and spec together. I used behaviour mutations instead (D-007). The contract text was left as adopted.
9. **Smaller:** the remote-image sub-goal was replaced by a producer search (nothing in `src` creates a remote image block), so the coverage was descoped rather than built. WebKit and Firefox were run once each. CLS was not measured in them. The branch-protection question for `Verify pull request` went unanswered, so the new check is visible and advisory. The builder trailer was missing on #136. I wrote `boundary-packet.md` from a script with `>` and did not check whether a file by that name already existed.

## Root Cause

1. **Seven instead of four (item 1):** the plan scoped goal 2 on the assumption that the flake was a test problem. I had not run the repeat before planning, so the plan priced a diagnosis as a fix of a timer.
2. **Wrong reload-race hypothesis (item 3):** I formed a cause from the symptom's timing and stated it. No failing test existed for it. The reproduction that found the real cause was a unit test on `initFromDb`, which I should have written first.
3. **"Slow runners" (item 4):** I read `gh run list` status as ground truth. Job-level `gh run view --json jobs` is authoritative; the list status lagged.
4. **Persistence defects reached the operator (items 2, 3):** `ensureThreadRegistered` and `initFromDb` were added across two earlier phases without a test that exercises a first send on an empty database, then a reload. Both failures needed that sequence.
5. **Review skipped (item 7):** a standing operator instruction. The cost lands on the one phase where the code under change had a recent history of being misdiagnosed.

## Recalled lessons

- "Run the CI Verify sequence before opening a PR that adds a test or workflow" (previous reflection, corrective action 1): applied to every PR in this phase; no `main` went red on a Verify failure. I did not re-read each PR's local gate output while writing this reflection, so I report the green PR and deploy runs, not the local runs.
- "A visual or security assertion is not evidence until a mutation check shows it fails on the bug": applied to the close control and CI guard, adapted to behaviour mutations for BR-1 (item 8).
- "Boundary gates launch the packaged artifact": applied; the 30-repeat flake run and the WebKit and Firefox runs were against the built app.
- "Run `kbd-apply reconcile` before stating a task closed": `reconcile` is clean at the boundary (`boundary-packet.md`, section 6).
- Not among the recalled lessons, and broken this phase: **state a cause only after a reproduction** (item 3).

## Corrective actions

1. Before naming a cause to the operator, reproduce it or label it a hypothesis in the same sentence.
2. Add an e2e or integration test for first send on an empty database followed by a reload and a resume. Today the two defects are guarded by unit tests only.
3. Read job-level data (`gh run view --json jobs`) for any statement about CI timing.
4. When the plan scopes a goal on an untested cause, put a short diagnosis task first and re-plan at its result instead of sizing the fix up front.
5. Amend the BR-1 wording in the contract the next time it is amended (D-007).
6. Ask once at the phase boundary for the operator-only items: branch protection, the stale skill-pack cache `rm -rf`, worktree cleanup, the monthly token ceiling.

## Goal achievement

| Goal | Result | Evidence and limit |
|---|---|---|
| 1. CI gates the server crate | **MET** | `Verify pull request` runs web and server checks (#132); the deploy workflow's image job `needs` the server job (#135). In the #139 deploy run the Server job ended 12:36:52Z and the image builds started 12:37:53Z. The deliberate clippy error failed the server job (run 39283001412) and the web job passed. Limit: on pull requests the check is advisory until the operator sets branch protection. |
| 2. Close control 44 px; flake explained | **MET, with one caveat** | The 44 px close control shipped in #134 with a spec asserting the box at 320 and 1440 px. The flake: two of three failures traced to the thread-row ordering defect, fixed in #137; the third (stalled download) is classified from a trace only. I have no record of the 30-repeat run being repeated against the merged tree, so "fixed" rests on the unit and e2e tests passing in CI, not on a repeat of the original reproduction. |
| 3. Real phone; WebKit and Firefox; remote image | **PARTIAL** | Real phone: `NOT_EXERCISED`, waived. WebKit and Firefox: both specs run once in each engine (#136), mutation checks done. Remote image: descoped; no producer exists in `src`. |
| Added: first send order, home resume button, persistence loss | **MET** | #137, #138, #139 merged; deploy runs green; live image `…@sha256:05af7e81…` 2/2 ready; CSP unchanged. Limit: I read that the image digest changed after #139 and the run was green; I did not prove the digest is the one built from `6232785`, and I did not exercise the fix in a real browser against production. |

## Artifact quality summary

| Metric | Value |
|---|---|
| Per-change QA (artifact-refiner) | not run; the contract's QA is the CI Verify sequence and each change's integration gate |
| Cumulative adversarial review | `pending_review`, no waiver |
| `kbd-apply verify` | PASS for all 7 |
| `kbd-apply archive` | done for all 7 in a worktree (merges with the docs close-out PR) |
| Verify pull request runs | 7 listed, 6 success, 1 failure by design (the proof PR) |
| Deploy site runs, #130 to #139 | 8 of 8 success |

## Technical debt introduced or left

- No end-to-end guard for first send, reload and resume on an empty database.
- CLS not measured in WebKit or Firefox. The front page with web search on, at 320 px, was not captured. Hydration can be slower than the 2 s cap.
- No field count for how often visitors hit the thread-order defect.
- `Verify pull request` is not a required check.
- Stale skill-pack cache directories `1.12.1` and `1.13.0` and many worktrees under `.claude/worktrees/` (this phase's and older) remain until the operator removes them.
- Three visitor strings (reset notice, export omission line, resume button) are approved by merge only; review files record that.
- The EdgeQuake, diagram and user-message Copy plan (`~/.claude/plans/dapper-moseying-kahn.md`) is written and unstarted.

## Lessons captured

- State a cause only after a reproduction; otherwise label it a hypothesis. (Broken once in this phase.)
- `gh run list` status can lag job state; use `gh run view --json jobs` for timing and conclusions.
- A first-send test needs an empty database, a send, a reload and a resume. A unit test on the store alone passed while the product failed.
- When a contract's negative control cannot fail by construction (the string comes from the same source as the code under test), record the deviation and use a behaviour mutation.
- `kbd_stage_gate execute` finds the readiness checker through `KBD_PACK_ROOT`; the `current` plugin generation has no `shared/` directory, so set `KBD_PACK_ROOT` to the plugin cache directory.
- For kubectl on this project use `--context know-me`; the default context is a different cluster.

## Codify as Skill?

No new skill. A candidate for the operator to decide: a short "reproduce before you name a cause" check in the debugging workflow, since it recurred. Left to `pk candidates`; I accept or reject nothing.

## Recommended Next Phase

`chat-diagrams-and-user-copy`: the three increments in `~/.claude/plans/dapper-moseying-kahn.md`, in the plan's order.

1. **A. Copy on user messages** (client only, reuses the shared `CopyButton`).
2. **B. Prompt and knowledge content** so "diagram how the products relate" works from the knowledge base. Needs content-officer pre-review and a security read of the prompt edit; goes live when the operator runs the seed script.
3. **C. EdgeQuake as a graph tool**, only after B gives a baseline, and only after finding out why the workspace has 0 entities.

Carry-in: the first-send end-to-end guard (corrective action 2), and the operator-only items. The operator has not asked for this plan in this phase; it is a recommendation, not a start.
