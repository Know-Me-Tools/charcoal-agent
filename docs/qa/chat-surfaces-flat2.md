# QA report: chat-surfaces-flat2 (task 4.1)

Owner: km-qa-engineer. Change: `openspec/changes/chat-surfaces-flat2`. Branch: `rebrand/chat-surfaces-flat2`.
Reviewed against `docs/design/chat-surfaces.md` §12 (visual acceptance criteria) and `know-me-system/docs/knowme-ui-ux-standard.md` §7.7 (chat visual treatment). No commit made; this file is the evidence for task 4.2 (`verification.md`).

---

## 1. Build / typecheck / lint / unit / e2e gate

Command: `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`

| Step | Exit | Result |
|---|---|---|
| `npm run build` | 0 | `vite build` succeeded, `✓ built in 1m 5s` |
| `npm run typecheck` | 0 | `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p e2e/tsconfig.json`, no output |
| `npm run lint` | 0 | `eslint .` — **0 errors, 2 warnings** |
| `npm test` | 0 | vitest: **200 passed / 200** (24 files) |
| `npm run test:e2e` | 0 | playwright: **162 passed / 162** |

All five steps exited 0.

**Lint detail** — 0 errors, 2 warnings, both pre-existing and unrelated to this change (shadcn primitives, not touched by tasks 2.1–3.2):
```
src/components/ui/button.tsx  57:18  warning  react-refresh/only-export-components
src/components/ui/tabs.tsx    79:52  warning  react-refresh/only-export-components
```

