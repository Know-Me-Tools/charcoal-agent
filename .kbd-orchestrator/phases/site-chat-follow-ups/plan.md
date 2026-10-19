# Plan: site-chat-follow-ups

Date: 2026-10-19. Phase goals: `goals.md`. Assessment: `assessment.md` (assess stage complete). Decisions: `decision-log.md`.

OpenSpec available: YES (managed CLI). Changes to implement: 3. Tasks: 18. Plan revision: 1.

## Operator answers applied at plan time

The assessment asked four questions and the operator did not answer them. The operator's standing instruction is to decide what can be decided and not to ask. Each default below is reversible and is recorded in `decision-log.md`.

| Question | Default taken | Why it is safe |
|---|---|---|
| Monthly token ceiling | No change: 20,000,000 monthly, 2,000,000 daily | Nothing observed shows the ceiling hit. Changing a spend limit without a reason is the riskier move. |
| Wipe notice | Build it: one line, once | Strings are approved by the operator's merge, so building is the question. A PR can be closed unmerged. |
| Export omission note | Build it: one line naming the kinds of content left out | Same. |
| Housekeeping | In the phase, as change 3, with a stop condition on the CSP finding | The CSP test failure may be a real header difference. That is a reason to look, not to defer. |

## Adversarial review

Skipped on the operator's standing instruction. No independent critic has read this plan; the ordering and the scope are one author's reading.

## Recalled lessons that change ordering, scope or risk

- "Require spec deltas before accepting /kbd-plan OpenSpec changes" (recalled at `plan:before`): all three changes carry a delta spec (`chat-export`, `chat-persistence`, `site-server-quality`), so `verify` and `archive` are reachable at the end.
- "A visual or security assertion is not evidence until a mutation check shows it fails on the bug" (previous phase): tasks 1.3 of change 1 and 1.4 of change 2 carry mutation checks.
- "Run the narrow type check on a new test before merge": every test-writing task ends with `tsc --noEmit` on the new file.
- "Merging a client change deploys `knowme-web` with no approval stop": each change ends with a PR that the operator merges; nothing merges on its own.
- "Run `kbd-apply reconcile` before stating a task is closed": execute and reflect run it.
- "Put device checks early, or decide at plan time that they are waivable": no device check is planned in this phase. Goal 1 is closed. Changes 1 and 2 are tested in Chromium only; a real-phone look is recommended after merge, not gated.

## What is not planned, and why

- The smaller review items from the last reflection (`console.warn` on every tab switch, `aria-describedby` for disabled export reasons, `)` escaping in image URLs, same-origin media L4): none is an observed failure on a phone or in a test, and none is in the three goals. They stay on the follow-up list.
- Reply-speed progress cue: a feature, not a fix. Not asked for in the goals.
- The `description` field of the export taking an abandoned first message: cosmetic, noted.
- Export or copy of chats before the wipe: the database is unreadable when the error fires; there is nothing to export.
- Removal of stale worktrees by the agent: `git worktree remove` and `rm -rf` are operator commands. The agent lists them and hands over the command.

## CHANGE LIST (ordered)

1. app-export-omission-note: the export ends with one line when a block the visitor saw was dropped.
   - Scope: ui (export serializer, one string, one review record)
   - Depends on: NONE
   - Recommended agent: km-frontend-engineer (native, Sonnet 5.5)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH (a file that looks complete and is not)
   - Details: record dropped visible blocks in `okf-serialize.ts` and `okf-blocks.ts`, append one line, add the string to `okf-strings.ts`, review it with the content officer, test with a mutation check, then one built-app gate.

2. app-db-reset-notice: after a purge-and-reopen the visitor sees one line saying saved chats on this device were reset.
   - Scope: ui + persistence (`db-provider.tsx`, one string, one review record)
   - Depends on: NONE
   - Recommended agent: km-frontend-engineer (native, Sonnet 5.5)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: MEDIUM (rare, and the loss is total when it happens)
   - Details: first find an honest way to reach the retry path in a real browser; then show one notice once through the existing toast. The recovery is untouched.

3. site-server-gates-green: clippy and the header test pass on main, and the housekeeping that needs the operator is handed over.
   - Scope: server (Rust) + repo hygiene
   - Depends on: NONE
   - Recommended agent: km-rust-engineer (native, Sonnet 5.5)
   - Est. complexity: M
   - Complexity score: Medium (the CSP finding can raise it)
   - Model class: medium
   - Customer value: MEDIUM (a red test on main hides the next real failure)
   - Details: reproduce on a clean worktree, decide drift versus real header change before editing anything, fix, then one serialized cargo gate.

## EXECUTION ROUND ORDER

Round 1 (parallel, separate worktrees): changes 1, 2 and 3. They touch different files (`src/features/export/`, `src/lib/db/`, `server/`). The operator merges them one at a time, and each merge deploys.
Round 2: phase-boundary gate. One cumulative check on `main` after all three merge (production header and a fresh export look), then verify and archive each change, then reflect.

