# 8. Functional specification

Owner: km-product-owner. Status: proposal, 2026-10-01. Inputs: sections 2, 4, 5, 6 and 7, the `uar-integration` plan, and the open OpenSpec changes.

Priority: **MUST** blocks the phase it belongs to (section 9). **SHOULD** ships in that phase unless a decision-log entry defers it. **COULD** ships only if time allows. "Trace" names the section that motivates the requirement. §8.12 maps every requirement to its phase and owning change.

## 8.0 Key constraints

These facts constrain every requirement below.

1. **Tool exposure.** The launch run policy is in the working tree: `uar/agents/knowme-site.json` sets `extensions["uar.run_policy"]` with tools `selected` and no ids, skills `none`, MCP servers `none` and `tool_approval: deny`. It was seeded to the local stack on 2026-10-01 and the agent record returns it. An empty selected list resolves to tools `none` at run admission (§4.7). UAR still registers `activate_skill` on every run and exempts it from tool selection, so the model is offered that one tool, and `effective_run_policy` cannot show it. `deny` is a required launch control and the only lock on `activate_skill`. No D-15 addition may switch approval to `auto` until UAR drops `activate_skill` when skills are `none`, or a test proves an `activate_skill` call under `auto` is rejected without hanging (§4.7, §6.2 T2).
2. **Token cost.** One local-stack run on 2026-09-30 reported 8,732 input tokens for "In one sentence, what is KnowMe?", with an empty knowledge base and `Auto` tool selection (the run predates the extension). Re-measured on 2026-10-01 as `knowme-site` under the launch run policy with the KB populated, three questions used 1,425 to 1,459 input tokens per turn, retrieved chunks included, with zero tool events, so `Auto` accounted for roughly 83% of the earlier figure (§4.8). UAR's agent RAG takes the top 3 chunks with score >= 0.7 (UAR `src/uar/runtime/manager.rs:3804`). Phase 0 measures the deployed agent again.
3. **Erasure.** UAR routes `/api/sessions` and `/api/sessions/{*path}` to a handler that returns 404, has no session delete and no session TTL, and has no read route for the tables involved. Visitor-linked data sits in `sessions`, `checkpoints`, `cost_ledger` and `tool_admission_evidence`, plus `memory` if it is ever enabled (§4.5). The Phase 0 default is an operator-scheduled purge of every store plus a published, request-based erasure process, each tested by a direct SurrealDB query. A per-conversation delete (FR-20) needs a UAR change and is conditional. The real cross-visitor read vector is `POST /api/chat/completion` with another visitor's `X-UAR-Session-ID` (FR-34).
4. **Routes the agent may name.** `/settings/about` is excluded from the site build (`src/App.tsx:33-50`, `use-site-config.ts:22`), and no `/about` or contact page exists. In Phase 0 the agent names no site routes; it offers the in-chat company topic. Route checks for FR-6 and FR-9 start in Phase 1, together with FR-23.
5. **Widgets cannot render today**, for five reasons. The client drops `agui.state.patch`. The client parses A2UI v0.8 names while UAR emits v0.9.1. The proxy strips `presentation_mode` and `client_rendering`, and the agent has `ui.artifacts.enabled: false`. UAR's nine catalog components include no link, URL, image or citation component. UAR publishes surfaces only through the `a2ui_render` and `presentation_render` tools, both gated by the `tools` selection, so any surface needs one of them on the allowlist and approval at `auto` (item 1). §8.10 states the sandbox allowlist.
6. **The §4.3 registry supersedes §5.4.** The v0.9.1 component registry (§4.3, FR-12, FR-13) replaces §5.4's `artifactType` catalog and its text fallback wherever they conflict.
7. **Launch scope.** The evidence in §1.2 and §1.3 argues against a site where conversation replaces content, and for a complete, crawlable site with a grounded agent layer on top. It shows no measured conversion lift for that layer. The case for the agent at launch is demo value at low cost, not measured lift. So Phase 1 is the public launch: prerendered pages plus a cited text concierge, with the DNS cutover as its last change. The widget and morphing demo ships only as an opt-in, labelled sandbox (FR-43) until the section 9 Phase 2 exit evidence exists. One public misbehaviour, in the concierge or the sandbox, is a brand incident for UAR as well as for the site, and it is a kill criterion (section 9).
8. **Phase 0 makes the site safe to deploy, not public.** Before Phase 0 exits: the launch run policy deployed and proven through the turn manifest; memory capture forced off by the proxy (memory is not enabled: default `false`, unset in config); internal artifacts dropped on the public path; UAR accepting only gate-minted tokens; the site server's reserve-and-settle token meter as the global spend ceiling, and a file-mounted kill switch; gate's external-authorization policies on the site's routes; HMAC-derived session binding on chat completion and resume; proxy error hardening and the `artifact-response` route removed; the `runtime.know-me.tools` route deleted and CI secrets moved out before the first deploy, plus a UAR NetworkPolicy; CSP and HSTS; KB chunking fixed; a fixed non-model AI disclosure label; the purge and request-based erasure with a privacy notice and a data-request contact; a citation-link allowlist; offline and 429 client states; a text-only golden set; red-team and pinning evidence.
9. **UAR authentication.** UAR keeps API keys only in memory (`InMemoryApiKeyStorage`, UAR `src/server.rs:1334-1335`), so a restart invalidates the site's key. Locally the site's requests then ran as `anonymous`, whose KB universe is empty; in the cluster they would get 401 permanently. By operator decision (2026-10-01) flint-gate is the auth layer for the know-me cluster: Envoy calls gate's check endpoint for each route (FR-47). The site server's call to UAR stays inside the cluster, so it obtains a short-lived gate-minted ES256 token for the site identity and calls UAR directly, and UAR verifies it through gate's JWKS (FR-46). UAR's ES256 verification is merged; the gate JWKS fix is being deployed, and gate has no check endpoint yet (§4.7). Gate never sees a run's usage, so the spend ceiling is the site server's token meter, not gate's budget (FR-36, revised 2026-10-02). No component issues per-visitor identities, so Phase 0 and 1 keep the shared principal and HMAC session binding (FR-34).
10. **Chunking.** Retrieval works (`text-embedding-v4`; the right document at score 0.917), but the KB's `Recursive { size: 512 }` chunker splits at periods inside version numbers and its 32- to 50-character fragments score highest. The agent then misses facts the corpus states and answers "v0" or "Obsidian 1.x" (§4.8). The text golden set waits on the fix (FR-8).

