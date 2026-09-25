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
