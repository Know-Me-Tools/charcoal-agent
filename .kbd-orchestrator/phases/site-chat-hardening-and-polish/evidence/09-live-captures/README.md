# 09 Live captures of https://know-me.tools

Task 1.2, change site-impeccable-design-context. Captured 2026-10-13 with Playwright (Python, system Chrome, headless).
Widths 320, 768, 1024, 1440; light and dark. Factual notes only, no design critique.

## Method and limits

- Landing (a) and empty thread (b): one fresh browser context per image (first visit, empty storage). Heights used: 320x700, 768x900, 1024x800, 1440x900.
- Answered thread (c) and About/Sources (d): one persistent profile, one real question sent to the live site: "Is the Surreal Memory Server MIT licensed?" (thread `d0227268-791a-4fac-b3af-e2aa3f82c5b2`). Stream finished in about 15 s.
- Chat messages sent in total: 2 (limit 3). The second was a new thread, only for the 320 light streaming capture.
- Theme: the site defaults to dark. Light was reached by clicking the "Switch to light theme" button (no system-colour dependence). Artifact of my capture, not a site defect: after that click the toggle button shows a focus/hover tile in light images, and the composer has no orange focus ring in light but does in dark (dark was never clicked, so the composer kept autofocus).
- `-full` equals `-viewport` for b, c and d (the app shell is fixed height; identical md5). Only the landing page scrolls. `c-...-viewport-bottom` is identical to `-viewport` because the thread opens scrolled to the bottom. `c-...-tall` is a 2200 px high viewport so the whole thread is visible at once; it is the useful c capture.
- No page-level horizontal overflow at any width: scrollWidth equals clientWidth in all 32 a/b captures and all 8 d captures.
- No console, network or cluster actions beyond loading the public site and the two chat sends. Kill switch and cluster untouched.
- Review: I opened the images. Opened individually: all 8 landing full-page images, 2 landing viewports (320 light, 1440 dark), all 8 b viewports, c at 320 light/dark (viewport, bottom, full), c tall at all of 320, 768, 1024 and 1440 in both themes, c viewport at 768 light, 1024 dark, 1440 light and dark, all 8 d, and both streaming frames. Not opened one by one: the other 6 landing viewports (top crops of the full images), and files that are byte-identical copies of an opened file (md5 verified: every b/c/d `-full` and `-viewport-bottom`, plus c viewports at 768 dark and 1024 light).

## a. Landing page (`a-landing-{w}-{theme}-{full,viewport}.png`)

On screen at all widths: sticky top bar (K mark + "KnowMe" wordmark left, theme toggle right); hero with a large K + "KnowMe" logo, mono eyebrow "// KNOWME AI, LLC", headline "AI that understands you." (last word orange), one paragraph, an inline composer (placeholder "Ask about KnowMe, The Boss and the other products", orange Send button); then three alternating-band sections (PRODUCTS "Ask about the products.", YOUR CONVERSATIONS "Your conversations stay in your browser.", AVAILABLE NOW "The Boss is available now." with link the-boss.know-me.tools and "KnowMe itself is not yet released."); footer with small logo and "(c) 2026 KnowMe AI, LLC · v0.1.0". Full-page heights: 320 = 1786, 768 = 1778, 1024 = 1566, 1440 = 1582 px.

- 320 light/dark: single column, no overflow. Composer sits below the paragraph. Link text breaks across two lines at the hyphen ("the-" / "boss.know-me.tools"). Top bar toggle in light shows as a grey tile (capture artifact).
- 768 light/dark: single column. Composer is about 75 percent of the width, left aligned, leaving the right quarter empty. Section bodies are narrower than the page and left aligned, so a wide empty area sits to their right. Link breaks at the hyphen as above.
- 1024 light/dark: two columns in the hero (headline left, composer right) and two columns in each section (heading left, body right). Link fits on one line. The composer card is vertically offset lower than the headline block.
- 1440 light/dark: same two-column layout inside a centred container. Link breaks at the hyphen ("the-" / "boss.know-me.tools") in both themes. Hero composer card is empty apart from placeholder and Send, with a large blank area between them. Below the fold in the first viewport the PRODUCTS band starts at y=610 and is cut at y=900.
- All widths: the brand logo appears twice above the headline (top bar wordmark and the large hero logo). Body copy in the three bands is repeated and short; the bands have large vertical padding with little content. Dark bands alternate between two near-black navy tones; light bands between two near-white greys.
- Contrast: no visible contrast failure. The small mono eyebrow and the footer text are the lowest-contrast text in both themes (not measured).
- No "localhost", raw markdown or dev text seen.