## 8.1 Entry experience

**FR-1 (MUST) Static first view.** Trace: 2.2, 5.2.
- Given a first-time visitor with an empty cache, when `/` loads, then the lockup, the tagline, the AI disclosure line, four entry chips and the composer are all in the initial HTML response. None of them depends on a network call after that response.
- The chips and the composer are React components, so a Markdown-to-HTML generator cannot satisfy this requirement. The prerender approach is a Phase 1 decision (section 9, `site-prerender-baseline`).

**FR-2 (MUST) Chips work without the agent.** Trace: 2.2, 2.8.
- Given JavaScript is disabled, when the visitor activates a chip, then the browser navigates to that chip's topic page, and that page passes FR-23.
- Given JavaScript is enabled and the agent is reachable, when the visitor activates a chip, then a thread starts with the chip text as the first message.

**FR-3 (MUST) Chat is never forced.** Trace: 2.9.
- Given any page, when it loads, then no modal opens, the composer does not take focus, and no content is gated behind a conversation.

**FR-4 (SHOULD) Cached chip answers.** Trace: 2.2, 4.8.
- Given a chip answer has already been generated for the current corpus version, when a visitor activates that chip, then the answer is served without a model call.
- Given the corpus is reseeded, when the seed job finishes, then every cached chip answer is invalidated.

## 8.2 Chat

**FR-5 (MUST) Pinned agent.** Trace: 4.2, 4.7, plan change 8.
- Given a request body that carries `agent_id=other` and `model=x`, when it passes through the proxy, then UAR runs `knowme-site` on the configured model.
- Given any `/api` path outside the audited set, when it is requested, then the response is 404 or 403 with a generic body.
- The audited set contains no route that UAR serves as disabled and no route the site does not use. `GET /api/sessions/{id}/messages`, `DELETE /api/sessions/{id}` and `POST /api/uar/runs/{run_id}/artifact-response` are removed from the proxy allowlist (§4.5, §4.7). A delete route is added only if FR-20's UAR change lands.

**FR-6 (MUST) Grounded answers or none.** Trace: 5.5, 4.6.
- Given a question whose retrieval returns no chunk with score >= 0.7, when the agent answers, then it says it does not know and offers the in-chat company topic or another question. It does not answer from model knowledge.
- Given an answer that makes a product claim, when it renders, then each claim carries a citation to a corpus file.
- In Phase 0 the agent names no site routes. From Phase 1, given any answer that names a site route, when the golden set runs, then the route is fetched from the deployed build and returns 200 under FR-23. After `/about` passes FR-23, the agent may offer `/about`.

**FR-7 (MUST) Status discipline.** Trace: 5.1, 2.9.
- Given a question about a feature the corpus marks planned, when the agent answers, then the answer says "planned" and gives no date unless the corpus states one.

**FR-8 (MUST) KB health gate.** Trace: 4.8.
- Given the seed job has run, when it finishes, then it reports a document count and an embedded-chunk count for KB `knowme-site`. If any document has zero chunks, the job exits non-zero.
- Given a document whose ingestion failed, when the seed job runs again, then it re-uploads that document. The seed script does this today (`scripts/seed-site-agent.sh`).
- Given the corpus is ingested, when its chunks are listed, then no chunk ends inside a version number ("v0.", "Obsidian 1."), and a question about The Boss's platforms retrieves the chunk from `the-boss.md` that states them (`kb-chunking-quality`, §4.8). The `site-agent-seed` gate and the text golden set run only after this passes.

**FR-9 (MUST) No invented paths.** Trace: 5.6(a), 4.6.
- Given a visitor asks how to contact the company, or where to read more, when the agent answers in Phase 0, then it names no site route and says there is no separate contact page. From Phase 1 it names only routes that pass FR-23 in the deployed build, or destinations stated in the corpus. A general contact method appears only after the operator records one (D-8).

