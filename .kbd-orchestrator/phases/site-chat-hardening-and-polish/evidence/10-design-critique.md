# 10 Design critique and audit of the live site

Task 1.3, change site-impeccable-design-context. Reviewer: km-creative-director. Input: the 74 captures and README in `09-live-captures/` (task 1.2, 2026-10-13), read against PRODUCT.md, `src/styles/tokens.css`, `docs/design/chat-surfaces.md` and decision log D-1..D-10.

Method: Impeccable `critique` and `audit`, single context (the brief required the reviewer to open the images itself, so Assessment A and B were not split into sub-agents). Images opened: landing 320 light, 768 dark, 1440 dark (full); empty thread 320 dark, 1440 light; answered thread tall 320 dark, 768 light, 1440 dark, plus 1440 light viewport; About/Sources 320 dark (sheet) and 1440 dark (inline); both streaming frames. Detector: `engine.mjs detect --json` on the six surface files below returned `[]`, exit 0. Contrast ratios are computed from tokens.css hex values (WCAG 2.x formula). Not run: live keyboard or screen-reader pass, axe, Lighthouse. Claims about focus order and announcements are from reading code only and are marked so.

## 1. Verdict

Not s-tier yet. The brand system holds (Flat 2.0 is clean, tokens are respected, both themes are intentional), but the conversation, which PRODUCT.md says is the proof, does not yet read as a confident concierge.
1. The answer comes last: five cyan source cards fill the first screen, and the About panel renumbers those sources so `[4]` in the text points at a different source than item 4.
2. The first contact is an empty box: the landing composer sends with no AI disclosure beside it and offers nothing to ask.
3. At 320 the chrome eats the thread (composer, disclosure and tab bar take 278 of 700 px), streaming progress falls below the fold, and at 1440 the last paragraph sits hidden under the composer.

## 2. Ranked findings

QA note numbers (Q1..Q9) refer to the README defect notes: Q1 link breaks at hyphen, Q2 logo twice, Q3 dark step rows barely visible, Q4 answer narrower than cards, Q5 last paragraph cut at 1440, Q6 panel count mismatch, Q7 caption three times, Q8 "I'm an AI concierge" first line, Q9 320 sheet opens scrolled.

### P0: broken or untrue

**P0-1 Sources panel renumbers citations** (Q6, agree). About/Sources, all widths, both themes. `useThreadCitations` dedupes by source and the panel numbers by position (`index={i + 1}`, about-sources-panel.tsx:90), so the text's `[4]` (Agent memory systems compared) is item 3 in the panel. A visitor who checks a claim is sent to the wrong source; for a site whose principle is "truth over reach" this is an untrue citation. Fix: carry the stream marker into `ThreadCitation` (`indices: number[]`) in `src/hooks/use-thread-citations.ts`; render the label as the bracketed markers, e.g. `[2] [3]` for a merged source, in the same `font-mono text-xs text-cyan-text` treatment the message uses. Never renumber. Effort S.

**P0-2 No AI disclosure at the landing composer.** Landing, all widths, both themes. The hero form (landing-page.tsx:108) sends the first message with no disclosure beside it; the disclosure only appears on the thread page after sending. EU AI Act Art. 50 and PRODUCT principle 5 need it visible before the first message. Fix: render the existing approved `AI_DISCLOSURE_CONTENT.label` and `.sensitiveDataHint` under the form, same classes as `ComposerDisclosure` (`font-mono text-xs text-faint`, 5.20:1 light / 7.00:1 dark on canvas). No new copy. Effort S.

**P0-3 The answered thread is missing from the thread list** (not in QA notes). Answered thread and About captures, 768 to 1440, both themes: the sidebar is empty after a complete reply, although the landing says "Your conversations stay in your browser" and D-8 makes the local thread list the visitor's memory. `left-sidebar.tsx:91` hides `isEphemeral` threads, and promotion in `thread-registry-store.ts:109` did not happen within the capture. Verify on the live site first (reload after a reply); if reproduced, promote on the first completed assistant message on the site build. Effort S to M.

### P1: clearly hurts the experience

