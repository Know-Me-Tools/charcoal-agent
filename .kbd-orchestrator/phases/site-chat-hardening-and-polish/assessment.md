# Assessment: site-chat-hardening-and-polish

Date: 2026-10-12. Phase goals: `goals.md`. Predecessor: `agui-rendering-functionality` (reflection merged in #41, all of #27 to #41 deployed in runs 38201976018 and 38259324516; the 10-prompt live validator reported 0 problems on the current production image).

## How to read this

Every finding below comes from reading code. Claims marked **[checked]** were re-read by me in the cited file; a few of those first rested on a grep returning nothing, and the independent review (below) correctly said that does not prove absence, so those were re-traced by reading the mount path. Nothing here was observed in a browser this session except the bundle numbers, which I built and measured (command and output recorded in `evidence/01-bundle-baseline.md`). Where a claim depends on browser behaviour it says so. The two Explore reports behind this are model output; they are inputs, not evidence.

## Recalled lessons that shape this phase

From `agui-rendering-functionality/reflection.md` (the only recall hit besides an unrelated KB note):

- "A visual assertion is not evidence until a mutation check shows it fails on the bug." Every new visual or security assertion in this phase gets a mutation check, or it does not count.
- "Look at the screenshots even when every assertion passes." Design work here is judged by captures at 320/768/1024/1440 in both themes, looked at, not by green specs.
- "Run the real model against the real stack as soon as one path renders." Items that depend on model behaviour (card/prose policy, caption) get a live run before the phase closes.
- "Record a decision when a PR reverses one." Decisions go in `decision-log.md` as they are made.
- "`tier-guard.sh` matches command text" and "server tests need `KNOWME_WEB_DIST_DIR=tests/fixtures/web`."

Knowledge gaps in `prior-context.md`: none recorded. (`/learn-goal` offers: none.)

## Delta from the predecessor's seed

The seed listed four ordered groups. Assessment keeps them and adds a fifth that the code reading surfaced (A below), because it is the same trust boundary as W2.

## Findings by goal

### G1. W2: links, images and the CSP

Observed in code:

- One markdown component renders model reply text: `src/components/assistant-ui/enhanced-markdown-text.tsx`. Pipeline: remark-gfm, remark-math, then `rehypeRaw`, `rehypeSanitize` (schema `markdown-sanitize-schema.ts`), `rehypeKatex`. The same component renders the visitor's own message (`enhanced-thread.tsx:294`).
- Sanitizer: GitHub default schema with `href` limited to http, https, mailto. `img src` keeps the library default (http, https). So a reply can produce a live `<a>` to any host and a live `<img src="https://any.host/...">`. A remote image fires a request as soon as it renders, so its URL is a channel out of the chat to a third party.
- The existing host allowlist `src/lib/link-policy/is-allowed-link.ts` is applied to citation cards only, not to markdown.
- CSP is report-only **[checked]**: `server/src/interface/routes/mod.rs:46` sets `content-security-policy-report-only`; the comment says it switches after "a clean week" (`site-security-headers` 1.6). Policy (`server/src/domain/csp.rs:94-114`): `default-src 'self'`; `script-src 'self' 'wasm-unsafe-eval'` plus a hash of the theme script; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob:`; `font-src 'self' data:`; `connect-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'self'`. No `frame-src`, `worker-src`, `media-src`.
- Tests pin the header name and `script-src` only (`server/tests/meter_and_headers.rs:202-228`). Nothing pins `img-src`, `connect-src` or `style-src`, and nothing asserts a remote markdown image is blocked.
- The built `dist/` loads no Google Fonts or CDN (agent grep of dist assets and CSS); fonts are self-hosted. Enforcing the current policy would block remote model images (desired). I have **not** read `/api/csp-report` data, so "a clean week" is unmeasured: whether anything legitimate is being reported is unknown.

Gaps: (a) reply links and images unrestricted; (b) CSP not enforced; (c) the sanitizer and the CSP are two independent rules for the same thing and can disagree; (d) no test for either.

### A. Model-written code runs on the public site (new; not in the seed)

- `HtmlArtifactCard` renders a model-authored fenced `html`/`svg` (over 100 chars) or `tsx`/`jsx` (over 200 chars) block in `<iframe srcDoc sandbox="allow-scripts">` (`src/features/artifacts/html-artifact-card.tsx`). No `allow-same-origin`, so the origin is opaque. Nothing in the render path checks `isSiteBuild()`: the markdown pipeline, this card and `MermaidBlock` are identical in the site and app builds.
- A `srcdoc` frame inherits the parent CSP, so enforcing W2 will change how these previews behave (inline scripts and remote assets stop working). **Not tested in a browser.**
- `MermaidBlock` injects Mermaid SVG with `dangerouslySetInnerHTML`; `securityLevel` is not set **[checked: no match in `mermaid-block.tsx`]**. Mermaid's default is believed to be `strict`; **unverified**.
- The concierge is a read-only Q&A agent with `ui.artifacts.enabled=false`; no legitimate site answer needs a script-running preview.
- Reachability, **[checked]**: the server forwards only `a2ui` artifacts (`ALLOWED_ARTIFACT_TYPES = ["a2ui"]`, `agui_filter.rs:44`), so this card is reached only through a fenced block in the model's **prose**, which the client renders.
- Which mitigation closes which channel: `img-src` closes remote-image loads; `connect-src 'self'` should block `fetch` from a frame that inherits the CSP, but a `srcdoc` frame's inheritance is **not verified in a browser** and must be tested before it is relied on; gating `HtmlArtifactCard` on `isSiteBuild()` removes the script-running path altogether and does not depend on either. They are separate controls and Plan should not treat the CSP flip as closing item A.

This is a named failure scenario: a prompt-injected or jailbroken reply emits a fenced html block and the visitor's browser runs model-authored JavaScript (in a sandbox, with no cookie or storage access, but with network access until the CSP is enforced).

### G2. W3: machine-generated caption on every surface

- AI disclosure copy exists in one file, `content/site/ai-disclosure.ts`, marked DRAFT pending operator approval: label "KnowMe Concierge — an AI assistant. Answers may be wrong." and a sensitive-data hint.
- It renders in two app-controlled places: `ComposerDisclosure` (always, under the composer) and on the first assistant message of a thread only (`enhanced-thread.tsx:344-348`). Every assistant message carries `data-ai-generated="true"` (invisible).
- No A2UI surface, citation card or artifact carries a caption. The A2UI `Text` `caption` variant is model-controlled, so a model can write a caption-styled line that looks like a system label. That is the W3 scenario (a fake "KnowMe notice" inside a card).
- Bounding facts: on the site the surface is already passive. `A2uiSurfaceBlock` defaults `passiveOnly = isSiteBuild()` (`a2ui-surface-block.tsx:54`) and the server rejects any surface with a component outside the passive five (`is_passive_surface`, `agui_filter.rs`). So the W3 scenario is a text-only fake notice (no controls, no links in the catalog), not a fake form. The `Text` `caption` variant (`catalog.tsx:85`) is a plain `<p class="text-xs text-faint">` that looks like a system label.
- The goal is a caption on **every A2UI surface**. The caption design must therefore (a) sit outside model content, (b) be visually and structurally distinct from the model's `caption` text, and (c) not depend on the model calling the card. A per-message caption is a wider option the operator may prefer; it is listed as a decision, not substituted for the goal.
- Candidate fixed points, all outside model content: a wrapper around the `<section>` in `A2uiSurfaceBlock`, or `ToolCallPart`, or a per-message line in `AssistantMessage`.

### G3. Visible quality

1. **Duplicated answer.** Root cause is instruction, not a bug: **[checked]** `uar/agents/knowme-site.json` tells the model "The card replaces nothing: still write the answer and its citations in the reply", and `uar/presentations/answer-card.json` carries the full `answer` text. The server filter (`agui_filter.rs`) and the client both forward whatever arrives, in arrival order; `richMessageToThreadMessageLike` has no concept of "this message has a card". Evidence it happens live: `evidence/2026-10-12-live/README.md`.
   - The "three citation cards" are three separate `CitationBlock` parts. A `CitationList` with a "Sources" heading exists in `citation-block.tsx` but is not imported anywhere (dead code).
   - Options (cost in brackets): client hides or collapses prose when a card is present, with fallback to prose if the surface errors [client only; also fixes persisted history]; client groups citations into one "Sources" block [client only]; edit the prompt and the template so the card carries a title, source and a summary and the prose adds, not repeats [UAR artifacts only, via seed, needs a deploy; model compliance is not deterministic]; drop the card on the site [removes the feature this predecessor shipped]. This is a product decision, listed below.
2. **Citation snippets.** **[checked]** `citation-block.tsx:50` renders the raw string with `line-clamp-3`; there is no markdown stripping and no JS truncation in this repo. The server filter copies `snippet` untouched. Whether the mid-word cut also happens upstream (UAR or KB chunker) is **unknown** and needs one raw `agui.rag_citations` payload from the live site. Also: the client never renders a citation `marker` (type in `agui-event-handlers.ts:44`, no use in the citation path). The server filter forwards `marker` when present (`agui_filter.rs:436`); whether UAR sends it is **unknown** and belongs to the same raw-payload question.
3. **"localhost" text.** **[checked]** It is not the page footer. The site build passes `VITE_UAR_BASE_URL=` as an empty string (Dockerfile:31-33), and `src/components/common/uar-status.tsx:23` turns an empty URL into the literal "localhost". The mechanism is the empty-string fallback, so the fix is not to set the variable. `<UarStatus />` is rendered with no site gate in the sidebar footer (`left-sidebar.tsx:273`) and the topbar (`topbar.tsx:58`, compact, but its aria-label still says "localhost"). Fix points: gate it on `isSiteBuild()` at those two mounts (it is infra detail a visitor does not need), or change the fallback.
4. **Context panel.** **[checked, traced]** `RightContextPanel` and `ContextPanelSheet` are mounted by `app-layout.tsx:60,63` on `isWide/!isWide && isThreadView` only; neither that file nor `right-context-panel.tsx` references `isSiteBuild`, and no other file mounts them, so on the site it is open by default on every thread view. The empty state says "This thread uses the default agent. Choose an agent when you start a thread…", wrong on a site with no picker. `useAgents()` may issue an admin call the proxy blocks (**unverified**).
5. **Other public-surface problems seen in code, not in the goals** (each needs a decision before it is scoped in): empty state copy is stale app copy ("// No threads yet" on an empty thread, "act on your behalf" for a read-only concierge) and offers no starter prompts although the scope is four topics; the composer shows a prompt-caching toggle and "Ask your agent anything…" (from the Explore report, **not re-read**); the "New thread" button and the thread list are rendered with no site gate (**[checked]** `left-sidebar.tsx:158-175` gates only the agent-picker button; `UarStatus` is ungated). Whether showing the thread list to a visitor is wrong is a product question, not a defect found.
6. **Coverage gap.** Existing captures cover A2UI surfaces (8 mocked + live). No spec covers the sidebar footer text, the site-build context panel, citation snippet text, or the site empty state.

### G4. Bundle

Measured by me: production-equivalent build (`VITE_SITE_AGENT_ID=knowme-site`, sourcemaps, scratch outDir; `dist/` untouched).

- Eager entry chunk `index-*.js`: **668.7 kB gzip** (the predecessor's 684.81 kB was a different measurement; this one is the baseline for this phase). Budget 300 kB. `index.html` loads only this chunk eagerly.
- Largest lazy chunks (gzip): wasm 224.9, emacs-lisp 191.5, a2ui-surface-block 142.7, cytoscape 138.2, mermaid core 136.7, treemap 104.6. These are not on the critical path.
- Source bytes in the eager chunk, by package (pre-minify, from the sourcemap): `@base-ui/react` 618 kB, `katex` 594 kB, `react-dom` 533 kB, `@electric-sql/pglite` 392 kB, `react-router` 378 kB, `@assistant-ui/core` 360 kB, `@prometheus-ags/entity-graph-react` 301 kB, `parse5` 269 kB, `@assistant-ui/react` 234 kB, entity-graph-core 143 kB, `micromark-core-commonmark` 111 kB, `tailwind-merge` 104 kB.
- The public site build ships PGlite (local database) and KaTeX in the entry chunk. Whether the site needs them eagerly is an open question for Plan, not a conclusion: threads are persisted in PGlite today and the site runs ephemeral threads in part (`persistence.md`), so removing it may touch product behaviour.

Not measured: Core Web Vitals (LCP, TBT) of the live site. The goal says "attribute and cut"; the cut has no target yet because no CWV baseline exists. Plan should require one (Lighthouse on the live site at mobile).

### G5. Observe what was never seen live

Never observed: a forced non-allowlisted tool call being denied; meter rows on the new image (needs DB credentials, which I will not read into the conversation: the operator or a SurrealDB query run by the operator is required); why one payment-prompt stream once ended without `agui.done` (today's validator run showed it ending cleanly, and 5 earlier replays were clean, so this may not reproduce). The tool-denial test requires coaxing the model into calling a tool outside its allowlist; the model tends to refuse, so it may need a UAR-side test harness rather than a prompt.

### G6. S-tier UI/UX and the process

The goal says to walk the full process with the agent team and the Impeccable skills. State of the ground:

- Design system: "Flat 2.0" tokens in `src/styles/tokens.css` (no borders or shadows, fills separate areas), ladder of nine surfaces, ember #e04e28 primary and cyan for citation/thinking, four font roles (Space Grotesk, Inter, Roboto, JetBrains Mono), radius ladder 4/6/10/16/24, no spacing scale, 12px minimum text enforced by e2e, WCAG pairs enforced by `tokens.test.ts`.
- Impeccable design context: **none exists** (no `.impeccable*` at the repo root; confirmed by the reviewer and by me). Most design skills depend on it, so running `teach-impeccable` is a prerequisite step of Plan, not an option.
- Impeccable skills are installed (`impeccable`, `teach-impeccable`, `critique`, `audit`, `polish`, `harden`, `clarify`, `typeset`, `adapt`, `arrange`, `animate`, `normalize`, `distill`, `delight`, `bolder`, `quieter`, `colorize`, `optimize`, `onboard`, `extract`, `overdrive`, `better-layout`). Whether the project has an impeccable design context (a `.impeccable` file or equivalent from `teach-impeccable`) was **not checked**; Plan should check before any design skill runs, since most of them depend on it.
- Agent team: `km-creative-director` (design system and brand tokens), `km-conversational-designer` (persona, opening, chips, guardrails, disclosure), `km-frontend-engineer`, `km-qa-engineer` (WCAG 2.2 AA, CWV), `km-security-officer`, `km-chief-content-officer` (all copy under `content/**`), `km-rust-engineer`, `km-product-owner`.
- Copy is a gate: `content/site/ai-disclosure.ts` and `chat-offline-states.ts` are marked DRAFT pending operator approval. New or changed visitor-facing copy needs the chief content officer's pre-review and the operator's approval before it ships.

## Uncomfortable findings

1. **The predecessor shipped a card that makes the site worse for most visitors**: it states the same answer twice and then three source cards, and the instruction that causes it is in our own agent prompt. The predecessor's reflection said so; nothing in the phase measured whether the card helps.
2. **W2 is a live exfiltration channel today**, not a hypothetical: any reply can load an image from any host. The only stated gate on the CSP flip is a code comment ("until a clean week", `mod.rs:44`); I do not know whether the operator wants that gate honoured, and I have not read the report endpoint's data. Flipping the header is a Rust change (`server/src`), so it needs a deploy, and it requires updating `meter_and_headers.rs:221-223`, which currently asserts the enforcing header is absent. That collides with the `[skip ci]` default and must be flagged as a deploy-bearing change in Plan. Sanitizer-level blocking of remote images is a client change that closes the image channel without waiting for the CSP.
3. **Two of the goals can contradict each other.** Enforcing the CSP changes `HtmlArtifactCard`, and "S-tier" polish on that card is wasted if the right answer is to turn it off on the site.
4. **Model-dependent fixes cannot be proven by tests.** The duplication fix by prompt, the caption copy and the tool-denial observation all depend on a live model; the mocked suite passed 316 tests while three defects lived. The live check is mandatory.
5. **The bundle target may be unreachable without a product change.** Dropping PGlite and KaTeX from the entry chunk is the only large lever in the numbers, and both are product features.

## Decisions needed from the operator (before Plan)

1. **Duplication policy** (the root-cause finding): (a) card is the answer, prose becomes a collapsed "full answer"; (b) prose is the answer, the card is only a title/summary/sources header; (c) remove the card from the site. My recommendation is (b) implemented as: prompt and template changed so the card carries title, one-line summary and source, plus a client rule that collapses citations into one "Sources" block. It fixes history only for the citation part; a client prose-collapse (a) fixes old threads too. Your call.
2. **Remote images in replies:** block entirely (recommended; the concierge has no reason to show third-party images) or allow only allowlisted hosts.
3. **Reply links:** keep clickable but only to allowlisted hosts and show the destination as text for the rest, or show all as plain text (the citation-card behaviour).
4. **`HtmlArtifactCard` and `MermaidBlock` on the public site:** disable on the site build (recommended) or keep with CSP.
5. **Disclosure copy:** the draft wording needs your approval (`docs/content/reviews/site-ai-disclosure-label.md`), and whether the caption goes on every assistant message or only on cards.
6. **Context panel:** remove on the site (recommended) or repurpose as an "About / Sources" panel.
7. **Extra items in 5. above** (empty state, starter prompts, composer toggle, sidebar thread list, runtime status): in scope or out. They were not in the goals, so they stay out unless you say so.

## Open questions I could not answer from here

- Is the snippet cut upstream? Needs one raw `agui.rag_citations` payload from the live site.
- What do `/api/csp-report` records show? Needs log access.
- (Answered: no Impeccable design context exists; see G6.)
- Does anything legitimate use `data:` or `blob:` images, so `img-src` can be tightened?
- Is Mermaid's default `securityLevel` `strict`?
- Is the 668.7 vs 684.81 kB difference a measurement method or a real change?

## Unresolved review findings

Independent review by the `artifact-critic` subagent (artifact only, no generation history; the cross-model judge gateway was not used, so this is a same-family review, a weaker guarantee). Verdict: no CRITICAL; 7 WARNING, 5 SUGGESTION; it re-verified 14 claims, 9 held.

All 7 warnings were folded into the text above:

1. `marker` claim was wrong (the server forwards it; the client never renders it): corrected in G3.2.
2. "localhost" mechanism misstated: corrected in G3.3, with the two ungated mounts named.
3. Verification count inflated and two negatives proven by grep alone: reworded in "How to read this"; the context-panel claim was re-traced through its mount path and holds.
4. Thread list and "New thread" claimed ungated without a check: now read in `left-sidebar.tsx`; the claim holds and is stated as a product question.
5. W3 scope slipped from "every A2UI surface": restated, with the passive-only controls cited.
6. HTML artifact reasoning incomplete: reachability traced (prose fence only), mitigations separated by channel, CSP inheritance marked unverified.
7. "CSP flip blocked on data" was an assumption, and the pinned test was not mentioned: both addressed in Uncomfortable #2.

Suggestions: the bundle measurement is now in `evidence/01-bundle-baseline.md` (S2); the impeccable question is closed (S4); the CSP deploy collision is flagged (S3); the `tier-guard` recall is a recalled lesson, unchecked this session (S1); S5 is this section.

Not resolved by review, by design: the seven operator decisions above.
