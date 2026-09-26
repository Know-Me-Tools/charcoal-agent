# QA: chat-persistence-durability — task 2.1

Scope: `e2e/**` only (`e2e/chat-surfaces.spec.ts`, new `e2e/chat-persistence.spec.ts`). No `src/` files were read for editing and none were changed — confirmed by `git --no-optional-locks status --short -- e2e/ docs/qa/ src/ playwright.config.ts vitest.config.ts` below. Every test in this record exercises the real PGlite/IndexedDB path through the app's UAR mock (`e2e/support/uar-mock.ts`); nothing here is a unit test against a fake `CharcoalDb`.

This covers task 2.1 of `openspec/changes/chat-persistence-durability/tasks.md`: restore the reload-survival assertions removed in §6.15 below, and add new e2e coverage for the write-queue/journal/save-state/failure-notice behaviour built in tasks 1.1 and 1.2.

## 1. What changed

### 1.1 Restored: `e2e/chat-surfaces.spec.ts`

The retry/regenerate test (`"Message error: retry replaces the failed turn (no duplicate); Regenerate replaces a good reply; both survive a reload"`, around line 788) had its title and reload assertions restored, and the §6.15 "no reload assertion here by design" comment removed. It now reloads **twice**, immediately, with no wait for `data-persistence="saved"` and no fixed timeout:

- Immediately after Try again's retried reply becomes visible: `page.reload()`, then asserts exactly 1 user message, 1 assistant message, the retried reply text, and no error text.
- Immediately after Regenerate's replacement reply becomes visible: `page.reload()` again, then asserts exactly 1 user message, 1 assistant message, the regenerated text, and no text from the message Regenerate replaced (`FIXTURE_FINAL_TEXT`) or from the earlier failed attempt (`MESSAGE_ERROR_TEXT`).

This is the exact test that failed 10/10 under `--repeat-each 10 --workers=1 --trace on` in §6.15 before the write-queue/journal fix (tasks 1.1/1.2) existed.

### 1.2 New: `e2e/chat-persistence.spec.ts`

Five tests, all against the real PGlite/IndexedDB path via `page.goto(/threads/${FIXTURE_THREAD_ID})`:

1. **"Reload immediately after a reply finishes keeps exactly one user message and one reply"** — sends a message, waits for the reply text only (no wait for the save), `page.reload()`, asserts exactly 1 user + 1 assistant message with the same text, and that `[data-persistence]` reads `saved` after the reload's own hydration settles. Covers spec scenario "Reload immediately after a reply".
2. **"A reply that ended in an error survives an immediate reload"** — uses `ERROR_STREAM_EVENTS` (a mid-stream `agui.error`), waits for the plain-language error only, reloads immediately, asserts 1 user + 1 assistant message, the error text still shown, and no raw error text (`RAW_STREAM_ERROR_TEXT`). Covers spec scenario "Reply that ended in an error".
3. **"Reopening the thread in a new tab of the same browser context shows the saved reply"** — sends a message, waits for `data-persistence="saved"` (this scenario is "finished, then closed", not a mid-write race — the reload-immediately tests above already cover the race), closes the page, opens a new page in the same `context` (shares IndexedDB/localStorage — the mock is re-installed on the new page via `installUarMock`, since the `uar` auto-fixture only wires the original page), navigates to the same thread URL, and asserts the user message and reply are both shown. Covers spec scenario "Reopen after the page was closed".
4. **"data-persistence reads saving while a save is pending and saved once it settles"** — installs a `MutationObserver` on `[data-persistence]` *before* sending, so every attribute transition is captured with no polling gap (not timing-fragile: `enqueueWrite` sets `pending` synchronously before the async PGlite write starts, so React is guaranteed to render `saving` at least once). Asserts the captured log contains `saving` and ends at `saved`. Covers spec scenarios "Saving then saved" and "Save state is observable".
5. **"A simulated local-write failure shows the plain-language notice once and keeps the conversation usable"** — deterministic failure injection, see §2 below. Asserts the exact plain-language toast text appears exactly once, `[data-persistence]` reads `failed`, no raw error text (`QuotaExceededError`/`AbortError`/`DOMException`) reaches the DOM, and the composer stays editable and accepts further input afterward. Covers spec scenarios "A save fails", "Several saves fail together", and "No raw errors".

## 2. Deterministic write-failure injection

The task asked for a deterministic failure-injection method, or an honest statement that none was possible without an app change. One was found and works reliably (evidence in §3): after the thread page has loaded and the composer is interactive (so startup/migrations are unaffected), the test monkey-patches `IDBObjectStore.prototype.put` on the page (via `page.evaluate`, scoped to that page/test only — nothing in `src/` changes) so that every subsequent `put()` call still runs against the real store but then calls `this.transaction.abort()`. Aborting a transaction is IndexedDB-spec-legal: it fires a genuine `error`/`abort` event on the pending request, the same shape a real quota-exceeded or storage-disabled failure produces — not a fabricated exception. `CharcoalDb.open`'s own comment (`src/lib/db/pglite.ts`) documents that every write awaits PGlite's `syncToFs()`, which persists dirty pages to IndexedDB via `put()`, so this reliably fails the write the test triggers next.

This is not gated by any `window.__`/`import.meta.env` hook in `src/` — the earlier `grep -rnE "window\.__|import\.meta\.env\.(MODE|DEV)" src/lib/db src/stores src/features/chat` check from task 1.2 still returns nothing (re-verified below); the injection lives entirely in the test file.

