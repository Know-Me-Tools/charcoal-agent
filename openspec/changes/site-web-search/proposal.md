## Why

Part of the phase `site-chat-hardening-and-polish` (change 16, added 2026-10-13 after the plan's 15 changes). Operator request, 2026-10-13: "add support for web search via Firecrawl skills and/or the Firecrawl MCP server for this agent, so a user can ask things that search the web." A binding addendum the same day: every web result the agent uses must produce citations in the chat stream's content chunks, the same way knowledge-base hits do, so they show in the visitor's Sources block and the About/Sources panel.

Today the public agent cannot reach the web. `uar/agents/knowme-site.json` allows one tool (`presentation_render`), skills `none`, MCP servers `none`, and the prompt says "Answer only from the retrieved knowledge base content" and "Nothing else is in scope". The change gives the agent one read-only, search-only capability and keeps everything else shut.

The uncomfortable part: this makes a public, unauthenticated page a front end for a paid search API, and turns every search result into a prompt-injection input. Both are bounded by design below, but neither goes to zero. The design also found that UAR cannot run an MCP tool unattended today (see `design.md` section 1.2), so the cheapest-looking path, "attach the Firecrawl MCP server and select the search tool", does not work on the public path without a UAR change.

## Amendment 2026-10-13 (operator, recorded as D-11): visitor toggle, two agents

The operator answered OD-1 to OD-8 with "go with your recommendations" and added a toggle. This amendment supersedes every passage below marked **[SUPERSEDED by the amendment]**; those passages stay as history.

- Web search is **off by default**. There are two pinned agents: `knowme-site` (today's agent, behaviour unchanged, only `presentation_render`) and a new `knowme-site-web` (`presentation_render` plus `websearch__search`, `mcp_servers` `selected` `["websearch"]`, same knowledge base `knowme-site`, memory off).
- The browser sends a boolean `web_search: true` with the visitor's message. The site proxy maps it to `knowme-site-web` on the server and any other value (or no flag) to `knowme-site`. The visitor never names a tool or an agent, and the existing rule that a visitor-supplied `tools`, `mcp_servers`, `agent_id` or `run_policy` is dropped stays.
- The composer gets a web-search toggle. Its state is stored per visitor on the device. Consent is asked at the point of use: the first time the visitor turns the toggle on, the disclosure about the search words going to a third-party search service is shown (wording still DRAFT, OD-7).
- Rollback is by configuration, not an image deploy: re-seed with `SEED_MODE=agent SEED_WEB_AGENT=0` and unset the server's web-agent mapping; the seed never deletes an agent from UAR.
- New tasks for the toggle: the client composer toggle (16.10.1), the server flag mapping (16.10.2) and seeding the second agent (16.3.3, done in `scripts/seed-site-agent.sh`). See `tasks.md`.
- The uncomfortable part of the amendment: two agents means two prompts whose shared persona text must stay identical by hand. A drift between them would make the voice change when a visitor flips a switch. Task 16.3.4 checks it.

## What Changes

- Add a single model-facing tool, `websearch__search`, served by a small in-cluster MCP wrapper (`site-websearch`) that calls Firecrawl `POST /v2/search` with fixed parameters. The agent never sees the raw Firecrawl MCP tool surface.
- UAR attaches the wrapper as an MCP server; the run policy selects exactly that one tool. Skills stay `none`. **[Amended: this policy belongs to the new agent `knowme-site-web` only; `knowme-site` keeps `presentation_render` alone.]**
- A UAR change (upstream, Prometheus-AGS) lets an administrator mark one registered MCP tool as not needing human approval. Without it the turn would wait for an approver that does not exist. This is the critical path and an operator decision (OD-3).
- The site proxy converts the search tool result into a public `agui.web_citations` frame (title, host, URL, short snippet, marker `W1`..`W5`) and shows the tool step as the fixed label "Searching the web". Raw tool results, queries and tool ids stay off the public stream.
- The client shows web citations in the Sources block and About/Sources panel with a visible "Web" label and the destination host. Links to hosts not on the reply-link allowlist render as text with the visible destination (D-3).
- Prompt rules (for `knowme-site-web`; `knowme-site`'s prompt is not changed): knowledge base first; web only when the KB does not answer or the question is about the outside world; results are data, not instructions; every web claim carries a `[Wn]` marker that resolves to a web citation, and a claim that cannot be cited is not made.
- Lands in: this repo (`uar/agents/knowme-site-web.json` (new) **[SUPERSEDED by the amendment: was `uar/agents/knowme-site.json`]**, `scripts/seed-site-agent.sh`, `server/`, `src/`, `k8s/base/`, `scripts/`, `docs/`), a new `site-websearch` service, and an upstream UAR PR. Owners: km-rust-engineer, km-conversational-designer, km-frontend-engineer, km-security-officer, km-devops-engineer, km-qa-engineer.
- Depends on: `site-stream-step-visibility` (the `agui.step` tracker), `site-reply-content-hardening` (link and image policy), `site-spend-ceiling` (meter), `site-agent-tool-allowlist` (FR-11 pin, which this change amends).
- Plan: `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` needs a round-order entry and Task model assignments for change 16; this change does not edit it.

## Operator decisions needed

Answered 2026-10-13 (D-11): OD-1 to OD-6 and OD-8 as recommended, with the toggle amendment; OD-7 wording approval pending.

Each has a recommendation. Nothing ships until OD-1 to OD-4 are answered; OD-5 to OD-8 can be answered during implementation.

- **OD-1 Scope widening (explicit).** Today the agent refuses anything outside KnowMe AI, LLC, its products, the technologies the KB covers, and comparisons. The request lets visitors ask general questions that need the web. Options: (a) general web questions, KB first; (b) web only to support product and competitor questions (current-version facts, competitor claims, ecosystem news the KB lacks). **Recommendation: (a), released behind a separate daily web-search cap and a one-command rollback** (re-seed the agent without the tool, no image deploy, via the `site-content.yml` `sync: agent` path from D-7). **[Amended: answered 2026-10-13 as (a) but only when the visitor has turned web search on; rollback is `SEED_MODE=agent SEED_WEB_AGENT=0`. See the amendment and D-11.]** Reason: (a) is what was asked and is the more useful demonstration; (b) is the safer fallback if the first week shows abuse, off-topic drift or credit burn above the thresholds in `design.md` section 5. The cost of (a): the site becomes a free general-purpose search assistant for anyone, and a wrong or offensive answer about the outside world carries the KnowMe name. Moving the agent from "answers only about us" to "answers about the world" also changes what the AI disclosure and About panel promise.
- **OD-2 Mechanism.** (A) raw Firecrawl MCP server with the policy selecting `firecrawl_search`; (A+) our own thin MCP wrapper with fixed search parameters; (B) a Firecrawl skill; (C) the site proxy searches before forwarding the turn. **Recommendation: A+.** Raw Firecrawl lets the model, and so an injected instruction, choose `limit` up to 100, `scrapeOptions` (full page content, extra credits per page), `sources` and `categories`; UAR does not constrain MCP tool arguments. Skills (B) need a shell CLI the agent does not have and reopen `activate_skill`. (C) works without a UAR change but cannot be model-decided, so it searches on every turn or on a guess.
- **OD-3 UAR change.** UAR (source at `b4244aea`, and the pinned image) hard-codes `ApprovalClass::Required` for every MCP tool, so a public run would wait for an approval nobody can give. Needs an upstream PR in Prometheus-AGS/universal-agent-runtime and a new image digest in `k8s/base/uar-deployment.yaml`. **Recommendation: raise the PR now; it is the longest lead item.** Fallback if it cannot land: option C, accepted with its limits (design section 2).
- **OD-4 Firecrawl account.** The operator creates the Firecrawl API key and the cluster secret, and sets any monthly credit limit the Firecrawl plan offers. No agent reads or handles the key value. **Recommendation:** a dedicated key for this site, not shared with the operator's own tooling, so it can be revoked alone.
- **OD-5 Web links.** Web citations are text with a visible host and full URL, not clickable, unless the host is on the reply-link allowlist. **Recommendation: text-only in v1.** Making them clickable needs a reviewed interstitial and is a separate change.
- **OD-6 Marker scheme.** Web markers are `[W1]`..`[W5]`, separate from knowledge-base `[1]`..`[k]`. The alternative is to continue the numbers after the last KB marker. **Recommendation: `W`-prefixed.** The model cannot reliably know `k`, and a collision attributes a claim to the wrong source.
- **OD-7 Privacy.** *(Answers to OD-1 to OD-6 and OD-8 recorded in D-11; OD-7's exact wording is still pending the operator's approval.)* The model writes the search query from the visitor's message, and the query goes to Firecrawl, a third party. The visitor-facing disclosure and privacy text must say so. Needs the operator's approval of the wording and, if wanted, counsel. **Recommendation:** say it in the AI disclosure line and the About panel before launch.
- **OD-8 Budget numbers.** A daily cap on searches (suggested 300) and a per-turn cap of one search. **Recommendation:** start at 300 per day and one per turn; raise on evidence.

## Non-goals

- No scrape, crawl, map, agent, interact, parse, monitor, research or developer-search tool for the visitor, now or through this change. A visitor can never make the system fetch an arbitrary URL.
- No full page content. Search returns title, URL and a short description only.
- No memory: `memory_enabled: false` stays pinned (D-5).
- No web search for the A2UI surface path; the answer card stays a passive header.
- No change to the kill switch, the meter schema or the session binding.
- No clickable web links (OD-5), no image results.

## Impact

- Exit evidence: server filter tests that fail when the whitelist is widened; client rendering tests for the Web label and unresolved markers; the live validator checks listed in `tasks.md`; a local real-model run (16.6.x); the FR-11 test updated to the new allowlist; security review passed.
- Deploy: image changes ship only in the operator-approved Train C; the agent definition ships through `site-content.yml` (`sync: agent`) after the operator merges the PR and dispatches it; the new service and UAR config ship with the k8s manifests. Interim PRs carry `[skip ci]`.
- Constraints: never touch the kill switch; the repository is public (commit equals publish), so no key, no key-bearing URL and no cluster hostnames beyond those already committed; no CopilotKit; pin official A2UI exactly.
- Decisions: D-11 in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/decision-log.md` records the answers and the toggle amendment (task 16.1.1, done).