**FR-10 (SHOULD) Stream resume.** Trace: 4.2.
- Given a dropped connection mid-turn, when the client reconnects with the run id and `Last-Event-ID`, then the proxy forwards both and the turn continues without duplicated text.
- The client reads the run id from `agui.stream.start.request_id`, because the proxy strips the `x-uar-run-id` response header.
- The resume request is bound to the visitor under FR-34. A resume carrying another visitor's run id gets no events.

**FR-11 (MUST) Allowlisted tools only, proven by the run's policy and manifest.** Trace: 4.7, 5.6(b), 6.2 T2.
- Given the seeded `knowme-site` agent, when a test reads the `effective_run_policy` and `turn_manifest` of a real public chat turn, then:
  - `tools.mode` is `none` or `selected`, and `tools.ids` set-equals the operator-approved list (D-15). `none` is correct exactly when the list is empty;
  - `skills.mode` and `mcp_servers.mode` are `none` unless their own lists are approved;
  - `tool_approval == deny` while the list is empty, and while the `activate_skill` precondition in §4.7 is unmet;
  - `turn_manifest.selected_tools` equals the allowlist plus `activate_skill`, and §6.2 T2 records `activate_skill` as reviewed and blocked by `deny`.
- The test fails on `auto`, `all` or `inherit`, on any id not on the list, and on any extra model-facing tool. The artifact text is not evidence: a malformed or misspelled key is dropped silently.
- The test reads the two artifacts through a proxy test harness that sees the upstream stream before the public-path filter (FR-45), or runs from the seed job if the NetworkPolicy admits it (OPEN QUESTION, §4.1). It does not call `GET /api/uar/runs/{id}` from outside the cluster.
- A tool joins the allowlist only with a security review entry in §6.2 T2 (owner km-security-officer): read-only or scoped to the visitor's own view, safe for anonymous use, input-validated, and within the turn budget.
- Given the tool-eliciting prompt set (part of the Phase 0 text golden set), when it runs against the deployed agent, then no tool executes: the stream carries no tool start or tool result event. A forced-call fixture makes the model call `activate_skill`, the one tool it is offered, and the stream carries `agui.tool_call.denied`. A test that only waits for a denial would pass on nothing if the model never called a tool, so the fixture is required.
- Given `agui.tool_call.denied` arrives in the stream, when it renders, then the client shows "Blocked by policy". It never shows as running or silently disappears. UAR already emits this event (`sse.rs:751`), so this needs only a client case.
- Given the Phase 2 sandbox path (FR-43), when its policy and manifest are read, then `tools.mode == selected` with exactly the sandbox allowlist (§8.10), `presentations.mode == selected` with named template ids, and `selected_tools` equals that list plus `activate_skill` unless UAR has dropped it. The public path still has exactly its own list.

## 8.3 Widgets and A2UI surfaces

Every requirement in this section applies to the opt-in sandbox (FR-43) only, until the operator records the sandbox graduation decision (D-11). The public path renders text with citations.

**FR-12 (MUST) Closed catalog.** Trace: 4.3, 4.4, 5.4.
- Given a surface message names a component outside the registered catalog, when the client renders it, then the client shows a non-executable "unsupported component" placeholder and no props.
- Given a registered component with props that fail its schema, when the client renders it, then nothing from that message renders and a `surface_rejected` event is counted.

**FR-13 (MUST) A2UI v0.9.1 projection in the dialect the client uses.** Trace: 4.2, 4.3.
- The client today requests `stream_mode: "dual"`. In that dialect the dotted `agui.state.patch` payload is `{kind, phase, request_id, patch}`, and `sequence` and `eventId` do not exist; they exist only in `agui_spec`. `site-surface-registry` records a decision-log entry choosing one of two paths, and this requirement is tested in the chosen dialect:
  - **Stay on `dual`.** Given UAR publishes `createSurface` and `updateComponents` under profile `uar.a2ui/1`, when the client receives the matching `agui.state.patch` events, then the surface renders through the registry. Patches apply in SSE arrival order, and an event whose SSE `id` was already applied (for example after a resume with `Last-Event-ID`) is not applied twice.
  - **Migrate to `agui_spec`.** The same, with patches applied in `sequence` order and a replayed `eventId` not applied twice. The migration covers every event the client consumes, not only surfaces, and FR-10, FR-11 and FR-30 are retested in the new dialect.

**FR-14 (MUST) Server-side negotiation.** Trace: 4.3.
- Given any chat request on the sandbox path, when the proxy forwards it, then the proxy sets `presentation_mode` and `client_rendering.a2ui_profiles` from server config. Values sent by the client are ignored. On the public path the proxy sets no presentation mode.

**FR-15 (MUST) The launch catalog.** Trace: 2.4, 4.4, 5.4. Eight widgets: `product-summary-card`, `comparison-table`, `status-list`, `platform-availability`, `download-link-card`, `faq-accordion`, `unpublished-notice`, `next-steps-card`.
- Given each widget, when it is rendered from a golden fixture, then every field shows a citation chip to a corpus file. In light and dark themes it uses only Flat 2.0 tokens (no border, shadow, gradient or blur), ember only for the action and cyan only for AI output.
- `download-link-card`, `next-steps-card`, any call-to-action card, and per-field citations need a link, URL or citation component. UAR's nine components have none. These widgets depend on an upstream UAR catalog change, or on a site catalog ID that UAR accepts (`site-a2ui-catalog-decision`). Until that lands, they are not built; the widgets that need no link component are built first.