## 3. Commands and results

Port checked clear before every run: `lsof -nP -iTCP:4174 -sTCP:LISTEN` (exit 1 / no output each time).

### 3.1 Single runs, validating each new/changed test individually

```
npx playwright test e2e/chat-persistence.spec.ts --workers=1
5 passed (56.2s)

npx playwright test e2e/chat-surfaces.spec.ts -g "retry replaces the failed turn" --workers=1
1 passed (7.9s)
```

### 3.2 Combined run, both spec files together, single worker

```
npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts --workers=1
34 passed (2.1m)
```
(An earlier combined run, before the `networkidle` hardening described in §4, also passed 34/34 in 1.7m.)

### 3.3 `-g "reload" --repeat-each 20 --workers=1` (task-required matrix)

```
npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts -g "reload" --repeat-each 20 --workers=1
60 passed (5.6m)
```
This matches 3 matching tests × 20 repeats = 60. (An earlier run before the §4 hardening also passed 60/60 in 4.7m.)

### 3.4 `-g "retry replaces the failed turn" --repeat-each 10 --workers=1 --trace on` (the exact §6.15 failure condition)

```
npx playwright test e2e/chat-surfaces.spec.ts -g "retry replaces the failed turn" --repeat-each 10 --workers=1 --trace on
10 passed (1.7m)
```
This is the identical command that failed 10/10 in §6.15 before the write-queue/journal fix existed (tasks 1.1/1.2, already committed). It now passes 10/10. (An earlier run before the §4 hardening also passed 10/10 in 1.4m.)

### 3.5 Full `e2e/chat-persistence.spec.ts --repeat-each 20 --workers=1`

```
npx playwright test e2e/chat-persistence.spec.ts --repeat-each 20 --workers=1
100 passed (7.7m)
```
5 tests × 20 repeats = 100/100.

