# Verification: chat-surfaces-flat2 (task 4.3)

Owner: km-product-owner. Phase: `complete-rebranding` (Execute stage). Branch: `rebrand/chat-surfaces-flat2`. Final tree: `1e6bfa7`.
Sources:
- `specs/chat-surfaces/spec.md`
- `docs/qa/chat-surfaces-flat2.md`: §1–5 (task 4.1), §6.1–6.9 (first re-verification) and §6.10–6.13 (partial rows and pre-stream failures)
- the commits listed in §1
- the test files named below

Each claim below points to a test, a file on disk or a command.

## Result

**19 scenarios: 19 MET, 0 PARTIAL, 0 UNMET.**

| Status | Meaning |
|---|---|
| MET | An automated test or a measured runtime value exercises the THEN clause in full. |
| PARTIAL | The test evidence does not cover the whole THEN clause. At least one clause rests on source reading or capture review, or on a fixture that lacks some block types. |
| UNMET | No runtime evidence for the THEN clause. |

This file used the same rule in all three versions. The count moved from 12 / 4 / 3 (first draft, applied loosely) to 6 / 13 / 0 (strict) to 19 / 0 / 0. The last move came from the new tests in `4dffaa1` and `1e6bfa7`, not from a looser reading.

Two MET rows are weaker than the rest:

- **#10, code background.** The code well's colour comes from a computed-style probe that QA ran once on the rendered page (QA §6.7), plus the token tests. No standing e2e test compares the code well's background to `--km-code`. If a later change moves code off `bg-code`, the token tests still pass. Only the source guard would stop a raw colour; a different token would get through.
- **#7, composer focused.** The e2e test proves three things: the focus outline is ≥ 2px and ≥ 3:1 against the canvas, the fill *changes*, and there is no border or box-shadow. That the new fill is a *surface token* comes from the source guard (no raw palette, hex or literal fills) and the class `focus-within:bg-raised`. It does not come from a computed comparison to `--km-raised`. The test focuses with `.focus()`, not a Tab key press. It asserts `:focus-visible` matches first, which a `<textarea>` does on programmatic focus.

## 1. Gates on the final tree (`1e6bfa7`)

The orchestrator ran these, one run each. This file reports its results.

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | exit 0 |
| Types | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | 0 errors, 2 pre-existing warnings (`src/components/ui/button.tsx:57`, `src/components/ui/tabs.tsx:79`, `react-refresh/only-export-components`) |
| Unit | `npm test` | 228 / 228 |
| E2E, full suite | `npm run test:e2e` | 182 / 182, one run |
| Axe | `npm run test:a11y` | 24 scans, 5 violations across 3 rules, all on other pages and pre-existing (§3). `thread` light 0, `thread` dark 0 |

Artifacts on disk postdate `1e6bfa7` (05:30):
- Thread captures, for example `test-results/screenshots/thread__1440__{light,dark}.png`, were written at 05:36.
- `test-results/a11y/thread__light.json` (05:40) and `thread__dark.json` (05:39) both contain `"violations": []` and `"raw": []`. They were checked directly, on the fixture that now includes the image and divider.

Additional runs by QA on intermediate trees (QA §6.11–6.12): `e2e/chat-surfaces.spec.ts` passed 22 / 22 twice after `4dffaa1`, then 26 / 26 four times after the pre-stream tests.

Task commits (`git log --oneline main..HEAD`):