**FR-16 (MUST) Link allowlist.** Trace: 5.4, 6.2 T4.
- Given a citation or a widget carries a URL, when it renders, then the URL must match a URL string in the corpus or a host on the site-owned allowlist. Otherwise it renders as plain text, not as a link.
- Citations come first, in Phase 0: `citation-block.tsx` renders any URL today. Widgets inherit the same check in Phase 2.

**FR-17 (MUST) No collection widgets.** Trace: 4.7, 6.2 T4.
- Given the catalog, when it is reviewed, then no component accepts password, payment, email or file input.

**FR-18 (SHOULD) Text first.** Trace: 5.3.
- Given a single-fact, yes/no, refusal or clarifying answer, when the surface golden set runs, then the agent emits text and no surface.

## 8.4 Per-visitor board and state

**FR-19 (MUST) Local-only board.** Trace: 2.4, 2.6, 4.5.
- Given a visitor pins a widget in the sandbox, when they reload, then the board shows the same widgets in the same order. The server stores nothing keyed on the visitor except the session-linked records that FR-33 purges. Memory capture is off (FR-41).

**FR-20 (MUST once UAR adds a session delete; not a Phase 0 gate) Visitor control.** Trace: 2.5, 2.6, 4.5.
- Given a pinned widget, when the visitor unpins or reorders it, then the board updates immediately. Undo restores the previous state within the same view. This part ships with the sandbox in Phase 2.
- Given "Start fresh", when confirmed, then local threads and the board are cleared.
- Given UAR has added a session delete that covers every store in §4.5, and "Delete conversation" is confirmed, then the proxy deletes the current session's server-side records through that delete, keyed by the FR-34 derived session. It does not call `/api/sessions`. A test then queries SurrealDB directly and finds no rows for the session in `sessions`, `checkpoints`, `cost_ledger`, `tool_admission_evidence` or `memory`.
- Until that UAR change lands, the control is not shown, and the privacy notice offers the request-based erasure process instead (FR-32, FR-33).

**FR-21 (MUST) Pin only on request.** Trace: 2.9.
- Given a turn the visitor started, when a surface is pinned, then the thread shows a receipt ("Pinned: <widget>") with Undo. No surface is pinned without a visitor turn before it.

**FR-22 (MUST) Fixed frame.** Trace: 2.5.
- Given any surface message, when it renders, then it appears only inside the marked agent region. Header, spine, disclosure, footer and topic pages are unchanged.

## 8.5 Crawlable pages

**FR-23 (MUST) Prerendered topics.** Trace: 2.5, 4.6, 7.2.
- Given a crawler that does not run JavaScript, when it fetches `/`, `/knowme`, `/knowme/privacy`, `/the-boss`, `/ipfs-sync`, `/faq`, `/status` and `/about`, then each returns 200 with its body content, a unique title and description, and a self-canonical URL.
- `/about` does not exist today. It is a Phase 1 deliverable (`site-about-page`).

**FR-24 (MUST) One source.** Trace: 2.7, 7.2.
- Given a fact the agent can state, when its corpus file is checked, then the same fact appears on a prerendered page generated from that file.

**FR-25 (SHOULD) Sitemap and structured data.** Trace: 7.2.
- Given a build, when it completes, then `sitemap.xml` lists every topic page and `robots.txt` references it. JSON-LD validates (`Organization`, `WebSite`, `SoftwareApplication` with no `offers`, `FAQPage`, `BreadcrumbList`) and describes only visible content.

**FR-26 (COULD) llms.txt** generated from the same page list. Trace: 7.2.

## 8.6 Fallbacks

**FR-27 (MUST, Phase 0) Agent offline.** Trace: 2.8, 4.8.
- Given UAR is down, the spend ceiling is reached, or the kill switch is on, when the visitor opens the composer, then a static notice says the agent is offline and points to the pages, and chips still navigate. In Phase 0, before topic pages exist, the notice points to the landing page content that does exist.

**FR-28 (MUST, Phase 0) Rate limit.** Trace: 2.8, 4.8.
- Given a 429, when the client receives it, then it shows a plain message with the wait time if the proxy supplied one. The thread stays usable.

**FR-29 (MUST) No raw errors.** Trace: 2.8, 5.7.
- Given a stream failure mid-answer, when it is shown, then the partial answer is marked incomplete with Retry. No runtime error text appears as assistant text.

**FR-30 (SHOULD) Runtime signals.** Trace: 4.2.
- Given `agui.budget.alert`, `agui.guardrail` or `agui.cancelled`, when received, then each renders a specific, visible state. None is dropped.

## 8.7 Disclosure and privacy

**FR-31 (MUST) Fixed AI label.** Trace: 6.3, Art. 50(1) and (5).
- Given any page with a composer, when it renders, then a static, non-model label identifies the agent as AI and says answers may be wrong, before the first token. Every agent message carries `data-ai-generated="true"`.

**FR-32 (MUST) Privacy notice.** Trace: 6.3, 6.4 items 8 and 9.
- Given the composer or the footer, when the visitor follows the privacy link, then the notice names the processor (Alibaba Cloud), the transfer destination (Singapore), the retention period (D-5), what is stored server-side (the stores in §6.3; no memory, per FR-41), the request-based erasure process, and the data-request contact (D-8). The notice passes the operator approval gate (`docs/content/reviews/<piece-id>.md`) before it is placed. It states only what FR-33 and FR-41 have been shown to do, and mentions a delete control only if FR-20 has shipped.

