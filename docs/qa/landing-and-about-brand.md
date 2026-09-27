# QA report: landing-and-about-brand — task 3.1, plus one flake investigation

Owner: km-qa-engineer. Change: `openspec/changes/landing-and-about-brand`. Branch: `rebrand/landing-and-about-brand`. HEAD at session start: `fc98393` (pages built and committed by tasks 1.x/2.x).

Scope of this record: task 3.1 (guard and regression tests) and one flaky-test investigation on `e2e/primitives.spec.ts`. Task 4.1 (full build/lint/visual/a11y gate) and task 4.2 (verification.md) are **not** run here — out of scope for this session, left for a later pass. No commit was made; `git --no-optional-locks status --short` at the end of this session shows exactly:

```
 M e2e/primitives.spec.ts
 M src/test/flat-shell.test.ts
 M src/test/setup.ts
?? e2e/brand-pages.spec.ts
?? src/test/brand-copy.test.ts
```

All five are inside km-qa-engineer's owned paths (`e2e/**`, `src/test/**`). `src/test/setup.ts` needed one addition (below) to make the new suites runnable at all; nothing under `src/pages`, `src/components/site` or `content/` was touched.

---

## 1. What changed

### 1.1 `src/test/flat-shell.test.ts` — extended (design.md decision 10)

Added two new `describe` blocks after the existing chat-surfaces guard:

- **`Flat 2.0 gradient rule`** — a new `GRADIENT_RULE` (`bg-gradient-*`, `bg-linear-*`, `from-*`/`via-*`/`to-*`, `bg-[...gradient...]`), with `it.each` proving it fires on gradient utility classes and stays silent on plain fills.
- **`Flat 2.0 brand pages`** — reuses the existing chat-only rule set (hex, `bg-white`/`text-white`/`bg-black`, opacity text colour) plus the new gradient rule, scanned over `src/pages/landing-page.tsx`, `src/pages/about-page.tsx`, `src/pages/NotFound.tsx` and every `src/components/site/*.tsx` file (`site-header.tsx`, `site-footer.tsx` today; `ember-cta.ts` is `.ts`, not `.tsx`, so it's outside this glob, matching the task/design-doc wording literally).

File went from 62 to **78 tests**, all passing against the real (unmutated) source.

### 1.2 `src/test/brand-copy.test.ts` — new

Three `describe` blocks, **9 tests**:

- **`Approved taglines only`**: `LANDING_CONTENT.headline` is a member of `APPROVED_TAGLINES`; it equals the primary tagline exactly; and a git-ls-files-based scan of `src`, `content`, `index.html` (mirroring the spec's "Retired slogans are gone" grep, this file's own name excluded — see the bug found and fixed in §3 below) finds no "AI that knows" / "OS that learns you".
- **`Brand voice in page copy`**: walks every string in the landing, About and not-found content modules (recursively, not just top-level fields) for `"!"` and the banned-word/"charcoal" pattern.
- **`FAQ items render as question headings`**: per design.md decision 10 ("renders a fixture FAQ section"), this mocks `content/site/landing.ts` with `vi.doMock` + a dynamic import and renders the **real** `LandingPage` component (not a hand-copied fragment of its JSX), inside a `MemoryRouter`. Two FAQ items render two `h3` elements each followed by its answer text; `faq: undefined` and `faq: []` both render zero `h3`.

JSX is written with `createElement` rather than `<tag>` syntax so the file can stay `.ts`, per the task's specified file name.

**`src/test/setup.ts`**: one addition. `__APP_VERSION__` is a Vite `define` (`vite.config.ts`), and `vitest.config.ts` has no `define` of its own (AGENTS.md/CLAUDE.md gotcha: "`vitest.config.ts` takes precedence over the `test` block in `vite.config.ts`"). Rendering `LandingPage` (which renders `SiteFooter`, which reads `__APP_VERSION__`) in a component test threw `ReferenceError: __APP_VERSION__ is not defined` without this. Set to a literal placeholder (`"0.0.0-test"`) with a comment explaining why — no unit test asserts this value; the real version is checked against `package.json` in `e2e/brand-pages.spec.ts`, under the real Vite define.

### 1.3 `e2e/brand-pages.spec.ts` — new, 42 tests

Covers every browser-dependent scenario in `specs/brand-pages/spec.md` (mapping in §2). Notable implementation points:

- **No content-module re-imports for expected values.** Literal strings (the tagline, the legal line, the 404 CTA label) are hardcoded from `docs/design/brand-pages.md` / the Brand Guide, the same convention `e2e/brand.spec.ts` already uses. Importing `LANDING_CONTENT` into the test and asserting against itself would make a content-module regression invisible to the very test meant to catch it.
- **`gotoReady(page, path)` helper.** `page.goto()` resolves on load/commit, before this client-rendered SPA route has painted anything. A raw `page.evaluate()` or `page.keyboard.press()` right after `goto()` — as opposed to a Playwright locator, which retries — can read/act on an empty `#root`. First draft of this spec hit exactly this: `document.querySelector("h1")` returning `null` and `"main section h2"` resolving to zero elements, non-deterministically, until every `goto` was replaced with a wait for the page's own `h1` to be visible. All 42 tests pass with this in place.
- **Tab-through outline checks** (design.md "Amendments from task 1.1"; the `Button` primitive's `outline-none` bug). Real `page.keyboard.press("Tab")` sequences (not programmatic `.focus()`, which doesn't reliably trigger `:focus-visible` the same way) walk the landing header controls + send control, and the 404 header controls + home CTA, asserting `outline-style: solid` and `outline-width >= 2px` on `document.activeElement` at each stop.
- **`emberCtas()` / `tokenColor()` helpers** resolve `--km-ember` / `--km-ember-text` to their browser-computed colour via a throwaway probe element (same pattern as `tokenColor` in `e2e/chat-surfaces.spec.ts`), then count `a`/`button` elements whose computed `background-color` matches, per region.

---

## 2. Scenario → test mapping (29/29 scenarios in `specs/brand-pages/spec.md`)

| # | Scenario | Covered by | Notes |
|---|---|---|---|
| 1 | One real h1 and a value line | e2e: "one real h1 equal to the primary tagline, immediately followed by the value line"; "the h1 lies inside main..." | |
| 2 | Topic sections are named by their headings | e2e: "topic sections are named by their own h2, and each resolves as a named region" | Also checks every non-hero section's `aria-labelledby` points at an `h2` inside itself |
| 3 | FAQ items render as question headings | unit: `brand-copy.test.ts` "FAQ items render as question headings" (3 tests) | Real `LandingPage` render, mocked content |
| 4 | Hero headline is the primary tagline | e2e: scenario 1's test (exact `h1` text match); unit: "the headline is exactly the primary tagline" | |
| 5 | Content modules use only listed taglines | unit: "the landing headline is a member of APPROVED_TAGLINES" | |
| 6 | Retired slogans are gone | unit: "has no retired slogans in src, content or index.html" | |
| 7 | Nav and hero lockups at brand sizes | e2e: "nav lockup mark is >=24px and hero lockup mark is 52-72px at {320,768,1024,1440}px" (4 tests) | |
| 8 | Eyebrow and display headline | e2e: "eyebrow is 12px+ JetBrains Mono, and the h1 is Space Grotesk" | |
| 9 | Single ember accent in the headline | e2e: "exactly one ember-text descendant in the h1..." (dark, light) | |
| 10 | Footer lockup and legal line | e2e: "footer shows the footer lockup, the legal line and the package.json version" | |
| 11 | Hero has exactly one enabled ember CTA | e2e: "hero has exactly one enabled, named ember CTA; other regions have at most one" (dark, light) | |
| 12 | Other regions do not compete | same test as #11 (nav/footer = 0, other sections ≤ 1) | |
| 13 | Empty send does not navigate | e2e: "empty send does not navigate, and moves focus to the prompt field" | |
| 14 | Prompt starts a conversation | e2e: "Enter (no shift) submits the prompt and navigates to a new thread" | Also: "Shift+Enter adds a newline instead of submitting" (not a separate scenario, but pinned per task 3.1's explicit list) |
| 15 | No banned treatments in page source | unit: `flat-shell.test.ts` "Flat 2.0 brand pages" (per-file tests) | |
| 16 | No rendered borders, shadows or gradients | e2e: "{route}: no border, shadow, gradient or backdrop filter, nothing under 12px" × 3 routes × 2 themes (6 tests) | Also folds in the "nothing under 12px" check |
| 17 | Adjacent landing regions differ by background | e2e: "adjacent landing regions ... differ in background" (dark, light) | |
| 18 | Content modules pass the voice check | unit: brand-copy "{landing,about,not-found} content has no '!' and no banned or 'charcoal' word" (3 tests) | |
| 19 | Copy approval is recorded | **Not covered by task 3.1.** | This is `docs/content/brand-pages-copy.md`'s operator-approval line — task 4.2's evidence, not a test. |
| 20 | Product and runtime explanation | e2e: "About names the KnowMe agent on the Universal Agent Runtime" | Pre-existing `e2e/brand.spec.ts` also asserts this string; kept independently here since brand-pages.spec.ts owns this change's scenario set |
| 21 | Version comes from package.json | e2e: "About version row equals the package.json version" | The scenario's `grep -rn "\"0.1.0\"\|v0.1.0" src/pages` re-checked manually this session (exit 1, no match) — not wired into a QA test since it's task 2.2's own verify line, not new QA-owned coverage |
| 22 | Runtime status is not colour-only | e2e: "About runtime status is connected by default..."; "...shows a different label when /healthz returns 503" | 503 forced via a `page.route` override on `**/healthz` registered after the auto UAR-mock fixture |
| 23 | Endpoint is readable at 320px | e2e: "the runtime endpoint is unclipped at 320px, with no horizontal scroll" | |
| 24 | Unknown route | e2e: "unknown route shows one h1 containing 'not found' with no '!', the nav lockup, and the footer legal line" | |
| 25 | Return home without a full reload | e2e: "the 404 CTA returns home through client-side navigation, not a full reload" | `window.__noFullReload` marker set before click, checked still present after |
| 26 | No horizontal scroll at 320px | e2e: "no horizontal scroll at 320px on {/, /settings/about, /does-not-exist} ({dark,light})" (6 tests) | |
| 27 | Axe on the brand pages | **Not covered by task 3.1.** | `npm run test:a11y` is task 4.1, not run this session |
| 28 | Named icon-only controls | e2e: "dark theme: the theme toggle and the hero send control each resolve to exactly one named element" | |
| 29 | Captures at four widths in both themes | **Not covered by task 3.1.** | `npm run test:visual` + manual review is task 4.1, not run this session |

**26/29 scenarios have direct test evidence from this session; 3 (19, 27, 29) are explicitly task 4.1/4.2 evidence, not QA-owned unit/e2e coverage, and are named here rather than silently omitted.**

Additionally, task 3.1's own bullet list asked for the Tab-through outline check beyond the spec's scenario text (design.md "Amendments from task 1.1"): `e2e/brand-pages.spec.ts` has "landing: Tab reaches the lockup, theme toggle, Open app and send control, each with a solid >=2px outline" and "404: Tab reaches the header controls and the home CTA, each with a solid >=2px outline" — both pass.

No change was needed to `e2e/support/routes.ts` — the landing `readyText` (`/AI that/i`) and the `not-found`/`settings-about` ready texts already match the current headings.

---

## 3. Mutation-proof results (scratch copy, outside the repo)

Per the `browser-storage-e2e-testing` skill: proved each new suite can actually fail, in a scratch copy outside the repo, with a real control run first.

**Setup**: `qa-mutation-proof/app` under the session scratchpad, `src`/`content`/`e2e`/`public`/`index.html`/configs copied from the real repo, `node_modules` **symlinked** to the real repo's `node_modules`, `vite.config.ts` patched with `server.fs.allow` listing the scratch app dir and the real `node_modules` absolute path (without this, Vite 403s every request — the exact trap the skill names). A throwaway git repo was `git init`'d in the scratch copy so `git ls-files`-based tests (both `brand-naming.test.ts`'s pattern and my new retired-slogans check) work there too.

### Control run (unmodified scratch copy)

`npx vitest run src/test/flat-shell.test.ts src/test/brand-copy.test.ts` in the scratch copy — **first attempt failed**, and it was a real bug, not an environment artifact:

> `src/test/brand-copy.test.ts`'s own docstring comment contained the literal strings `"AI that knows"` / `"OS that learns you"` (quoting the grep pattern it mirrors, for documentation). Once the file was `git add`-ed in the scratch repo, `git ls-files` picked it up and the retired-slogans test failed against **itself**. This was silently masked in the real repo only because the file is new/untracked there (`git ls-files` only lists tracked files) — it would have started failing the moment anyone committed it. Fixed in the real repo (and copied into the scratch) by excluding `src/test/brand-copy.test.ts` from the scanned file list, exactly the way `src/test/brand-naming.test.ts` already excludes itself. Re-verified passing in the real repo (`npx vitest run src/test/brand-copy.test.ts` → 9/9) before re-running the scratch control.

Control run, second attempt: **87/87 passed** (78 + 9).

### Mutation 1 — re-add `border border-border` to one landing section

Changed one content `<section>`'s `className` from `` `${sectionBackground(index + 1)}` `` to `` `${sectionBackground(index + 1)} border border-border` `` in the scratch copy's `src/pages/landing-page.tsx`.

`npx vitest run src/test/flat-shell.test.ts` → **failed**, exactly the expected test:
```
FAIL src/test/flat-shell.test.ts > Flat 2.0 brand pages > src/pages/landing-page.tsx has no borders, shadows, blur, sub-12px text, raw palette colours, hex, literal white/black fills, opacity text colour or gradients
AssertionError: expected [ 'border: border', 'border: border-border' ] to deeply equal []
```
Reverted (`git checkout -- src/pages/landing-page.tsx`); confirmed clean tree.

### Mutation 2 — unlisted headline

Changed `content/site/landing.ts`'s `headline` to `"AI that knows you." as unknown as ApprovedTagline` (the `as unknown as` cast is needed only because vitest doesn't type-check; the real `tsc` type pin from design.md decision 3 would already reject this at compile time — this mutation targets the *runtime* guard specifically).

`npx vitest run src/test/brand-copy.test.ts` → **failed 3/9** (all in `Approved taglines only`):
- "the landing headline is a member of APPROVED_TAGLINES" — `expected [...] to include 'AI that knows you.'`
- "the headline is exactly the primary tagline" — `expected 'AI that knows you.' to be 'AI that understands you.'`
- "has no retired slogans in src, content or index.html" — `expected [ 'content/site/landing.ts' ] to deeply equal []` (a bonus catch: this specific mutation happens to also be a retired slogan)

Reverted; confirmed clean tree.

### Mutation 3 — a second `bg-primary` link in the hero

Added a decoy `<a href="#decoy" className="bg-primary mt-4 inline-block px-4 py-2">Decoy CTA</a>` as a sibling of the hero's value-line paragraph, in the scratch copy's `src/pages/landing-page.tsx`.

`npx playwright test e2e/brand-pages.spec.ts -g "hero has exactly one enabled"` → **failed 2/2** (dark, light):
```
Error: expect(received).toBe(expected) // Object.is equality
Expected: 1
Received: 2
    at .../e2e/brand-pages.spec.ts:272:24
```
(`--primary` resolves to `--km-ember`, per `src/styles/tokens.css`, so the decoy correctly registers as a second ember CTA.) Reverted; re-ran the same test — **2/2 passed**.

All three mutations behaved exactly as tasks.md 3.1 specifies. The scratch copy is left in place at `qa-mutation-proof/app` under the session scratchpad (the harness's `rm -rf` there was denied by the permission system; it is session-scoped and will be cleaned up with the scratchpad).

---

## 4. Flake investigation: `e2e/primitives.spec.ts` › "dialog traps Tab focus and returns focus on Escape"

### 4.1 Reproduction

```
npx playwright test e2e/primitives.spec.ts -g "dialog traps Tab focus" --repeat-each 10 --workers=1 --retries=0 --global-timeout=500000
```
Result on the unmodified test (this environment): **10 failed / 10** (worse than the reported 7/10 — same failure, at the same assertion, line 21: `expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)`).

### 4.2 Reading a failing trace

The `error-context.md` accessibility snapshot at one failure showed `document.activeElement` back inside the dialog (on the "Name" textbox) — i.e. by the time the snapshot was captured, focus had already recovered. That ruled out a permanently broken trap and pointed at timing.

A temporary instrumented copy of the test (not committed) logged `document.activeElement`'s tag/label after every `Tab` press, across several runs. Findings:
- **The very first Tab after opening the dialog always landed correctly** (`Save`, i.e. autofocus had already put focus on `Name` before any Tab) — in every run, across all attempts. This falsifies the task's suggested hypothesis ("Tab being pressed before the trap is armed after open"): the trap is armed immediately on open, every time.
- **The failure is specifically at the wrap-around**: Tab from the *last* focusable element inside the dialog (the built-in "Close" button that `DialogContent` renders) sometimes landed on an invisible `<span>` **outside** the dialog instead of wrapping back to "Name" — and then continued walking the underlying page's tab order (the trigger button, the Select trigger) until, by chance, a later Tab cycled back in.

### 4.3 Root cause

Read `node_modules/@base-ui/react/floating-ui-react/utils/enqueueFocus.js`: Base UI's dialog (`DialogPopup.js` → `FloatingFocusManager`) wraps Tab at the edges using invisible **focus-guard** sentinel elements. When native Tab moves focus onto a guard, the guard's own focus handler calls `enqueueFocus(realElement)` to redirect focus back inside the dialog — and `enqueueFocus` defaults to `sync: false`, scheduling the actual `.focus()` call via `requestAnimationFrame`, **not synchronously**:

```js
// enqueueFocus.js
if (sync) { exec(); return NOOP; }
const currentRafId = requestAnimationFrame(exec);
```

`page.keyboard.press("Tab")` only waits for the key event dispatch, not for that queued animation frame. Reading `document.activeElement` immediately afterward can catch focus mid-flight, sitting on the guard, one frame before Base UI's own corrective refocus lands. This is Base UI's real, working, intentional behaviour (deferred refocus is a documented technique to avoid focus-fighting) — **not a bug in the app's dialog**, and not something a change to `src/components/ui` should touch.

**Verdict: test-setup race**, per the skill's triage categories — the assertion reads a single point in time instead of waiting for the real signal (focus having settled inside the dialog).

### 4.4 Fix

`e2e/primitives.spec.ts`, the same test, same 6-iteration loop, same assertion condition — only the *how* of waiting changed, from a single synchronous read to polling the real signal:

```ts
await expect
  .poll(() => dialog.evaluate((d) => d.contains(document.activeElement)), {
    message: `Tab #${i + 1} should land (or settle, after the focus-guard's queued refocus) inside the dialog`,
  })
  .toBe(true);
```

This is `expect.poll` against the actual DOM state, not a `waitForTimeout` or a raised timeout/retry count — it resolves as soon as the real condition is true, and still fails (at the existing `expect.timeout: 15_000` from `playwright.config.ts`) if it never becomes true. No retries were added at the Playwright test level, and no timeout was raised.

### 4.5 Before / after

| Command | Before | After |
|---|---|---|
| `--repeat-each 10 --workers=1 --retries=0` | **10 failed / 10** | (superseded by the 20-repeat run below) |
| `--repeat-each 20 --workers=1 --retries=0` | not run | **20 passed / 20** |
| `--repeat-each 40 --workers=5 --retries=0` (fresh dev server, attempt 1) | not applicable | 30 passed / 40 — **10 failures, all `page.goto` timeouts in `beforeEach`**, zero focus-assertion failures |
| `--repeat-each 40 --workers=5 --retries=0` (fresh dev server, attempt 2) | not applicable | 35 passed / 40 — **5 failures, same navigation-timeout signature**, zero focus-assertion failures |
| `--repeat-each 40 --workers=5 --retries=0` (fresh dev server, attempt 3) | not applicable | **40 passed / 40** |
| `--repeat-each 40 --workers=5 --retries=0` with `E2E_REUSE_SERVER=1` against a pre-warmed server | not applicable | **40 passed / 40** |

**Separate finding, reported and not silently fixed:** the two `--workers=5` attempts that failed did so entirely on `page.goto("/e2e/harness/primitives.html")` timing out in `beforeEach` (`Test timeout of 60000ms exceeded ... navigating to ... waiting until "load"`) — never on the focus assertion this investigation targets. A manual probe confirmed the cause: the harness route's **first-ever** compile through this dev server took ~7.5s (`curl` timing, cold), while a repeat request was 0.013s; five workers all making that first request concurrently against a freshly-spawned server occasionally pushed one or two of them past the 60s test timeout in this sandboxed environment. Pre-warming the server with one request before the stress run (attempt with `E2E_REUSE_SERVER=1`) eliminated it completely (40/40), and a third fully-fresh attempt also came back clean (40/40), confirming this is a probabilistic cold-start/load characteristic of the harness route under 5-way concurrency, independent of the dialog fix — not a new flake introduced here, and not something `e2e/primitives.spec.ts`'s `beforeEach` (unmodified by this fix) can be blamed for. No workers/timeout/retry values were changed to make this go away; it is named here as a follow-up worth a second look (e.g. a session-scoped warm-up navigation) if `--workers=5` stress runs of this file become routine.

**Net**: 0 focus-assertion failures across 20 (workers=1) + 40 + 40 + 40 + 40 (workers=5) = **180 total executions** of the fixed test. The two required bars are met: 20/20 at `--workers=1`, and 40/40 at `--workers=5` (achieved twice, including once with a completely fresh server).

---

## 5. Commands and results (this session)

| Command | Result |
|---|---|
| `npx tsc --noEmit -p e2e/tsconfig.json` | exit 0, no output (run after both `brand-pages.spec.ts` and the `primitives.spec.ts` fix) |
| `npx vitest run` (full suite) | exit 0 — **43 files / 389 tests passed** |
| `npx vitest run src/test/flat-shell.test.ts src/test/brand-copy.test.ts` | exit 0 — 87/87 |
| `npx playwright test e2e/brand-pages.spec.ts --global-timeout=500000` | exit 0 — **42/42** |
| `npx playwright test e2e/brand.spec.ts --global-timeout=500000` | exit 0 — 9/9 (pre-existing brand-identity suite, unaffected) |
| `npx playwright test --global-timeout=500000` (full e2e suite) | exit 0 — **239 passed / 239, 0 failed** (12 spec files, including `a11y.spec.ts` in report-only mode, `visual.spec.ts`, `brand-pages.spec.ts`, and the fixed `primitives.spec.ts`) |

All Playwright runs used `PATH=.../v24.16.0/bin:$PATH` (Node 24) and were run one at a time, wrapped in `timeout 540 ... --global-timeout=500000`, per instructions. Port 4174 was confirmed free before every run that needed it; no stray `vite`/`node` processes were left running at the end of the session.

---

## 6. What remains

- **Task 4.1** (full `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`, then `npm run test:visual` capture review, then `npm run test:a11y`) — not run this session. Spec scenarios 27 ("Axe on the brand pages") and 29 ("Captures at four widths in both themes") depend on it.
- **Task 4.2** (`verification.md`, independent review) depends on 4.1's evidence plus the copy-approval line (scenario 19), neither produced here.
- **Follow-up, not part of this task**: the `beforeEach`/`page.goto` cold-start timing under `--workers=5` concurrent first-navigation to `e2e/harness/primitives.html`, described in §4.5. Worth a warm-up navigation if this file is regularly stress-run at `--workers=5`; not fixed here since it is outside the scope of the requested flake and does not affect normal (`--workers` default, single run) execution — the full e2e suite (§5) passed 239/239 with the default configuration.

## Task 4.1: full gate (orchestrator, 2026-09-26, Node v24.16.0, after merging self-hosted fonts from main)

- `npm run build`: ok. `npm run typecheck`: ok. `npm run lint`: 0 errors, 2 existing warnings. `npm test`: 389/389.
- `npm run test:e2e`: 239 passed, 1 failed. The failure was `brand-pages.spec.ts:220`, which expected the family "JetBrains Mono"; the fonts are now self-hosted as "JetBrains Mono Variable". The assertions now expect the self-hosted family names, and the test passes.
- `npm run test:visual`: 96 passed, including all 24 brand-page captures in `test-results/screenshots/{landing,settings-about,not-found}__{320,768,1024,1440}__{dark,light}.png`. In the light 1440 landing capture the bands read as distinct (chrome, then canvas, then band and canvas alternating, then chrome). There is one ember control (Send), the h1 is "AI that understands you.", and there are no borders, shadows or gradients.
- `npm run test:a11y`: 24 passed. axe found 3 violations across 2 rules, all on routes outside this change. landing, settings-about and not-found are 0/0 in both themes. The baseline had landing `button-name` ×1 per theme; that is now fixed.
- **Known infrastructure issue, not fixed here (follow-up for brand-fidelity-audit):** on a freshly started dev server, the a11y spec intermittently fails with `page.goto` timeouts or `ERR_ABORTED (frame detached)`. This happened after lockfile or branch changes; a warm server passes 24/24. The cause is likely Vite's dependency re-optimisation reloading pages during the first concurrent loads, but that is unconfirmed. Self-hosting the fonts removed one contributor (the Google Fonts stall), not all of them. This corrects the 2026-09-26 gotchas entry, which named the fonts as the cause.