Within Round 1, the order I would merge is 3, then 1, then 2. Change 3 may report a security finding that changes what the other two should assume.

## TASK MODEL ASSIGNMENTS

All routes are native Claude Code subagents on Claude Sonnet 5.5. Reasoning effort is the harness default (no setting recorded). Evidence is task profile only: no benchmark for this repository, dated 2026-10-19. No external worker, liter-llm route or launcher is used, so there are no unresolved prerequisites. The native alternative is the same route.

Route legend: FE = km-frontend-engineer; RS = km-rust-engineer; CCO = km-chief-content-officer (read-only pre-review of copy); SELF = the driver session itself (PR, operator hand-off).

| Phase path | Change ID | Backend task ID | Requirements | Provider/model | Reasoning effort | Rationale and dated evidence | Harness and route | Worker launch and handoff | Native alternative | Availability and verification | Prerequisites |
|---|---|---|---|---|---|---|---|---|---|---|---|
| site-chat-follow-ups | app-export-omission-note | 1.1 | edit serializer; small, one module; no new tools | Anthropic Claude Sonnet 5.5 | harness default | single-file logic with a type-checked allowlist; task profile only, 2026-10-19 | Claude Code, native | FE; scope `src/features/export/`; worktree off `origin/main`; result: diff + note | same | native, configured | none |
| site-chat-follow-ups | app-export-omission-note | 1.2 | one visitor string; plain voice; review record | Anthropic Claude Sonnet 5.5 (FE writes), CCO reviews | harness default | copy review needs the content officer's role, not a stronger model | Claude Code, native | FE writes; CCO read-only pre-review; result: review file under `docs/content/reviews/` | same | native, configured | operator approves by merge |
| site-chat-follow-ups | app-export-omission-note | 1.3 | tests with mutation check; type-check the new test | Anthropic Claude Sonnet 5.5 | harness default | follows the existing leak-test pattern | Claude Code, native | FE; scope `src/features/export/*.test.ts`; result: test run output | same | native, configured | none |
| site-chat-follow-ups | app-export-omission-note | 1.4 | built app, Chromium, read a downloaded file | Anthropic Claude Sonnet 5.5 | harness default | needs the packaged build and a real download; task profile only | Claude Code, native | FE; Playwright; result: evidence file in `evidence/<date>/` | same | native, configured; Node 24.21.0 first on PATH | none |
| site-chat-follow-ups | app-export-omission-note | 1.5 | open PR ready, hand over to the operator | Anthropic Claude Sonnet 5.5 | harness default | mechanical | Claude Code, native | SELF; `gh pr create`; result: PR URL | same | native, configured | operator merges |
| site-chat-follow-ups | app-db-reset-notice | 1.1 | investigate how to reach a corrupt-database open in a real browser; uncertain | Anthropic Claude Sonnet 5.5 | harness default | open-ended search; may end with "no honest method"; task profile only | Claude Code, native | FE; scope `src/lib/db/`, `e2e/`; result: method note or a recorded dead end | same | native, configured | none |
| site-chat-follow-ups | app-db-reset-notice | 1.2 | one toast after retry; small | Anthropic Claude Sonnet 5.5 | harness default | few lines in one provider | Claude Code, native | FE; scope `src/lib/db/db-provider.tsx`; result: diff | same | native, configured | task 1.1 decides what can be tested |
| site-chat-follow-ups | app-db-reset-notice | 1.3 | one visitor string; review record | Anthropic Claude Sonnet 5.5 (FE writes), CCO reviews | harness default | as for change 1 | Claude Code, native | FE writes; CCO read-only pre-review; result: review file | same | native, configured | operator approves by merge |
| site-chat-follow-ups | app-db-reset-notice | 1.4 | tests with mutation check | Anthropic Claude Sonnet 5.5 | harness default | follows existing `DbProvider` tests | Claude Code, native | FE; scope `src/lib/db/*.test.ts*`; result: test run output | same | native, configured | task 1.2 |
| site-chat-follow-ups | app-db-reset-notice | 1.5 | built app, reach the reset path, look at the screen | Anthropic Claude Sonnet 5.5 | harness default | needs a real browser look; screenshot read, not only captured | Claude Code, native | FE; Playwright; result: evidence file + screenshot read | same | native, configured | method from task 1.1 |
| site-chat-follow-ups | app-db-reset-notice | 1.6 | open PR ready, hand over | Anthropic Claude Sonnet 5.5 | harness default | mechanical | Claude Code, native | SELF; `gh pr create`; result: PR URL | same | native, configured | operator merges |
| site-chat-follow-ups | site-server-gates-green | 1.1 | clean worktree, run clippy and one test file, record output | Anthropic Claude Sonnet 5.5 | harness default | read-only reproduction | Claude Code, native | RS; scope `server/`; result: output file | same | native, configured; single-writer cargo target | none |
| site-chat-follow-ups | site-server-gates-green | 1.2 | read test, header code and the live header; judge drift versus real change; security-relevant | Anthropic Claude Sonnet 5.5 | harness default | judgment task with a stop condition; the km-security-officer role may read the result | Claude Code, native | RS reads; km-security-officer read-only if the live header is weaker; result: finding note | same | native, configured; read-only `curl -sI` of the live site | none |
| site-chat-follow-ups | site-server-gates-green | 1.3 | fix three clippy errors without changing behaviour | Anthropic Claude Sonnet 5.5 | harness default | small Rust edits, each read for behaviour | Claude Code, native | RS; scope `server/src/`; result: diff | same | native, configured | task 1.1 |
| site-chat-follow-ups | site-server-gates-green | 1.4 | fix the test, or the header if task 1.2 and the operator say so | Anthropic Claude Sonnet 5.5 | harness default | depends on 1.2 | Claude Code, native | RS; scope `server/tests/`, `server/src/`; result: diff | same | native, configured | task 1.2 outcome; operator agreement if the header changes |
| site-chat-follow-ups | site-server-gates-green | 1.5 | clippy with warnings denied and the server suite, once, serialized | Anthropic Claude Sonnet 5.5 | harness default | single gate run | Claude Code, native | RS; one cargo invocation at a time; result: output file | same | native, configured | tasks 1.3, 1.4 |
| site-chat-follow-ups | site-server-gates-green | 1.6 | decide probe edits, list worktrees, write the removal command | Anthropic Claude Sonnet 5.5 | harness default | reading and listing only; removal is the operator's | Claude Code, native | SELF; result: command text for the operator | same | native, configured | operator runs the removal |
| site-chat-follow-ups | site-server-gates-green | 1.7 | open PR ready, hand over | Anthropic Claude Sonnet 5.5 | harness default | mechanical | Claude Code, native | SELF; `gh pr create`; result: PR URL | same | native, configured | operator merges |