**FR-33 (MUST) Retention and request-based erasure.** Trace: 4.5, 6.3.
- Given a site session older than the retention period (30 days unless the operator sets a shorter one, D-5), when the operator-scheduled purge runs, then that session's rows are gone from `sessions`, `checkpoints`, `cost_ledger` and `tool_admission_evidence`, and from `memory` if memory is ever enabled.
- Given an erasure request for a named session, when the operator runs the published process, then the same rows are gone for that session.
- Given either has run, when a test queries SurrealDB directly for the test session in each store, then it finds nothing. UAR has no read route for these tables, so the test does not go through UAR.

**FR-34 (MUST) Session binding.** Trace: 4.7, 6.2 T5.
- The proxy issues a signed, HttpOnly, Secure, SameSite=Lax first-party cookie holding a random visitor id. It never forwards the client's `X-UAR-Session-ID` upstream. It derives the upstream session id as `HMAC-SHA256(secret, cookie_id ‖ thread_id)`, formatted as a UUID. This is stateless, so it works across replicas with no shared map.
- The derivation applies to chat completion and stream resume, and to the FR-20 delete route if that ships. It does not depend on the erasure work.
- `artifact-response` is not routed (FR-5). If the Phase 2 action route brings it back, it is accepted only with a signed run token bound to the cookie; that binding is a Phase 2 exit criterion.
- Given an `X-UAR-Session-ID` (the thread id) that is not a UUIDv4, when it reaches the proxy, then the proxy returns 400.
- Given visitor A's cookie and visitor B's thread id, when A sends a chat completion or a resume, then UAR sees an upstream session id that is not B's. No message, memory or run of B is read, changed or resumed. A two-visitor test proves this for each route, with the proxy running two replicas.
- Rotating the HMAC secret orphans every server-side session. That is acceptable, because the local thread history stays and the purge deletes the orphans.
- All visitors stay one UAR principal in Phase 0 and 1: no component of the stack issues guest identities, and gate's `anonymous` provider uses one fixed subject. A per-visitor `sub` minted by gate is a Phase 2 spike (`visitor-identity-via-gate`, §4.5).

**FR-35 (SHOULD) Sensitive-data hint.** Trace: 6.2 T12.
- Given the composer, when it renders, then a hint asks the visitor not to share sensitive personal details.

**FR-41 (MUST, Phase 0) Memory capture off.** Trace: 4.5.
- UAR memory is not enabled (default `false`, unset in config). If it is ever enabled, `memory_enabled` and `auto_capture` default to true, and extracted memories are stored under `user_id=knowme-site`. Given a public chat turn, when it runs, then the effective run policy has memory disabled, because the proxy injects `memory_enabled: false`; the artifact's `memory.conversation.enabled` does not gate capture (§4.5).
- Given a scripted five-turn session, when it finishes, then a direct SurrealDB query finds no new memory rows for `user_id=knowme-site`.

## 8.8 Admin and operations

**FR-36 (MUST) Spend ceiling and kill switch.** Trace: 4.8, 6.2 T1. The authoritative design and tests are in `openspec/changes/site-spend-ceiling/tasks.md`.
- The site-wide ceiling is the site server's reserve-and-settle meter (revised 2026-10-02; §4.8). Before forwarding a turn, the site server atomically reserves the per-turn reservation size against the daily and monthly token counters (rows per UTC period, created on first use) in SurrealDB `site/meter`, in one transaction, and refuses the turn if either would exceed its D-3 budget. The run's `agui.done` settles the reservation to the actual `usage.total_tokens`; a run that never reports usage keeps its full reservation. The site server forces `stream: true` and `stream_mode: dual`. The total is shared across the site server's replicas and survives a rollout. A monthly token budget on the same meter enforces the D-3 monthly cap until the model has a catalog price. Feeding the meter to gate's `max_token_budget` is optional (D-4). The site server's per-IP limiter stays as the first layer.
- Given the daily budget would be exceeded by the next turn's reservation, when the turn arrives, then no model call is made for it and the proxy returns the offline state (FR-27).
- Given the meter store is unreachable, when a turn arrives, then it is refused with the offline state (fail closed).
- Given the daily total reaches 80% of the budget, and again at exhaustion, then an alert fires through the same channel as the provider-side spend alert.
- Given N concurrent turns at the budget boundary, when they are reserved, then only turns whose reservations fit are forwarded, and any overshoot equals the recorded excess of runs that exceeded their reservation.
- Given the first turn of a new UTC day or month, when it is reserved, then the new counter row is created on first use and the turn is admitted if it fits. A `stream: false` request and a `stream_mode: agui_spec` request are each metered.
- Title-generation requests are a second model call. They go through the same site server, so the same meter counts them.
- The site model's `max_output_tokens` is set in UAR settings; the agent policy has no `max_tokens` key.
- A run cancelled by a disconnect has already billed its input (UAR `manager.rs:701-727`). The meter keeps such a run's full reservation, so it is counted at its maximum (§4.8).
- Given the operator changes the kill switch in its ConfigMap, when the mounted file updates, then within 60 seconds every replica returns the offline state, with no redeploy and no pod restart. An environment variable does not pass.

