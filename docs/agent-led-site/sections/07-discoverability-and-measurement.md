# 7. Discoverability and measurement

Owner: km-marketing-officer. Status: proposal, for review by km-product-owner, km-rust-engineer (prerender build step), km-security-officer (analytics privacy posture) and km-cmo (north-star sign-off).

Items marked **[CURRENT]** exist in the repo today. Items marked **[PLANNED]** do not yet exist and need a change proposal before anyone builds them. External pages outside threads A to D are listed with read dates under "Additional sources" at the end of this section.

## 7.1 The problem, stated plainly

The site's theory is that visitors discover most content through a conversation with the KnowMe agent, which later pins small, durable widgets to the page (§2.4). Today's build is a Vite SPA rendered by `createBrowserRouter`, served by `server/src/interface/routes/static_files.rs`. On the site build, the router (`src/App.tsx`) exposes three public routes — `/` (landing), `/threads` (thread list) and `/threads/:id` (thread detail) — plus a catch-all 404 route; `isSiteBuild()` excludes the admin routes (`/agents/*`, `/settings/*`, including `/settings/about`) from the router entirely on that build, so a direct link to any of them 404s rather than rendering. None of the three public routes has server-side or build-time rendering **[CURRENT]**. `index.html` ships a static `<title>` and description, but the hero copy, the knowledge-base content in `content/knowledge/*.md`, and anything the agent says exist only after JavaScript runs.

AI crawlers do not run that JavaScript — for the crawlers we have measurement for. The best evidence is one panel: Vercel and MERJ's analysis of December 2024 production log data, which found that OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot, Meta-ExternalAgent, Bytespider and PerplexityBot all fetched raw HTML only and rendered nothing, while Googlebot and Applebot render [C1]. Googlebot rendered 100% of pages, with a median 10-second delay and a p99 of about 18 hours [C2]. OpenAI's crawler documentation names GPTBot, OAI-SearchBot and ChatGPT-User as the agents behind training, ChatGPT search and user-triggered reads (S1); Anthropic documents the equivalent split — ClaudeBot, Claude-SearchBot, Claude-User (S2).

That panel is nearly two years old, and it did not measure Claude-SearchBot, Claude-User, or any fetcher introduced since [C1]. "ClaudeBot doesn't render" is evidenced; "Claude-SearchBot and Claude-User don't render" is an inference from a sibling bot, not a measurement. Treat every bot [C1] didn't test as unmeasured, and confirm from our own data once the site is live: filter server logs by AI-bot user agent and compare what each one fetches against what a rendered page would contain.

Google is the best-evidenced exception [C2], though its render pass trails the first crawl by minutes to hours, and Google's AI-features guide says a page must be indexed and eligible to show with a snippet to appear in its generative AI features (S3). Left as-is, this site is unreadable to every AI crawler [C1] measured as non-rendering, and its status with the rest is an open question we should answer from logs rather than assume.

## 7.2 The crawlable baseline

**Every topic in `content/knowledge/*.md` gets a static, prerendered HTML page. [PLANNED]** The eight files — `company.md`, `faq.md`, `knowme-overview.md`, `knowme-features.md`, `knowme-platforms-and-status.md`, `knowme-privacy.md`, `the-boss.md`, `ipfs-sync-for-obsidian.md` — are already the agent's source corpus, each with inline source citations. Publishing them as their own routes (`/knowme`, `/knowme/privacy`, `/the-boss`, `/faq`, aligned to the nav spine in §2.5) means the same facts the agent can say are readable with no model call and no JavaScript — the standing rule in §2.7: "Every fact the agent can state is on one of those pages."

The mechanism: `server/src/infrastructure/assets.rs` embeds whatever static bundle exists at `OUT_DIR` (or reads `KNOWME_WEB_ROOT` from disk), and `static_files.rs` already resolves `/about` to `about/index.html` before falling back to the SPA shell — unused today since nothing writes a prerendered file for it to find **[CURRENT infrastructure, unused]**. The plan: a small Node generator renders each knowledge file through the site's page template (full `<head>`, per-route title/description/canonical, plus the JSON-LD below) to static HTML written into the Vite `dist/` tree before `cargo build`'s asset-embed step runs **[PLANNED]**. This works for the topic pages because their content is pure markdown — a script can turn `content/knowledge/*.md` into a head block, JSON-LD and a body with no React involved.

