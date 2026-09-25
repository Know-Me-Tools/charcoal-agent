## 1. Design spec

- [x] 1.1 (owner: km-creative-director) Write `docs/design/chat-surfaces.md`. It must cover:
  - a per-block surface and token map for text, thinking, code, citation, memory, tool use/result, skill, context update, artifact, HTML artifact, A2UI, image and divider
  - message treatment: assistant prose face, prose width and spacing rhythm between messages; user ember-soft fill, radius and trailing alignment
  - composer at rest, focus and drag states
  - status pill anatomy
  - motion: streaming cursor, thinking pulse, expand/collapse, reduced-motion behaviour
  - 320px behaviour: wrapping, pill reflow, horizontal scroll only inside code/JSON boxes

  Also add `--km-artifact-canvas` to `src/styles/tokens.css`, set for both themes and exposed as `bg-artifact-canvas`. Verify:
  - `npm test` passes, including the brand token tests
  - the doc has a row for every §7.5 block kind
  - every colour in the doc names a token, with no hex

## 2. Conversation surfaces

- [ ] 2.1 (owner: km-frontend-engineer) Restyle the thread, messages and composer in `src/components/assistant-ui/enhanced-thread.tsx`, `enhanced-markdown-text.tsx` and `tooltip-icon-button.tsx`, following the design doc:
  - assistant replies unbubbled `font-body` prose on the canvas
  - user message on `bg-ember-soft` at the trailing edge
  - user avatar on tokens, not zinc
  - composer as a filled surface with `focus-within` fill, no border, blur or ring, and `outline-none` on the textarea
  - action bar and "more" menu flat
  - cyan streaming cursor and thinking pulse

  Verify:
  - `grep -nE "\bborder\b|border-[a-z]|shadow|backdrop-blur|ring-1|zinc-|bg-white|#[0-9a-fA-F]{6}|text-\[(9|10|11)(\.[0-9]+)?px\]|text-[a-z-]+/[0-9]+" src/components/assistant-ui/enhanced-thread.tsx src/components/assistant-ui/enhanced-markdown-text.tsx src/components/assistant-ui/tooltip-icon-button.tsx` returns nothing, apart from `border-0`/`border-transparent`
  - `npx vitest run src/features/chat` passes
  - a light-theme and a dark-theme screenshot of a thread at 1440 show a readable user message and an unbubbled assistant reply
- [ ] 2.2 (owner: km-frontend-engineer) Restyle the content blocks in `src/features/chat/components/{thinking-block,citation-block,tool-call-block,memory-block,skill-activation-block,context-update-block}.tsx`, following the design doc:
  - thinking and citation blocks on `bg-cyan-soft`
  - tool, memory, skill and context blocks on surface/raised tokens
  - mono metadata at 12px or larger
  - status pills as status token plus text label
  - token text colours instead of opacity
  - tool and skill names wrap instead of truncating
  - context-update values wrap, and JSON scrolls only inside its own box
  - `min-w-0` on flex children

  Verify:
  - the same grep over these six files returns nothing
  - `npx playwright test e2e/chat-stream.spec.ts` passes
  - at a 320px viewport the fixture thread has `document.documentElement.scrollWidth <= 320`, checked in the Playwright trace or a one-off `page.evaluate`
- [ ] 2.3 (owner: km-frontend-engineer) Restyle the artifacts, A2UI, code and Mermaid in `src/features/chat/components/{artifact-block,a2ui-artifact-block}.tsx` and `src/features/artifacts/{html-artifact-card,mermaid-block,shiki-code-block}.tsx`:
  - borderless cards on surface tokens
  - code on `bg-code`, ignoring the Shiki theme background
  - HTML preview on `bg-artifact-canvas`
  - full-screen overlay on `bg-scrim` with no blur
  - A2UI "Response captured" gated on `submitted || hasResponse`, not on `status === "complete"`
  - reproduce the Mermaid-as-source defect, then route `mermaid` artifacts to `MermaidBlock`, with a plain-language fallback on render failure

  Verify:
  - the same grep over these five files returns nothing
  - new colocated unit tests pass under `npx vitest run src/features/chat src/features/artifacts`, with Mermaid mocked:
    - A2UI with `status: "complete"` and no response does not show "Response captured"
    - A2UI shows it after a successful submit
    - a `mermaid` artifact renders an SVG
    - an invalid `mermaid` artifact shows source plus the error label

## 3. Guard and regressions

- [ ] 3.1 (owner: km-qa-engineer) Extend `src/test/flat-shell.test.ts`:
  - add a `describe` that globs `src/components/assistant-ui/{enhanced-thread,enhanced-markdown-text,tooltip-icon-button}.tsx`, `src/features/chat/components/*.tsx` and `src/features/artifacts/*.tsx`, excluding tests
  - apply the existing rules plus three chat-only rules: six-digit hex, `bg-white`/`text-white`/`bg-black`, and opacity text `text-*/NN`
  - add flag/allow cases for the new rules

  Verify with `npx vitest run src/test/flat-shell.test.ts`: it passes, and a scratch revert of one class (for example re-adding `bg-zinc-800`) makes it fail. Record that check in the task note, then undo the revert.
- [ ] 3.2 (owner: km-qa-engineer) Add `e2e/chat-surfaces.spec.ts`, and extend `e2e/fixtures` where needed with a long tool name, a Mermaid artifact and an unanswered A2UI input. The spec covers:
  - light and dark themes: user message text contrast is at least 4.5:1 against its fill, computed from styles
  - 320px: no horizontal document scroll with every block shown, and the long tool name is fully visible with no ellipsis
  - A2UI: no "Response captured" before a response, and it appears after submitting
  - Mermaid artifact: an `svg` is rendered
  - composer: no border or outline when focused, and a different background from rest

  Verify with `npx playwright test e2e/chat-surfaces.spec.ts`, which passes. Each assertion fails against `main` or is noted as newly covered.

## 4. Verification

- [ ] 4.1 (owner: km-qa-engineer) Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`. Run the visual harness for the fixture thread at 320/768/1024/1440 in both themes and review every capture against `docs/design/chat-surfaces.md` and standard §7.7. Run `npm run test:a11y`. Record the commands, outputs, capture paths, review notes and the thread axe delta against the baseline in `docs/qa/chat-surfaces-flat2.md`. Verify:
  - all commands exit 0
  - axe reports no `color-contrast`, `button-name` or `nested-interactive` violations in the thread region in either theme
  - any failure traced to a token value is filed back to km-creative-director and recorded as unmet, not waived
- [ ] 4.2 (owner: km-product-owner) Write `openspec/changes/chat-surfaces-flat2/verification.md` from the QA evidence. It maps each spec scenario to its evidence (test name, capture path or axe result) and lists every unmet criterion. Then run an independent review with the `artifact-critic` subagent or `adversarial-review --mode diff`, and record its findings. Verify:
  - every scenario in `specs/chat-surfaces/spec.md` has evidence or is marked unmet
  - the review reports no CRITICAL findings, or they are fixed and re-reviewed before archive