**FR-37 (MUST) Runtime host closed.** Trace: 4.1, 6.2 T6.
- The `runtime.know-me.tools` HTTPRoute is removed from the manifests, and the lockdown lands before the first deploy of the `knowme` namespace. Removing a manifest does not delete a live route (the deploy has no prune and its Role has no `delete`), so if a route has ever been applied it is deleted explicitly with operator credentials. Once a route attaches, the host serves `/metrics` and `/admin`.
- Given a request from the internet to `runtime.know-me.tools`, when it arrives, then no UAR endpoint answers (`curl` shows no route, or a refusal, recorded in the change). If the operator decides the host is needed (D-7), it sits behind a fail-closed gate policy instead (FR-47).
- A NetworkPolicy admits only `knowme-web` and flint-gate to `uar:6565`. Whether the seed job also needs direct access is an OPEN QUESTION (§4.1).
- The CI steps that call `runtime.know-me.tools` (`.github/workflows/site.yml`, the `/readyz` and `/api/agents` checks) are rewritten to run inside the cluster or against the proxy.

**FR-38 (MUST) Per-turn usage record.** Trace: 4.9.
- Given a completed or cancelled turn, when it ends, then the server records the model, input tokens, output tokens, time to first token and the outcome. The record holds no session ID and no message text.
- The local baseline the records are compared with is 1,425 to 1,459 input tokens per turn, measured on 2026-10-01 under the launch run policy with the KB populated (§4.8).

**FR-39 (SHOULD) Counters.** Trace: 4.9. Turns, 429s, upstream errors, stream duration, `agui.tool_call.denied` by tool name, policy regressions, `presentation_output_ceiling` and `a2ui_publication_rejected` counts are exposed as Prometheus metrics.

**FR-40 (SHOULD) Cookieless analytics.** Trace: 6.3, 7.4.
- The section 7.4 event set fires with no third-party pixel and no device storage that counsel has not cleared.
- No experiment bucket is assigned until counsel decides (D-10). `sessionStorage` and `localStorage` are both device storage under ePrivacy Art. 5(3), so neither is assumed consent-free. Server-side assignment is an option, but it must not reuse the FR-34 binding cookie, which exists for session security.

**FR-42 (MUST, Phase 0) Proxy error discipline.** Trace: 4.7, 6.2 T15.
- Given UAR returns a non-2xx status, when the proxy relays it, then the visitor gets a generic error body mapped through `AppError`, never UAR's body. Upstream 5xx responses are logged with status and route, without the session id or the body. Today `upstream.rs:58-63` passes status and body through as-is, and upstream 5xx appears only in `TraceLayer`'s INFO response line.
- The `artifact-response` route is removed (FR-5).
- No route forwards the client's query string unless the parameter is on that route's allowlist.

**FR-45 (MUST, Phase 0) Internal artifacts stay internal.** Trace: 4.2, 6.2 T15.
- Given a public-path stream, when UAR emits an `agui.artifact` whose `artifact_type` is `effective_run_policy` or `turn_manifest`, then the proxy drops it, and the client never receives it.
- FR-11 reads these artifacts in its test harness or from the seed job, not from the public stream.

**FR-46 (MUST, Phase 0) UAR accepts only gate-minted tokens.** Trace: 4.1, 4.7, 6.2 T6.
- The site server obtains a short-lived ES256 JWT from flint-gate, with `sub` = the site identity (the principal that owns the agent and the KB) and `aud` = `uar`, and calls UAR directly inside the cluster. Its gate credential is in Secret `site-proxy`. Which gate path issues the token, `/oauth/token` client credentials or token exchange from the database-backed gate API key, is an OPEN QUESTION settled in `gate-site-credentials`.
- UAR verifies tokens through gate's JWKS (`UAR_SECURITY__JWKS_URL`, with `UAR_SECURITY__JWT_ISSUER` `https://gate.know-me.tools` and `UAR_SECURITY__JWT_AUDIENCE` `uar`). With `jwks_url` set, verification is JWKS-only.
- Given UAR restarts, when the next chat turn arrives, then it authenticates as the site identity, the run sees KB `knowme-site` (at least one knowledge base available), and it never runs as `anonymous`.
- Given a request to UAR without a gate-minted JWT, with an HS256 token signed with UAR's own secret, or with a JWT whose issuer or audience differs, when it arrives, then UAR returns 401.
- Given the seed job runs, when it calls UAR, then it authenticates with a gate token for its seed identity.
- Given the site server's configuration and the seed script, when they are inspected, then neither holds nor mints a UAR API key (`POST /api/uar/auth/keys`).
- Preconditions, each a Phase 0 change: UAR's ES256 verification in a pinned image (`uar-jwks-es256`, merged as #321); the deployed gate JWKS publishes `crv`, `x` and `y` (`gate-ec-jwks-deploy`); the site and seed identities exist in gate (`gate-site-credentials`).