```
1e6bfa7 test: pre-stream failure e2e and working Try again
4dffaa1 test: close partial chat-surfaces scenarios with computed-style assertions
e334863 fix: show the plain-language error when a reply fails before streaming
e4900d3 test: guard attachment.tsx; Failed tool state in e2e
a51dd81 test: close chat-surfaces coverage gaps
a9dd0fe fix: Failed tool status reachable; Flat 2.0 attachments; token hover on error
e142cc1 fix: plain-language message errors; review round 1 fixes
ab906a6 fix: composer and code wells read as their own surfaces; AA syntax colours
0ec4521 docs(openspec): add remediation task for the three unmet QA criteria
eb3d99b docs: chat-surfaces-flat2 QA report
d1ea3fc test: chat surfaces e2e spec
a177211 test: Flat 2.0 guard covers chat and artifact surfaces; no stale git lock
991ba52 feat: Flat 2.0 artifacts, A2UI, code and Mermaid; fix two routed defects
b6b7225 feat: Flat 2.0 content blocks for thinking, citations, tools, memory, skills and context
f244150 feat: Flat 2.0 thread, messages and composer
5b03192 docs: chat surfaces design spec; artifact-canvas token
9a730b3 docs(openspec): plan chat-surfaces-flat2 change
```

## 2. Scenario to evidence

Abbreviations:
- **guard**: `src/test/flat-shell.test.ts` › "Flat 2.0 chat surfaces" › `<file> has no borders, shadows, blur, sub-12px text, raw palette colours, hex, literal white/black fills or opacity text colour`. Its glob includes `src/components/assistant-ui/attachment.tsx`.
- **surfaces**: `e2e/chat-surfaces.spec.ts`.
- **sweep**: surfaces › `Flat 2.0: no element in the thread region has a visible border, box shadow or backdrop filter, and no text is under 12px (light|dark)`. It walks every element under `.aui-thread-root`, with the composer blurred to its rest state.
- **token(x)**: the test compares a computed colour to the computed value of token `x`, probed on the same page (`tokenColor`).

The fixture thread (`e2e/fixtures/sse.ts`) now contains every block kind in the design's block table: text, thinking, code, citation, memory recall and mutation, tool calls (completed, running, failed), skill, context update, artifact (Mermaid), HTML artifact, A2UI input and display, image (`FIXTURE_IMAGE_ALT`, a 1×1 data-URI PNG) and divider (`---`).

### Flat 2.0 conversation surfaces

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | No banned treatments in conversation source | MET | guard. Rule cases in "Flat 2.0 chat-only guard rules". Task 3.1 did a scratch revert (`bg-zinc-800`) that made the guard fail. |
| 2 | Rendered blocks have no borders or shadows | MET | sweep, both themes, over the full fixture including the image and divider. |

### Message treatment

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 3 | Assistant reply is authored prose | MET | surfaces › "Assistant reply: no background fill, body (Roboto) font, and prose capped near 68ch". It checks a transparent computed background, a `fontFamily` containing Roboto, and a computed `maxWidth` equal to a `68ch` reference in the same font context. |
| 4 | User message, light theme | MET | surfaces › "User message: sits at the trailing edge and its fill matches km-ember-soft in light". The bubble's right edge is within 2px of the message root's, and its fill is token(`--km-ember-soft`). surfaces › "user message text reaches 4.5:1 against its own fill in light" measures the same computed fill. |
| 5 | User message, dark theme | MET | The same two tests, "… in dark". |

### Filled composer

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 6 | Composer at rest | MET | No border, shadow (ring) or backdrop filter at rest: sweep, both themes. No border or outline at rest: surfaces › "composer: at rest no border or outline; keyboard focus shows a ≥3:1 outline, still no border, and the fill changes (light\|dark)" (rewritten in `6d64b70`) reads the border widths and `outlineStyle`/`outlineWidth` before focusing, in both themes. Filled and distinct: `tokens.test.ts` › "km-composer separates from km-canvas (composer at rest on the thread)" (≥ 1.8 L*), and 1.066:1 against canvas measured on the page (QA §6.7). |
| 7 | Composer focused | MET (see Result) | The same test, both themes. It asserts the input matches `:focus-visible`. The container outline is not `none`, is at least 2px wide, and reaches ≥ 3:1 against the canvas (`contrastRatio`). The focused background differs from rest, border widths are 0, and `boxShadow` is `none`. That the new fill is a surface token comes from the guard. The scenario was amended in review round 2 to require this outline (spec § Filled composer). |