**Build notes** (not blocking, pre-existing, out of km-qa-engineer scope to fix):
- `@electric-sql/pglite` emits Rollup "not exported by `__vite-browser-external`" warnings and an `eval` warning — known, documented in `CLAUDE.md` gotchas.
- Rollup chunk-size warning: `dist/assets/index-*.js` is 2,450.71 kB (666.44 kB gzip); several vendor chunks (Shiki languages, `mermaid.core`, `wasm`, `cpp`, `emacs-lisp`) exceed 500 kB. Pre-existing, not introduced by chat-surfaces-flat2 (no `manualChunks`/code-splitting work is in this change's scope). Flagging for awareness, not as an unmet criterion of this change.

---

## 2. Visual harness — fixture thread at 320/768/1024/1440, both themes

Command: `npm run test:visual` — **96 passed / 96**, exit 0. Screenshots regenerated fresh in `test-results/screenshots/`.

Thread captures reviewed (all 8 present and opened as images, not inferred):

```
test-results/screenshots/thread__320__light.png   test-results/screenshots/thread__320__dark.png
test-results/screenshots/thread__768__light.png   test-results/screenshots/thread__768__dark.png
test-results/screenshots/thread__1024__light.png  test-results/screenshots/thread__1024__dark.png
test-results/screenshots/thread__1440__light.png  test-results/screenshots/thread__1440__dark.png
```

For the two flagged risks (light composer anchor, dark code well) I also pulled the actual rendered `getComputedStyle` values through a throwaway Playwright probe (not the visual-review captures) and sampled capture pixels directly with Pillow, since a screen-viewed judgement of a ~1.03:1 step is unreliable either way — the numbers below are measured, not estimated.

### Acceptance criteria (§12), fixture thread, 320/768/1024/1440 × light/dark

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | No visible border/divider/shadow/backdrop-filter/gradient in the thread region | **PASS** | All 8 captures: skill/context/memory/tool/artifact/A2UI cards, code wells, composer are fill-only. One caveat: Mermaid flowchart nodes ("Plan"/"Build"/"Review") render with their own stroked boxes — this is Mermaid's inline SVG theme, explicitly out of scope per design doc §12/§13 ("Mermaid theme colours are inline SVG fills from Mermaid's theme, outside our tokens"), not a KnowMe surface border. |
| 2 | Assistant reply has no fill; Roboto; no line > 68ch | **PASS** | `thread__1440__*.png`: prose sits directly on canvas, no bubble; paragraph width is well under the 68ch cap at 1440. |
| 3 | User message on ember-tinted fill at trailing edge, 16px radius / 6px trailing top corner, ≥4.5:1 text | **PASS** | Visible in all 8 captures (peach fill light, dark-ember fill dark, right-aligned, rounded with a flatter trailing-top corner). Contrast is asserted at runtime in both themes by `e2e/chat-surfaces.spec.ts` (task 3.2, passing) and by `src/styles/tokens.test.ts` (16.2:1 light / 14.1:1 dark per the design doc). |
| 4 | Reply gap (16px) visibly smaller than gap before next question (48px) | **PASS (partial verification)** | The fixture has only one exchange, so the "gap before the next question" half can't be measured from a capture. Confirmed instead from source: `enhanced-thread.tsx` assistant root is `pt-2 pb-6`, user root is `pt-6 pb-2 first:pt-0` — matches §3.2's 16px/48px rhythm. The one visible reply gap in every capture reads tight (~16px), consistent. |
| 5 | Thinking/citation cyan-tinted; tool/skill/memory/context/artifact/A2UI neutral; code on the code well | **PASS** | "Reasoning" and "Planning guide" are the only pale-cyan cards in every capture; "KnowMe Profile" (skill), "Context managed", "Memory recalled", both tool-call rows, both `Artifact` cards, "Input requested" and "Custom Event" are all neutral `bg-surface` gray; the `ts` code sample sits in a visibly distinct well (light) — see the dark-theme caveat under §3 below. |
| 6 | Every status is an icon+text pill; Running is cyan, not amber | **PASS** | Both "Completed" pills (skill activation, both tool calls) show a check icon plus the word "Completed" in every capture. No `Running`/`Sending` state exists in this completed static fixture, so the cyan-vs-amber distinction itself is confirmed by source (`tool-call-block.tsx` `statusConfig.running.toneClass = "text-cyan-text"`, `fillClass = "bg-cyan-soft"`) rather than by a captured pixel. |
| 7 | No text under 12px in the thread; nothing dimmed by opacity | **PASS** | No visibly tiny or faded text in any capture; enforced structurally by the `src/test/flat-shell.test.ts` chat-surfaces guard (task 3.1, 62/62 passing) for the `text-[<12px]` and opacity-on-color patterns. |
| 8 | Composer is a filled surface, no outline at rest or on focus, fill changes on focus | **UNMET (light theme, at rest) — see §3** | See below. |
| 9 | At 320px: no page-level horizontal scroll, long tool name fully visible, pills reflow below | **PASS** | `thread__320__light.png` / `thread__320__dark.png`: the 112-character unbroken tool name wraps across two lines with no ellipsis, and its "Completed" pill drops to its own line below the name. Matches the passing `e2e/chat-surfaces.spec.ts` 320px assertions (document- and viewport-level `scrollWidth <= clientWidth`, task 3.2). |
| 10 | HTML preview on white in both themes; full screen dims with the scrim, no blur | **NOT OBSERVABLE** | The fixture thread has no HTML artifact block (`html-artifact-card.tsx` is not exercised by `e2e/fixtures/sse.ts`), so this criterion cannot be checked from these captures. Not marked pass or fail; flagging as unverified by this review. |
| 11 | Streaming indicators are cyan; static but visible under reduced motion | **PASS (verified by source, not by capture)** | Every capture is of a *finished* conversation (the fixture stream completes before the screenshot), so no in-flight streaming/thinking-pulse/spinner state is present to photograph. All captures were taken under Playwright's global `reducedMotion: "reduce"` (`playwright.config.ts`), and the relevant classes (`bg-cyan`, `text-cyan-text`, `animate-shimmer`/`animate-spin`) are present in source per `docs/design/chat-surfaces.md` §9. |
| 12 | Ember appears only on the user fill, links, "Show more", the caching toggle when on, and primary buttons | **PASS** | Ember/orange appears in exactly three places across all 8 captures: the user message fill, the long-URL link text, and the primary "Add" / send buttons. No stray ember elsewhere. The caching-toggle-on state isn't exercised by the fixture (default composer state), so that sub-case is unverified but low-risk (single conditional class already covered by the existing component test suite, out of this task's scope to re-verify). |

**Score: 9 PASS, 1 UNMET (criterion 8, light theme), 1 partial (criterion 4, single-exchange fixture limits full verification), 2 not directly observable from these captures (10, 11 — no HTML artifact / no in-flight streaming state in a completed-conversation fixture).**