**The landing page is a different, harder prerendering problem, and the Markdown generator above cannot solve it.** FR-1 requires the opening message and the four starter chips to exist in `/`'s initial HTML, and those are live React components (the composer, the chip row), not markdown. Getting them into the initial HTML needs one of two approaches, and this section requires a decision, not a default **[PLANNED, Phase 1 decision, owner km-frontend-engineer, sign-off km-product-owner]**:

- **Option A — React SSG / Framework mode.** Migrate `src/App.tsx` from Data Router mode (`createBrowserRouter`) to React Router's Framework mode (`@react-router/dev` plus a `prerender` list in `react-router.config.ts`, S4), or an equivalent SSG step, so the real chip and composer components render to static HTML at build time. One source of truth for the UI, but the larger migration, taken on for at least `/`. Scope it to the landing route; it should not be assumed to cascade to `/threads` or `/threads/:id`.
- **Option B — static-plus-island.** Hand-author a static HTML shell for `/` (h1, value statement, opener copy, the four chips as plain links or buttons) that mirrors the live component, with React hydrating over it as an island once JS loads. Cheaper to ship, but creates a second copy of the hero UI that can silently drift from the real component — needs a visual-regression check (320px and 1440px, both themes) tying shell and component together.

Either option changes the build step, not just adds a file: `npm run build` today is plain `vite build`, and whichever option is chosen, its prerender step has to run as part of that build, ahead of the Rust asset-embed step.

**`/about` is a named Phase 1 deliverable.** `static_files.rs` already resolves `/about` to `about/index.html`, but nothing writes that file today, so the route 404s, and the site build excludes `/settings/about`. The agent's prompt still names About and Contact pages. In Phase 0 the agent names no site routes; the prompt fix (`site-agent-prompt-fixes`) and `/about` land together in Phase 1, with the prompt fix depending on `/about`, and FR-6 and FR-9 route checks start with FR-23.

**Sitemap** — `public/sitemap.xml` does not exist **[CURRENT gap]**. Generate it in the same build step once topic routes exist, with `lastmod` from each knowledge file's git history, referenced from `robots.txt` **[PLANNED]**.