### Block surfaces follow the event presentation table

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 8 | Reasoning and sources are cyan-tinted | MET | surfaces › "Thinking and citation blocks: fill equals km-cyan-soft" (exactly two elements, each token(`--km-cyan-soft`)). surfaces › "Thinking: collapsed by default, aria-expanded toggles, and the body shows on expand". |
| 9 | Tool status is not colour-only | MET | surfaces › "Tool states: a completed call shows…", "…a failed call shows…", "…a running call (no result yet) shows… Running pill". Each asserts the icon, the state text and the pill colour: token(`--km-success-text` / `--km-danger-text` / `--km-cyan-text`). Unit: `tool-call-block.test.tsx` › "shows the Failed pill when isError is true, even though status.type is complete". Metadata ≥ 12px: sweep. |
| 10 | Code uses the code background | MET (see Result) | Language label and named copy action: surfaces › "Code block: shows its language label, and the copy button has an accessible name", scoped to the `ts` block. Background: the computed code-well colour measured once on the page (QA §6.7), and `tokens.test.ts` › "every github-light-high-contrast colour reaches 4.5:1 on km-code" and the dark equivalent. Code artifacts route to `ShikiCodeBlock`: `artifact-block.test.tsx` › "still routes a non-mermaid code artifact to ShikiCodeBlock". |
| 11 | HTML artifact preview backdrop | MET | surfaces › "HTML artifact: inline preview sits on the artifact canvas; full screen dims with the scrim, no blur, and Escape returns focus". Both the inline and the full-screen preview wrappers are token(`--km-artifact-canvas`). The overlay is token(`--km-scrim`) with `backdrop-filter: none`. Focus returns to "Full screen" after Escape. |
| 12 | Streaming indicator | MET | surfaces › 'Streaming: the reasoning trigger pulses cyan while "Thinking" is the active part' and "Streaming: the markdown streaming mark after assistant prose uses the cyan token while text is in flight", both on held-open streams against token(`--km-cyan`). Captures `thread__mid-stream-thinking.png` and `thread__mid-stream-text.png`. |

### Conversation blocks fit narrow viewports

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 13 | Every block at 320px | MET | surfaces › "320px: no horizontal document scroll with every block shown, and the long tool name is fully visible with no ellipsis". `document.documentElement` and `.aui-thread-viewport` have `scrollWidth <= clientWidth`. The image's bounding box stays within [0, 320], and the divider is attached. |
| 14 | Long tool name at 320px | MET | The same test: the 112-character `LONG_TOOL_NAME` has `scrollWidth <= clientWidth` and `text-overflow` is not `ellipsis`. |

### A2UI response state is truthful

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 15 | Request streamed, no response yet | MET | `a2ui-artifact-block.test.tsx` › "does not show Response captured when status is complete and no response was given" (Add and Skip enabled). surfaces › 'A2UI: "Response captured" is absent before a response and appears after submitting one'. |
| 16 | User submits a response | MET | `a2ui-artifact-block.test.tsx` › "shows Response captured after the user submits a response successfully" (inputs disabled). The e2e test above also asserts that the label's computed colour is token(`--km-success-text`). |

### Mermaid artifacts render as diagrams

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 17 | Valid Mermaid artifact | MET | `mermaid-block.test.tsx` › "renders an SVG for valid Mermaid source". `a2ui-artifact-block.test.tsx` › "renders a mermaid-language artifact through MermaidBlock by default, with no click". surfaces › 'Mermaid: the "Week flow" artifact card renders an svg by default, with no click' and 'Mermaid: the "Source" toggle reveals the source, and a Copy control exists, on the Week flow diagram'. |
| 18 | Invalid Mermaid artifact | MET | `mermaid-block.test.tsx` › "shows the source and a plain-language error label when rendering fails, with no raw exception text". |

### Accessible thread with every block type

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 19 | Axe on the fixture thread | MET | `npm run test:a11y` on `1e6bfa7`: `test-results/a11y/thread__light.json` and `thread__dark.json` both have `"violations": []`, on the fixture with every block kind. |