## Budgets

Time: 600 minutes of agent work across the phase. Tool calls: 600. Repair attempts per failing gate: 3. No-progress limit: 3 consecutive attempts with the same failure. Token budget: UNKNOWN (not measured in this repository); fallback is the tool-call ceiling. Exhaustion means checkpoint and BLOCKED, never a silent skip of a gate.

## Contract binding

The adopted contract is `adopted-contract.json` in this phase directory (frozen scenario set EXP-1, EXP-2, DB-1, DB-2, SRV-1, SRV-2). Adoption is recorded by `shared/scripts/kbd-contract-adopt.sh`; the digest and plan revision are stamped by that script. Scenario to task coverage:

| Scenario | Owner tasks |
|---|---|
| EXP-1 omission line present for dropped visible content | app-export-omission-note 1.1, 1.3, 1.4 |
| EXP-2 no omission line for plain or hidden-only chats | app-export-omission-note 1.3, 1.4 |
| DB-1 reset notice shown once after purge-and-reopen | app-db-reset-notice 1.2, 1.4, 1.5 |
| DB-2 no notice on a normal start or on reload | app-db-reset-notice 1.4, 1.5 |
| SRV-1 clippy with warnings denied is clean | site-server-gates-green 1.3, 1.5 |
| SRV-2 header test asserts the header the server sends | site-server-gates-green 1.2, 1.4, 1.5 |

Evidence invalidation: evidence is keyed to the commit it ran against. A later commit to the files a scenario touches invalidates that scenario's evidence only; other scenarios keep theirs.

## Boundary execution packet (one, post-implementation only)

After all three PRs are merged by the operator:
1. `curl -sI https://know-me.tools` and compare the Content-Security-Policy to the test's expectation (read-only).
2. Look at the deployed digest: `kubectl --context know-me -n knowme get deploy knowme-web -o jsonpath='{.spec.template.spec.containers[*].image}'`.
3. In a fresh browser profile, run one chat and export it; open the file; confirm there is no omission line for a plain chat.
4. Run `kbd-apply reconcile site-chat-follow-ups`; expected clean.
Expected effects: none beyond reads. Approvals: none. Stop conditions: a CSP header weaker than intended, or an export that leaks an identifier: stop and report. Cleanup: none.

## COMMANDS TO RUN

```
/kbd-execute site-chat-follow-ups
```

Execute starts with change 3 (task 1.1) so a security finding surfaces before the client changes merge.

PLAN COMPLETE

## Sycophancy self-check (manual)

- S-03: the plan states trade-offs and cuts: five items not planned, three defaults taken in place of answers, the reset notice cannot bring chats back.
- S-07: scope is the three goals; the cut list is explicit.
- S-02: the largest unsupported assumption is that the CSP failure is drift. Task 1.2 exists to test it, with a stop condition.
- Weakest part: effort figures (M, M, M) are guesses; none was measured.