## b. Empty thread (`b-empty-thread-{w}-{theme}-{full,viewport}.png`, reached via /threads, which creates a new thread)

Shell: top bar (K + wordmark, "Threads" pill; at 320 a hamburger instead; theme toggle and a right-panel toggle icon at right), left sidebar at 768 and wider ("// THREADS" label, orange "New thread" button, "Search threads..." field, empty list), a centred empty state (K tile, "AI that understands you.", one paragraph naming KnowMe, The Boss, the Universal Agent Runtime, BossFang, the Surreal Memory Server, the Prometheus skill packages and IPFS Sync for Obsidian), the composer (placeholder, plus icon, round send arrow in disabled tint), a mono caption "KnowMe Concierge — an AI assistant. Answers may be wrong. / Please don't share sensitive personal details in this chat."

- 320 light/dark: no sidebar; bottom tab bar with one tab "Threads" (pill). Heading wraps to two lines ("AI that understands / you."), leaving "you." alone on line two. Composer and caption fit; caption wraps to four lines. The tab bar and the caption sit close together.
- 768 light/dark: sidebar takes 260 px of 768, so the chat column is 508 px. Empty sidebar list has no empty-state text. Heading on one line.
- 1024 light/dark: same layout, chat column 764 px. No defects seen.
- 1440 light/dark: composer 770 px wide centred in the chat column. Wide blank area on both sides; sidebar list is empty. No defects seen.
- Dark images show an orange focus ring on the composer (autofocus); light images do not (capture artifact, see Method).
- No prompt chips or suggested questions are present in the empty state at any width.

## c. Answered thread (`c-answered-thread-{w}-{theme}-tall.png` is the full-thread view; `-viewport` is the scrolled-to-bottom view)

Content seen top to bottom (identical at all widths): user bubble "Is the Surreal Memory Server MIT licensed?"; mono line "KnowMe Concierge — an AI assistant. Answers may be wrong."; heading SOURCES with five cards [1] Surreal Memory Server FAQ, [2] Surreal Memory Server status and licence, [3] Surreal Memory Server status and licence, [4] Agent memory systems compared, [5] Prometheus and its products (each with a truncated excerpt ending in an ellipsis); two collapsed step rows "Thinking" and "Preparing an answer card" with check marks; an answer card titled "Surreal Memory Server licence" with one sentence and the source name in small text; a tinted caption bar "AI-GENERATED · CHECK IMPORTANT DETAILS"; answer text starting with the line "I'm an AI concierge for KnowMe AI, LLC." then "Yes. The Surreal Memory Server is MIT licensed ... [2] ... [1]." and "One note: on 2026-10-05 ... not a release [4]."; copy, regenerate and more-actions icons; composer and caption.

