ASSESSMENT: site-chat-follow-ups
Project: KnowMe site (charcoal-agent)
Date: 2026-10-19
Codebase baseline: `origin/main` at `7eb995d` (PR #126, docs only); production runs the #125 image `sha256:81b2442b…d226e9`, 2 of 2 replicas ready. All code facts below were read from `origin/main` with `git grep` and `git show`; the main checkout is on `fix/site-copy-officer-edits` and has none of the export code, so it was not used.
Cross-tool progress: none. `progress.json` shows 0 of 0 changes; no other tool has touched this phase.

Adversarial review: skipped (`--skip-adversarial-review`, the operator's standing instruction). No independent critic has read this assessment. The sycophancy-correction server is not connected this session, so `detect_sycophancy` was not run; the self-check is manual (see the end).

## Recalled lessons that apply

From `prior-context.md`:
- "Put device checks early in a phase, or decide at plan time that they are waivable and say so." Applied: goal 1 ran first and is closed on the operator's report.
- "Run `kbd-apply reconcile` before stating a task is closed." Applies to plan and execute.
- "Run the narrow type check on a new test before merge." Applies to any test added for goal 2.
- "For a reported live fault, capture the real production stream with timestamps before choosing a fix." Applies if the saved-chat wipe is ever reported as a live fault (see goal 2).

Knowledge gaps: none recorded. No `/learn-goal` offers.

## IMPLEMENTATION STATUS

- Device checks (goal 1): DONE on report. The operator reported all five checks passing on iPhone and Android ("I validated all these operations on mobile iOS and android"). The agent saw one artefact, the Android single-chat file. Detail, device models, browsers and zip Prepare time are not recorded. Evidence: `evidence/2026-10-18/device-check-sheet.md`.
- Export, single chat and zip bundle: DONE. Merged through #124 and #121; production on #125.
- Export omission note: MISSING. `src/features/export/okf-serialize.ts:168` drops any block type without a "serialized" entry. `okf-blocks.ts` has three silent drop paths:
  1. Block types listed "omitted" (`reasoning`, `tool-call`, `skill-activation`, `context-update`, `memory-recall`, `memory-mutation`, `step`). By design (spec 6.1: what the app stores, not what the visitor sees). Not a defect.
  2. `artifactMarkdown` returns `null` for input requests and for every artifact type outside `code, html, svg, mermaid, markdown`. Form, confirm and display artifacts are dropped with nothing in the file.
  3. `imageMarkdown` returns `null` for images that are not own-host or same-origin.
  No grep hit anywhere in `src/features/export` or `content/site` for a "not included" or "left out" line. Paths 2 and 3 are content the visitor saw and the file lacks. Path 1 is not.
- Saved-chat wipe notice: PARTIAL. `src/lib/db/db-provider.tsx:86-91` deletes the whole IndexedDB when PGlite throws a message containing "bundle size", then reopens once. Only `console.warn` marks the wipe. `discardJournalAfterPurge` (`persistence-journal.ts:634`) raises the failure toast only when this tab has a pending journal entry (`if (!raw) return;`). A visitor with saved chats and an empty journal loses them with no visible notice. The toast path (`reportFailure`) was traced to a failure toast in comments; its on-screen wording was not read.
- Token ceiling: DONE (default). `server/src/config.rs:67` `DEFAULT_MONTHLY_TOKENS = 20_000_000`; `k8s/base/knowme-web-deployment.yaml:107` sets the daily budget to 2,000,000 and its comment says the monthly ceiling stays at the default. The config guard rejects a daily budget above the monthly one.
- Housekeeping: UNKNOWN this session. The three clippy errors, the failing CSP test in `server/tests/meter_and_headers.rs`, the stale worktrees and the uncommitted probe edits in the `stall` worktree are carried from the 2026-10-17 reflection. None was re-run or re-listed today, apart from `git worktree list`, which counted 97 worktrees.

## CROSS-TOOL PROGRESS
NONE: no cross-tool activity recorded.

## SPEC GAP SUMMARY

- G-1 (visible loss, export): a visitor who exports a chat containing a form, confirm or display artifact, or a remote image, gets a file with no mark that content was left out. `openspec/specs/chat-export/spec.md` states the allowlist; the assessment did not re-read it to check whether it requires an omission note. Open question for plan.
- G-2 (silent loss, storage): the wipe on a "bundle size" error removes every saved chat and shows nothing in the common case. The data is already unreadable when the error is thrown, so there is nothing to export first; the gap is the notice, not the recovery.
- G-3 (privacy wording): any "not included" line is new visitor-facing text. It needs a content-officer pre-review, a review record in `docs/content/reviews/`, and the operator's approval by merge (standing rule).
- G-4 (cosmetic): the export's `description` field takes the visitor's first message even when it was abandoned ("How can know"), while `title` takes a later one. Seen in the Android file.
- G-5 (not assessed): the smaller review items carried from the last reflection (`console.warn` on every tab switch, `aria-describedby` for disabled export reasons, `)` escaping in image URLs, same-origin media L4, A2UI and logo cards as a separate case, reply-speed progress cue) were not inspected. They are not in the three goals.

## BUILD HEALTH

- build check: UNKNOWN. No build, type check or test ran in this stage (assess is read-only here). The last known gate is CI on #125, which passed.
- known violations: three clippy errors and one CSP test failure in `server/`, both carried from the 2026-10-17 reflection as present on a clean `origin/main`; not re-verified.
- test coverage: PARTIAL. The export has serialize, leak, inert, round-trip and completeness tests (`src/features/export/*.test.ts`). No test covers the saved-chat wipe notice, and none can cover an omission note that does not exist yet.

## CONSTRAINT CHECK

- AGENTS.md violations: NONE found in what was read.
- constraints.md violations: N/A (not read).
- Standing constraints that bind plan and execute: never touch the kill switch or `SITE_CHAT_KILL_SWITCH_EXPECTED`; never read credential values; open PRs ready, never draft; the operator merges; a merge to `main` without `[skip ci]` deploys `knowme-web` to production immediately; new visitor-facing strings go through content review and a review record.

## ADOPTED-OUTCOME INPUTS

- User operation: a visitor exports a conversation and gets a file that is complete for what they saw, or says what is missing; a visitor whose saved chats are wiped is told.
- Observed baseline: export Save, Copy as Markdown, zip, image Copy and user-message Copy work on iPhone and Android (operator report). The file for a plain text chat is correct (read). UNKNOWN: whether a chat with a form, confirm or display artifact, or a remote image, exports cleanly and silently; the visible wording of the existing failure toast; how often the wipe path fires in production.
- Desired observable result: (a) an exported file that dropped a visible block carries one plain line saying so; (b) after a wipe the visitor sees one line saying saved chats were reset; (c) a recorded decision on the monthly token ceiling; (d) the housekeeping items either fixed or listed as deferred.
- Supported environments: the production site in current iOS Safari and Android Chrome (browser not stated by the operator for the Android run), desktop Chromium for automated checks. WebKit and Firefox desktop runs remain unverified.
- Required safety checks: the export privacy proofs must stay green (zero network requests, leak test with mutation check); any new string must not carry a thread id, token or internal URL; the kill switch stays untouched.
- Exclusions and deferred (proposed, not yet adopted): the smaller review items in G-5; the reply-speed progress cue; the listed-omitted block types in path 1; any change to the PGlite recovery itself.
- Risk acceptance: a notice that appears on a wipe does not recover the lost chats; it only stops the loss being silent. The operator should accept that limit or ask for a different design.
- Decision owner: the operator (Travis James). Ceiling decision: operator. Visitor wording: operator by merge.

## GOAL PROGRESS

1. Device checks: MET on operator report. Evidence is a summary statement plus one read file; zip Prepare time and device models are not recorded.
2. Export data-loss fixes: NOT MET. Assessed above: G-1 and G-2 are real; neither is built. The assessment did not reproduce a wipe or export a chat with a form artifact.
3. Token ceiling and housekeeping: NOT MET. The ceiling is at the default and awaits the operator's call. The housekeeping items were not re-verified.

## Open questions for plan (operator)

1. Monthly token ceiling: keep 20,000,000 (daily 2,000,000)? If there is no answer, plan records "no change".
2. Wipe notice: one line shown after a reset ("saved chats on this device were reset"), or leave it silent? It is new visitor text.
3. Export omission note: one line in the file, for example at the end of the conversation, naming the kinds of content left out? Or only the count? Both are new text.
4. Housekeeping: fix the clippy errors and CSP test in this phase, or list them as deferred? They are in the Rust server, which deploys on merge.

## Sycophancy self-check (manual)

- S-03: gaps were surfaced (G-1 to G-5, UNKNOWN baseline items).
- S-02: no claim of correctness for existing code without evidence; the one design call (the wipe recovery is sound) rests on the code reading at `db-provider.tsx:86-91`, where the error means the database is already unreadable.
- Weakest part: "the data is already unreadable" is inferred from the error message and the comment in the code, not tested against a real corrupt database.

ASSESSMENT COMPLETE
