# Verification: chat-persistence-durability (task 3.2)

Owner: km-product-owner. Phase: `complete-rebranding` (Execute stage). Branch: `rebrand/chat-persistence-durability`. Final count on `d51be31`, plus the uncommitted working-tree changes: `e2e/chat-persistence.spec.ts` (7 new tests, 3 extended) and the new `src/lib/db/write-queue.real-pglite.test.ts`. Earlier counts: the first on `1cccdcf`, the second on `d51be31` before QA §4–6.

Sources:
- `specs/chat-persistence/spec.md`
- `docs/qa/chat-persistence-durability.md`: the task 2.1 part (§1–5), the task 3.1 part (§1–4) and the task 3.2 part (§1–6)
- the commits listed in §1
- the test files named below, read for what they assert, not for their titles
- the source files named where a clause rests on reading code

## Result

**18 scenarios: 18 MET, 0 PARTIAL, 0 UNMET.**

History of the count:
- First count, on `1cccdcf`: 9 MET, 8 PARTIAL, 1 UNMET.
- Second count, on `d51be31` before QA §4–6: 12 MET, 6 PARTIAL, 0 UNMET. Rows 12, 13 and 16 moved to MET and row 18 from UNMET to MET. Row 6 dropped to PARTIAL because its 20× run was on an older save path.
- Final count: rows 6, 7, 8, 14, 15 and 17 moved to MET. Row 6 has the 20× matrix re-run on the final tree (80/80). Rows 7, 8 and 17 have tests against real PGlite SQL. Row 14 has a deterministic wait and a failure count above 1. Row 15 asserts the diagnostic log. Every one of these has a recorded mutation run that makes it fail (QA §4.1–4.3).

Every row's test has now passed on the final tree: vitest 322/322, full e2e 197/197, and the 20× reload matrix 80/80 (§1.2).

The planning summary said the spec had 17 scenarios. That count was wrong: it has 18.

| Status | Meaning |
|---|---|
| MET | A standing automated test, or a measured runtime value, exercises the THEN clause in full. |
| PARTIAL | Standing automated evidence does not cover the whole THEN clause. At least one clause rests on one of: a fake database standing in for PGlite, a one-off Playwright run whose spec was deleted afterwards, or reading the source. |
| UNMET | No runtime evidence for the THEN clause, or reading the source shows a clause is not implemented. |

The rule is the one used for chat-surfaces-flat2. A clause is covered only when a test that still exists and runs in the gate asserts it. A test that proves call order against a fake `CharcoalDb` covers ordering. It does not cover what ends up in the saved conversation, because the fake does not run the SQL.

### The uncomfortable thing

An all-MET verdict is the result a reviewer should trust least, so these are its weak points.

- **Every mutation proof is a recorded run, not a repeatable test.** QA 3.2 §2 and §4.1–4.3 made each mutation in a scratch copy outside the repo and did not keep the copy. Rows 7, 8, 14, 15, 16 and 17 rely on those runs to show the tests can fail. Anyone re-checking has to redo the mutation.
- **Rows 7, 8 and 17 run on in-memory PGlite in jsdom.** They are not in a browser against IndexedDB. The test mocks the `PGlite` constructor to drop the `idb://` DSN. The schema, constraints and SQL are the production ones, but the storage layer beneath them is not exercised.
- **The `pagehide` path is proven only in jsdom.** Every real-browser journal test triggers the journal with a synthetic `visibilitychange`, done by redefining `document.visibilityState`. `page.reload()` does fire a real `pagehide`, but no test attributes the journal write to it.
- **The final gate has two gaps.** The typecheck in QA §6 was `tsc --noEmit -p tsconfig.app.json` only. `npm run typecheck` also runs `tsc -p e2e/tsconfig.json`, and that project is where most of the new code is. Playwright transpiles without type-checking, so a type error in the e2e spec would not show up. `npm run test:a11y` was not re-run on the final tree either. Neither gap is scenario evidence, so the count does not change. Both belong in the pre-archive gate (finding 6).
- **The suite depends on the Node version.** Under Node 26, vitest fails 19 tests because of a jsdom `localStorage` clash. That is recorded in `.prometheus/gotchas.md`. The 322/322 is a Node v24.16.0 result.