The message error has no spec scenario, but review round 1 raised it as CRITICAL. The error is shown in plain language and never shows the raw runtime error.

| Failure shape | Evidence |
|---|---|
| Mid-stream `agui.error` | surfaces › "Message error: plain-language recovery text and Try again, never the raw error" |
| HTTP non-2xx before any event | surfaces › "Message error: an HTTP failure before any SSE bytes shows the plain-language error and an enabled Try again" |
| Aborted request | surfaces › "Message error: an aborted request before any SSE bytes…" |
| `200` with zero events | surfaces › "Message error: a 200 response with zero SSE events…" |
| Retry | surfaces › "Message error: Try again re-sends the user message, and a successful retry shows the fixture's reply" (exactly 2 completion requests) |
| Unit | `use-message-stream.test.ts` › "HTTP 500 before any SSE event still produces a failed assistant message", "a rejected fetch (network error) before any SSE event…" and "a 200 stream that closes with zero SSE events…". `chat-message-store.test.ts` › "creates a failed assistant message when the stream errors before any content block arrives". |

## 3. Axe before and after

| Rule | Baseline (before this change, after app-shell-flat2) | Task 4.1 | Final (`1e6bfa7`) |
|---|---|---|---|
| color-contrast | 5 scans / 38 nodes | 2 scans / 7 nodes (`thread`/light 6, `agents`/light 1) | **1 scan / 1 node**: `agents`/light, the `federated` badge (2.27:1). Pre-existing, outside this change. |
| button-name | 2 scans (landing) | 2 scans / 2 nodes (landing) | 2 (landing): unchanged, out of scope |
| nested-interactive | 2 scans (skills) | 2 scans / 18 nodes (settings-skills) | 2 (settings-skills): unchanged, out of scope |
| **thread region** | contrast failures present | light 6 nodes (Shiki `#d73a49` 4.07:1, `#e36209` 3.11:1), dark 0 | **light 0, dark 0**, on the full block-kind fixture |

## 4. Defects found and fixed during the change

| Defect | Root cause | Fix | Caught by |
|---|---|---|---|
| Mermaid artifacts rendered as source text | Plain `agui.artifact` events render through `A2uiDisplayBlock`, which had no Mermaid branch. The first fix changed only `ArtifactBlock`. | Mermaid branch in `A2uiDisplayBlock` (`991ba52`) | Capture review after the first fix |
| A2UI "Response captured" shown when the stream completed | The label was gated on `status === "complete"` | Gated on `submitted \|\| hasResponse` (`991ba52`) | Planned reproduction (task 2.3) |
| 320px tool-name overflow | The `Button` primitive's `whitespace-nowrap` kept the long name on one line | The name span wraps (`wrap-anywhere`, `min-w-0`) | surfaces 320px test |
| Stale `.git/index.lock` left by the naming test | A git read from inside a test took the optional index lock | `GIT_OPTIONAL_LOCKS=0` (`a177211`) | Stale lock observed during execution |
| Light composer at rest 1.033:1, dark code well 1.025:1, light syntax colours below AA | Token values and the Shiki palette were not covered by token tests | `--km-composer`, dark `--km-code` `#111720`, `github-light-high-contrast` with comment remap, fill-step and syntax-colour tests (`ab906a6`) | QA task 4.1 |
| Raw runtime error text reached the DOM (review round 1, CRITICAL) | `ErrorPrimitive.Message` was given no children, so it fell back to `String(error)` | Fixed children: "The reply stopped before it finished." with Try again (`e142cc1`) | Independent review, round 1 |
| Tool "Failed" status was unreachable | `@assistant-ui/core` `toMessagePartStatus` returns `complete` for any tool-call part with a `result` and never reads `isError`. The wrapper mapped Failed from `status.type === "incomplete"`. | The wrapper reads `isError` (`a9dd0fe`). The unit test failed before the fix, and an e2e test was added in `e4900d3`. | QA §6.5 |
| Visible 1px border on the dark composer's "Add Attachment" button | `attachment.tsx` kept assistant-ui registry styling (`dark:border-muted-foreground/15`, rings, blur, black/white fills) and was outside the guard glob | Flat 2.0 token surfaces (`a9dd0fe`). File added to the guard glob (`e4900d3`). | The new block-wide sweep (QA §6.4) |
| **A failure before the first event showed nothing** | `setStreamError` attached to `streamingMessageId`, which is `null` until the first content delta, so an HTTP non-2xx or an aborted request had no message to show the error on. A `200` stream that closed with zero events called `finishStream()` as a success. | `setStreamError` creates the assistant message when none exists, and a zero-event stream is an error (`e334863`). Stream and store unit tests failed before the fix. E2E for all three shapes (`1e6bfa7`). | QA §6.6 probe (HTTP 500 showed only the user message) |
| **"Try again" was disabled from `e142cc1` until `e334863`** | The runtime adapter provided no `onReload`, so assistant-ui set `capabilities.reload = false` and rendered the reload action disabled. | `onReload` re-sends the triggering user message through the normal send path (`e334863`). E2E proves a real second request that returns the fixture reply (`1e6bfa7`). | QA pre-stream e2e (§6.12) |
| Process miss: `e142cc1` committed without a unit run | The commit added `hover:text-danger-text/80`, which the chat guard bans. `npm test` was red (1 / 219) until `a9dd0fe`. | Hover uses `text-fg` (`a9dd0fe`). The orchestrator now gates every commit on the unit suite. | QA gate run §6.3 |