**P1-1 Answer buried under a wall of sources.** Answered thread, all widths, both themes. At 320 the five cards fill 560 px before the answer card; the prose starts at y≈1000. Two cards share a title ([2], [3]). D-1 fixes grouping, not order. Fix: in the citation grouping (`src/features/chat/render-registry/pseudo-parts.ts`, `citation-block.tsx`), render the Sources block after the prose; while streaming, show one cyan status line ("Reading 5 sources", using the existing step treatment) instead of the cards. Cards: drop the excerpt by default (`line-clamp-3` removed; show title and `[n]` only), excerpt on expand. Effort M.

**P1-2 Last paragraph hidden under the composer** (Q5, agree; cause is wider). 1440 light and dark viewport, and 1440 with the inline panel. The sticky `ViewportFooter` (enhanced-thread.tsx:97) covers the end of the thread while the viewport believes it is at the bottom (no scroll-to-bottom arrow in light). Fix: give the message list a bottom spacer equal to the footer height (measure the footer, set `--thread-footer-h`, `scroll-padding-bottom` on the viewport) and scroll to the true end on thread load. Effort M.

**P1-3 Chrome crowds the thread at 320.** Empty thread, streaming, answered viewport, 320, both themes. Header 48 + composer, disclosure and tab bar 278 = 47% of a 700 px screen; during streaming only source cards are visible and the "Thinking" row is below the fold (e-320). Fix in `enhanced-thread.tsx` and `mobile-nav.tsx`: below 768, hide the tab bar while the composer has focus or a run is active; set the composer `min-h` to one line on 320 (it grows with `field-sizing-content`); keep the active step row in view by anchoring the run status to the footer (`ThreadScrollToBottom` slot). Effort M.

**P1-4 320 sheet opens mid-scroll** (Q9, agree). About/Sources 320, both themes: "Sources" heading and item 1 off screen. Likely initial focus lands on a later link and scrolls it into view (code reading, unverified). Fix: `initialFocus` on the sheet title in `about-sources-panel.tsx` (the 1440 panel already focuses its title button) and reset the scroller to top on open. Effort S.

**P1-5 Empty first screen offers nothing to ask.** Landing hero 1024/1440 (composer card 420 px wide, empty), empty thread all widths. The agent-led brief needs opener and chips in static HTML; D-4 starter prompts are change 07. Fix: reserve the chip row now under both composers (`flex flex-wrap gap-2`, chips `bg-cyan-soft text-cyan-text rounded-pill` per the AI-role rule, 44 px min height) so change 07 drops into a designed slot. Effort S (slot), chips are change 07.

**P1-6 Step rows are invisible containers** (Q3, disagree on cause). Text contrast passes: label `fg-secondary` on `surface` 7.71:1 dark, 7.29:1 light; check icon `faint` 6.16:1 / 5.37:1; active "Thinking" `cyan-text` 7.85:1 / 5.17:1. The defect is the fill: `bg-surface` on canvas is 1.14:1 dark and 1.03:1 light, so the row reads as a faint stripe, and two finished rows cost 60 px. Fix in `step-block.tsx`: drop the fill (`bg-transparent`, `px-0`), and per tiered visibility collapse finished steps into one line ("2 steps") that expands; keep the running row as is. Effort S.

### P2: polish