**Structured data** — JSON-LD must describe content visible on the page (S5). Minimum set, per route type **[PLANNED, none exists today]**: `Organization` and `WebSite` on every page; `SoftwareApplication` on `/knowme` and `/the-boss` (`offers` omitted entirely while pricing is unpublished, per the flagship brief's pricing gate); `FAQPage` on `/faq`, built from `faq.md`'s existing Q&A since the schema requires matching visible content; `BreadcrumbList` matching the nav spine.

**llms.txt** — `public/llms.txt` does not exist **[CURRENT gap]**. It is a community proposal, and the measured evidence on whether it does anything is negative, not neutral. Across roughly 300,000 domains, SE Ranking found llms.txt on about 10% and no measured effect on how often a domain was cited in AI answers; dropping it as a model feature improved the predictive model. A separate 90-day log study found AI bots requested `/llms.txt` on only 0.1% of hits, versus roughly 265 hits for an average content page on the same site [C6]. Google says its Search does not use such files (S3). It stays **[PLANNED, low cost]**: one generated file pointing at the prerendered pages, cheap to ship once those pages exist, but not a source of citation lift and never a substitute for the crawlable baseline above.

**Canonical URLs.** Every prerendered topic page self-canonicalizes to its own URL. The agent's pinned widgets (§2.4) aren't separate documents — client-side UI state, per visitor, never indexed. When a widget cites a source, it cites the same topic page that's independently crawlable, so the "canonical" answer and the "cited" answer are the same URL — and that page is also the control condition for §7.4's experiment, since it's what a crawler, and the no-JS fallback in §2.8, actually see.

## 7.3 AEO: earning the citation

Being retrieved and being recommended are different outcomes: an AI answer can cite a page while recommending a competitor named in that same answer. **This framing is not a finding from our own research threads** — nothing in threads A-D measured citation-versus-recommendation behavior for KnowMe or a comparable site. It's the documented pattern in the ai-seo skill's citations-vs-recommendations reference (a 100-query B2B study found self-promotional "best alternatives" listicles earned citations that went on to recommend a competitor 69% of the time), carried over here as an informed expectation, not a measured result for this project. Given that, and the flagship brief's status table (the most differentiating claims — Hands, BossFang sync, the plugin marketplace — are skeleton, not shipped), the near-term strategy leans on what's true and citable over competitive positioning:

- Every topic page leads with a direct, 40–60 word answer to its own question, matching the corpus's shipped-vs-planned discipline rather than inventing marketing copy. The 40-60 word figure is the ai-seo skill's stated optimum for snippet extraction; it has not been tested against this corpus.
- The status distinction itself (working / partial / skeleton / planned) is the differentiator worth citing — unusual, specific and verifiable. **This is our own judgment, not a cited finding.**
- `FAQPage` schema over `faq.md`'s existing Q&A is the highest-leverage addition. "FAQ extraction is one of the more reliable citation surfaces on non-Google engines" is the ai-seo skill's characterization of its sources, not a number we have independently measured.
- No content gets written "for AI" separately from what a human reads — the same prerendered page serves both. Google's guide says: "There's no requirement to break your content into tiny pieces for AI to better understand it" (S3).

## 7.4 Measurement plan

**Analytics approach [PLANNED].** No analytics tooling exists in the repo today **[CURRENT gap]**. Given KnowMe AI, LLC's own privacy positioning (`content/knowledge/knowme-privacy.md`), the site should not contradict it: no cross-device identity graph, no third-party ad pixels, and no accounts (§2.6). How any session identifier is stored, and on what consent basis, follows the ePrivacy decision below.

**Event set [PLANNED], aligned to the experience concept's own vocabulary:**

| Event | Fires when |
|---|---|
| `starter_option_clicked` | A visitor taps one of the four entry chips (§2.2) |
| `chat_started` | First message sent in a session |
| `turn_completed` | Each agent reply completes (gives messages-per-session) |
| `surface_rendered` | A widget is pinned to the board (§2.4) |
| `surface_interacted` | A visitor acts on a pinned widget (unpin, reorder, follow its link) |
| `handoff_clicked` | A visitor clicks a qualifying handoff link — a download or external product link today, a contact/waitlist action once one ships — wherever it appears: a chat-pinned widget, an inline chat link, or the static page itself. One definition, fired the same way in both experiment arms. |
| `fallback_used` | The no-JS/offline/rate-limited fallback in §2.8 is shown |

**North-star metric — proposed, pending km-cmo sign-off:** *qualified next-step rate* — the share of sessions reaching a `handoff_clicked` event, regardless of whether the visitor chatted or just read the static pages. This deliberately doesn't reward "messages sent" as an end in itself; a visitor who reads one topic page and downloads The Boss counts the same as one who had a ten-turn conversation. At launch, with no Contact page and no waitlist, the only concrete target behind this metric is clicking through to The Boss's GitHub releases.

**Guardrail metrics:** Core Web Vitals budgets (LCP < 2.5s, INP < 200ms, CLS < 0.1, per the core-web-vitals skill) must hold on both the static pages and the chat-enabled landing page — the static arm shouldn't win because the chat arm is slow. Model cost per session is a guardrail on the agent arm, so a budget kill switch firing mid-experiment doesn't get read as a content effect.

**A/B / holdout design, agent-led vs. static control [PLANNED].** The control arm already exists as a design artifact: §2.8's no-JS fallback (tagline, disclosure, chips as plain links, FAQ, nav spine) *is* the static-only experience. The experiment reuses it: each session is assigned to "agent-led" (composer live, chips open chat, widgets pin to the board once Phase 2 ships) or "static control" (chips link straight to the matching topic page, composer hidden).

Primary metric: `handoff_clicked`, with the one definition above for both arms. It must not be scoped to "leaving the chat", which would make the static arm's rate near zero by construction. With no live pricing, signup flow, Contact page or waitlist (§5.6(a)), the only qualifying target at launch is The Boss's GitHub releases page. Don't change the metric's shape once a holdout has started; add a contact or waitlist target only before the next holdout begins.

**The realistic baseline is low.** A single download link is a smaller target than "download, contact, or waitlist" combined, so a baseline near 1% is more plausible than 3–5%. Recompute n from Phase 1's measured baseline before locking the holdout.

**What this design can and cannot isolate.** The agent-led arm bundles chat *and* widgets once Phase 2 ships; the static arm has neither. A GO is evidence for "the agent-led experience, as a whole, beats static", not that widgets caused the lift. Section 9's Phase 3 gate (at least 15% of agent-arm sessions with a chat render a widget, at least a third of those interact) is a usage gate, not a causal estimate. A three-arm design (static / chat-only / chat-plus-widgets) would isolate widgets; a third arm raises the total sample by half, and it is not proposed here.

**ePrivacy decision for the bucket assignment.** EDPB guidance holds that information in browser storage is outside Article 5(3) consent only while it stays on the device; once it, or anything derived from it, is read over the network, Article 5(3) may apply [C29]. Every event tied to a bucket does that. `sessionStorage` is still device storage, so a session-scoped bucket does not by itself remove the consent question. D-10's default is **no bucket until counsel decides**. Server-side assignment is an option, but the cookie used for session binding must not be stretched to cover measurement. No experiment runs before D-10 is recorded.

**Sample size and stopping rule — fixed horizon, no interim stopping.** A target sample is set in advance from the Phase 1-measured baseline, and the result is read once, at that sample — never checked early and stopped the moment it looks favorable, which inflates false positives (the ab-testing skill's peeking problem). For a 20% relative lift (two-sided α 0.05, power 0.8), the standard two-proportion calculation gives about **8,200–13,900 sessions per arm at a 3–5% baseline** and about **43,000 per arm at 1%**. A 50% lift would need only about 1,500–2,500 per arm, but switching to a bolder lift once the data looks promising is the same peeking problem. The recomputed n is the pre-registered stopping point. **If 12 weeks pass without every arm reaching it, the result is HOLD** — section 9's "insufficient evidence" outcome, not NO-GO and not a judgment call read off partial data. At a 1% baseline, HOLD is the likely result.

## 7.5 What can't be measured

Some things are structurally invisible to this site's analytics, and should be named rather than implied away:

- **Product usage after handoff.** KnowMe's inference runs on the visitor's own device by default (`knowme-privacy.md`) — once someone downloads The Boss or installs KnowMe, their product engagement is outside what this website can observe. The funnel this section measures ends at the download click.
- **AI answer impressions without a click.** There is no Search-Console equivalent for ChatGPT, Claude or Perplexity — no impression count, no "you were cited here" report. Third-party trackers (Otterly, Peec, Profound) sample a fixed prompt set and report citation presence, not reach.
- **Single-run AI answers are not a measurement.** AI answers are non-deterministic — the same prompt run five times can cite different sources each time. A report has to state a rate with a sample size ("cited 3/5 runs"), not a single yes/no.
- **Cross-device and cross-session identity.** By design (§2.6: no accounts, local-only board and thread storage), this site can't tell whether the visitor who read `/knowme/privacy` on a phone is the one who later downloaded The Boss on a laptop. That gap is the cost of matching the product's own privacy posture, accepted rather than worked around.
- **Word of mouth and dark social.** A release link shared in Slack or Discord, or a verbal recommendation, shows up as unattributed traffic at best.

**Additional sources** (outside threads A to D; each read 2026-10-01):
- S1. OpenAI, "OpenAI Crawlers", https://developers.openai.com/api/docs/bots
- S2. Anthropic, crawler and site-owner help article, https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- S3. Google Search Central, AI features optimization guide, https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- S4. React Router, "Pre-Rendering", https://reactrouter.com/how-to/pre-rendering
- S5. Google Search Central, structured data general guidelines, https://developers.google.com/search/docs/appearance/structured-data/sd-policies