**Lesson: mocked primitives hid the disabled button.** The round-1 unit suite (`src/components/assistant-ui/enhanced-thread.test.tsx`) replaced `MessagePrimitive.Error`, `ErrorPrimitive` and `ActionBarPrimitive.Reload` with stand-ins. The stand-in `Reload` is a plain always-enabled `<button>`, so "offers a clear retry path" passed while the real button was disabled for lack of `onReload`. The test proved the copy, not the behaviour. Only the e2e test against the real runtime adapter exposed it. For controls whose enabled state comes from runtime capabilities, the evidence must come from the real runtime.

## 5. Open items and follow-ups

None of these blocks a spec scenario. They are recorded for the phase decision log and the next change.

| Item | Owner | Follow-up |
|---|---|---|
| **Try again appends a new turn instead of replacing the failed one** | km-product-owner (decision), km-frontend-engineer (implementation) | After a retry, the failed assistant message stays in the thread and the retry adds a new exchange. Decide whether a retry should replace the failed message in place, which is the usual chat convention, and if so route it as a separate change. |
| Weak evidence for #10: no standing test compares the code-well background to `--km-code` | km-qa-engineer | Add one computed assertion to the "Code block" test, so the one-off QA probe becomes a regression check. |
| Weak evidence for #7: the focused fill is not compared to `--km-raised` | km-qa-engineer | Assert focused bg is token(`--km-raised`) in the composer test. |
| Thinking duration and token metadata; image open, download and provenance | km-product-owner | The stream carries no data for them, and parsing changes are out of scope. Needs a separate change. |
| Memory-mutation `add` operation falls back to the "Updated" label | km-rust-engineer (confirm the UAR enum) → km-frontend-engineer | UAR's operation values are unconfirmed; the UAR repo is not at the path in CLAUDE.md. |
| A2UI `hasResponse` from a recorded server result is not wired in `enhanced-thread.tsx` | km-frontend-engineer | The local submit path works and is tested. Inferred from the source, not observed: after a reload, an answered request would show its inputs again. |
| Light cards (`bg-surface` on canvas, 1.31 L*) may not read as separate surfaces | km-creative-director via brand-fidelity-audit | Not changed here, because `--km-surface` is shared app-wide. |