- **P2-1 Card and prose widths disagree** (Q4, agree). 768 to 1440: cards and caption run full width, prose stops at the measure. Fix: cap `CitationList`, the A2UI `SurfaceFrame` and step rows at the prose measure (`max-w-[65ch]`) in their components. S.
- **P2-2 Caption repeated** (Q7, partly disagree). The A2UI caption is binding (D-4) and the footer disclosure is the Art. 50 notice; keep both. The first-message mono line above Sources (enhanced-thread.tsx:388) is the redundant one, but removing a disclosure is an operator call: ask, do not change. Q8 ("I'm an AI concierge" as the reply's first line) is the agent prompt; route to km-conversational-designer, not a design fix.
- **P2-3 Domain link breaks at the hyphen** (Q1, agree). Landing 320/768/1440, panel all widths. Add `whitespace-nowrap` to the-boss.know-me.tools links in `landing-page.tsx` and `about-sources-panel.tsx:110`. S.
- **P2-4 Logo twice above the fold** (Q2, agree). Landing all widths: top-bar lockup and 52 px hero lockup 120 px apart. Drop the hero lockup; the 2-line headline is the thesis. `landing-page.tsx`. S.
- **P2-5 Eyebrow on every band.** Landing: PRODUCTS / YOUR CONVERSATIONS / AVAILABLE NOW repeat the label-heading-body template three times. Keep only the hero eyebrow; drop the band labels (design, not copy; headings carry the meaning). S.
- **P2-6 Targets at 320.** Top-bar icons, action bar and composer send are `size-8` (32 px): passes WCAG 2.2 2.5.8 (24 px) but below the 44 px touch guidance for a mobile-first audience. Use `size-11` hit areas below 768 (`topbar.tsx`, `tooltip-icon-button.tsx`, send button in `enhanced-thread.tsx`). S.
- **P2-7 Ember focus ring on autofocus.** Thread composer, dark: programmatic autofocus matches `:focus-visible`, so the most saturated object on load is a ring, and on phones autofocus raises the keyboard. Do not autofocus below 768. S.
- **P2-8 Landing 768 composer at 75% width** leaves a dead quarter; let it take the full column (`md:max-w-none`). S.

### Accessibility notes

- Caption bar: `cyan-text` on `cyan-soft` 4.74:1 light (passes AA at 12 px, little margin; do not lighten), 6.98:1 dark. The bar fill on canvas is 1.06:1 light: it separates by tint only, acceptable as text-bearing, not as a boundary.
- Reduced motion: global override in `src/index.css:118` kills animations and transitions; the step dot also has `motion-reduce:animate-none`. Running state stays legible because "Thinking" is text plus colour, not motion alone. Passes on reading; untested in a browser.
- Screen reader (code reading): Sources is an `<ol>` labelled by its heading; the A2UI caption is a plain `<p>` after the card, so it is read after the card content, which is the right order; `sr-only` "Agent:" prefixes each reply. P0-1 also gives screen-reader users mismatched numbers.
- Focus order at 1440 with the inline panel and the composer-to-panel path: not verified; needs a keyboard pass by km-qa-engineer.

## 3. Do not change

- Flat 2.0: fills only, no borders or shadows, scrim for the sheet; both themes read as intentional, dark is the default.
- The two-step citation idea: `[n]` markers in prose plus one grouped Sources block (D-1).
- The answer card shape: title, one-line summary, source (D-1), on `raised`, followed by the app-rendered AI caption in mono caps.
- Cyan for AI only (sources, running step, caption), ember only for actions and the "you." accent. Stop button: dark square on ember.
- The composer footer disclosure wording and position (operator-approved).
- About/Sources panel replacing the Context panel; sheet below 1440, inline column at 1440.
- Landing type pairing (Space Grotesk headline, Inter body, mono eyebrow) and the "AI that understands you." hero.
- No horizontal overflow at any width.

## 4. Fix batches (parallel, file-disjoint)

**Batch A: citations and run status** (P0-1, P1-1, P1-4, P1-6, P2-1, P2-3 panel part)
`src/hooks/use-thread-citations.ts`, `src/components/layout/about-sources-panel.tsx`, `src/features/chat/components/citation-block.tsx`, `src/features/chat/components/step-block.tsx`, `src/features/chat/render-registry/pseudo-parts.ts`, `src/features/a2ui/a2ui-surface-block.tsx` (width cap only).

**Batch B: thread viewport and mobile chrome** (P1-2, P1-3, P2-6, P2-7)
`src/components/assistant-ui/enhanced-thread.tsx`, `src/components/assistant-ui/tooltip-icon-button.tsx`, `src/components/layout/mobile-nav.tsx`, `src/components/layout/topbar.tsx`.

**Batch C: first contact and memory** (P0-2, P0-3, P1-5 slot, P2-3 landing part, P2-4, P2-5, P2-8)
`src/pages/landing-page.tsx`, `src/components/layout/left-sidebar.tsx`, `src/stores/thread-registry-store.ts`. P1-5's slot in the empty thread lives in `enhanced-thread.tsx`, so it rides with Batch B.

No token changes are needed. Each batch needs captures at 320/768/1024/1440 in both themes and `npm run test:a11y` before handoff.