### 3. The two risks the design doc asked task 4.1 to check specifically

Both are confirmed present. Measured with a throwaway Playwright probe (`getComputedStyle`) against the real rendered thread page, and cross-checked against `src/styles/tokens.css`, not inferred from token literals alone.

**a. Light-theme composer anchor (§4.2 "Known weakness")** — **UNMET, file to km-creative-director, not waived.**

The fixture captures actually show the composer in its *focused* state, not at rest — `ComposerPrimitive.Input` has `autoFocus`, so the textarea keeps focus through the whole scripted send, and the dropzone's `focus-within:bg-raised` is active in every capture (confirmed: computed `background-color` of the composer div is `rgb(255, 255, 255)`, which equals `--km-raised: #ffffff`, not `--km-surface: #fafbfc`). To check the *rest* state the design doc actually flags, I blurred the input programmatically and re-read the computed style:

| Pair (light theme) | Values | Contrast |
|---|---|---|
| `--km-canvas` vs `--km-surface` (composer at true rest) | `#f7f7f8` vs `#fafbfc` | **1.033:1** |
| `--km-surface` vs `--km-raised` (the focus step itself) | `#fafbfc` vs `#ffffff` | 1.036:1 |
| `--km-canvas` vs `--km-raised` (what the captures show, since autofocus keeps it focused) | `#f7f7f8` vs `#ffffff` | 1.071:1 |

This matches the design doc's own estimate (1.03:1) almost exactly. At rest, the light-theme composer is a 3-unit-of-255 luminance step from the canvas — not perceptible as a distinct surface in practice. The dark theme is meaningfully better (`--km-canvas #0b0f14` vs `--km-surface #161d29` = **1.137:1** at rest, vs `--km-raised #1c2535` = **1.25:1** focused), so this is a light-theme-only defect.

Per the design doc: *"If the composer does not read as a distinct surface there, file it to km-creative-director as a token change (a dedicated field token), not a component workaround."* Filing as unmet, not waiving it: **owner km-creative-director**, criterion 8 (`docs/design/chat-surfaces.md` §12).

**b. Dark-theme code well (§13 risk list)** — **UNMET, file to km-creative-director, not waived.**

Sampled directly from `test-results/screenshots/thread__1440__dark.png` pixels (not just token literals):

| Region | Sampled RGB | Token |
|---|---|---|
| Canvas (outside the card) | `(11, 15, 20)` | `--km-canvas: #0b0f14` |
| Code body fill (blank area, not on a glyph) | `(10, 18, 32)` | `--km-code: #0a1220` |
| Code header row (`bg-raised`) | `(28, 37, 53)` | `--km-raised: #1c2535` |

Canvas-vs-code-well contrast: **1.025:1** — visually the code body is indistinguishable from bare canvas by fill alone (confirmed by eye in the capture, not just computed). The header row is the only thing marking where the block starts, exactly as the design doc anticipates: *"The `bg-raised` header row marks where a code block starts. If code bodies read as bare canvas in the dark captures, `--km-code` needs a new dark value."* They do. Filing as unmet: **owner km-creative-director**, `--km-code` needs a new dark value (`docs/design/chat-surfaces.md` §13).

---

## 4. Accessibility — `npm run test:a11y`

Command: `npm run test:a11y` (clean → `playwright test e2e/a11y.spec.ts` → merge report). Playwright exit 0 (report-only mode; `AXE_STRICT` was not set). **24 scans / 6 violations across 3 rules.**

```
axe: 24 scans, 6 violations across 3 rules
  color-contrast [serious] 2 page/theme(s), 7 node(s) — Elements must meet minimum color contrast ratio thresholds
  button-name [critical] 2 page/theme(s), 2 node(s) — Buttons must have discernible text
  nested-interactive [serious] 2 page/theme(s), 18 node(s) — Interactive controls must not be nested
```

### Delta vs. the app-shell-flat2 baseline

