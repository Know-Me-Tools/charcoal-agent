# 08 — Integration gate: site-chat-hardening-and-polish

- Date: 2026-10-13
- Role: km-qa-engineer
- Commit under test: `c376d82` (origin/main; branch `qa/integration-gate` is origin/main plus this file only)
- Environment: macOS (darwin, arm64), Node 24, `node_modules` symlinked from the main checkout, Google Chrome 155 (`channel: 'chrome'`; Playwright 1.63's own Chromium is not installed). A local UAR was running on 127.0.0.1:6565 (`/healthz` 200).
- No production code was changed. Temporary harness files (untracked, not committed): `playwright.gate.config.ts`, `playwright.gate.setup.ts`, `vite.gate.config.ts`, `gate-site/` (site capture spec + config), `gate-site-dist/` (site build output). Copies are in the session scratch dir under `gate-files/`.

Verdict: **NOT READY to deploy as-is.** The unit, Rust and KB gates are green. The Playwright gate is red (31 of 324), and the visual pass found copy and naming defects on the public site build. See the BLOCKING list.

## 1. Results table (steps 1 to 6)

Because `qa/integration-gate` equals origin/main at `c376d82`, a "clean origin/main checkout" is the same tree. Where the brief asked whether a failure also fails alone, I reran it alone (column "alone").

| # | Command | Exit | Counts | Failures (one-line reason) | Alone |
|---|---|---|---|---|---|
| 1 | `npx eslint .` | 0 | 0 errors, 2 warnings | warnings only: `react-refresh/only-export-components` in `src/components/ui/button.tsx:57` and `src/components/ui/tabs.tsx:82` | n/a |
| 2 | `npx tsc --noEmit -p tsconfig.app.json` | 0 | no diagnostics | none | n/a |
| 3 | `npx vitest run` | 1 | 66 files: 65 passed, 1 failed. 692 tests: 688 passed, 4 failed | all 4 in `src/test/skills-sync.integration.test.ts` (talks to the live local UAR): "second sync does not create duplicates" and 3 others. Causes: `POST /api/skills/knowme-profile/toggle → 503`, `POST /api/skills/knowme-memory/toggle → 503`, and `expected [ 'knowme-goals' ] to have a length of +0 but got 1` | rerun alone: exit 1, 3 failed / 8 passed (same 503s and leftover state). Environmental (local runtime), not a code defect shown by this gate. |
| 3b | `npx vitest run -t "keeps the JSON view when the result is over a cap"` | 0 | 1 passed, 691 skipped | it **passed in the full run too** (`tool-call-block.test.tsx`, 8 tests, 888 ms). Not reproduced; consistent with the earlier failure being a Shiki/load timeout. | passed |
| 4 | `cd server && KNOWME_WEB_DIST_DIR=tests/fixtures/web cargo test --no-fail-fast` | 0 | 155 passed, 0 failed (112 + 4 + 11 + 28 + 0 + 0) | none | n/a |
| 5a | `node --test 'scripts/kb/__tests__/*.test.mjs'` | 0 | 20 passed, 0 failed | none | n/a |
| 5b | `node scripts/kb/build-kb.mjs --check` | 0 | "40 manifest output(s), 0 out of date" | none | n/a |
| 5c | `node scripts/kb/validate-kb.mjs` | 0 | "0 failure(s), 0 warning(s)" | none | n/a |
| 6 | Playwright, whole `e2e/`, repo config + `channel: 'chrome'` | 1 | 324 tests: 293 passed, 31 failed (10.0 min, 5 workers) | see 1.1 | see 1.1 |

### 1.1 Playwright failures

**30 of 31 have one cause:** `expect(locator('img[alt="Rebrand palette swatch"]')).toBeAttached()` times out. The fixture reply (`e2e/fixtures/sse.ts` `ASSISTANT_MARKDOWN`) embeds a `data:image/png` markdown image, and `e2e/support/routes.ts:57` (`streamFixtureConversation`) waits for it. Commit `510583d` ("block remote images…", site-reply-content-hardening 3.1) now allows images only from know-me.tools, its subdomains or same-origin paths, so a `data:` image is correctly not rendered. **The fixture is stale. The product is behaving to spec.** Owner: km-qa-engineer (`e2e/**`). Fixing it means changing the fixture image to a same-origin path (and, for the image block, asserting the blocked-image presentation separately). Not fixed here because this gate adds evidence only.

Affected (every test that streams the fixture conversation):
- `a11y.spec.ts` thread light and dark (2)
- `chat-stream.spec.ts` "a streamed reply shows every block and reloads from local storage" (1)
- `chat-surfaces.spec.ts`: user-message contrast light and dark, user-message trailing edge light and dark, assistant reply font and width, 320px no horizontal scroll, A2UI "Response captured", Mermaid svg by default, Flat 2.0 light and dark, Thinking collapsed, Thinking and citation fill, tool Completed pill, tool Failed pill, Code block label, HTML artifact full screen, HTML artifact sandbox, Mermaid Source toggle (18)
- `primitives.spec.ts` "thread: reasoning collapsible exposes its expanded state" (1)
- `visual.spec.ts` thread at 320, 768, 1024 and 1440 in light and dark (8)

Rerun alone: `chat-surfaces.spec.ts -g "Code block: shows its language"` → exit 1, same locator. Deterministic.

Consequence: **the chat-surface, thread a11y and thread visual coverage did not run past the setup step.** No claim is made from this run about those surfaces in the app build.

**1 flaky failure:** `app-pages.spec.ts:231` "Flat 2.0 surfaces … › agent-new (dark)" fails with `["no main found"]`. Alone: failed once, then `--repeat-each=3` gave 5 passed, 1 failed (dark only). Intermittent. The `agent-new` visual captures in `test-results/screenshots/` show the "Applying migration v2…" spinner instead of the form at 1024 light, 1440 dark, 320 light, 768 dark and 768 light (see 2.3). So the route's `readyText` check does not guarantee the page has finished booting. Root cause not isolated (test readiness race or a slow PGlite migration on that route).

Environment notes (not product defects):
- With `node_modules` symlinked, Vite's `server.fs.allow` rejected `pglite.data` and the fonts (their real path is outside the worktree), and every test timed out. I worked around it with a temporary `vite.gate.config.ts` that adds the main checkout's `node_modules` to `fs.allow`. Only this worktree layout is affected.
- `e2e/support/global-setup.ts` launches `chromium` with no channel, so it fails when the bundled Chromium is missing. I worked around it with a temporary global setup that uses `channel: 'chrome'`.

## 2. Visual gate

### 2.1 What was captured

Site build: `VITE_SITE_AGENT_ID=knowme-site npx vite build --outDir gate-site-dist` (exit 0, built in 10.97 s; main chunk 2,695 kB, 735 kB gzip), served by `vite preview` on :4180. A temporary Playwright spec (`gate-site/site-capture.spec.ts`) used `installUarMock` plus a `page.route` override of `/api/chat/completion`. Its SSE events use the **public** shapes from `server/src/domain/agui_filter.rs` (`public_payload`, `artifact_outcome`) and `agui_steps.rs` (`step_frame`): `agui.stream.start {}`, `agui.step {kind,phase,index,label}`, `agui.rag_citations {kind,phase,citations:[{marker,document_name,snippet}]}`, `agui.message.delta {delta:{text}}`, `agui.artifact {artifact_type:"a2ui",artifact_id,title,content}` (a passive Card/Column/Text/Divider/Row surface), `agui.done {kind:"done"}`. The live-step state uses `holdChatStreamOpen`.

Scenarios × widths 320/768/1024/1440 × light/dark: `landing` (`/`), `empty` (`/threads`, which creates an ephemeral thread), `answered` (Sources + prose + card + caption), `steps-done` (finished Thinking, finished "Preparing an answer card", failed "Working", then the answer), `steps-live` (stream held open on "Preparing an answer card"), and `panel` (About and sources: inline at 1440, a sheet at 320/768/1024). Six extra frames scroll the thread to its top and bottom at 320 and 1024 (`answered-top__*`, `answered-bottom__*`), because full-page shots cannot show content inside the thread's own scroll container. Total: **54 site PNGs** (48 + 6), in the untracked scratch dir `scratchpad/shots/`.

Run: 54 tests passed. 6 soft assertions failed, all "empty": `/no threads yet/i` matched at 768, 1024 and 1440 in both themes. That is a real defect (S1).

A metrics probe at 1440 in both themes (`steps-done` state, every visible text node):
- No text under 12px.
- One contrast miss: the "Me" of the KnowMe wordmark in light theme, 3.97:1 at 18px. That is a logotype, which WCAG 1.4.3 exempts.
- The AI caption strip and the Sources block passed 4.5:1 in both themes. The probe's direct lookup of the caption missed (the caption text did not match its search), but the caption is a visible text node, so the all-text scan covered it.
- No horizontal document scroll.

Repo capture specs: `e2e/a2ui-surface-captures.spec.ts` passed and wrote 8 PNGs to `test-results/a2ui-captures/`. `visual.spec.ts` and `chat-surfaces.spec.ts` wrote 90 PNGs to `test-results/screenshots/`. The thread captures among them failed (1.1), so only `thread__mid-stream-*` exist for the thread. All untracked.

How each image was inspected:
- Each of the 54 site PNGs was opened individually with Read, except these 14, which were inspected on three contact sheets at about half scale: steps-live 768 dark; empty, steps-done, steps-live and panel at 1024 dark; answered, steps-done and steps-live at 1440 dark; answered-top 320 dark; answered-top 1024 light; answered-bottom 1024 dark; landing 768, 1024 and 1440 dark.
- a2ui-captures: 4 of 8 opened individually (surface-1440-light, surface-320-dark, inferred-1440-dark, inferred-320-light). The other 4 were not opened.
- The 90 app-build screenshots: 3 opened individually (thread__mid-stream-thinking, not-found__320__light, threads__768__dark), all 90 seen at thumbnail scale on three contact sheets. **Thumbnail review only catches gross defects such as a blank page, a spinner or a broken layout. Small-text, contrast and copy issues in the 87 not opened individually are unverified.**

### 2.2 Site build: findings per screenshot

Light and dark were laid out the same at every width; each row describes both unless it says otherwise.

| Screenshot(s) | What I see | Defects |
|---|---|---|
| `landing__320/768/1024/1440__light/dark` (8) | Marketing landing at `/`: hero "AI that understands you.", eyebrow "// THE KNOWME AGENT", copy "The KnowMe agent runs on the Universal Agent Runtime. Type a message to start.", composer "What's on your mind?", sections THREADS "Your conversations, saved on this device.", SKILLS "Skills you can attach.", EVERYWHERE "In your browser, or on your desktop … desktop app built with Tauri", header "Open app". Layout is clean, nothing overflows, both themes look intentional. | **B1**: the app-build landing ships unchanged on the site build. "Skills you can attach" and "extending what it can do" are false for a visitor (the About panel says "It can only answer questions. It cannot act for you"). "Open app" and the Tauri desktop pitch describe the app product, not the site. The composer placeholder differs from the site placeholder. `src/pages/landing-page.tsx` has no `isSiteBuild()` branch. |
| `empty__1440__light/dark`, `empty__1024__*`, `empty__768__*` (6) | Left sidebar "// THREADS", "New thread", search, then **"// No threads yet" / "Start a new thread to begin"**. Main area: K tile, H1 "AI that understands you.", the product-list sentence, the disclosure line, the composer with site placeholder "Ask about KnowMe, The Boss and the other products", and under it the disclosure again plus "Please don't share sensitive personal details in this chat." | **S1**: stale app copy "// No threads yet" on the site build, which the brief names as wrong copy, shown beside an open (ephemeral) thread. It persists while the first answer streams (`steps-live__768/1024/1440`). **C1**: the AI disclosure appears twice on the empty state (welcome block and composer footer). No "localhost", no "Choose an agent", no runtime status pill. |
| `empty__320__light/dark` (2) | Hamburger, logo, theme and panel icons; welcome block; composer; disclosure footer; bottom nav "Threads". | **C1** as above. At 320 the composer (about 130px), the two-line disclosure footer (about 70px) and the bottom nav (about 55px) leave about 410 of 740px for the conversation (M1). |
| `answered__1440__light` | User message scrolled off the top. "SOURCES" eyebrow; two cyan source cards "[1] **The Boss overview 3f9a2c1d7e4b**" with snippet "The Boss The Boss is a free, open-source desktop workspace…", and "[2] **Products/universal agent runtime**". Then prose with [1]/[2] markers and bullets, the answer card ("The Boss", body, caption row "License: open source  Platforms: macOS, Windows, Linux"), the cyan caption strip "AI-GENERATED · CHECK IMPORTANT DETAILS", and the copy/regenerate/more actions. | **S2**: the upload hash leaks into the Sources-block title. **C2**: snippet cleanup joins the stripped heading to the body, so "The Boss The Boss is…" repeats. **C3**: a path-style `document_name` keeps its "Products/" prefix. (UAR's real `document_name` format is unverified; see S2.) The caption is legible, 1 line, ≥12px, passed contrast. |
| `answered__768__light/dark` | Same content, fits; scrolled to the bottom; caption is 1 line. | S2, C2, C3. |
| `answered__1024__light/dark`, `answered__320__light/dark`, `steps-done__320/768/1024/1440__*` (12) | After `agui.done` the thread is **not** scrolled to the bottom: the answer card is cut off by the composer, and the floating jump-to-bottom button sits on top of card text ("for dev↓ers", "local-first m↓ory"). At 1440 light and 768 the same `answered` stream did end at the bottom, so this is inconsistent. | **S3**: the thread stops following the stream when the answer card (the last event) arrives, and the jump button covers content until clicked. File hint: the thread viewport auto-scroll in `src/components/assistant-ui/enhanced-thread.tsx` and the A2UI card mount growing height after the last text delta. |
| `steps-done__1440__light`, `answered-top__320/1024__*` (5) | Step rows under the disclosure: "✓ Thinking", "✓ Preparing an answer card", "⚠ Working  did not complete" (warning icon + text, so status is not shown by colour alone), then SOURCES. | Labels are fixed public strings. No tool names leak. No defect in the step rows. |
| `steps-live__320/768/1024/1440__light/dark` (8) | User bubble "What is The Boss?", disclosure, "✓ Thinking", active "• Preparing an answer card" in cyan, stop button (ember square) in the composer. Readable in both themes. | S1 still visible in the sidebar at 768+. |
| `answered-bottom__320__light/dark`, `answered-bottom__1024__*` (3) | Card at full width; at 320 the caption strip wraps to 2 lines ("AI-GENERATED · CHECK IMPORTANT / DETAILS") and stays readable; actions row below. | M1: at 320 the card plus caption fill the whole visible thread area. |
| `panel__1440__light/dark` (2) | Inline right panel "ABOUT AND SOURCES" with a close button; "Sources": "1 **The boss overview**", "2 Products/universal agent runtime"; "About this assistant", 3 paragraphs and a link to the-boss.know-me.tools. Aligned, no overlap; the conversation column narrows correctly. | **S2b**: the panel names a source differently from the in-message block ("The boss overview" here, "The Boss overview 3f9a2c1d7e4b" there). The panel loses the "Boss" brand casing. |
| `panel__1024__*`, `panel__768__*` (4) | At 1024 and 768 a right sheet over a dimmed scrim: same content and title "About and sources". Clean. | S2b. At 1024 a sheet rather than the inline panel; probably intentional (breakpoint), flagged only as a question. |
| `panel__320__light/dark` (2) | Sheet covers about 85% of the width. The second source shows its index "2" on its own line above a 2-line title. | **C4**: the index and the title misalign when the title wraps. S2b. |

### 2.3 Repo capture specs: findings (app build)

| Screenshot(s) | What I see | Defects |
|---|---|---|
| `a2ui-captures/surface-1440-light`, `surface-320-dark` | Card "The Boss", "Your name" field, disabled "Continue", AI caption strip under the card, then "Here is the summary." The app build shows "Connected"/"localhost" and the Context panel "Choose an agent…", which is expected there (the site-shell tests assert the app keeps them). | none for the site; the disabled "Continue" is low emphasis by design. |
| `a2ui-captures/inferred-1440-dark`, `inferred-320-light` | Inferred card "Calendar" with raw keys "message", "accept_label", "cancel_label" as row labels. | **C5** (app build): raw snake_case keys shown as labels. |
| `screenshots/agent-new__1024__light`, `__1440__dark`, `__320__light`, `__768__dark`, `__768__light` | Blank page with the spinner "Applying migration v2…" instead of the Create Agent form. | **S4** (QA harness): the visual capture records a loading state as a passing golden input. Same root as the flaky Flat 2.0 test in 1.1. |
| `screenshots/thread__mid-stream-thinking` | Thinking row with cyan dots, stop button, app chrome. Fine. | — |
| `screenshots/threads__768__dark` | App empty state "KnowMe / // No threads yet / Ask anything… act on your behalf". Correct for the app build. | — |
| `screenshots/not-found__320__light` | "/does-not-exist", "Page not found", "Back to KnowMe". Fine. | — |
| the other app-build screenshots (thumbnails only) | agents, agent-detail, settings-*, landing, not-found, threads, in both themes and all widths: no blank pages, overflow or broken layout visible at thumbnail scale apart from agent-new. | unverified at full scale |

## 3. Prioritised defect list

### BLOCKING for deploy

1. **B0, gate red: 30 Playwright tests fail on a stale fixture image** (`e2e/fixtures/sse.ts` `FIXTURE_IMAGE_DATA_URI`, `e2e/support/routes.ts:57`). The product correctly blocks the `data:` image (`510583d`). Until the fixture is updated, the thread a11y, chat-surface and thread visual checks never reach their assertions, so this phase's chat changes have **no passing browser evidence** in the app build. Owner: km-qa-engineer.
2. **B1, the site's front door makes false capability claims.** On the site build, `/` renders the app landing: "Skills you can attach … extending what it can do", "Open app", and the Tauri desktop section. The About panel on the same build says the assistant can only answer questions. File: `src/pages/landing-page.tsx` (no `isSiteBuild()` branch); copy owner km-chief-content-officer, implementation km-frontend-engineer. If the production front door is served from somewhere else (prerendered HTML), downgrade this to should-fix. The SPA bundle that was built and served here does render it.

### Should fix

3. **S1**: "// No threads yet / Start a new thread to begin" in the site sidebar at 768/1024/1440 while a thread is open or streaming. File: `src/components/layout/left-sidebar.tsx` (thread-list empty state); the welcome copy was already moved to `content/site/empty-state.ts`.
4. **S2 / S2b**: two source-name formatters disagree. `src/features/chat/citation-text.ts` strips a `.<12hex>` hash and keeps brand casing. `src/components/layout/source-display-name.ts` strips `-/_<12hex>`, does not strip `.<12hex>`, and does not keep brand casing. Measured: for `knowme-platforms-and-status.0123456789ab.md` (the format documented in citation-text.ts) the About panel shows "Knowme platforms and status.0123456789ab" while the block shows "KnowMe platforms and status". For `the-boss-overview_3f9a2c1d7e4b.md` the block shows "The Boss overview 3f9a2c1d7e4b" while the panel shows "The boss overview". Use one formatter. Which format UAR actually sends is unverified against a live run.
5. **S3**: after an answer card arrives last, the thread is not pinned to the bottom (320, 1024, and every steps-done width), and the jump-to-bottom button covers card text. File hint: the thread viewport in `src/components/assistant-ui/enhanced-thread.tsx`, the A2UI surface mount.
6. **S4 (QA)**: the agent-new visual capture and the Flat 2.0 test pass or fail on a still-booting page ("Applying migration v2…"). `e2e/support/routes.ts` `readyText` for agent-new needs a real ready signal. Owner: km-qa-engineer.
7. **S5 (QA)**: `e2e/support/global-setup.ts` hard-codes the bundled Chromium. Honour the project's channel so the suite runs where only Chrome is installed. Owner: km-qa-engineer.
8. **S6**: `src/test/skills-sync.integration.test.ts` fails against a live local UAR (toggle 503s, leftover `knowme-goals` state) and is included in `npm test`. Either isolate its state or keep it out of the default run. Owner: km-qa-engineer with km-rust-engineer for the 503.

### Cosmetic

9. **C1**: the AI disclosure appears twice on the empty state and again above every answer; with the caption strip, an answered card carries three AI notices. `src/components/assistant-ui/enhanced-thread.tsx`.
10. **C2**: snippet cleanup joins a stripped markdown heading to its body ("The Boss The Boss is…"). `cleanCitationSnippet` in `src/features/chat/citation-text.ts`.
11. **C3**: a path-style `document_name` keeps its directory ("Products/universal agent runtime").
12. **C4**: at 320, the source index in the sheet sits on its own line when the title wraps. `src/components/layout/about-sources-panel.tsx`.
13. **M1**: at 320 the composer, the two-line disclosure footer and the bottom nav leave about 410 of 740px for the conversation.
14. **C5 (app build)**: the inferred A2UI card shows raw keys ("accept_label") as labels.
15. Lint: 2 `react-refresh/only-export-components` warnings (`button.tsx`, `tabs.tsx`).

## 4. Not run or not verified

- Core Web Vitals (LCP/INP/CLS) and Lighthouse: not run in this gate. No performance claim.
- axe on the site build: not run. The repo a11y spec ran on the app build, and its thread cases failed on the fixture (B0).
- Keyboard-only and screen-reader walk-through of the site conversation and panel: not done.
- Real Rust server serving the site build (`server/` with a built dist) and `curl` of prerendered HTML: not done. The site was served by `vite preview`, and the event stream came from a mock that copies the filter's public shapes rather than from the filter itself (the filter itself is covered by the 155 passing Rust tests).
- Live UAR end-to-end with the knowme-site agent: not done.
- The 87 app-build screenshots and 4 a2ui captures that were not opened individually: thumbnail review only.
- Cross-browser (Firefox, WebKit): not run. Chrome only.