**FR-47 (MUST, Phase 0 for the knowme routes) Route policies through flint-gate.** Trace: 4.1, 4.7.
- Each HTTPRoute that gate guards has a SecurityPolicy in know-me-cluster that sends an `extAuth.http` check to gate, with a timeout of about 200 ms. On allow, gate injects `Authorization: Bearer <gate-minted ES256 JWT>` for the upstream and strips client-supplied auth headers.
- Given gate is down, when a visitor requests `know-me.tools` or `www.know-me.tools`, then the site still serves (anonymous-allow, `failOpen: true`).
- Given gate is down, or the request carries no valid credential, when it reaches a protected route (`runtime.know-me.tools` if D-7 keeps it; later `api.know-me.tools` and `rt.know-me.tools`), then Envoy refuses it (`failOpen: false`).
- Argo CD is never routed through the gateway or a gate policy; port-forward reaches it while gate is down.
- Given a SecurityPolicy must come off in an emergency, when the operator follows `docs/break-glass-securitypolicy.md` in know-me-cluster (suspend auto-sync for the Argo app, or revert the policy commit and sync, then delete the policy), then the policy stays deleted and the route serves.
- Precondition: gate's check endpoint exists (`gate-ext-authz-endpoint`).

**FR-43 (MUST, Phase 2) Widget sandbox is opt-in and labelled.** Trace: 1.4, 2.4, section 9 Phase 2 exit.
- Given a visitor on the public site, when they use the composer, then they get the text concierge. Widgets render only after an explicit opt-in (a separate, `noindex` sandbox entry point), under a visible label that says the widget board is experimental.
- The sandbox uses the same proxy, spend ceiling, session binding, link allowlist and kill switch as the public path. It has its own kill switch, so it can close while the text concierge stays up.
- The opt-in does not protect against developers, who are the visitors most likely to open it. A sandbox misbehaviour is a brand incident under kill criterion 2, like any other.
- Graduation from sandbox to default is operator decision D-11, taken only on the evidence listed in section 9's Phase 2 exit.

**FR-44 (MUST, Phase 1) One handoff definition.** Trace: 7.4.
- `handoff_clicked` fires when a visitor activates a link to any destination on the handoff list, from any surface: topic page, chip answer, chat answer or widget. The list is fixed in the decision log before Phase 1 baseline collection starts. At launch it holds one target, The Boss's GitHub releases link; product links and a general contact method (D-8) are added only by a decision-log entry, and never during a running experiment. The definition is identical for every experiment arm. An event defined "out of the chat flow" does not pass, because it counts near zero in the static arm by construction.

## 8.9 Non-functional requirements

| Area | Requirement | How it is checked |
|---|---|---|
| Static performance | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 at p75 on mobile for `/` and every topic page. Landing initial JS < 150 KB gzipped; PGlite and the chat runtime load after first paint. | Lighthouse CI on the prerendered build. Current bundle size is unmeasured. |
| Time to first token | p50 <= 2.0 s and p95 <= 5.0 s, measured at the proxy from request accepted to the first `agui.message.delta`. This is a target to confirm against the Phase 0 re-measurement and the Phase 1 baseline, because the run context sets the floor. | FR-38 records. |
| Widget render (sandbox) | A surface renders within 200 ms of its last patch on a mid-tier phone. | Playwright trace. |
| Availability | Static pages 99.5% monthly, and they keep serving when UAR is down. Chat 99% monthly, excluding deliberate kill-switch time. | Uptime probe on `/` and `/readyz`, run from inside the cluster or through the proxy (FR-37). |
| Accessibility | WCAG 2.2 AA. Streamed text is **not** placed in a live region. A single polite status region announces the turn state once ("The KnowMe agent is answering", then "Answer ready" or the error state), not per token. The finished message is reachable and readable in the thread. Every widget is keyboard-operable with visible focus and targets of at least 24×24 px. Status is never shown by colour alone. Reduced motion removes the pin animation. | axe in CI plus a manual keyboard and screen-reader pass per release, including one streamed turn with a screen reader. |
| Cost | A daily token budget and a monthly token budget, both set by the operator (D-3), recorded in the decision log and enforced by the site server's reserve-and-settle meter (revised 2026-10-02). The monthly budget stands in for a cost cap until the model has a catalog price. Cost per conversation is reported weekly. | FR-36, FR-38. |
| Security | Every section 6.4 checklist item has evidence from the change mapped to it in section 9. CSP enforced after a week in report-only mode with zero violations. HSTS and `Permissions-Policy` present on a live `curl -I`. Images pinned by digest and actions pinned by SHA (`ci-supply-chain-pins`). Signing secret, admin key and database password out of CI (`ci-secrets-out`). | Section 6.4 evidence file. |
| Quality, text | Text golden set (5.8), built in Phase 0: >= 18/20 on groundedness and on citation, zero fabrications on the pricing and contact items, zero executed tools on the tool-eliciting items, the `activate_skill` forced-call fixture denied, and zero links outside the allowlist. Run before every agent or corpus release, at Phase 0 exit and before the DNS cutover. | Eval run recorded in the change. |
| Quality, surfaces | Surface golden set, built in Phase 2: text-first items, surface-choice items and an injection set. | Eval run recorded in the change. |

## 8.10 Out of scope