| Rule | Baseline (post app-shell-flat2) | Now (post chat-surfaces-flat2) | Delta |
|---|---|---|---|
| color-contrast | 5 page/theme scans, 38 nodes | **2 scans, 7 nodes** | **−3 scans, −31 nodes** — net large improvement |
| button-name | 2 scans (landing) | 2 scans, 2 nodes (landing) | unchanged, same page |
| nested-interactive | 2 scans (skills) | 2 scans, 18 nodes (settings-skills) | unchanged, same page |

`button-name` and `nested-interactive` are both still confined to `landing` and `settings-skills` respectively — outside chat-surfaces-flat2's scope (no change to those routes in this branch), so no regression there.

### Where the remaining color-contrast violations are

Read directly from `test-results/a11y/*.json` (per-route files), not summarized only:

| Route / theme | Nodes | In the thread region? | Source |
|---|---|---|---|
| `agents` / light | 1 | **No** — a `federated` badge on `/agents` (`bg-blue-500/10 text-blue-400 border-blue-500/20`, 2.27:1). Pre-existing, unrelated component, out of chat-surfaces-flat2 scope. | `test-results/a11y/agents__light.json` |
| `thread` / light | **6** | **Yes** | `test-results/a11y/thread__light.json` |
| `thread` / dark | 0 | — | `test-results/a11y/thread__dark.json` — clean |

**`thread` / light is the one violation inside the thread region**, and it's exactly design-doc risk #3 (§13): *"Shiki palettes (`github-light`, `github-dark-dimmed`) were designed for their own backgrounds, not `bg-code`. Low-contrast comment colours would only show in captures and the axe run."* Confirmed — the failing tokens aren't comments here, they're Shiki's keyword/entity colors:

| Shiki token colour | On `bg-code` (`#f0f2f5`) | Ratio | Needed | Nodes |
|---|---|---|---|---|
| `#d73a49` (keywords: `export`, `function`, `const`, `new`, `return`) | fails | 4.07:1 | 4.5:1 | 5 |
| `#e36209` (parameter/identifier: `date`) | fails | 3.11:1 | 4.5:1 | 1 |

The `e2e/a11y.spec.ts` logotype exemption (`[data-slot='knowme-wordmark']`) does not apply here — these are plain Shiki `<span style="color:...">` tokens inside the `ts` code sample, not the KnowMe wordmark. The dark theme (`github-dark-dimmed`) does not trigger this — `thread`/dark has 0 violations.