Decisions settled during execution (for the phase decision log):
- Tool status has three states (running, completed, failed). The event model has no pending state; the spec was amended in `e142cc1`.
- The artifact canvas stays white in the dark theme.
- The light-card step is routed to brand-fidelity-audit.
- Thinking metadata, image actions, the memory `add` label and A2UI server-result wiring are follow-ups.
- The change is not archived while testable scenarios are open. That condition is now met.

## 6. Known risks

- **A watched flake, not a current failure.** Once in four runs, the Mermaid test in `chat-stream.spec.ts` timed out waiting for "KnowMe Profile" with 5 workers. It did not recur across about six QA runs or the final runs on `e4900d3` and `1e6bfa7`. Its cause was never diagnosed, so no recurrence does not mean it is fixed.
- **The final full e2e and axe gates ran once each.** QA's 22 / 22 and 26 / 26 repeats cover only `chat-surfaces.spec.ts`. The held-open-stream tests rely on an init-script `fetch` override (`holdChatStreamOpen`, `e2e/support/uar-mock.ts`), which may be timing-sensitive under CI load.
- **Port contention in local runs.** QA §6.11 hit `localhost:4174 is already used` from a leftover dev server. Overlapping local Playwright runs fail for reasons unrelated to the code.
- **The distinctness ratios are small by design.** The composer and code well measure 1.066:1 and 1.068:1 against the canvas. They pass the ≥ 1.8 L* token rule and QA judged them distinct by eye, but at low display contrast they may still merge.

## 7. What this evidence does not prove

- **All of it runs against a mock of UAR.** The fixture events, A2UI response endpoint, held-open streams, pre-stream failures and retries are scripted in `e2e/fixtures/sse.ts` and `e2e/support/uar-mock.ts`. Real UAR event shapes, ordering and timing were not exercised; the memory `add` operation is one known gap in them. A fixture that drifts from the real runtime would pass every test here.
- **The fixture has one of each block, rendered once.** Long threads, many tool calls, very large code or JSON, slow image loads and real remote images (the fixture image is a 1×1 data URI) are not covered.
- **The sweep covers only the fixture's DOM at rest and in the two themes.** Hover, drag-over, the attachment preview and the error states of the composer are not swept for borders or shadows. The source guard proves only that banned class strings are absent; `attachment.tsx` showed a primitive can draw a border the guard never sees.
- **Two MET rows lean on one-off or indirect evidence:** #10 (code background) and #7 (focus fill token), as described in the Result section.
- **"19 / 19 MET" means the spec's scenarios are evidenced, not that the chat is finished.** The retry-appends-a-turn behaviour, the missing thinking metadata and image actions, and the unwired A2UI reload state are user-visible gaps that this spec does not cover.

## Independent review


Written by the orchestrator. The sections above cite the gate on `1e6bfa7`. Work after that point (critic findings, a pre-existing shell race) was gated again on the final tree `99f28a0`:
build 0, typecheck 0, lint 0 errors / 2 pre-existing warnings, unit **245/245**, e2e **185/185** (full suite), axe 24 scans / 5 violations / 3 rules (all on other pages, pre-existing), thread light 0, thread dark 0.

### Round 1: cross-model judge (gpt-5.5, verified distinct), diff mode

BLOCK, 3 CRITICAL:
1. Hex colours in `docs/design/chat-surfaces.md`, breaking its own rule. Fixed in `e142cc1`: colours are named by token.
2. Raw runtime error text reached the DOM through `ErrorPrimitive.Message`. Fixed in `e142cc1`: fixed plain-language copy plus Try again.
3. `verification.md` was absent. Resolved by this file.

### `artifact-critic` (same model family, no generation history)

Verdict: defects found. Findings and what happened to each:

| # | Severity | Finding | Outcome |
|---|---|---|---|
| 1 | CRITICAL | Try again and Regenerate re-appended the user message and kept the old reply, persisted to PGlite permanently. `onReload` had also enabled Regenerate on every reply. | Fixed in `3c24255`: messages after the parent are deleted from the store and PGlite, and the stream restarts without appending the user message again. Unit tests (red first) and e2e `retry replaces the failed turn…` in `6d64b70`. **Correction (round 4):** the e2e reload assertions were removed because a persistence race made them flaky (see Round 4). The in-memory replacement and request count are verified; survival across a reload is **not** currently tested. |
| 2 | CRITICAL | Model-authored HTML iframes used `allow-scripts allow-same-origin`, which gives them the app origin (IndexedDB, UAR calls). "Open in new tab" used a `blob:` URL in the app origin. | Fixed in `3c24255`: sandbox is `allow-scripts` only, open-in-new-tab is removed, and the inline iframe unmounts while full screen is open. Unit test plus e2e in `6d64b70`. |
| 2b | CRITICAL (pre-existing) | `rehypeRaw` without a sanitizer lets model markdown inject `<style>`, `<iframe>` and `<form>`. | **Not fixed here.** Follow-up for km-security-officer: a dedicated change to add sanitisation without breaking math, Mermaid or code rendering. |
| 3 | WARNING | A stream with a start event but no content now shows an error. | Kept on purpose: the user got no reply, so an error is correct. The code comment now matches the code (`3c24255`). |
| 4 | WARNING | "Response captured" is lost on remount, because `hasResponse` is dead (`result` is always undefined). | Follow-up, km-frontend-engineer: persist A2UI responses. Listed in §5. |
| 5 | WARNING | Composer keyboard focus was a ~1.1:1 fill change. | Fixed in `3c24255` with an ember outline on `:focus-visible`. e2e asserts width ≥2px and ≥3:1 against the canvas (`6d64b70`). |
| 6 | WARNING | A2UI status changes were not announced, and the parse failure showed the send-failure text. | Fixed in `3c24255`: status in a polite live region, alerts for errors, a separate parse message. |
| 7 | WARNING | Two close controls in the full-screen dialog. | Fixed in `3c24255`. |
| 8 | SUGGESTION | One error message for every failure. | Follow-up for km-chief-content-officer and km-product-owner: map known `agui.error` codes to specific copy. |
| 9 | SUGGESTION | Tests that pass for the wrong reason, such as a mocked `role=alert` or a brittle `.bg-cyan-soft` count. | Follow-up for km-qa-engineer. |
| 10 | SUGGESTION | Guard gaps: rem sizes, 3- and 8-digit hex, inline styles. | Follow-up for km-qa-engineer. |
| 11 | SUGGESTION | Test fetch mocks leaked on failure. | Fixed in `3c24255`. |

### Found during final gating (pre-existing on `main`)

A flaky shell e2e test (`sheets close when their layout goes away`) exposed two app bugs that were already on `main`:
- `useMediaQuery` re-subscribed on every render and could drop a change event.
- `useCloseWithLayout` reset the sheet flag in a passive effect.

Both were fixed in `3289b7f`. The remaining flake was a test artifact: two resizes about 9ms apart produce no `matchMedia` event. It was fixed with a settle assertion in `99f28a0`, and passed 30/30 with `--repeat-each 30`.

### Round 2: cross-model judge

BLOCK, 2 CRITICAL, 1 WARNING.

