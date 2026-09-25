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