- Accounts, sign-in and cross-device continuity.
- Long-term memory of a visitor, server-side visitor profiles, and UAR memory capture for this agent (FR-41).
- The demo plugin (2.4), and any third-party or remotely loaded plugin code.
- Prices, tiers, roadmap dates and claims about unreleased features, until the operator decides them.
- Collecting email or other personal data inside the chat.
- Any tool for `knowme-site` that is not on the operator-approved allowlist (D-15), and Auto or All selection on any path (FR-11).
- Any `tool_approval` value other than `deny` before the `activate_skill` precondition in §4.7 holds.
- **Sandbox allowlist.** UAR publishes A2UI surfaces only through tools, and both surface tools are gated by the `tools` selection. The Phase 2 sandbox path's allowlist includes `presentation_render`; `a2ui_render` is a separate candidate. Each is a normal allowlist member with its own §6.2 T2 review entry. No Auto, no All. It is enabled only in the sandbox, only after `site-a2ui-catalog-decision` is recorded and the `activate_skill` precondition holds, and FR-11 proves each path's list.
- A captcha or challenge on first load.
- Localisation, and voice input or output.
- Changes to the Tauri desktop shell for the site.
- Personalising what one visitor sees based on another visitor.
- Per-visitor identities and per-visitor budgets in Phase 0 and 1. Every visitor is the one site principal until the Phase 2 spike `visitor-identity-via-gate` (§4.5) shows otherwise.

## 8.11 The uncomfortable part

The launch gate rests on one setting. With tools `none`, the model is still offered `activate_skill`, and `tool_approval: deny` is the only thing that stops it. The same setting means no allowlisted tool can run, so every widget requirement in 8.3 waits on a UAR change or a test we have not written. The fastest way past a red gate would be to loosen `deny`, and FR-11 exists to fail if anyone does.

Erasure in Phase 0 is an operator purge and an operator answering requests, not a button. The privacy notice must say exactly that, and FR-20 stays conditional on a UAR change whose date is not ours.

Half of the MUST requirements in 8.3 and 8.4 depend on further decisions that are not ours. UAR's catalog has no link, URL, image or citation component, so the download, next-steps and CTA widgets and the per-field citations need a catalog change from UAR maintainers. If the catalog change does not land, FR-12 through FR-22 collapse to "text with citations". The site then has no morph, and the theory has nothing to test. Phase 1 alone is the product in that case, and it is a complete one.

## 8.12 Requirement to phase map

| Phase | Requirements | Owning change (section 9) |
|---|---|---|
| 0 | FR-5 | `site-chat-proxy`, `site-proxy-hardening` |
| 0 | FR-6, FR-9 (no site routes named) | `site-agent-prompt-fixes` |
| 0 | FR-7 | `site-agent-prompt-fixes`, checked by `site-agent-eval-text` |
| 0 | FR-8 | `site-agent-seed`, `kb-chunking-quality` |
| 0 | FR-11 (policy and manifest test, `activate_skill` fixture, "Blocked by policy") | `site-agent-tool-allowlist`, `site-chat-offline-states` |
| 0 | FR-16 (citations) | `site-citation-link-allowlist` |
| 0 | FR-33 | `site-session-erasure` |
| 0 | FR-27, FR-28 | `site-chat-offline-states` |
| 0 | FR-31, FR-35 | `site-ai-disclosure-label` |
| 0 | FR-32 | `site-retention-and-privacy` |
| 0 | FR-34 | `site-session-binding` |
| 0 | FR-36, FR-38 | `site-spend-ceiling`, `gate-site-credentials` |
| 0 | FR-37 | `uar-runtime-host-lockdown` |
| 0 | FR-41 | `site-agent-tool-allowlist` |
| 0 | FR-42 | `site-proxy-hardening` |
| 0 | FR-45 | `site-proxy-artifact-filter` |
| 0 | FR-46 | `uar-jwks-es256`, `gate-ec-jwks-deploy`, `gate-site-credentials` |
| 0 | FR-47 (knowme routes) | `gate-ext-authz-endpoint`, `cluster-extauthz-policies` |
| 0 | NFR quality, text | `site-agent-eval-text` |
| 0 | NFR security | `site-security-headers`, `ci-supply-chain-pins`, `ci-secrets-out`, `site-redteam-prompts` |
| 1 | FR-1 to FR-4 | `site-prerender-baseline`, `site-entry-chips` |
| 1 | FR-6, FR-9 (route checks, `/about`) | `site-about-page`, `site-agent-prompt-about-link` |
| 1 | FR-10 | `site-stream-resume` |
| 1 | FR-23 to FR-26 | `site-prerender-baseline`, `site-topic-pages-content`, `site-about-page`, `site-seo-metadata` |
| 1 | FR-29, FR-30 | `site-chat-failure-states` |
| 1 | FR-39 | `site-turn-metrics` |
| 1 | FR-40, FR-44 | `site-analytics-events` |
| 2 | FR-11 (sandbox path), FR-14, FR-43 | `site-proxy-presentation`, `site-widget-sandbox` |
| 2 | FR-12, FR-13 | `site-surface-registry` |
| 2 | FR-15 to FR-17 (widgets) | `site-widget-catalog-cards`, `site-widget-catalog-tables` |
| 2 | FR-18 | `site-surface-eval` |
| 2 | FR-19 to FR-22 (board; FR-20 delete control only if UAR adds a session delete) | `site-visitor-board` |
| 2 | Per-visitor identity (spike, no FR until it reports) | `visitor-identity-via-gate` |