**Resolved since the first count.** The reload tests can now be attributed to the journal. The test "A write held pending at reload is journaled…" failed 10/10 with `installPersistenceJournal()` disabled and 10/10 with `replayJournal` disabled (QA 3.2 §2). A failed replay now raises a notice: `d51be31` added the `pendingNotice` latch and the app-wide `PersistenceNotices` (row 18).

## 1. Gates on `1cccdcf` (the first count's tree)

The orchestrator ran these, one run each. This file reports its results. None of them has run on `d51be31` (§1.1).

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | exit 0 |
| Types | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | 0 errors, 2 pre-existing warnings (`src/components/ui/button.tsx`, `src/components/ui/tabs.tsx`, `react-refresh/only-export-components`) |
| Unit | `npm test` | 301 / 301 |
| E2E, full suite | `npm run test:e2e` | 190 / 190, one run |
| Axe | `npm run test:a11y` | 24 scans, 5 violations across 3 rules, all pre-existing and on other pages (agents, landing, settings-skills). `thread` light 0, `thread` dark 0 |

QA's stability runs were on `5763bbe`, before the toast fix (QA 2.1 §3):

| Command | Result |
|---|---|
| `npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts -g "reload" --repeat-each 20 --workers=1` | 60 / 60 |
| `npx playwright test e2e/chat-surfaces.spec.ts -g "retry replaces the failed turn" --repeat-each 10 --workers=1 --trace on` | 10 / 10. The same command failed 10 / 10 in `docs/qa/chat-surfaces-flat2.md` §6.15. |
| `npx playwright test e2e/chat-persistence.spec.ts --repeat-each 20 --workers=1` | 100 / 100 |
| `npx playwright test e2e/chat-persistence.spec.ts -g "data-persistence reads" --repeat-each 30 --workers=1` | 30 / 30 |

- **Which tests `-g "reload"` matched.** I confirmed with `--list`, run for this file. It matches 3 tests:
  - `chat-persistence.spec.ts:50` "Reload immediately after a reply finishes…"
  - `chat-persistence.spec.ts:70` "A reply that ended in an error survives an immediate reload"
  - `chat-surfaces.spec.ts:788` "…both survive a reload"
- **The toast fix and stability.** `1cccdcf` touches only `sonner.tsx`, its test, the Flat 2.0 guard and the QA doc, so no persistence path changed. The repeat runs were not re-run on `1cccdcf`. On that tree these tests have one run each, inside the 190 / 190.
- **One flake during QA, since fixed.** QA hit one flake while stabilising (1 of 100). The cause was test scaffolding: a `page.evaluate` ran before `networkidle`. The spec was fixed, then re-run 30 / 30 and 100 / 100 (QA 2.1 §4).

### 1.1 Runs on the recounted tree (`d51be31` plus the uncommitted e2e additions)

Reported by QA in 3.2 §2–3. I did not run Playwright for this recount, because another run may hold port 4174.

| Command | Result |
|---|---|
| `npx playwright test e2e/chat-persistence.spec.ts --workers=1` | 12 passed (51.2s) |
| `npx playwright test e2e/chat-persistence.spec.ts --repeat-each 5 --workers=1 --retries=0` | 60 passed (4.2m) |
| Journal test, scratch copy, control, `-g "journaled to this tab" --repeat-each 3 --retries=0` | 3 passed |
| Same, `installPersistenceJournal()` call commented out, `--repeat-each 10` | 10 failed, all at `expect(journalBefore).not.toBeNull()` |
| Same, `await replayJournal(db)` commented out, `--repeat-each 10` | 10 failed, all at the reply-visible-after-reload assertion |