**Filing as unmet, not waiving it: owner km-creative-director** (`docs/design/chat-surfaces.md` §13, criterion 5 of §12). This is a Shiki-theme-vs-token mismatch, not something `src/styles/tokens.test.ts` can catch (Shiki's palette lives outside the KnowMe token set), and not in km-qa-engineer's or km-frontend-engineer's owned paths to fix directly — it needs either a KnowMe-authored Shiki theme override or a different light Shiki theme choice.

---

## 5. Summary

| Gate | Result |
|---|---|
| build / typecheck / lint / unit / e2e | **All 5 exit 0.** Lint: 0 errors, 2 pre-existing warnings unrelated to this change. |
| Visual harness (8 thread captures, 4 widths × 2 themes) | **9/12 criteria PASS**, 1 unmet (composer, light, criterion 8), 1 partially verifiable (criterion 4 — single exchange in fixture), 2 not observable from this fixture (10 — no HTML artifact; 11 — no in-flight streaming state in a completed-conversation capture). |
| a11y (`npm run test:a11y`) | 24 scans / 6 violations / 3 rules. `color-contrast` improved from the app-shell-flat2 baseline (5 scans/38 nodes → 2 scans/7 nodes). `button-name` and `nested-interactive` unchanged, both outside this change's scope. **One violation is inside the thread region** (`thread`/light, 6 nodes, Shiki-on-`bg-code`). `thread`/dark is clean. |

### Unmet criteria filed to km-creative-director (not waived)

1. **Composer, light theme, at rest**: `--km-canvas` (`#f7f7f8`) vs `--km-surface` (`#fafbfc`) = 1.033:1 — the composer does not read as a distinct filled surface until it is focused. Design doc §4.2/§12 criterion 8.
2. **Code well, dark theme**: `--km-canvas` (`#0b0f14`) vs `--km-code` (`#0a1220`) = 1.025:1 — code bodies read as bare canvas except for the `bg-raised` header row. Design doc §13.
3. **Shiki syntax colors on `bg-code`, light theme**: two Shiki `github-light` token colors (`#d73a49` at 4.07:1, `#e36209` at 3.11:1) fail WCAG AA against `--km-code` (`#f0f2f5`); confirmed by axe inside the thread region, 6 nodes, `thread`/light only. Design doc §13.

None of these are waived. All three trace to token/theme values outside `src/styles/tokens.test.ts`'s coverage (the composer's *rest*-state token pair, the dark code-well token, and Shiki's own palette), so they are not fixable inside km-qa-engineer's or km-frontend-engineer's owned paths and are recorded here as unmet for km-creative-director to action.

---

## 6. Re-verification after remediation (task 4.3 evidence)

Closes the coverage gaps `openspec/changes/chat-surfaces-flat2/verification.md` (task 4.3, product owner) found: scenarios that were PARTIAL or UNMET only because nothing tested them. Read `specs/chat-surfaces/spec.md` and `verification.md` first; this section maps each gap to the new test, states what it found, and re-runs the full gate on the tree as it now stands (HEAD: `e142cc1`, plus the uncommitted `e2e/**` changes below — no commit made). Scope for this pass: `e2e/**` and `docs/qa/**` only.

### 6.1 Files changed

- `e2e/chat-surfaces.spec.ts` — 10 new tests (listed in 6.2).
- `e2e/fixtures/sse.ts` — a running tool call (`send_calendar_invite`, never gets a result), a failed one (`sync_contacts`, `tool_result` with `success: false`), an HTML fence in the assistant's markdown reply (`html artifact`), and three new partial-stream exports for held-open mid-stream states (`PARTIAL_STREAM_EVENTS`, `PARTIAL_STREAM_THINKING_ONLY_EVENTS`, `ERROR_STREAM_EVENTS` + `RAW_STREAM_ERROR_TEXT`).
- `e2e/support/uar-mock.ts` — added `holdChatStreamOpen(page, sseBody)`: overrides `window.fetch` for `/api/chat/completion` via an init script (before any page script runs) so the response never closes, which is what keeps a message "running" indefinitely. Needed because `route.fulfill()` only delivers a whole body atomically — Playwright has no genuine chunked/held-open response support — so a body that's merely missing `agui.done` still finishes as soon as delivery completes.
- `e2e/support/routes.ts` — added `send_calendar_invite`, `sync_contacts` and `html artifact` to the shared fixture-conversation marker wait list, so `openRoute`/`streamFixtureConversation` (used by `chat-stream.spec.ts`, `visual.spec.ts`, `a11y.spec.ts`) prove the new blocks rendered before capturing/scanning.
- `docs/qa/chat-surfaces-flat2.md` — this section.

### 6.2 Tests added per scenario

| Scenario(s) | Test | Finding |
|---|---|---|
| 2, 6 (block-wide Flat 2.0) | `Flat 2.0: no element in the thread region has a visible border, box shadow or backdrop filter, and no text is under 12px` (light, dark) | Walks every element under `.aui-thread-root` (thread + composer, composer blurred to its rest state first), same computed-style method as `shell.spec.ts`'s existing sweep. **Light: PASS. Dark: FAILS — see 6.4, a real defect, not a test bug.** |
| 8 (thinking expand) | `Thinking: collapsed by default, aria-expanded toggles, and the body shows on expand` | PASS. `aria-expanded` false → click → true; body hidden → visible. |
| 9 (tool states) | `Tool states: a completed call shows an icon-and-text Completed pill…` and `…a running call (no result yet) shows an icon-and-text Running pill…` | PASS for both. **The third state, "Failed", could not be given a test — see 6.5: it is unreachable at runtime, not merely untested.** |
| 11 (HTML artifact) | `HTML artifact: inline preview sits on the artifact canvas; full screen dims with the scrim, no blur, and Escape returns focus` | PASS. Inline iframe background matches `--km-artifact-canvas` computed colour, `color-scheme: light`; full-screen overlay background matches `--km-scrim`, `backdrop-filter: none`; Escape closes the dialog and returns focus to the "Full screen" button. |
| 12 (streaming indicator) | `Streaming: the reasoning trigger pulses cyan while "Thinking" is the active part` and `Streaming: the markdown streaming mark after assistant prose uses the cyan token while text is in flight` | PASS for both, split into two tests — see 6.6 for why one stream can't show both signals at once. Each also saves a mid-stream capture (`thread__mid-stream-thinking.png`, `thread__mid-stream-text.png`), reviewed in 6.7. |
| review round 1 fix (message error) | `Message error: plain-language recovery text and Try again, never the raw error` | PASS. Needed an event-based failure (`agui.error` after at least one content delta), not an HTTP-level 500 — see 6.6. |
| 17 (Mermaid source/copy) | `Mermaid: the "Source" toggle reveals the source, and a Copy control exists, on the Week flow diagram` | PASS. Scoped to the "Week flow" card (there's a second, inline Mermaid fence in the same reply) to avoid ambiguity. |

`e2e/chat-surfaces.spec.ts` now has 16 tests total (6 from tasks 3.2/4.2 plus these 10, two of the new ones parameterized over both themes).

### 6.3 Fresh gate

Ran literally as specified: `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`.

| Step | Exit | Result |
|---|---|---|
| `npm run build` | 0 | `✓ built in` ~1m; same pre-existing pglite/eval and >500 KB chunk warnings as task 4.1, not introduced here. |
| `npm run typecheck` | 0 | clean (`tsconfig.app.json` + `e2e/tsconfig.json`). |
| `npm run lint` | 0 | 0 errors, 2 pre-existing warnings (`button.tsx:57`, `tabs.tsx:79`). |
| `npm test` | **1** | **218 / 219 passed.** 1 failure — see 6.4. As `&&`-chained, the gate stops here; `test:e2e` never runs. |
| `npm run test:e2e` (run separately for full data) | 1 | **171 / 172 passed.** The 1 failure is the same defect as `npm test`'s finding, from the new dark-theme block-wide sweep (6.4) — not a second, independent problem. |

`npm run test:visual`: **96 / 96 passed**, captures regenerated at 04:34 (after both `ab906a6` and `e142cc1` — see 6.7). `npm run test:a11y`: **24 scans / 5 violations / 3 rules** — see 6.8.

Regression check: `chat-stream.spec.ts`, `shell.spec.ts`, `a11y.spec.ts`, `visual.spec.ts` together — **136 / 136 passed** — the fixture extensions (new tool calls, HTML fence, new markers) did not break any existing spec.

**Fixture-marker flake** (`verification.md` §6: one run in four failed waiting for "KnowMe Profile" under 5-worker parallelism): not observed to recur across roughly six full runs of `chat-surfaces.spec.ts` plus the regression specs in this session. Not investigated further since it didn't reproduce; flagging that absence of evidence isn't evidence of a fix.

### 6.4 New finding: a real border in the dark composer, not a coverage gap

The block-wide sweep (scenarios 2, 6) is genuinely new coverage — the file it caught was never in task 3.1's static-guard glob — and it found a real defect on its first run, reproduced on every subsequent run:

```
border: BUTTON.…aui-composer-add-attachment text-muted-foreground hover:text-foreground
  hover:bg-muted-foreground/15 dark:border-muted-foreground/15 dark:hover:bg-muted-foreground/30…
```

`ComposerAddAttachment` in `src/components/assistant-ui/attachment.tsx:259` carries `dark:border-muted-foreground/15` — a real, visible 1px border in the dark theme, on the composer's "Add Attachment" button. It's assistant-ui-registry-default styling (`aui-composer-add-attachment`, `text-muted-foreground`) that the chat-surfaces Flat 2.0 pass never touched, and `attachment.tsx` was never in task 3.1's guard file glob, so no static check ever scanned it. The sweep passes cleanly in the light theme (no border-color override there, so it stays `border-transparent`).

Left the assertion failing rather than excluding this element: the point of the sweep is to catch exactly this. **Filed as a defect, not a coverage gap — owner km-frontend-engineer.** `src/components/assistant-ui/attachment.tsx:259`, remove or theme the `dark:border-*` classes on `ComposerAddAttachment`.

### 6.5 New finding: the tool "Failed" pill is unreachable, not just untested

`verification.md` already flagged tool Running/Failed as untested (#8, #9) and recorded it as a spec/code mismatch needing a decision. Building the coverage went further and found the mismatch is not "the three states exist but nobody streamed one before" — the **third state cannot happen at all** under the current wiring, confirmed by reading the library source and then proving it empirically:

- `use-chat-runtime.ts` passes `isError: block.status === "failed"` on the tool-call part, and nothing else that could mark it failed.
- `@assistant-ui/core`'s `toMessagePartStatus` (`node_modules/@assistant-ui/core/dist/utils/normalizePartStatus.js`) has, for `part.type === "tool-call"`: `if (part.result === void 0) return message.status; else return COMPLETE_STATUS;` — **`isError` is never read.** Any tool call with a `result`, success or failure, gets `{type: "complete"}`.
- `ToolCallBlockWrapper` maps `status.type === "incomplete"` to the "Failed" pill — a value this function can never produce for a tool call.
- Verified with a probe (not kept as a test, since it can't pass): a held-open stream sends `sync_contacts` a `tool_result` with `success: false`, mid-stream, message still "running". It renders **"Completed"**, not "Failed", exactly as the source predicts.

`sync_contacts` and its `success: false` result stay in the fixture (its marker is still asserted in `routes.ts`) so the store/render path for a failed result is at least exercised and visible in capture review — see the "Reasoning"/tool-call rows in `thread__1440__light.png`, both `send_calendar_invite` and `sync_contacts` read "Completed" there, which is the visible symptom of this defect.

**Stopping and reporting per scope, not fixing it**: closing this needs app code — either `ToolCallBlockWrapper` deriving "failed" from the block's own `result`/`success` data instead of trusting assistant-ui's forwarded `status.type`, or a different way of signalling the failure through assistant-ui's part shape. **Owner: km-frontend-engineer** (implementation) **and km-product-owner** (verification.md already asked whether to amend the spec to three genuinely-supported states or add a fourth `pending` state — this finding sharpens that: it isn't a states-vs-labels question, "failed" is dead code today).

### 6.6 Two library/wiring constraints that shaped the new tests

- **`toMessagePartStatus` only lets the LAST content part inherit the message's "running" status** (tool-calls excepted — their status is unconditional on `result`). A reasoning part followed by a text part reads "complete"/"Reasoning" once the text part exists, even while the message overall is still streaming. Confirmed by probing `PARTIAL_STREAM_EVENTS` (thinking then text): the reasoning trigger read "Reasoning", not "Thinking", with no pulsing dots. This is why scenario 12 needed two separate held-open streams (`PARTIAL_STREAM_THINKING_ONLY_EVENTS` where thinking is the only, and therefore last, part) rather than one.
- **The streaming assistant message doesn't exist until the first content delta.** `beginStream` sets `streamingMessageId: null`; `getOrCreateStreamingMessage` (`src/stores/chat-message-store.ts`) is what actually creates the message, and it's only called from delta-appending actions. An immediate HTTP-level failure (e.g. the mock returning 500 before any SSE content) leaves `setStreamError` with no message to attach the error to, so **no error UI renders at all** — confirmed by probing an HTTP-500 mock: the DOM had a user message and nothing else, no error block. Switching to an `agui.error` SSE event sent after one `agui.message.delta` fixed this and is what the test now uses.

### 6.7 Capture review: both task 4.1 risks confirmed fixed

Regenerated all 8 thread captures (`npm run test:visual`, 04:34, after `ab906a6` 03:49 and `e142cc1`) and opened every one, plus the two new mid-stream captures. Re-measured both flagged risks the same way as task 4.1 (Playwright `getComputedStyle` probes on the real page, not token literals), since the visible improvement needed a number, not just an impression:

| Risk | Before (task 4.1) | After (`ab906a6`) | Visual |
|---|---|---|---|
| Light composer at rest | `--km-canvas` #f7f7f8 vs `--km-surface` #fafbfc = **1.033:1** | `--km-canvas` #f7f7f8 vs `--km-composer` #eef0f3 = **1.066:1** | Confirmed by eye in a crop of `thread__1440__light.png`: the composer is now a clearly bounded lighter box against the canvas, not a barely-there edge. |
| Dark code well | `--km-canvas` #0b0f14 vs `--km-code` #0a1220 = **1.025:1** | `--km-canvas` #0b0f14 vs `--km-code` #111720 = **1.068:1** | Confirmed by eye in a crop of `thread__1440__dark.png`: the `ts` code block now reads as a distinct navy well down its full body, not just at the header row. |
| Light Shiki syntax colours on `bg-code` | 2 colours fail AA (4.07:1, 3.11:1), 6 axe nodes | **0 axe nodes** (6.8) | The `ts` sample's keyword/identifier colours are legible in `thread__1440__light.png`. |

Both are still a smaller step than the shell's `--km-chrome`-vs-`--km-canvas` pairing, so "distinct surface" here means "now has a visible edge," not "leaps off the page" — consistent with the intentionally subtle §4.2 design.

New content reviewed across all 4 widths × 2 themes (not just 1440): the HTML artifact (`html artifact` toolbar, "Rebrand quick look" preview on white in both themes, toolbar wraps to two lines at 320px per §10.1), and the running/failed tool rows (both wrap correctly at 320px, no ellipsis, pill drops below the name). No new visual regressions found outside the two items in 6.4/6.5.

The two mid-stream captures (`thread__mid-stream-thinking.png`, `thread__mid-stream-text.png`) are direct photographic evidence for scenario 12: the first shows "Thinking ●●●" in cyan with no reply text yet; the second shows "Reasoning" (now complete), a cyan "Running" pill on `send_calendar_invite`, and the prose ending in a small cyan dot after "…priorities." — the exact "signature" moment `docs/design/chat-surfaces.md` §1.2 describes.

### 6.8 Axe totals

`npm run test:a11y`: **24 scans / 5 violations / 3 rules** (down from 6 at task 4.1, pre-remediation):

```
color-contrast [serious] 1 page/theme(s), 1 node(s)
button-name    [critical] 2 page/theme(s), 2 node(s)
nested-interactive [serious] 2 page/theme(s), 18 node(s)
```

Matches the `ab906a6` post-remediation baseline in `verification.md` §3 exactly. `color-contrast` is `agents`/light only (the pre-existing, unrelated `federated` badge) — the thread's light-theme Shiki violation from task 4.1 is gone. `button-name` (landing) and `nested-interactive` (settings-skills) are unchanged, both outside this change.

Checked `test-results/a11y/thread__light.json` and `thread__dark.json` directly, against the now-larger fixture (running/failed tools, HTML artifact fence): **both `"violations": []`.** The new content did not introduce any new axe-detectable violation in the thread region.

### 6.9 What remains unmet or newly found, and who owns it

| Item | Status | Owner | Note |
|---|---|---|---|
| Tool "Failed" pill unreachable (6.5) | **Blocking, needs app code** | km-frontend-engineer / km-product-owner | Not fixable in `e2e/**`/`docs/qa/**`; stopped and reported per scope. |
| Dark composer "Add Attachment" border (6.4) | **New defect, e2e coverage now catches it** | km-frontend-engineer | `attachment.tsx:259`. The failing test (dark theme) is the regression signal — it should go green once fixed, not be edited to pass. |
| `npm test` red (1/219) from the same `attachment.tsx`… no — from `enhanced-thread.tsx:580` `hover:text-danger-text/80` | **Pre-existing on the branch, blocks the literal `&&`-chained gate** | km-frontend-engineer | Introduced in `e142cc1` ("review round 1 fixes"), the same commit that added the `MESSAGE_ERROR_TEXT`/"Try again" button this task's new error test relies on. `src/test/flat-shell.test.ts`'s existing chat-only guard (task 3.1, already on the branch) catches it: `text-danger-text/80` is a banned opacity-on-colour class. Not touched by me — confirmed via `git status`/`git log` that `src/` has no uncommitted changes and this line was already committed. |
| All 4 task 4.2 `verification.md` gaps this task targeted (#2/#6 sweep, #8 expand, #9 running, #11 HTML, #12 streaming, review-round-1 error, #17 source/copy) | **Closed with passing tests**, except #9's "failed" sub-case | — | See 6.2. |

No commit made. Files touched are listed in 6.1, all within `e2e/**` and `docs/qa/**`.