- 320 light/dark (tall): everything stacks in one column, no overflow. The AI-GENERATED caption bar wraps to two lines ("...CHECK IMPORTANT / DETAILS"). Sources cards are tall (up to five lines each). The AI caption "KnowMe Concierge — an AI assistant" appears three times in view: above Sources, in the composer footer, and the AI-GENERATED bar. Sources and the two step rows come before any answer text. In `-viewport` the thread opens at the bottom, so Sources, answer card and AI bar are off screen above; only the final paragraphs show.
- 768 (tall and viewport): sidebar plus a 508 px thread column; the mono "KnowMe Concierge" line wraps to two lines ("...may be / wrong."). Answer text column is narrower than the cards (answer text stops about 70 percent across, cards go full width).
- 1024: same; answer text ends well before the right edge of the cards and caption bar (the bar and cards are about 600 px wide, text about 520 px).
- 1440: thread column 692 px centred, answer text ends well before the right edge of the cards. In `-viewport` the last paragraph is cut off by the composer (text visible under the top of the composer area at y about 705). Scroll-to-bottom arrow is visible in dark but not in light (light viewport opened at the bottom, arrow absent).
- Dark: Sources cards are teal-tinted, answer card is a lighter navy; the "Thinking" rows are barely distinguishable from the background. Light: Sources cards pale blue, answer card pale grey, caption bar pale blue with teal mono text.
- Answer content check: the "[n]" markers in the text refer to the card numbers ([2], [1], [4]). Note for the About panel below.
- No "localhost" or raw markdown seen. The words "I'm an AI concierge for KnowMe AI, LLC." are the first line of the generated answer (a repeat of the caption information).

## d. About / Sources (`d-about-sources-{w}-{theme}-viewport.png`; `-full` is identical)

Trigger is the right icon in the top bar, aria-label "About and sources". At 320, 768 and 1024 it opens a modal sheet from the right (dialog, dimmed page behind). At 1440 it opens an inline third column (aria-expanded false to true).

- 320 light/dark: sheet is 272 px wide of 320, with the page showing in a 48 px strip at left. Header "About and sources" with a close X. The Sources list is scrolled so the first items are out of view: the visible top is the tail of one card (an item number and then "Surreal Memory Server status and licence"), then "3 Agent memory systems compared", "4 Prometheus and its products"; the "Sources" heading and item 1 are not visible. Below: "About this assistant" with four paragraphs. The link breaks at the hyphen ("the-" / "boss.know-me.tools").
- 768 light/dark: sheet 320 px wide on the right of 768; shows "Sources" heading and four items: 1 Surreal Memory Server FAQ, 2 Surreal Memory Server status and licence, 3 Agent memory systems compared, 4 Prometheus and its products; then About text. Link breaks at the hyphen.
- 1024 light/dark: same sheet, 320 px wide. Same copy and link break.
- 1440 light/dark: inline panel about 320 px wide at right, title in spaced mono capitals "ABOUT AND SOURCES" (the sheet title at narrower widths is sentence case "About and sources"). Same four sources and About text. The thread column narrows to make room and the answer text is cut by the composer. Link breaks at the hyphen. Panel toggle icon in the top bar shows an active tile.
- Count mismatch: the thread shows five source cards ([1] to [5]) but this panel lists four, merging the two "Surreal Memory Server status and licence" cards and renumbering. In the panel "3" is Agent memory systems compared and "4" is Prometheus, while in the message they are [4] and [5], and the answer text cites [4] for Agent memory systems compared.
- Panel items show a number without brackets; in the message they show "[n]" with brackets.
- The panel's Sources items do not show excerpts; the message cards do.

## e. Streaming indicator

- `e-streaming-tool-step-1440-light.png`: caught while streaming. The Sources cards are shown, below them a row "Thinking" with a filled teal dot and teal text (active state; the finished state is a check mark and grey text). The composer's send button has turned into a black square on an orange circle (stop). Nothing below the "Thinking" row yet. The empty gap between "Thinking" and the composer is about 60 px.
- `e-streaming-tool-step-320-light.png`: caught while streaming at 320 (frame taken in the second sent message; Sources cards already rendered, view scrolled so cards [3] to [5] show, last card cut off by the scroll-to-bottom arrow). The stop button shows in the composer (black square on orange). The "Thinking" row is below the visible area. Text-based capture log recorded "Thinking ... in progress" at 5.7 s to 12.9 s after send.
- A "Preparing an answer card" step was not caught in its running state; it only appears in the finished state in c.
- Timing seen: first Sources about 2 s after send, "Thinking" in progress about 4 s to 13 s, stop button gone at 15 s to 17 s.

## Not captured

- Streaming frames in dark theme (not requested).
- A first-visit landing screenshot from a returning visitor (not requested).
- Widths other than 320, 768, 1024, 1440.