1. **CRITICAL: the spec required no outline when the composer is focused.** `3c24255` added the ember `:focus-visible` outline because the fill-only cue measured about 1.1:1, below the 3:1 non-text focus-indicator minimum (WCAG 2.2 SC 1.4.11, 2.4.7). The code was right and the written criteria were stale. Resolved by amending `specs/chat-surfaces/spec.md` § Filled composer and scenario "Composer focused": no border or outline at rest; a keyboard-focus outline of at least 2px and at least 3:1; still no border, box shadow or blur; the fill also changes. `design.md` decision 4 and its surface-table row were updated to match, and km-creative-director updated `docs/design/chat-surfaces.md`. Evidence: rows #6 and #7 above.
2. **CRITICAL: the written criteria did not cover the A2UI live regions added in `3c24255`.** Resolved by alignment. `design.md` decision 5 now records the rule. A2UI submission status (Sending, "Response captured", send and parse errors) is announced, with a polite `role="status"` and errors as `role="alert"`, because it is feedback on the user's own action. Streamed blocks stay without live roles. `specs/chat-surfaces/spec.md` has no live-region wording, so no scenario changed. km-creative-director updated the design doc.
3. **WARNING, accepted: failed tool results show the tool's own result text.** It appears inside the collapsed tool details, which are labelled "Failed". This is inspectable tool output that the user opens deliberately. It is not an assistant response, so the rule that assistant replies never show raw runtime error text does not apply. **Follow-up for km-frontend-engineer and km-security-officer:** classify known sensitive tool error payloads (credentials, tokens, internal hosts and paths) and redact them before display.

### Round 3: cross-model judge



Gate on `08f024d` beforehand: build 0, lint 0 errors, e2e 185/185, thread axe 0 in both themes.

BLOCK, 1 CRITICAL: `enhanced-markdown-text.tsx` rendered model markdown with `rehypeRaw` and no sanitizer, so it could inject iframes, forms and styles. This was the artifact-critic's finding 2b. It predates this branch but sits on the surface this change restyled, and two independent reviewers flagged it, so it was fixed here rather than deferred.

Fixed in `69f9f0e`:
- `rehypeRaw` → `rehype-sanitize` 6.0.0 (pinned exactly) → `rehype-katex`.
- The sanitizer uses GitHub's default schema, extended only with `code` className for `language-*`, `math-inline` and `math-display`. `href` is limited to http, https and mailto.
- Unit tests (red first) cover:
  - `<iframe>`, `<form>` and `<style>` are removed, and `onerror` and `javascript:` are stripped;
  - `<sup>` and `<details>` are kept;
  - KaTeX, code language classes and Mermaid routing still work.
- Gates on `69f9f0e`: unit 258/258, typecheck clean, lint back to the 2 pre-existing warnings, chat e2e 30/30.

### Round 4: cross-model judge

Gate on `f4dcd5d` beforehand: build 0, lint 0 errors, unit 258/258, e2e 185/185, thread axe 0 in both themes.

BLOCK, 1 CRITICAL and 1 WARNING:
- **CRITICAL: task 4.3 unchecked.** Procedural only. The KBD driver ticks it when the task closes after this review.
- **WARNING: the A2UI JSON textarea had no accessible name.** Fixed. Both JSON textareas (the form branch and the fallback branch) now have associated `<Label htmlFor>`s. A unit test finds the textbox by role and name.

**Found while gating this fix: a persistence race, pre-existing on `main`.**
- **Symptom:** the retry e2e test failed intermittently. Under `--trace on` it failed 10/10 at the post-reload assertion. Some runs lost every assistant message; others showed the pre-regenerate text.
- **Root cause (QA §6.15):** message writes to PGlite are fire-and-forget.
  - `persistMessages` and `deleteMessagesAfter` call the db with `.catch(console.error)` and are never awaited.
  - `onReload` does not await the delete.
  - The app has no `pagehide` or `beforeunload` flush.
  - A reload shortly after a reply can therefore lose messages or show stale ones. This affects every reply, not only retry and regenerate.
- **Why `chat-stream.spec.ts`'s reload test passes:** only because it reloads long after the stream finishes.
- **What was done here:** the flaky reload assertions were removed from the retry test (20/20 with `--repeat-each 20`; the full file 29/29 twice).
- **Decision (operator, 2026-09-25):** fix durability in a **separate change scheduled next**: awaited writes plus a `pagehide` flush, with a reload e2e test restored. Until it lands, reload survival is unverified.

Final gates on the tree archived: unit 259/259 and typecheck clean after this fix; the full-suite e2e, axe and build numbers are from `f4dcd5d` above, and `chat-surfaces.spec.ts` was 29/29 twice after the test change.