**Not run on this tree:** `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, the full `npm run test:e2e`, `npm run test:a11y`, and the `-g "reload" --repeat-each 20` matrix. Every unit test title this file cites exists in the `d51be31` sources. I checked that with `grep`. It does not show that they pass on that tree.

### 1.2 Final gate on the final tree (QA §6, Node v24.16.0)

Reported by QA. I did not run these commands.

| Command | Result |
|---|---|
| `npx vitest run` | 40 files, 322 passed |
| `npx tsc --noEmit -p tsconfig.app.json` | exit 0. This is only the app project; `npm run typecheck`'s second project, `e2e/tsconfig.json`, is not recorded. |
| `npm run lint` | 0 errors, 2 warnings (existing react-refresh) |
| `npm run build` | built in 11.25s |
| `npx playwright test --workers=5` | 197 passed (3.3m) |
| `npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts -g "reload" --repeat-each 20 --workers=1 --retries=0` | 80 passed (4 tests × 20, 6.5m) |
| `npm run test:a11y` | **not run** on this tree |

Environmental: under Node 26, vitest fails 19 tests because of a jsdom `localStorage` clash (`.prometheus/gotchas.md`).

Task commits (`git log --oneline main..HEAD`):

```
d51be31 fix: app-wide save notices, per-turn saves, per-tab journals
1cccdcf fix: toasts sit top-center clear of the composer, and are Flat 2.0
5763bbe test: reload-survival e2e for durable chat persistence
bc2a460 feat: page-exit journal, replay on open, visible save state, failure notice
3f083c6 feat: serial write queue for local chat persistence
04bbdae docs(openspec): plan chat-persistence-durability change
```

## 2. Scenario to evidence

Abbreviations:
- **persist**: `e2e/chat-persistence.spec.ts`
- **surfaces**: `e2e/chat-surfaces.spec.ts`
- **queue**: `src/lib/db/write-queue.test.ts`
- **journal**: `src/lib/db/persistence-journal.test.ts`
- **status**: `src/hooks/use-persistence-status.test.tsx`
- **notices**: `src/components/common/persistence-notices.test.tsx` (added in `d51be31`)

Every `persist` and `surfaces` test runs against the real PGlite/IndexedDB path in Chromium. `queue`, `journal`, `status` and `notices` run in jsdom against a fake database or a mocked queue.

### Finished replies are saved durably

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Reload immediately after a reply | MET | persist › "Reload immediately after a reply finishes keeps exactly one user message and one reply". The test waits for the reply text only, reloads, then asserts 1 `[data-role="user"]`, 1 `[data-role="assistant"]`, and the same user and reply text. Runs: 60 / 60 in the `-g reload` matrix, 100 / 100 in the full-file repeat, and 1 / 1 in the final gate, all on `1cccdcf` or earlier. On `d51be31`: 1 / 1 and 5 / 5 inside the 12 / 12 and 60 / 60 file runs (§1.1). |
| 2 | Reply that ended in an error | MET | persist › "A reply that ended in an error survives an immediate reload" (`ERROR_STREAM_EVENTS`). After an immediate reload: the user text is shown, 1 user and 1 assistant message, the plain-language `MESSAGE_ERROR_TEXT` is shown, and `RAW_STREAM_ERROR_TEXT` has count 0. |
| 3 | Reopen after the page was closed | MET | persist › "Reopening the thread in a new tab of the same browser context shows the saved reply". The first page closes, a new page in the same context opens the thread, and it shows 1 user and 1 assistant message with both texts. Weaker than it reads: the test waits for `data-persistence="saved"` before it closes the tab. Closing *while* saves are pending is not tested. Row 16 covers a *reload* while saves are pending, and no test closes a tab with the journal written and reopens the thread elsewhere. This test ran 1 / 1 and 5 / 5 on `d51be31` (§1.1). |

### Retry and Regenerate replacements survive a reload

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 4 | Reload immediately after Try again | MET | surfaces › "Message error: retry replaces the failed turn (no duplicate); Regenerate replaces a good reply; both survive a reload" (line 788). Right after the retried reply is visible, it runs `page.reload()`, then asserts 1 user, 1 assistant, `FIXTURE_FINAL_TEXT` visible and `MESSAGE_ERROR_TEXT` count 0. |
| 5 | Reload immediately after Regenerate | MET | Same test. It runs `page.reload()` right after the regenerated reply is visible, then asserts `REGENERATED_REPLY_TEXT` visible, 1 user, 1 assistant and `FIXTURE_FINAL_TEXT` count 0. Because the assistant count is 1 and the text is the regenerated one, no part of the replaced turn survives as a message. |
| 6 | Stable under repetition | MET | QA §6, on the final tree (`d51be31` plus the uncommitted tests, Node v24.16.0): `npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts -g "reload" --repeat-each 20 --workers=1 --retries=0` gave **80 passed**. That is 4 tests × 20: persist "Reload immediately after a reply…" (line 50), "A reply that ended in an error survives an immediate reload" (70), "A write held pending at reload is journaled…" (280) and surfaces "…both survive a reload" (788). The Try again and Regenerate reloads both sit in the line-788 test, so each ran 20 times. Earlier runs: 60 / 60 on `5763bbe`, before `d51be31` changed the save path. |

### Saves apply in the order they were made

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 7 | Removal followed by a replacement | MET | `src/lib/db/write-queue.real-pglite.test.ts` › "row 7: applies a removal that is still pending before a replacement requested while it's in flight, and the real row set ends up correct". It uses the real `CharcoalDb` schema and SQL on an in-memory PGlite, with the real `enqueueWrite`. `deleteMessages` is gated, and a settle flag confirms it is still pending when the replacement is enqueued, which is the scenario's WHEN exactly. It asserts that settlement order is `["deleteMessages","upsertMessage"]` and that `getMessages()` returns `["u1","a1-new"]`. Runs: 10/10 file re-runs and 322/322 in the full vitest suite (QA §4.1, §6). Mutation: removing the queue's chaining fails this test on the order assertion (QA §4.1). QA notes that the final row set alone would not show ordering, because the ids do not overlap. The settlement-order assertion is what does. **Limit:** in-memory PGlite in jsdom, not IndexedDB-backed. The spec clause is about order and the saved rows, and the SQL is the production SQL. |
| 8 | New conversation's first exchange | MET | `write-queue.real-pglite.test.ts` › "row 8, negative control…" shows the `messages.thread_id` foreign key really rejects an orphan insert. › "row 8: a new conversation's thread row lands before its first message even when the thread write is still pending, with no message save rejected" gates the real `upsertThread` and confirms it is still pending. It then enqueues the first reply's `upsertMessage` while the thread row does not exist, releases the gate, and asserts that neither write rejects and that both rows exist. Because the foreign key is live, the message insert could not succeed without the thread row, so the order clause is enforced by the database itself. Mutation: without the queue's chaining, the test fails with a real `messages_thread_id_fkey` violation (QA §4.1). Runs as row 7. Same in-memory limit as row 7. |
| 9 | A failed save does not block later saves | MET | queue › "does not stop later writes when one fails": the first write rejects, the second resolves, and calls are `["upsertThread","touchThread"]`. queue › "reports the failure to the enqueuer's own promise, not to later callers". |
| 10 | Completion can be awaited | MET | queue › "resolves after all prior writes settle, and resolves even when one failed", and "pendingWriteCount() goes to 0 after flush()". `use-chat-runtime.onreload.test.tsx` shows the real awaiting caller: no fetch before the delete settles, one fetch after. |

### Save state is observable

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 11 | Saving then saved | MET | persist › "data-persistence reads saving while a save is pending and saved once it settles". A `MutationObserver` on the real `[data-persistence]` attribute, installed before the send, logs a `saving` entry and ends at `saved`. Unit check: status › "reads saving while a write is pending, then saved once it settles". The attribute is real product state on `.aui-thread-root` (`enhanced-thread.tsx`), with no build-mode gate. The observer's `window.__persistenceLog` lives only inside the test's `page.evaluate`. |
| 12 | Failed then recovered | MET | persist › "The failed save state clears back to saved after a later write succeeds". Against the real queue and real PGlite/IndexedDB: every `put` aborts, the test asserts `data-persistence="failed"`, restores the original `put`, sends a second message, and asserts `data-persistence="saved"`. This replaces the first count's mocked-`hasFailedWrite()` unit test and the deleted one-off QA 3.1 §3 spec. Runs: 1/1 and 5/5 (QA 3.2 §3). Unit support: status › "reads failed after a failure, and saved again after a later success". |

### Save failures are reported without breaking the conversation

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 13 | A save fails | MET | **Notice appears once:** persist › "A simulated local-write failure shows the plain-language notice once…" (text count 1) and persist › "A burst of failing writes from one turn shows exactly one toast element". **Focus, reply, further send:** persist › "A failed save keeps focus in the composer, the reply on screen, and the composer usable for a further send". After the notice is visible it asserts that `document.activeElement` is the composer, that the toast's box does not overlap the composer's, and that the first reply is still visible. Then it sends a second message and asserts the second reply plus 2 user and 2 assistant messages. This ran on the tree with the top-centre toast, which closes first-count finding 5. **Caveat:** the further send happens after the `put` injection is reverted, so it shows the composer can still send after a failure. It does not show a send while saves are still failing. |
| 14 | Several saves fail together | MET | persist › "A burst of failing writes from one turn shows exactly one toast element". The fixed 1000 ms wait is gone. The test now registers a `page.waitForResponse` for the turn's title request before sending, then re-checks `data-persistence="failed"` by polling the DOM, so the delayed `setTitle` write has settled too. It counts `[write-queue] … failed` console lines and asserts **more than 1** (the primary assertion); it also asserts `__putAbortCount > 1` as a secondary signal. Then it asserts exactly 1 `[data-sonner-toast]`. Runs: 10/10 repeated, 12/12 file run, and 197/197 full e2e on the final tree (QA §4.2, §6). Mutation: cutting the turn down to one failing write fails the test at `writeQueueFailures.length > 1` 5/5 (QA §4.2). |
| 15 | No raw errors | MET | **Plain text only:** on the page, persist asserts no `QuotaExceededError`, `AbortError` or `DOMException` text, and persist › "A replay failure at startup…" asserts no `not-a-real-role`, `CheckViolation` or `constraint` text. In units: notices › "shows the fixed plain-language text and never the raw error". **Logged for diagnosis:** persist › "A simulated local-write failure shows the plain-language notice once and keeps the conversation usable" now listens on the page console and asserts that a `[write-queue] … failed` `console.error` line appears. Runs: 10/10 and 12/12 (QA §4.3), plus the final-tree 197/197 (QA §6). Mutation: turning `reportFailure`'s `console.error` into a no-op fails the test 5/5 (QA §4.3). |

The notice's axe and focus behaviour sit in the thread region, which scans 0 / 0 in both themes. The toast is inside sonner's `aria-live="polite"` section, queried on the page in QA 3.1 §3 (one-off run). `src/components/ui/sonner.test.tsx` checks the new top-centre position and the Flat 2.0 treatment. It does not check the live region.

### Saves pending at page exit are kept where the browser allows

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 16 | Reload while saves are pending | MET | persist › "A write held pending at reload is journaled to this tab's own key and replayed on the next start". `holdWritesPending` swallows IndexedDB completion events, so `data-persistence="saving"` is guaranteed and not sampled. The test asserts that `knowme-pending-writes-v1:<tabId>` holds version 1 and at least one `upsertMessage` descriptor. It then reloads (the injection does not survive the navigation) and asserts the reply, the user text, 1 user and 1 assistant message, and that the key is gone. **Attribution:** fails 10/10 without `installPersistenceJournal()` and 10/10 without `replayJournal`, and passes 3/3 as the control (QA 3.2 §2). The reply therefore comes from replay. **"Before the conversation is shown"** is met by consequence: the first view after reload already includes the replayed reply. The ordering itself rests on `db-provider.tsx` awaiting `replayJournal(db)` before `setValue({ ready: true })`. **Caveats:** the journal is triggered by a synthetic `visibilitychange`; `pagehide` is covered by journal › "dispatching pagehide with two pending writes stores both descriptors, in order" (jsdom only). The mutation runs came from a scratch copy that was not kept. |
| 17 | A recorded save had already applied | MET | `write-queue.real-pglite.test.ts` › "replaying an already-applied upsertMessage leaves exactly one row, not a duplicate" and › "replaying a deleteMessages descriptor for an already-removed turn is a harmless no-op — no removed turn reappears". Each test calls `applyDescriptor` twice against real PGlite. That is the function `replayKey` uses to replay (`persistence-journal.ts:314`), so a second application stands in for "the save had already applied, and replay applies it again". The tests assert exactly one row, and an empty row set with no error. Mutations: removing `ON CONFLICT (id) DO UPDATE` fails the upsert test with `messages_pkey`, and making a zero-row delete throw fails the delete test (QA §4.1). Same in-memory limit as row 7. The earlier fake-store test (journal › "replaying an already-applied suffix…") still covers `upsertThread`. |
| 18 | A recorded save cannot be applied on the next start | MET | **Fix:** in `d51be31`, `reportFailure` latches a failure reported before any subscriber exists (`pendingNotice`, `write-queue.ts`). `PersistenceNotices` mounts app-wide in `App.tsx` and receives the latched failure once. Unit tests: queue › "delivers a failure reported before any subscriber existed to the first subscriber that mounts afterward" and "delivers the latched failure only once…". **Notice shown once, and the app finishes starting:** persist › "A replay failure at startup shows the notice once the app is ready, and the app still finishes starting". It writes a journal entry for this tab that real PGlite rejects (a `messages.role` value the migration's CHECK refuses), then reloads. It asserts the composer is visible and editable, the notice is visible with count 1, the key is removed, and no raw error text appears. **Remaining saves still apply, in order:** journal › "skips a failing descriptor, applies the rest, and reports exactly one failure" (`["upsertThread","touchThread"]`, one failure, key removed). That test uses a fake; row 9 uses the same standard. The e2e journal holds only one descriptor, so the in-order part is not shown against real PGlite. **Stability:** the e2e test was flaky, failing 3/80 at `--workers=5`. The cause was in the test, not the app: the old page's `syncJournalIfPresent` erased the planted entry before reload. The entry is now planted with `page.addInitScript` on the next load, and the test passes 80/80 at `--repeat-each 80 --workers=5 --retries=0` (QA §5). It is also in the final-tree 197/197 (QA §6). **Not asserted:** `data-persistence="failed"` after a replay failure. The test's comment says `failed` has cleared before the thread root mounts, and the spec does not require it for this scenario. |

## 3. Findings for the independent review and the owners

These were written at the first count, on `1cccdcf`. Each one is kept and its current status is added below it.

1. **Defect: a replay failure raises no notice** (row 18; owner km-frontend-engineer). Two possible fixes: raise the toast when a `usePersistenceStatus` subscriber mounts and `hasFailedWrite()` is already true, or buffer failures reported before any subscriber exists. Add a test that fails replay and then mounts the thread view. It blocks row 18. I recommend fixing it before archive.
   - **Recount: resolved in `d51be31`.** `pendingNotice` latch plus app-wide `PersistenceNotices`. Covered by persist › "A replay failure at startup shows the notice once the app is ready…" and the two queue latch unit tests (row 18).
2. **The notice exists only while a thread view is mounted** (km-frontend-engineer). The requirement text is "when a local save fails", but the listener lives in `EnhancedThread`. A failed `removeThread` or `setTitle` on another route shows nothing. No scenario tests this, so it does not change the count. It is a gap between the requirement text and the implementation.
   - **Recount: resolved in `d51be31`.** `PersistenceNotices` mounts in `App.tsx`, not in the thread view. Covered by persist › "A write failure on a non-thread route still shows the app-wide notice": a delayed title response makes `setTitle` write after a client-side navigation to `/agents`, and the test asserts the notice there. Only `setTitle` is exercised. A failed `removeThread` off-route is not tested.
3. **The journal is not attributable in e2e** (km-qa-engineer). A test could hold writes pending and then reload: for example, delay IndexedDB `put` in the page, then assert the `knowme-pending-writes-v1` key exists before reload and is gone after. That would move rows 16 and, partly, 1 from "passes" to "passes because of the journal".
   - **Recount: resolved for row 16.** That test now exists and was mutation-checked (row 16, QA 3.2 §2). Row 1 is unchanged: its own test still does not show that a write was pending at reload.
4. **The durability source differs from the task.** Task 1.1 asked for the PGlite 0.3.15 durability behaviour to be confirmed "from the docs through Context7 or the upstream README". The comment at `CharcoalDb.open` says the README does not cover the option, and it cites the installed `dist/` source instead: `relaxedDurability` is unset, and `query()`/`exec()` await `syncToFs()`. The claim is plausible and specific, but it comes from reading the bundle, not from documentation, and a PGlite upgrade could change it silently.
   - **Recount: still open.** No change.
5. **Manual evidence predates the final tree.** QA 3.1 §3's focus and send checks ran on `5763bbe`. `1cccdcf` then moved the toast to top-centre and changed its styling. Focus and usability were not re-checked by hand on `1cccdcf`. The standing e2e test that covers editability passed in the final 190 / 190.
   - **Recount: resolved by a standing test.** persist › "A failed save keeps focus in the composer…" checks focus, no overlap between toast and composer, the reply on screen, and a further send, on the top-centre toast (row 13).
6. **Second count: the full gate had not run on `d51be31`** (km-qa-engineer). §1.1 lists what did run. Build, typecheck, lint, `npm test`, the full e2e suite, axe and the `-g reload --repeat-each 20` matrix must run on the final tree before archive. `d51be31` changed the thread registry's write path, which the retry/regenerate reload tests in `chat-surfaces.spec.ts` depend on. They have no run on this tree.
   - **Final count: mostly resolved.** QA §6 ran vitest 322/322, the app typecheck, lint, build, full e2e 197/197, and the 20× reload matrix 80/80, which includes the surfaces test (§1.2). **Still open before archive:** `tsc --noEmit -p e2e/tsconfig.json`, the second half of `npm run typecheck`, and `npm run test:a11y` have no run on this tree.
8. **Final count: the row-18 e2e test was flaky, and the test is now fixed** (QA §4.5, §5). It failed 3/80 at `--workers=5`. The cause was a setup race in the test: the old page's `syncJournalIfPresent` erased the planted entry. It is not a product defect, because in the app only the page that owns a key writes to it. The entry is now planted with `addInitScript`, and the test passes 80/80.
9. **Final count: the mutation copies are not kept** (km-qa-engineer). The 7 mutation experiments in QA 3.2 §2 and §4.1–4.3 are recorded as results only. If the tests need to keep proving they can fail, that should become a standing check. That is a follow-up, not in this change's scope.
7. **New at recount: two `d51be31` paths are covered only in jsdom** (km-qa-engineer). The first is journal › "discards this tab's journal without replaying it, and reports one failure", the purge-retry discard. The second is journal › "drops the largest upserts first when the full journal doesn't fit…", the quota shrink. Neither is in a spec scenario, so the count does not change.

## 4. Not proven, stated as limits

- **A real process kill.** Every reload in the tests goes through Playwright, which fires `pagehide`. Nothing tests a killed renderer or browser, or a crash. Per the spec, writes pending then MAY be lost.
- **Tauri quit.** Whether the Tauri WebView fires `pagehide` or `visibilitychange` on app quit is untested. If it fires neither, pending writes MAY be lost.
- **`localStorage` quota or disabled storage at unload.** Since `d51be31`, a journal that does not fit drops the largest upserts first and keeps deletes and thread rows. It reports a failure for what it drops, and that is unit-tested against a fake `localStorage` only. Disabled storage is still only caught and logged. The dropped writes are lost. The spec names this as a MAY-be-lost case.
- **Reload mid-stream.** The in-flight turn, including the optimistic user message, is still not saved locally. It falls back to the UAR transcript. This is a declared non-goal, unchanged by this change.
- **Several tabs sharing the local database.** A non-goal. Since `d51be31`, journals are per tab, and a Web Lock held for the page's lifetime protects a live tab's journal. persist › "One tab's journal is left untouched by another tab's startup replay" shows this in a real browser. Replaying a dead tab's journal is unit-tested only. Replay order across tabs is still not defined.
- **A bfcache restore.** The design says the key is cleared on drain after the page returns. The unit test covers drain-clears-key, not an actual bfcache round trip.

## Independent review

Two independent reviewers looked at the change. Neither saw how the work was produced.
- **artifact-critic** (a Claude subagent that sees only the artifacts) reviewed the branch diff against spec.md and design.md once.
- **Cross-model judge** (`adversarial-review --mode diff`, gpt-5.5; `cross_model_check: verified-distinct`) reviewed the full branch diff against main in three rounds. Its packets and findings are in `.kbd-orchestrator/phases/complete-rebranding/review/chat-persistence-durability/`.

### artifact-critic

| Severity | Finding | Outcome |
|---|---|---|
| CRITICAL | Replaying a dead tab's journal can bring back a deleted thread and overwrite a newer title | Confirmed in the code: the upsert inserts and the delete is a hard delete. The operator chose "scrub + newer-wins" (design.md, operator decision 2026-09-26). Fixed: `scrubThreadFromJournals` runs on delete, and replayed foreign descriptors pass a newer-wins guard. Real-PGlite tests cover both. |
| WARNING | Writes queued while the page is already hidden are never journaled | Fixed: `syncJournalOnQueueChange` writes the journal whenever the page is hidden and writes are pending. Unit test; fails when reverted. |
| WARNING | A duplicated tab inherits sessionStorage, so two live tabs share one key | Fixed: `ensureUniqueTabIdentity` mints a new id when the inherited id's lock is held. Unit test (`persistence-journal.duplicate-tab.test.ts`); fails when reverted. |
| WARNING | Only changed messages are persisted, contrary to a design non-goal, and `updateToolCall` never re-saved | Confirmed. Fixed: a message modified after it was saved is queued again. The trade-off is recorded (design.md, Amendment). 3 unit tests. |
| WARNING | The toast-burst test settled for the wrong reason | Fixed: it polls for the last write's failure log line. QA §7. |
| WARNING | The non-thread-route test depended on a fixed 1500 ms delay | Fixed: the route is held until the test releases it. The file has no fixed waits. QA §7. |
| WARNING | Plain reload tests pass with or without the journal | Accepted as described. The journal test holds writes pending and fails 10/10 without the journal and 10/10 without replay (QA 3.2 §2). |
| SUGGESTION | `listOtherJournalKeys` wasn't guarded, so a storage error could stop startup | Fixed with try/catch. Unit test with a throwing `Storage.key`. |
| SUGGESTION | `onReload` waits for the whole queue | Accepted; recorded as a residual. |
| SUGGESTION | A page-lifetime Web Lock may make the page ineligible for bfcache | Not verified. Follow-up. |
| SUGGESTION | The journal keeps message content in localStorage indefinitely | Partly addressed: the scrub on delete removes a thread's entries. Otherwise accepted, as it's the same origin as IndexedDB. |
| SUGGESTION | Stale comment in the e2e file | Fixed. |

### Cross-model judge

| Round | Severity | Finding | Outcome |
|---|---|---|---|
| 1 | CRITICAL | New `: any` in `use-chat-runtime.onreload.test.tsx` | Fixed: now typed `ExternalStoreAdapter`. The remaining `any` in `use-chat-runtime.ts:67` exists on main. |
| 1 | CRITICAL | The PGlite durability claim wasn't taken from the docs | Fixed: the `pglite.ts` comment cites PGlite `docs/docs/filesystems.md`, confirmed through Context7 `/electric-sql/pglite`. |
| 1 | CRITICAL ×3 | Task 3.2 unchecked; `verification.md` and the real-PGlite test untracked | Procedural. The files are now tracked. Task 3.2 is checked by the KBD driver at end-task. |
| 2 | CRITICAL | Dead-tab replay drops a new thread that never landed: an upsert for a missing row was skipped | Confirmed; my decision text had caused it. Fixed: a missing-row upsert is a creation (design.md, Correction). Real-PGlite test; fails when reverted. |
| 2 | WARNING | A foreign `touchThread` was compared against "now", so a stale touch always applied | Fixed: descriptors carry `at`, which the guard compares. Real-PGlite test; fails when reverted. |
| 3 | CRITICAL | This section was empty | Filled by this record. |
| 3 | CRITICAL | `.env` files in the tree | **False.** `git ls-files` shows neither is tracked, `git check-ignore` matches `.gitignore:34,36`, and `git log --all` shows neither was ever committed. The packet's file tree lists files on disk, not tracked files. |
| 4 | CRITICAL ×3 | Mocks of `@/lib/db/pglite` in `chat-message-store.write-queue.test.ts`, `thread-registry-store.test.ts` and `use-chat-runtime.onreload.test.tsx` lack `whenDbReady`, "so the suite can fail" | **False.** The three files pass (19/19), and the full suite passes 341/341. vitest throws on a missing mock export only when it is read. `write-queue.ts:113` reads `whenDbReady` only when `getDbInstance()` returns null, and these mocks always return an instance. |

**Final verdict:** round 4 returned BLOCK, resting only on the three findings disproved above. Every finding that held up in rounds 1–3 is fixed, with a test that fails when its fix is reverted. No round raised a confirmed defect that remains open.

### Gate on the final tree (Node v24.16.0)

`npx vitest run`: 341 passed (42 files). `npm run typecheck`: ok. `npm run lint`: 0 errors. `npm run build`: ok. `npx playwright test --workers=5`: 197 passed. The 20× reload matrix: 80 passed. `npm run test:a11y`: 24 scans, 5 violations across 3 rules, identical to the baseline (thread 0/0 in both themes).