**One flake found and fixed, not waived.** A first attempt at this same command (before §4's fix) failed once, at repeat 74/100, in the `data-persistence reads saving…` test: `Error: page.evaluate: Execution context was destroyed, most likely because of a navigation`, thrown by the very first `page.evaluate` call right after the page load helper returned — before any persistence assertion ran. See §4 for the fix and re-verification (30/30, then the 100/100 above).

## 4. The one flake: cause and fix

**Symptom.** `page.evaluate` (installing the `MutationObserver`) failed with "Execution context was destroyed, most likely because of a navigation" on 1 of 100 repeats of the `data-persistence` test. No app-level assertion had run yet — the failure was in test setup, not in a claim about the product.

**Diagnosis.** The shared `openThread()` helper in the new spec only waited for the composer to become visible before returning, unlike the codebase's existing `e2e/support/page-helpers.ts`'s `openRoute()`, which also waits for `page.waitForLoadState("networkidle")` before any caller runs `page.evaluate`. A `page.evaluate` issued in the brief window while the page still has in-flight activity can occasionally race a context teardown in Playwright/Chromium. This is scaffolding fragility, not a persistence defect: nothing in the write queue, journal, or save-state code is implicated, and the failure occurred before the test touched any of it.

**Fix (test-only, `e2e/chat-persistence.spec.ts`).** Added `await page.waitForLoadState("networkidle")` to `openThread()`, matching the existing `openRoute()` convention.

**Re-verification.**
```
npx playwright test e2e/chat-persistence.spec.ts -g "data-persistence reads" --repeat-each 30 --workers=1
30 passed (3.0m)

npx playwright test e2e/chat-persistence.spec.ts --repeat-each 20 --workers=1
100 passed (7.7m)
```

## 5. Unmet or out of scope (task 2.1)

- Nothing in task 2.1's stated deliverables is unmet: the restored reload assertions pass at 20/20 and 10/10-under-trace; the new spec's 5 tests pass at 100/100; the failure-injection method was found (not reported as impossible) and is deterministic across 100 repeats of the test that uses it.
- Task 2.1 does not require unit-test evidence — that is tasks 1.1/1.2 (already committed, with their own `npx vitest run` evidence per `tasks.md`; not re-run here as it is outside this task's verify block).
- Task 3.1 (`npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`, then `npm run test:a11y`, plus the manual failure-notice check) and task 3.2 (verification.md + independent review) are separate km-qa-engineer / km-product-owner tasks in `tasks.md` and are not run here.

---

# Task 3.1: full gate, axe totals, and the manual failure-notice check

Scope: `docs/qa/**` only — no `src/` changes, and no net `e2e/**` change (a temporary manual-check spec was added, run, and deleted; see §3 below). No commit made. `git --no-optional-locks` used for every read-only git check. One Playwright run at a time; port 4174 confirmed clear (`lsof -nP -iTCP:4174 -sTCP:LISTEN`, exit 1 / no output) before every `test:e2e`/`test:a11y` invocation. Run against commit `5763bbe` on `rebrand/chat-persistence-durability` (task 2.1 already committed at the point this ran).

## 1. Full gate

All five commands below exited 0, run in the order `tasks.md` specifies.

```
npm run build
✓ built in 12.21s
(exit 0)
```
Only pre-existing bundle-size warnings (chunks >500kB — syntax-highlighting/mermaid language packs, unrelated to this change).

```
npm run typecheck
> tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p e2e/tsconfig.json
(exit 0, no output)
```

```
npm run lint
> eslint .
/Users/.../src/components/ui/button.tsx: 1 warning (react-refresh/only-export-components)
/Users/.../src/components/ui/tabs.tsx: 1 warning (react-refresh/only-export-components)
✖ 2 problems (0 errors, 2 warnings)
(exit 0)
```
Both warnings are pre-existing, in files this change never touched (shadcn `button.tsx`/`tabs.tsx` fast-refresh warnings, not errors).

```
npm test
> vitest run
Test Files  37 passed (37)
     Tests  298 passed (298)
(exit 0)
```
The stderr lines interleaved in this run (`[write-queue] ... failed Error: ...`, `[persistence-journal] unknown journal version — discarding 99`) are expected diagnostic logging from tests that intentionally trigger a write/replay failure to assert the error-isolation and discard-unknown-version behaviour (write-queue.test.ts, persistence-journal.test.ts, use-chat-runtime.onreload.test.tsx) — not failures.

```
npm run test:e2e
> playwright test
190 passed (4.6m), 5 workers
(exit 0)
```
Includes all of `e2e/chat-surfaces.spec.ts` and `e2e/chat-persistence.spec.ts` from task 2.1, plus every other spec (a11y, brand, chat-stream, mock-smoke, primitives, shell, skills-toggle, theme, visual). No failures, no flaked tests reported.

## 2. Accessibility: `npm run test:a11y`

```
npm run test:a11y
24 passed (46.5s)
axe: 24 scans, 5 violations across 3 rules
  color-contrast [serious] 1 page/theme(s), 1 node(s)
  button-name [critical] 2 page/theme(s), 2 node(s)
  nested-interactive [serious] 2 page/theme(s), 18 node(s)
(exit 0)
```

Matches the stated baseline exactly (5 violations across 3 rules elsewhere, thread 0/0). Per-file breakdown of the 5 non-zero violations (1 each), from `test-results/a11y/*.json`:

| File | Violations |
|---|---|
| `agents__light.json` | 1 |
| `landing__dark.json` | 1 |
| `landing__light.json` | 1 |
| `settings-skills__dark.json` | 1 |
| `settings-skills__light.json` | 1 |

**Thread region, both themes — the gate's actual pass criterion:**

`test-results/a11y/thread__light.json`:
```json
{ "route": "thread", "theme": "light", "violations": [], "raw": [] }
```

`test-results/a11y/thread__dark.json`:
```json
{ "route": "thread", "theme": "dark", "violations": [], "raw": [] }
```

0/0 in both themes, matching the chat-surfaces-flat2 baseline. **No new violations in the thread region in either theme** — the verify criterion in `tasks.md` ("axe reports no new violations in the thread region in either theme compared with the chat-surfaces-flat2 baseline") is met. The 5 violations elsewhere (agents, landing, settings-skills) are pre-existing and outside this change's scope (chat-persistence-durability touches only local-write ordering, the journal, the save-state attribute, and the failure toast — none of those pages).

## 3. Manual check: the failure notice by hand

**Method.** A temporary spec, `e2e/_manual-persistence-notice-check.spec.ts`, was added, run once per theme, and then deleted (confirmed by `git --no-optional-locks status --short -- e2e/ src/` returning no output afterward — the net diff to `e2e/**` from this task is zero). It used the same deterministic write-failure injection as task 2.1's automated test (a temporary throwing executor: `IDBObjectStore.prototype.put` is overridden to call the real `put()` and then abort its transaction — a spec-legal IndexedDB failure, not a fabricated one), and reverted it afterward via the saved original function reference, then confirmed a further send succeeds and `data-persistence` returns to `saved`.

**What it checked, per theme (light and dark), against a real send that fails to persist:**

| Check | Result |
|---|---|
| Toast text | Exact, singular: `"Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload."` — present once |
| `data-persistence` | Reads `failed` |
| Announced politely | The toast's containing `<section aria-live="polite">` region exists (queried directly from the DOM, not assumed from sonner's docs) |
| Focus | `document.activeElement === composer` — the toast never took focus |
| Composer usable during failure | `composer.toBeEditable()` holds |
| Recovery | After reverting the throwing executor, a further send succeeds and `data-persistence` returns to `saved` within 20s |

All of the above passed in both themes.

**Finding: the toast's bounding box overlaps the composer's outer rounded border by a small margin.** Measured at the default 1280×800 viewport: toast box `{x:917, y:620.5, w:322, h:58.5}`, composer box `{x:280, y:596, w:660, h:56}` — a ~23×31px intersection at the composer's bottom-right corner. Visually (see screenshots below) this is the toast card grazing the composer's focus-ring border; it does **not** cover the placeholder text, the typed-text area, or the "+"/skill icon controls, all of which sit at the left/middle of the composer. This does not violate the spec's actual normative text (`specs/chat-persistence/spec.md`: "SHALL NOT take focus or block input" and "the composer SHALL stay usable") — both held under direct test (composer stayed editable and a further send succeeded while the toast was showing). It also isn't blocking per the interaction check: typing and sending both worked with the toast visible. It's recorded here as a **QA finding, not a spec violation**: at this viewport the toast's card sits close enough to the composer to visually intersect its corner, which a design/frontend review may want to address (e.g. a bottom offset large enough to clear the composer's rounded border) even though nothing is functionally broken. Per role boundaries, this is reported, not fixed — km-frontend-engineer or km-creative-director owns any layout change.

**Screenshots** (scratchpad, both themes, toast visible with the composer still in frame):
- `/private/tmp/claude-501/-Users-gqadonis-Projects-know-me-charcoal-agent/f387bcbd-326d-4e0b-a0d8-b156ce6cbd80/scratchpad/persistence-failure-notice-light.png`
- `/private/tmp/claude-501/-Users-gqadonis-Projects-know-me-charcoal-agent/f387bcbd-326d-4e0b-a0d8-b156ce6cbd80/scratchpad/persistence-failure-notice-dark.png`

## 4. Unmet or out of scope (task 3.1)

- All five gate commands exited 0; nothing unmet there.
- Axe: no new violations in the thread region in either theme (0/0, matching baseline); nothing unmet there.
- Manual check: every normative requirement (toast text, politeness, focus, composer usability, recovery) passed in both themes. The one thing recorded as **not fully clean** is the geometric corner-overlap finding in §3 above — reported as a QA finding for design/frontend follow-up, not waived and not silently fixed.
- Task 3.2 (`verification.md` + independent review) is km-product-owner's task in `tasks.md` and is not run here.

> Superseded note on §3's overlap finding: commit 1cccdcf moved the toaster to top-center (`src/components/ui/sonner.tsx`), so it no longer sits near the composer.

# Task 3.2: journal proof and standing coverage for the PARTIAL rows

## 1. New tests in `e2e/chat-persistence.spec.ts`

Seven tests were added (lines 266 to 562). Each one covers a PARTIAL row in `verification.md`:

- The journal and replay test: writes are held pending, the tab's own key `knowme-pending-writes-v1:<tabId>` is asserted before reload, and after reload the test asserts the reply, exactly one user and one assistant message, and that the key is gone.
- The failed state clears back to `saved` after a later write succeeds.
- After a failure, focus stays in the composer, the reply stays on screen, and a further send works.
- A burst of failing writes produces one toast element.
- A replay failure at startup shows the notice once the app is ready, and the app still finishes starting.
- A write failure on a non-thread route shows the app-wide notice.
- One tab's journal is untouched by another tab's startup replay.

## 2. The journal test fails without the journal

Setup: a copy of the tracked tree in the session scratchpad, outside the repo. It uses a symlinked `node_modules`, and its `vite.config.ts` gets a `server.fs.allow` entry for that path; without the entry, PGlite's data file is refused and the app shows "Invalid FS bundle size". Nothing in the repo was changed.

| Scratch variant | Command | Result |
|---|---|---|
| Unmodified (control) | `npx playwright test e2e/chat-persistence.spec.ts -g "journaled to this tab" --repeat-each 3 --workers=1 --retries=0` | 3 passed |
| `installPersistenceJournal()` call commented out | same, `--repeat-each 10` | 10 failed, all at line 295 `expect(journalBefore).not.toBeNull()` |
| `await replayJournal(db)` in `db-provider.tsx` commented out | same, `--repeat-each 10` | 10 failed, all at line 306 (reply not visible after reload) |

So the test detects a missing journal and a missing replay every time, not in 5 of 15 runs as the old reload test did.

## 3. Stability in the repo

```
npx playwright test e2e/chat-persistence.spec.ts --workers=1                               # 12 passed (51.2s)
npx playwright test e2e/chat-persistence.spec.ts --repeat-each 5 --workers=1 --retries=0   # 60 passed (4.2m)
```

The QA agent's scratch file `e2e/_scratch-hold-pending.spec.ts` was deleted.

## 4. Task 3.2 continued — closing rows 7, 8, 14, 15 and 17

Scope for this pass: `e2e/**` and `src/**/*.test.ts` only. No app source file was changed (confirmed with `git --no-optional-locks status --short -- src/ e2e/ docs/qa/` before and after — only `e2e/chat-persistence.spec.ts`, the new `src/lib/db/write-queue.real-pglite.test.ts`, and this doc are touched). Node 24 (`PATH=.../v24.16.0/bin:$PATH`) throughout, one Playwright run at a time, `timeout 540 ... --workers=1 --global-timeout=500000`.

### 4.1 Row 7 and row 8 — real PGlite, not the fake

**Why not e2e with writes held, then released (the task's preferred route).** `holdWritesPending()` (already in this file) swallows IndexedDB completion events **globally**, for every write, forever — it can't selectively hold back only the removal's write while letting the replacement's write proceed, because a turn's several logical writes (message upserts, thread touches) interleave at the same `IDBObjectStore.put` layer and a single logical write can itself span more than one `put` call (confirmed empirically in §4.2 below). There is no reliable way to intercept "this one descriptor's completion" from outside the page. So this pass uses the task's acceptable alternative instead: a vitest test against a **real, in-memory PGlite** — probed directly and confirmed to work under this project's jsdom + vitest setup (`new PGlite()` with no `idb://` DSN, ~1.3s to open a table, insert, and query).

**New file:** `src/lib/db/write-queue.real-pglite.test.ts`. It mocks only `@electric-sql/pglite`'s `PGlite` constructor to ignore the `idb://charcoal-db` DSN `CharcoalDb.open()` passes and always run in-memory — jsdom has no IndexedDB, so that DSN is unreachable here, but every migration, constraint and query is the genuine one `CharcoalDb` (`src/lib/db/pglite.ts`) ships. `write-queue.ts`'s real `enqueueWrite`/`applyDescriptor` run unmodified against this instance via `setDbInstance`.

- **Row 7** (`applies a removal that is still pending before a replacement requested while it's in flight, and the real row set ends up correct`): gates the real `CharcoalDb` instance's `deleteMessages` method behind a manually-released promise, enqueues the removal, confirms (via a settle flag, not a timing guess) that it has **not** settled two microtask ticks later, then enqueues the replacement for the same conversation while the removal is still pending by construction — the spec's literal WHEN clause. Releasing the gate and awaiting both, it asserts the **settlement order** (`["deleteMessages", "upsertMessage"]`) and the final row set via `db.getMessages()` (`["u1", "a1-new"]`, not `"a1-old"`).
  - **Finding:** checking only the final row set does **not** by itself prove ordering here, because the removal and the replacement target different ids — either order lands at the same two rows (PGlite serializes internal query execution regardless of submission order, so a broken, unserialized write queue can still coincidentally produce the right final state for a non-overlapping id pair). The settlement-order assertion is what actually distinguishes a correctly serialized queue from a broken one; the final-row-set assertion is kept because it is literally what the THEN clause says, but it is not on its own sufficient evidence, and the mutation below confirms this.
- **Row 8** (two tests): `row 8, negative control` proves the `messages.thread_id` foreign key is real by asserting `db.insertMessage("no-such-thread", …)` genuinely rejects (`error: insert or update on table "messages" violates foreign key constraint`). `row 8` then gates real `upsertThread`, enqueues the thread write, confirms it is still pending, enqueues the first reply's message write for the same thread while the thread row genuinely doesn't exist yet, releases, and asserts neither write rejects and both rows exist afterward.
- **Row 17** (two tests, `describe("replay idempotency against real PGlite …")`): calls the exported `applyDescriptor` — the exact function `persistence-journal.ts`'s `replayKey()` uses — twice with the same `upsertMessage` descriptor and asserts exactly one row (not a duplicate); and twice with the same `deleteMessages` descriptor for an already-removed id and asserts no error and no resurrection. This is real SQL (`ON CONFLICT (id) DO UPDATE`, delete-by-id), not the fake store the existing `persistence-journal.test.ts` uses (which only covers `upsertThread`).

**Runs:**

```
npx vitest run src/lib/db/write-queue.real-pglite.test.ts   # 5 passed (5 tests), ~2-6s depending on machine load
npx vitest run                                              # 322 passed (40 files) — full suite, no regressions
```

10× repeat (vitest has no `--repeat-each`; ran the file 10 times in a loop):

```
for i in $(seq 1 10); do npx vitest run src/lib/db/write-queue.real-pglite.test.ts; done
# PASSED: 10/10
```

**Mutations, scratch copy** (`cp -r src`, `package.json`, `vitest.config.ts`, `tsconfig*.json` into the session scratchpad outside the repo, `node_modules` symlinked — no `server.fs.allow` needed for vitest, only for the Playwright/Vite-dev-server case in §4.3/§4.4 below):

| Mutation | File | Result |
|---|---|---|
| `enqueueWrite`'s `result = tail.then(() => executeWrite(descriptor))` changed to `result = executeWrite(descriptor)` (writes no longer chained) | `write-queue.ts` | Row 7 failed: `settleOrder` was `["upsertMessage", "deleteMessages"]`, not `["deleteMessages", "upsertMessage"]`. Row 8 failed: real `error: insert or update on table "messages" violates foreign key constraint "messages_thread_id_fkey"`. The other 3 tests (row 8 negative control, both row 17 tests) were unaffected, as expected — they don't depend on tail-chaining. |
| `insertMessage`'s `ON CONFLICT (id) DO UPDATE` clause removed | `pglite.ts` | Row 17 upsert test failed: `error: duplicate key value violates unique constraint "messages_pkey"`. Other 4 tests unaffected. |
| `deleteMessages` changed to throw when the delete matched zero rows | `pglite.ts` | Row 17 delete test failed: `Error: MUTATION: deleteMessages matched no rows`. Other 4 tests unaffected. |

Each mutation was reverted immediately after confirming the failure; the scratch copy was not kept.

### 4.2 Row 14 — deterministic wait, and proof that more than one write failed

**File:** `e2e/chat-persistence.spec.ts`, test `"A burst of failing writes from one turn shows exactly one toast element"`.

Replaced the fixed `await page.waitForTimeout(1000)` with: a `page.waitForResponse(...)` for the turn's non-streaming title-generation request, **registered before the message is sent** (so it can't race a response that already happened), awaited after the first `data-persistence="failed"` check; then a second `toHaveAttribute("failed")` check (real DOM-state polling, not a sleep) so the assertions below only run once the delayed `setTitle` write this unlocks has also settled.

Added two counts, both read after that point:
1. **Primary — per-write failure count.** A `page.on("console", …)` listener collects every `[write-queue] <descriptor> failed` line (one `console.error` call per failing descriptor in `reportFailure`, `write-queue.ts`). Asserts `writeQueueFailures.length > 1`.
2. **Secondary — raw IndexedDB signal.** `patchPutAbortsWrites` now also increments `window.__putAbortCount` on every aborted `put()` call (reset to 0 each time the patch is installed). Asserts `putAbortCount > 1`.

The primary count is the one that actually discriminates: a probe during development found a single logical write (`db.insertMessage`) can already trigger more than one real `put()` call (PGlite's WASM filesystem sync doesn't map 1:1 to SQL statements), so the raw `put`-abort count stayed `> 1` even under a mutation that cut the turn down to one logical write — it is kept as a secondary, genuine-IndexedDB-failure signal, not the load-bearing assertion.

**Runs:**

```
npx playwright test e2e/chat-persistence.spec.ts -g "A burst of failing writes" --workers=1 --global-timeout=500000 --repeat-each 10   # 10 passed
npx playwright test e2e/chat-persistence.spec.ts --workers=1 --global-timeout=500000                                                    # 12 passed (full file)
```

**Mutation, scratch copy** (full working tree copied — `src`, `e2e`, `index.html`, `public`, `vite.config.ts`, `playwright.config.ts`, `package.json`, `tsconfig*.json`, `.env*`, `node_modules` symlinked, plus a `server.fs.allow` entry in the scratch `vite.config.ts` for the real `node_modules` path — without it PGlite fails with "Invalid FS bundle size" exactly as CLAUDE.md's gotcha describes): `use-chat-runtime.ts`'s `afterStreamComplete` was changed to skip `markPersisted`/`touch` and to stop calling `setTitle` after the (still-awaited, so the network wait still resolves) title-generation request; `chat-message-store.ts`'s `persistMessages` was changed to `.slice(-1)` so only the newest message is persisted instead of every unpersisted one. Together this cuts the turn's failing writes from 5 (2 messages + `markPersisted`'s `upsertThread` + `touch`'s `touchThread` + `setTitle`'s `upsertThread`) down to 1.

```
npx playwright test e2e/chat-persistence.spec.ts -g "A burst of failing writes" --workers=1 --global-timeout=500000 --repeat-each 5
# 5 failed, all at `expect(writeQueueFailures.length).toBeGreaterThan(1)` — Expected: > 1, Received: 1
```

(A first, heavier-handed attempt — skipping `afterStreamComplete` entirely before it ever calls `generateThreadTitle` — also failed 5/5, but at the `page.waitForResponse` timeout rather than at the counter, since no title request fired at all. That was a valid failure too, but the lighter mutation above isolates proof of the counter itself.) Both mutations were reverted immediately after; the scratch copy was not kept.

### 4.3 Row 15 — the database error is logged, not just absent from the DOM

**File:** `e2e/chat-persistence.spec.ts`, test `"A simulated local-write failure shows the plain-language notice once and keeps the conversation usable"` (extended, not replaced — it already covered the no-raw-error-in-the-DOM half of this row).

Added a `page.on("console", …)` listener registered at the top of the test, and one assertion after the failure is visible: `consoleErrors.some(line => line.includes("[write-queue]") && line.includes("failed"))` must be `true` — this is `write-queue.ts`'s own `reportFailure` diagnostic log (`console.error(\`[write-queue] ${descriptorLabel(descriptor)} failed\`, error)`), read the same way a real browser console or CI log capture would see it.

**Runs:**

```
npx playwright test e2e/chat-persistence.spec.ts -g "A simulated local-write failure" --workers=1 --global-timeout=500000 --repeat-each 10   # 10 passed
npx playwright test e2e/chat-persistence.spec.ts --workers=1 --global-timeout=500000                                                          # 12 passed (full file)
```

**Mutation, scratch copy** (same e2e scratch tree as §4.2): `write-queue.ts`'s `reportFailure` had its `console.error(...)` call replaced with a no-op comment.

```
npx playwright test e2e/chat-persistence.spec.ts -g "A simulated local-write failure" --workers=1 --global-timeout=500000 --repeat-each 5
# 5 failed, all at the new assertion — Expected: true, Received: false
```

Reverted immediately after; the scratch copy was not kept.

### 4.4 Full-file stability after all of the above

```
npx playwright test e2e/chat-persistence.spec.ts --workers=1 --global-timeout=500000   # 12 passed (38.0s)
```

### 4.5 Finding not in scope: an existing row-18 test is intermittently flaky

`"A replay failure at startup shows the notice once the app is ready, and the app still finishes starting"` (verification.md row 18, already MET, not one of this pass's PARTIAL rows; this test was not touched) failed once in a `--repeat-each 5` isolated run (4 passed, 1 failed at `expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible()`, 15s timeout) and passed cleanly in every other run in this pass, including the full-file run immediately after. This is a pre-existing intermittent flake, not a regression from this pass — neither `persistence-journal.ts`, `db-provider.tsx`, `write-queue.ts`'s failure-latch path, nor that test itself were touched here. Flagging for km-product-owner / km-frontend-engineer to investigate; not fixed here (out of this task's scope, and not this role's code to change without a corresponding QA-owned test failure to diagnose against).

### 4.6 Row-by-row summary

| Row | What now proves it | Repeat | Mutation |
|---|---|---|---|
| 7 | `write-queue.real-pglite.test.ts` › "row 7: applies a removal that is still pending…" (settlement order + final row set, real PGlite) | 10/10 (file re-run) | Ordering mutation: fails (both the order and the FK-driven row 8 test) |
| 8 | `write-queue.real-pglite.test.ts` › "row 8, negative control" + "row 8: a new conversation's thread row lands before its first message…" (real FK, real gated pending write) | 10/10 (file re-run) | Ordering mutation: row 8 fails with a real FK violation |
| 14 | `chat-persistence.spec.ts` › "A burst of failing writes…" (deterministic network-based wait; `writeQueueFailures.length > 1` primary, `putAbortCount > 1` secondary) | 10/10 | Reduced-write-count mutation: fails at `writeQueueFailures.length` |
| 15 | `chat-persistence.spec.ts` › "A simulated local-write failure…" (extended with a console.error assertion) | 10/10 | Removed-log mutation: fails at the new assertion |
| 17 | `write-queue.real-pglite.test.ts` › both "replaying …" tests (real `applyDescriptor` against real PGlite, twice) | 10/10 (file re-run) | `ON CONFLICT` removal and no-op-delete-throws mutations: each fails its respective test only |

Nothing in this pass required an app-code change to close; all five rows are closed by new or extended tests within `e2e/**` and `src/**/*.test.ts`.

## 5. §4.5's flake: cause and fix (orchestrator)

- **Reproduced:** `-g "replay failure at startup" --repeat-each 40 --workers=5 --retries=0` gave 3 failed and 37 passed, every failure at `expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible()`.
- **A first theory was ruled out.** The idea was that the toast's 4s auto-dismiss expired while the test waited on the composer. Asserting the notice before the composer still failed 3 of 80. That reorder was reverted.
- **Cause, which was in the test and not the app:** the test planted the bad journal entry from the running page. `syncJournalIfPresent` (`persistence-journal.ts`) rewrites or clears this tab's key on every queue change. When one of that page's own writes settled after the plant, the entry was erased before reload, replay had nothing to fail, and no notice appeared. In the app, only the page that owns a key writes to it, so this is not a product defect.
- **Fix:** the entry is now planted through `page.addInitScript`, guarded by a sessionStorage flag, so it is written on the next load before any app code runs. `-g "replay failure at startup" --repeat-each 80 --workers=5 --retries=0` gave **80 passed**, where the unfixed test failed 3 of 80.

## 6. Final gate on the final tree (Node v24.16.0)

```
npx vitest run                                    # 40 files, 322 passed
npx tsc --noEmit -p tsconfig.app.json             # exit 0
npm run lint                                      # 0 errors, 2 warnings (existing react-refresh)
npm run build                                     # built in 11.25s
npx playwright test --workers=5                   # 197 passed (3.3m)
npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts -g "reload" --repeat-each 20 --workers=1 --retries=0
                                                  # 80 passed (4 tests x 20, 6.5m)
```

### 6.1 The two gate items the product owner found missing (added after the final recount)

```
npm run typecheck      # tsconfig.app.json and e2e/tsconfig.json, exit 0
npm run test:a11y      # 24 passed; axe: 24 scans, 5 violations across 3 rules
```

The axe totals match the task 3.1 baseline exactly: thread 0/0 in both themes. The 5 violations are the existing ones on the agents, landing and settings-skills pages.

# Task 3.3 (§7): Fixing four defects an independent review found in `e2e/chat-persistence.spec.ts`

Scope: `e2e/chat-persistence.spec.ts` and this doc only. No `src/` file was read for editing and none was changed by this pass — `src/lib/db/persistence-journal.ts`, `src/lib/db/pglite.ts`, and `src/lib/db/write-queue.ts` show as modified in `git --no-optional-locks status` below, but that is km-frontend-engineer's concurrent work on the same branch (flagged as expected in this task's brief), not anything touched here; the runs in §7.4 below execute against whatever state those files were in at the time, which is the real integration surface this role tests against, not a frozen snapshot. No commit was made. `git --no-optional-locks` used for every read-only git check. Node 24 (`PATH=.../v24.16.0/bin:$PATH`) throughout. One Playwright run at a time, each wrapped in `timeout 540 … --global-timeout=500000`; port 4174 confirmed clear (`lsof -nP -iTCP:4174 -sTCP:LISTEN`, exit 1 / no output) before every invocation.

```
git --no-optional-locks status --short -- e2e/ docs/qa/ src/ playwright.config.ts vitest.config.ts
 M docs/qa/chat-persistence-durability.md
 M e2e/chat-persistence.spec.ts
 M src/lib/db/persistence-journal.ts     # km-frontend-engineer's concurrent work, not this pass's
 M src/lib/db/pglite.ts                  # km-frontend-engineer's concurrent work, not this pass's
 M src/lib/db/write-queue.ts             # km-frontend-engineer's concurrent work, not this pass's
?? src/lib/db/write-queue.real-pglite.test.ts   # from task 3.2, not this pass's
```

## 7.1 WARNING — the toast-burst test's settle point was not deterministic

**Defect.** `"A burst of failing writes from one turn shows exactly one toast element"` rechecked `[data-persistence]` for `"failed"` both before and after `await titleResponse`. That attribute was already `"failed"` from the burst's earlier writes (the two message upserts and `markPersisted`'s `upsertThread`) well before `setTitle`'s own write is even enqueued, so both checks could pass without `setTitle`'s write — the last one this burst enqueues — having settled at all. The `toHaveCount(1)` toast assertion that followed could then run before that last failure was actually reported.

**Fix.** Replaced the second `toHaveAttribute` recheck with `expect.poll` against the write queue's own failure log (the same `console.error` lines the test already collected for the `writeQueueFailures.length > 1` assertion), polling for the specific descriptor label `write-queue.ts`'s `descriptorLabel` produces for this write: `upsertThread(${FIXTURE_THREAD_ID})`.

That label is **not unique** to `setTitle` — `markPersisted` enqueues an `upsertThread` write for the same thread id earlier in the same burst and produces the identical string — so a single occurrence proves nothing about `setTitle` specifically. The poll instead waits for a **second** occurrence of that exact label, which can only exist once `setTitle`'s own write has also failed (the first occurrence is already accounted for by `markPersisted`, which has settled by the time the reply and notice are visible, asserted separately just above). This is flagged in a comment in the test itself, and only found by reading `descriptorLabel`'s actual output — grepping for `descriptorLabel` in the test file's history would not have surfaced it.

**Honesty on what the final toast-count assertion actually guards**, per the review's request: `await expect(toastElements).toHaveCount(1)` guards the **stable toast id** behaviour (`persistence-notices.tsx`'s `FAILURE_TOAST_ID`, which updates one toast in place instead of stacking a new one per failure). It does not, on its own, prove every individual failure in the burst was observed — `writeQueueFailures.length > 1` and `putAbortCount > 1` (both already in the test, both re-verified as still present and passing) are what establish that. This is now stated in a comment at the assertion site, not left implicit.

## 7.2 WARNING — the non-thread-route test raced a fixed delay against two independent actions

**Defect.** `"A write failure on a non-thread route still shows the app-wide notice"` delayed the title-generation route's fulfillment by a fixed `await new Promise((r) => setTimeout(r, 1500))`, then separately navigated away and called `patchPutAbortsWrites`. Nothing tied the 1500ms to when those two steps actually finished: too short, and the title response (and so `setTitle`'s write) could resolve and settle as a real, succeeding write before the IndexedDB patch was installed, silently making the test not exercise the failure path it claims to; too long, and the test is merely slower without buying more certainty. This is exactly the class of defect the file's own header (lines 7–10) says it avoids.

**Fix.** Replaced the fixed delay with an explicit gate: a `Promise` the test itself resolves.

```ts
let releaseTitleResponse: () => void = () => {};
const titleResponseGate = new Promise<void>((resolve) => {
  releaseTitleResponse = resolve;
});
await page.route("**/api/chat/completion", async (route) => {
  const body = route.request().postDataJSON() as { stream?: boolean } | null;
  if (body?.stream === false) {
    await titleResponseGate;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
  }
  return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody() });
});
```

The route handler now blocks indefinitely on `titleResponseGate` until the test calls `releaseTitleResponse()`, which happens only after the client-side navigation to `/agents` has completed and `patchPutAbortsWrites` has been installed. This removes the race entirely: the title response — and so `setTitle`'s write — cannot resolve before the failing-write patch is in place, regardless of how long navigation or route installation happen to take on a given run.

## 7.3 SUGGESTION — stale file reference in a comment

**Defect.** The comment above `PERSISTENCE_FAILURE_TEXT` (line 29) said the constant it mirrors lives in `src/hooks/use-persistence-status.ts`. It actually lives in `src/components/common/persistence-notices.tsx` (confirmed by reading that file directly — `usePersistenceStatus` only derives the `data-persistence` attribute now; the toast text and its ownership moved to `PersistenceNotices` per that file's own header comment).

**Fix.** Corrected the file path in the comment; no other wording changed.

## 7.4 "No fixed waits" — re-verified

```
grep -n "waitForTimeout\|setTimeout" e2e/chat-persistence.spec.ts
(no output, exit 1)
```

The only match before this pass was the `setTimeout` fixed delay fixed in §7.2 above. None remain. The file's header claim ("no fixed waits and no retries stand in for the fix") is now actually true of its contents, not just its stated intent.

## 7.5 Commands and results

Individual sanity checks, single worker, before the load matrix:

```
npx tsc --noEmit -p e2e/tsconfig.json
(exit 0, no output)

npx playwright test e2e/chat-persistence.spec.ts -g "A burst of failing writes" --workers=1 --global-timeout=500000
1 passed (7.1s)

npx playwright test e2e/chat-persistence.spec.ts -g "A write failure on a non-thread route" --workers=1 --global-timeout=500000
1 passed (5.9s)

npx playwright test e2e/chat-persistence.spec.ts --workers=1 --global-timeout=500000
12 passed (59.7s)
```

**Per-test stability, `--repeat-each 10 --workers=1` (both changed tests):**

```
npx playwright test e2e/chat-persistence.spec.ts -g "A burst of failing writes" --repeat-each 10 --workers=1 --global-timeout=500000
10 passed (39.6s)

npx playwright test e2e/chat-persistence.spec.ts -g "A write failure on a non-thread route" --repeat-each 10 --workers=1 --global-timeout=500000
10 passed (35.7s)
```

10/10 for each changed test.

**Whole-file load run, `--repeat-each 20 --workers=5 --retries=0`:**

```
npx playwright test e2e/chat-persistence.spec.ts --repeat-each 20 --workers=5 --retries=0 --global-timeout=500000
240 passed (6.6m)
[exited with code 0]
```

12 tests × 20 repeats = 240/240, no failures and no flaked-then-passed retries logged (`--retries=0`, so any flake would have shown as an outright failure). Grepped the full run output for `failed`/`✘`/`✗`: every match is a test **name** containing the word "failed" (e.g. `"The failed save state clears back to saved…"`), each one marked `✓`; there are no actual failures in the run.

## 7.6 Unmet or out of scope

- All four review items (7.1–7.4) are addressed; nothing in the review's stated list is unmet.
- This pass did not re-run the full project gate (`npm run build`/`typecheck`/`lint`/`test`/`test:e2e`/`test:a11y`) — out of scope for a targeted test-defect fix, and `src/lib/db/*` was mid-edit by km-frontend-engineer at the time (see the concurrent-modification note at the top of this section), so a full-suite run right now would be testing a moving target rather than this fix. The scoped runs in §7.5 (the two changed tests individually, at 10/10 each, and the whole file at 240/240 under `--workers=5 --retries=0`) are the evidence for this task.
- The pre-existing intermittent flake on the startup-replay test, already recorded and fixed in §5 above (task 3.2), was not touched here and was not observed to regress: it passed in every run in §7.5, including the 20×12 load run.
