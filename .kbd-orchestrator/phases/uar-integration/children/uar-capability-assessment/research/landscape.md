# External landscape: runtime capabilities for a public, website-embedded concierge agent

Phase: uar-integration / child uar-capability-assessment, Assess stage, external-landscape input.
Date: 2026-10-02. Author: research subagent (deep-research skill plus direct Firecrawl retrieval).
Scope: what a production, anonymous-visitor, KB-grounded concierge agent on a corporate site needs from its runtime, and how current platforms supply it. Extends `docs/agent-led-site/agent-led-site.md` §3 (which covers user behaviour, SEO/AEO, cost, law and protocol maturity) toward runtime capabilities. It does not repeat §3.

## Method and evidence quality

- A `deep-research` job (`job-1790935745-f2690f34`, depth deep) was started on the local `prometheus-research` daemon. Its job record caps `max_sources` at 10, the same cap that left the prior package thin. The findings below therefore come mainly from direct Firecrawl search and scrape (about 40 searches, 8 targeted page extractions), all on 2026-10-02.
- Every citation below was retrieved in this session. "Accessed" is 2026-10-02 for all. Publication or "last updated" dates are given where the page showed one; "n.d." means no date was visible.
- Strength labels: **Primary** = vendor docs, spec, statute or official guidance. **Peer-reviewed / preprint** = academic. **Vendor claim** = a company reporting its own result. **Secondary** = analysis or blog by a third party. **Community** = forum post.
- **Unverified** marks a claim whose exact wording came from an automated page extraction (Firecrawl `query` mode) or from a search excerpt, not from reading the full page.

---

## 1. Anonymous / guest session identity, binding, rate limiting, abuse

**Findings**

1. **Hosted chat products mint a short-lived, per-visitor session credential server-side and scope it to a free-form end-user ID.** OpenAI ChatKit's `sessions.create` takes a `user` string ("identifies your end user; ensures this Session can access other objects that have the same `user` scope"), a `workflow`, `rate_limits` and `expires_after`. The extracted defaults are 10 requests/minute and a 10-minute client-secret expiry (max 600 s). The reference example also shows `max_requests_per_session: 500` [L1]. *Unverified: the default values came from automated extraction.* Pattern: the site's server holds the API key; the browser holds only a short-lived token bound to a visitor ID.
2. **Platforms key state on a caller-supplied session ID plus a separate actor or user ID, and leave it to the integrator to issue that ID.** AgentCore Runtime gives each `runtimeSessionId` its own microVM [L2][L3]. AgentCore Memory scopes events by `actorId + sessionId` [L8]. ADK/Agent Platform sessions are keyed by `app_name`, `user_id` and `session_id` [L14]. Mastra uses `resource` and `thread` [L27]. LangGraph stamps an `owner` into resource metadata in an `@auth.on` handler and returns that owner as a filter on every read [L13]. None of them issues anonymous identities. That is the integrator's job everywhere.
3. **Use pseudonymous, pairwise subjects in tokens.** AWS warns that JWT inbound authorization logs some claims, including `sub`, to CloudTrail. It recommends a GUID or pairwise identifier instead of PII [L4]. This is directly relevant to a gate-minted visitor JWT.
4. **For anonymous sign-up, the reference pattern is CAPTCHA plus rate limits plus scheduled cleanup.** Supabase "strongly recommend[s]" invisible CAPTCHA or Cloudflare Turnstile on anonymous sign-ins, and documents a SQL purge of anonymous users older than 30 days [L67].
5. **Per-IP rate limiting is not enough against inference theft.** Vercel describes a real attack on its own AI endpoint: "hundreds of thousands of bot requests over two days", where "standard per-IP rate limits had nothing useful to act on". Its answer is per-request bot verification (BotID) on the AI route, with an allowlist for verified agents [L29][L30]. Vercel sells BotID, so this is a vendor claim, but the attack description runs against the vendor's own rate-limit product [L31]. Cloudflare Turnstile offers a comparable pre-clearance cookie for fetch-style API calls [L36].
6. **Shared principal vs. per-visitor identity.** Every framework surveyed assumes a distinct `user`/`actor`/`owner` per human when it scopes memory and access [L1][L8][L13][L14][L27]. Running all visitors under one principal (KnowMe Phase 0/1, §10 U7) works only if the runtime offers no cross-session memory or session listing to that principal. Otherwise one visitor can reach another's data through the shared owner. This is an inference from the scoping models above, not a documented incident.

**Site-specific vs. general.** Issuing anonymous IDs, bot challenges and edge rate limits are site/edge concerns. *Accepting* a verified principal plus a session ID, and enforcing owner scoping on every session read, is a general runtime capability that UAR must provide for desktop and mobile as well.

## 2. Session lifecycle: deletion, TTL, retention, erasure

**Findings**

1. **Every surveyed platform has a per-session delete, and most have TTL.**
   - Google Agent Platform sessions: "All sessions must have an expiration time. The session and its child events are automatically deleted" when it passes. Set via `ttl` or `expire_time`. Explicit `delete_session(app_name, user_id, session_id)` [L14]. Memory Bank adds TTL on memories [L15].
   - LangGraph Platform: `checkpointer.ttl` with `strategy: delete`, which removes the thread with all runs and checkpoints on an absolute timer, or `keep_latest`, a sliding window that prunes old checkpoints. Per-thread TTL is set at thread creation. Store items have a separate TTL with `refresh_on_read` [L11]. Community reports say `delete` TTL is not sliding and does not apply retroactively [L11][L12].
   - AgentCore: idle session timeout (default 900 s), max lifetime (default 8 h), `stop_runtime_session` [L2][L3]. Memory events expire after a configured `event-expiry-duration` in days [L8].
   - OpenAI Agents SDK: `session.clear_session()` on every backend. `EncryptedSession` and `DaprSession` take a `ttl` [L18]. *Unverified detail from extraction.*
   - Cloudflare Agents: each agent instance is a Durable Object with its own SQLite store, and `this.destroy()` drops it. `AIChatAgent` supports `maxPersistedMessages` [L35].
2. **Provider-side retention is a separate layer and survives app-side deletion.** OpenAI keeps API abuse-monitoring logs "for up to 30 days" by default unless Zero Data Retention applies [L19]. A runtime-level delete therefore does not erase what the model provider holds. The KnowMe equivalent is Alibaba's retention terms (§6.4 of the strategy doc, still unverified).
3. **Regulators expect deployers of public chatbots to do more.** EDPB Opinion 28/2024 covers models and deployment, and reminds controllers that Art. 21 objection and erasure rights apply [L60]. A law-firm reading adds that an external-facing public chatbot "may require" more testing than an internal one [L61]. Neither text sets a retention period for chat logs. That remains a controller decision (FR-32/33 in the strategy doc).
4. **Where telemetry carries content, deletion has to cascade to traces.** AgentCore Evaluations needs message content stored alongside spans in the agent's log group [L9]. OTel GenAI conventions make content capture opt-in [L39]. So a "delete my conversation" request must reach the trace store too, or content capture must stay off for anonymous traffic. This is an inference from L9 and L39.

**General vs. site-specific.** Session delete, TTL and an erasure cascade across checkpoints, memory and traces are **general runtime** capabilities. Every platform above ships them, and UAR does not (§10 U2). The retention *values* are site policy.

## 3. Cost control: budgets, ceilings, metering

**Findings**

1. **Gateways enforce spend, not just request counts.** Cloudflare AI Gateway spend limits "track actual dollar cost per request based on model pricing". They can be scoped per user, for example "$200/day per user, cap total gateway spend at $10,000/day", up to 20 rules per gateway. Spend limits shipped 2026-06-05 [L33][L34].
2. **LiteLLM** has budgets per key, team, end-user ("customer") and agent: `max_budget`, `budget_duration`, `tpm_limit`, `rpm_limit` and `max_end_user_budget_id`, a default budget applied to any unknown end user. Exhaustion returns HTTP 429 `budget_exceeded` [L63][L64]. Limits are enforced across replicas through Redis [L64]. That is the property §10 U6 says flint-core lacks.
3. **Envoy AI Gateway, now "Agent Router" under the Agentic AI Foundation as of 10 September 2026 [L66], charges tokens after the response completes.** It extracts `usage` from OpenAI-schema responses into metadata (`llm_input_token`, `llm_output_token`, `llm_total_token`, CEL-computed costs). It debits a global rate-limit bucket keyed on a header such as `x-user-id`, and checks the bucket before admitting the next request [L65]. Two details matter for KnowMe. A `QuotaPolicy` caps cumulative consumption separately from velocity. And `limit.fromMetadata` lets an **ext_authz** filter supply the per-tenant limit on each request [L65]. This maps directly onto the flint-gate ext_authz design (§10 U4, U18). One caveat: the usage it reads comes from OpenAI-schema LLM responses, not from an AG-UI SSE stream.
4. **The runtime must emit usage per run so something can meter it.** AG-UI 1.0 (30 Sept 2026) lists "token usage" and message `metadata` among its new features [L40][L41]. *Field names unverified.* The Vercel AI SDK exposes per-step and total `usage` in `onStepEnd` and `onFinish` [L32]. OTel defines `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` and a `gen_ai.client.token.usage` metric [L38].
5. **Per-session caps at the agent layer.** ChatKit has per-session request caps [L1]. The OpenAI Agents SDK has `max_turns` and raises `MaxTurnsExceeded` [L17]. OWASP LLM10:2025 "Unbounded Consumption" names denial of wallet as a top-10 risk [L52].

**Implication for U18 (inference, not tested).** If the gate cannot see tokens at ingress, there are two architectures. (a) UAR enforces an agent-scope or session-scope token budget itself and publishes usage events that gate consumes. (b) Put a token-metering gateway (Agent Router or LiteLLM) on UAR's *egress* to the model provider, keyed on a principal header UAR forwards. Option (b) gets proven metering without UAR changes, but only if UAR forwards a stable per-session or per-principal header on its LLM calls. That is unverified for UAR.

**General vs. site-specific.** Emitting usage per run and enforcing per-principal and per-session caps are **general**. Desktop, mobile and other products need them too. Ceiling values, the kill switch and the static fallback are **site-specific**.

## 4. RAG quality for small curated corpora

**Findings**

1. **For very small corpora, full context can beat retrieval.** Anthropic (19 Sept 2024): "If your knowledge base is smaller than 200,000 tokens (about 500 pages of material), you can just include the entire knowledge base in the prompt ... with no need for RAG", made cheap by prompt caching [L56]. Above that size, contextual embeddings plus contextual BM25 cut top-20 retrieval failures by 49% (5.7% to 2.9%), and adding a reranker cut them by 67% (to 1.9%) [L56]. Anthropic sells the model that does this, but the numbers are its own internal benchmark.
2. **Semantic chunking does not reliably beat structure-aware recursive chunking.** A July 2026 preprint found cluster-based semantic chunking "did not outperform simpler strategies" on academic texts at 150-word chunks [L57]. A practitioner summary of a chunking benchmark reports that recursive splitting at 200–400 tokens with no overlap "performed consistently well" and beat an 800-token/400-overlap default [L58]. *Secondary report of a third-party study.* A clinical-domain paper reports the opposite, semantic chunking "significantly superior" to fixed-size (PMC12649634, search excerpt only). See Contradictions.
3. **Minimum chunk size and boundary rules matter on small corpora.** Recursive splitters try paragraph, then line, then sentence boundaries [L58]. A naive sentence splitter breaks on "v0." and "1.", producing short fragments that embed with high similarity and outrank real content. That is KnowMe's observed defect (§10 U3). No source quantifies a minimum chunk size; 200–400 tokens is the best-supported working range [L58]. *A minimum is a design choice, not a sourced number.*
4. **Score thresholds and filtering are first-class retrieval settings.** AgentCore Memory retrieval takes `topK` and `relevanceScore` (example 0.5) per namespace [L8]. OpenAI file search exposes `ranking_options.score_threshold` (community thread, not the API reference) [L74].
5. **Evaluate with claim-level faithfulness and context metrics.** Ragas "faithfulness" is the share of response claims supported by the retrieved context; it also offers context precision, context recall and response relevancy [L59]. Foundry ships groundedness and relevance evaluators [L21]. AgentCore Evaluations scores Correctness and Helpfulness on sampled production sessions [L9][L10]. The July 2026 preprint warns that LLM-judged faithfulness itself failed to compute in 44% of cases in a small self-hosted setup [L57]. Evaluator reliability has to be checked too.
6. **The curated corpus is an attack surface.** PoisonedRAG (USENIX Security 2025) reached 90–97% attack success by inserting five malicious texts per target question [L55]. For a curated, operator-only corpus the precondition is write access to the KB. The control is ingestion provenance and review, not runtime filtering. This is an inference.

**General vs. site-specific.** Chunking quality, hybrid retrieval, rerank, thresholds, citations carrying source URLs, and an eval harness are **general** UAR KB capabilities. A full-context mode for corpora under about 200k tokens is a general option that this site would likely use. Corpus size has not been measured.

## 5. Tool policy, prompt injection, moderation, AI disclosure

**Findings**

1. **Deny by default, enforced outside the model.** OWASP LLM06:2025 "Excessive Agency" covers damaging actions "regardless of what is causing the LLM to malfunction" [L52]. The six patterns of Beurer-Kellner et al. (2025) share one principle: "once an LLM agent has ingested untrusted input, it must be constrained so that it is *impossible* for that input to trigger any consequential actions" [L53][L54]. In their own case studies, the constrained designs still leak influence in 8 of 10. In the chatbot case study, users "can still persuade the model to omit relevant sections" under context minimization (Armo summary of the paper; secondary).
2. **Platforms enforce tool policy at a gateway or hook, not in the prompt.**
   - AgentCore Policy evaluates Cedar policies, which can be authored in natural language, on Gateway tool calls. *GA 2026-03-03 per a secondary guide* [L6][L7].
   - The OpenAI Agents SDK has input, output and *tool* guardrails. Tool guardrails can skip a call, replace its output or trip a tripwire [L17].
   - ADK's `before_tool_callback` can block a call. Its plugins include "Gemini as a Judge" (Flash Lite screening for injection and jailbreak), Model Armor and PII redaction [L16].
   - Mastra's processors include `PromptInjectionDetector`, `ModerationProcessor`, `PIIDetector` and `SystemPromptScrubber`, with block, redact or rewrite strategies [L26].
   - Microsoft Foundry applies Prompt Shields (direct and document attacks) as guardrails on deployments or agents [L23].
3. **Built-in "meta" tools count as tools.** No surveyed platform documents exempting framework-internal tools from the allowlist. UAR's always-offered `activate_skill` (§10 U1) sits outside the industry norm that every model-visible tool passes policy. This is an inference from the absence of any counterexample.
4. **System-prompt leakage is its own OWASP category (LLM07:2025)** [L52], and Mastra ships an output scrubber for it [L26]. For a public concierge, assume the system prompt will be extracted and keep secrets out of it.
5. **AI disclosure: EU AI Act Art. 50 applies from 2 August 2026.** Providers must design chatbots so users are informed they are interacting with AI, unless it is obvious [L45][L46][L48]. The Commission adopted Art. 50 guidelines on **20 July 2026** [L48]. The AI Omnibus provisional agreement (May 2026) delays only the Art. 50(2) machine-readable *marking* duty, and only for generative systems already on the market before 2 August 2026, to 2 December 2026. Chatbot disclosure under 50(1) is not deferred [L46][L49]. The Code of Practice covers 50(2) and 50(4) marking and labelling, not chatbot disclosure [L47]. *EUR-Lex was not read directly; the official service-desk page returned no text to the scraper. U13 stays open.*
6. **US: disclosure duties are narrow but growing.** California SB 1001 (2018) bans undisclosed bots used to deceive in commercial transactions. SB 243, effective 1 Jan 2026, covers "companion" chatbots with a private right of action. Utah SB 226 (2025) narrowed disclosure to "when asked" or high-risk interactions [L50]. A secondary source says California AB 1609, which would extend disclosure to customer-service chatbots, advanced out of committee in spring 2026 [L51]. *Unverified, pending bill.* Operator liability for chatbot statements: *Moffatt v. Air Canada* [L62] (already in §3).

**General vs. site-specific.** Tool allowlists with no built-in exemptions, policy hooks before and after tools, input/output guardrail hooks and a moderation integration point are **general**. The disclosure label is **site/UI-specific**; the runtime's only part is not obstructing it, and it may carry a disclosure flag in agent metadata.

## 6. Streaming UI protocols

**Findings**

1. **AG-UI 1.0 shipped on 30 Sept 2026.** It adds subagent events (`SUBAGENT_STARTED`/`FINISHED`), message `metadata`, interrupts, multimodal tool results, token usage, capabilities and transports, across 31 events in 8 categories [L40][L41]. CopilotKit says it is "adopted by Google, Microsoft, Amazon and Oracle" [L40]. *Vendor claim from the protocol's sponsor.* Microsoft Learn independently documents Agent Framework's AG-UI mapping: SSE streaming, tool approval as human-in-the-loop, and `threadId` for conversation continuity (page updated 2026-09-08) [L20].
2. **A2UI.** v0.9.1 is "current", v1.0 a "candidate", v0.9 the previous stable and v0.8 legacy [L42]. Its security claim: "Agents can only use pre-approved components from your catalog — no UI injection attacks" [L42]. The strategy doc (§3.6) already notes this does not stop injected text or links inside allowed components. A2UI travels inside AG-UI `CUSTOM` events, and v0.9 moved the schema into the system prompt instead of structured output [L44][L43].
3. **ChatKit is the closed alternative.** It is a hosted, embeddable widget tied to OpenAI Agent Builder workflows; HubSpot's support agent is the named example [L72][L1].

**General vs. site-specific.** AG-UI event emission (including usage and metadata) and server-side A2UI catalog validation are **general**. The component catalog and link-host allowlist are **site-specific**.

## 7. Observability: run records, traces, production evals

**Findings**

1. **The OTel GenAI semantic conventions are the common schema, and they are still "Development" status.** Spans: `invoke_agent` (split into CLIENT and INTERNAL in v1.41), `chat`, `execute_tool {tool.name}`, `retrieval` (v1.40), plus MCP conventions. Attributes include `gen_ai.usage.*` and cache tokens. Metrics include `gen_ai.client.token.usage` and `gen_ai.invoke_agent.tool_calls`/`inference_calls`. Evaluation results are an event, `gen_ai.evaluation.result` [L37][L38][L39]. Content capture is opt-in [L39]. `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` selects the newest attribute set [L38].
2. **Platforms build production evaluation on these traces.** AgentCore Evaluations reads `invoke_agent`, inference and `execute_tool` spans from CloudWatch. It groups them by `session.id` and samples 0.01–100% of live sessions (online evaluation). It accepts OTel GenAI or OpenInference instrumentation, selected by scope-name prefix [L9][L10]. Foundry runs "continuous evaluation" of sampled production traffic over OTel traces, and Microsoft co-authors multi-agent conventions on top of GenAI spans [L21][L22]. The Vercel AI SDK emits OTel spans; telemetry there is still "experimental" [L32].
3. **Run records need a stable session correlator.** AgentCore's evaluator cannot assemble a session without `session.id` on spans [L9]. For UAR, the existing `X-UAR-Session-ID` would need to appear as a span attribute. *Unverified whether it does.*

**General.** All of section 7 is a general runtime capability.

## 8. How comparable platforms handle 1–7

Versions and dates are as stated on the pages retrieved (accessed 2026-10-02).

| Platform (source date) | Visitor identity / session key | Delete / TTL | Budgets / metering | RAG | Tool policy / guardrails | UI protocol | Observability / evals |
|---|---|---|---|---|---|---|---|
| **LangGraph Platform / LangSmith** (docs n.d.; forum 2026) | Custom `@auth.authenticate`; `@auth.on` owner metadata + filters [L13] | Thread/checkpoint TTL `delete` or `keep_latest`; store TTL [L11][L12] | Not found in this search | Bring your own | In graph code | AG-UI via CopilotKit [L40] | LangSmith traces; OTel conventions integrated into LangGraph per Microsoft [L22] |
| **OpenAI Agents SDK + ChatKit** (API ref n.d.) | Server-minted ChatKit session with `user` scope, short expiry [L1] | `clear_session()`, TTL on some backends [L18]; provider abuse logs 30 days [L19] | Per-minute and per-session request caps [L1]; `max_turns` [L17] | Hosted file search; score threshold (community) [L74] | Input, output and tool guardrails with tripwires [L17] | ChatKit widget [L72]; AG-UI adapter [L40] | OTel convention support per Microsoft [L22]; AgentCore Evaluations reads it [L9] |
| **AWS Bedrock AgentCore** (docs n.d.; blog Aug 2026) | `runtimeSessionId` per microVM; JWT/IAM inbound; pairwise `sub` advised [L2][L4] | Idle 15 min / max 8 h defaults; memory event expiry in days [L2][L8] | Not found in this search | Memory retrieval `topK` + `relevanceScore` [L8] | AgentCore Policy (Cedar, NL authoring) at Gateway [L6][L7] | AG-UI via Strands/CopilotKit [L40] | ADOT to CloudWatch; online evals by session sampling [L9][L10] |
| **Google ADK / Agent Platform** (renamed from Vertex AI Agent Engine; docs n.d.) | `user_id` + `session_id` [L14] | Mandatory session expiry; `delete_session`; Memory Bank TTL [L14][L15] | Not found in this search | Bring your own / Memory Bank | `before_tool_callback`; Gemini-judge, Model Armor and PII plugins [L16] | A2UI (Google-led) [L42][L43]; AG-UI [L40] | AgentCore Evaluations reads ADK traces [L9] |
| **Microsoft Agent Framework 1.0 / Foundry** (MAF 1.0 devblog 2026; Learn 2026-08/09) | `threadId`, AgentSession [L20][L25] | Foundry conversations; memory stores preview [L73] | Not found in this search | MAF overview: RAG "not yet available" (2026-08-25) [L25] | Middleware; Prompt Shields guardrails [L23][L25] | Native AG-UI hosting [L20] | OTel GenAI + multi-agent conventions; continuous evaluation [L21][L22] |
| **Letta** (docs n.d.) | Agent-per-user is the model; memory blocks [L28] | Not verified | Not found | Archival memory | Not verified | Not verified | Not verified |
| **Mastra** (docs n.d.) | `resource` + `thread` [L27] | Not verified | Not found | Bring your own | Processors: injection, moderation, PII, system-prompt scrub [L26] | AG-UI [L40] | Not verified |
| **Vercel AI SDK** (docs n.d.; blog 2026) | App-defined | App-defined | `usage` callbacks [L32]; edge rate limit [L31] | Bring your own | Tool definitions in code | UI message stream; AG-UI adapter [L40] | OTel `experimental_telemetry` [L32]; BotID on AI routes [L29][L30] |
| **Cloudflare Agents + AI Gateway** (changelog 2026-06-05) | Durable Object per agent name [L35]; Turnstile [L36] | `destroy()`; `maxPersistedMessages` [L35] | Spend limits per user and global [L33][L34] | Bring your own | Not verified | AI SDK UI stream [L35] | AI Gateway logs (not detailed here) |

"Not found" means not found in this session's searches. It does not mean the platform lacks the feature.

## 9. Agent-led websites in the wild (2025–2026)

**Findings**

1. **No new controlled outcome data.** Targeted searches for 2026 launches of agent-led or chat-first corporate homepages returned marketing content and trend pieces, not deployments with measured results. This matches strategy §3.1 and §3.7. Absence of search results is not proof of absence.
2. **Vendor-reported results for website AI SDR agents continue.** Qualified (Piper) customer pages claim "22% more pipeline", "3X more meetings in 6 months", "$1.8M in pipeline" from 3K conversations, and a "4X increase in website engagement" [L68]. These are vendor claims with no control group and the same caveats as §3.1.
3. **The AI-referral conversion figure that §3.3 cites as "9% less" has reversed.** Adobe reported AI-referred retail traffic converting 9% *worse* in February 2025 [L69]. Adobe's 2026 data shows it converting *better*: 54% higher in May 2026 [L70], and 11 straight months of outperformance with 53% more revenue per visit by July 2026 [L71]. This is about visitors who *arrive from* AI assistants, not about on-site agents. It is retail-only panel data from a vendor. Still, §3.3's `[A26]` "converted 9% less" is now stale.
4. **ChatKit embeds exist at scale for support, not for discovery.** OpenAI names HubSpot's customer-support agent as a ChatKit deployment [L72]. No ChatKit, AG-UI or A2UI deployment was found acting as a *discovery* concierge on a corporate homepage.

---

## Capability checklist

| # | Capability | Why a public agent site needs it | How platforms implement it | General runtime vs. site-specific |
|---|---|---|---|---|
| C1 | Accept a verified principal + session ID; owner-scope every session read | Anonymous visitors must not see each other's threads; shared principals leak through list/read APIs | LangGraph `@auth.on` owner filter [L13]; AgentCore actorId+sessionId [L8]; ADK user_id [L14]; ChatKit `user` scope [L1] | **General** |
| C2 | Anonymous visitor ID issuance with pairwise/pseudonymous `sub`, short expiry | Per-visitor budgets and erasure need a key; PII in `sub` gets logged | ChatKit server-minted secret, 10 min default [L1]; AWS pairwise GUID advice [L4]; Supabase anon users [L67] | **Site-specific** (gate/edge), with runtime JWKS verification general |
| C3 | Bot verification and abuse admission on the chat endpoint | Inference theft defeats per-IP limits | Vercel BotID [L29][L30]; Turnstile pre-clearance [L36]; CAPTCHA on anon sign-in [L67] | **Site-specific** (edge) |
| C4 | Per-session and per-principal request/turn caps | Bound a single abusive session | ChatKit per-minute and per-session caps [L1]; Agents SDK `max_turns` [L17] | **General** |
| C5 | Token/spend budgets per principal, agent and global, enforced across replicas | Denial of wallet (OWASP LLM10) [L52] | Cloudflare spend limits [L33]; LiteLLM budgets + Redis [L63][L64]; Agent Router token buckets + QuotaPolicy, ext_authz-supplied limits [L65] | **General** enforcement hook + **site** values |
| C6 | Per-run usage emission (input/output/cached tokens) on the stream and in telemetry | Gate cannot meter what it cannot see (U18) | AG-UI 1.0 token usage [L40][L41]; OTel `gen_ai.usage.*` [L38]; AI SDK `usage` [L32] | **General** |
| C7 | Session delete API and TTL (absolute and idle), cascading to checkpoints, memory and run evidence | GDPR erasure; retention limits; cost | ADK mandatory expiry + delete [L14]; LangGraph TTL [L11]; AgentCore lifetimes + memory expiry [L2][L8]; Agents SDK `clear_session` [L18] | **General** (UAR gap, U2) |
| C8 | Long-term memory off (or TTL'd) for anonymous principals | No cross-visit profiling without consent; avoids shared-principal leakage | Memory Bank TTL [L15]; AgentCore event expiry [L8]; Mastra opt-in working memory [L27] | **General** switch, **site** chooses off |
| C9 | Structure-aware chunking with minimum chunk size and version-safe sentence splitting | Fragments outrank real content (U3) | Recursive 200–400 tokens [L58]; semantic chunking not reliably better [L57] | **General** |
| C10 | Full-context mode for small corpora; hybrid BM25 + vector + rerank above that | Small curated KBs may not need retrieval at all | Anthropic: <200k tokens put in prompt; contextual retrieval −49% / −67% failures [L56] | **General** |
| C11 | Retrieval score threshold + citations with source URLs | Ungrounded answers create liability [L62]; site needs page links | AgentCore `relevanceScore` [L8]; file-search threshold [L74] | **General** (citation rendering is site) |
| C12 | RAG/agent eval harness: offline set + sampled online scoring | Detect drift and regressions before visitors do | Ragas faithfulness/context metrics [L59]; Foundry continuous eval [L21]; AgentCore online eval [L9][L10] | **General** |
| C13 | Deny-by-default tool allowlist covering built-in/meta tools; policy evaluated outside the model | Excessive agency (OWASP LLM06) [L52]; U1 `activate_skill` | AgentCore Policy/Cedar [L6]; tool guardrails [L17]; `before_tool_callback` [L16] | **General** |
| C14 | Input/output guardrail hooks: injection detection, moderation, PII redaction, system-prompt scrubbing | Public input is untrusted; LLM07 leakage | Agents SDK tripwires [L17]; Mastra processors [L26]; ADK judge/Model Armor [L16]; Prompt Shields [L23] | **General** hooks; **site** policy content |
| C15 | Injection-resistant architecture (no consequential tools after untrusted input; context minimization) | Guardrails are probabilistic | Beurer-Kellner et al. patterns [L53] | **General** design support |
| C16 | KB ingestion provenance and review | Poisoning needs only a few texts [L55] | Operator-only write path (inference) | **General** |
| C17 | AI disclosure before first interaction | EU AI Act Art. 50(1) since 2 Aug 2026 [L45][L48]; US state laws [L50] | Static UI label; nothing runtime-native found | **Site-specific** |
| C18 | AG-UI 1.0 event stream incl. metadata, usage, interrupts; A2UI catalog validation server-side | Rendering contract for the site and other clients | MAF AG-UI hosting [L20]; CopilotKit [L40]; A2UI v0.9.1 [L42] | **General** (catalog is site) |
| C19 | OTel GenAI spans (`invoke_agent`, `chat`, `execute_tool`, `retrieval`) with `session.id`; content capture opt-in | Debugging, cost attribution, evals, erasure scoping | OTel semconv v1.37–1.42 (Development) [L37][L38][L39]; ADOT/CloudWatch [L9]; Foundry [L22] | **General** |
| C20 | Kill switch / agent disable with static fallback | Brand incident containment (strategy §3.8) | Spend-limit hard stops [L33]; app-level | **Site-specific**, plus a general per-agent disable flag |

---

## Contradictions and uncertainties

1. **Semantic vs. recursive chunking.** L57 (preprint, academic texts) and L58 (secondary report of a benchmark) find no reliable gain from semantic chunking. A clinical-domain study (PMC12649634, excerpt only) reports a significant gain. Resolution: the evidence is domain-dependent and none of it covers short marketing and product pages. Measure on the KnowMe corpus with C12 before choosing.
2. **RAG at all?** Anthropic's "<200k tokens, skip RAG" [L56] conflicts with the strategy doc's KB-retrieval design. Full context raises per-turn input tokens (local measurement: 1,425–1,459 per turn with retrieval, §3.4) unless prompt caching applies. Whether Alibaba's implicit cache hits is open (§3.4 [C12]). The corpus token count is unmeasured. **Uncertain; decision-relevant.**
3. **Rate limits vs. bot verification.** Vercel says per-IP limits failed against a real attack [L30]; strategy §3.4 notes weak public efficacy evidence for bot challenges. Both a seller of rate limiting and a seller of bot detection (the same company) argue for layering. No independent efficacy data was found.
4. **OTel GenAI version churn.** Greptime (May 2026) reports docs at v1.41 [L38]; Dash0 (mid-2026) says MCP moved into the same repo in v1.42.0 [L39]. Both agree the status is Development with no stabilization date. Pin a version and use the opt-in env var.
5. **AgentCore Evaluations framework coverage.** The AWS blog (Aug 2026) lists Strands, LangGraph, OpenAI Agents SDK, LlamaIndex, ADK and Claude Agent SDK [L9]; a third-party guide lists only Strands and LangGraph [L10]. The AWS page is newer and primary, so it is preferred.
6. **AG-UI adoption claims** ("adopted by Google, Microsoft, Amazon and Oracle") come from CopilotKit, the protocol's sponsor [L40]. Microsoft's own docs confirm Microsoft [L20]; the others were not independently checked here.
7. **ChatKit defaults** (10 req/min, 600 s max expiry) came from automated extraction [L1]. **Unverified.**
8. **EU AI Act Art. 50 text** was read on artificialintelligenceact.eu (unofficial) and in law-firm summaries [L45][L46][L48][L49]. The official service-desk page returned nothing to the scraper. The Omnibus deferral of 50(2) to 2 Dec 2026 rests on one secondary source [L46] and is corroborated in substance by L49. **U13 remains open for counsel.**
9. **AgentCore Policy GA date** (2026-03-03) comes from a secondary guide [L7]. **Unverified.**
10. **Egress metering for UAR (section 3 implication)** is an architecture inference. Whether UAR forwards a per-session or per-principal header on its provider calls is **unverified**.
11. **The deep-research package is incomplete at write time** (see the handback). This document does not depend on it.

---

## References

All accessed 2026-10-02.

- [L1] OpenAI. "Create a ChatKit session", API reference. https://developers.openai.com/api/reference/resources/beta/subresources/chatkit/subresources/sessions/methods/create (n.d.) — Primary.
- [L2] AWS. "Configure Amazon Bedrock AgentCore lifecycle settings". https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-lifecycle-settings.html (n.d.) — Primary.
- [L3] AWS. "Use isolated sessions for agents". https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-sessions.html (n.d.) — Primary.
- [L4] AWS. "Set up inbound authorization for your gateway". https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-inbound-auth.html (n.d.) — Primary.
- [L5] Solo.io. "Inbound Auth for AgentCore with Agentgateway". https://www.solo.io/blog/inbound-auth-for-agentcore-with-agentgateway (2026) — Secondary/vendor.
- [L6] AWS. "Policy in Amazon Bedrock AgentCore". https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html (n.d.) — Primary.
- [L7] H. Konishi. "Amazon Bedrock AgentCore Policy Implementation Guide". https://hidekazu-konishi.com/entry/amazon_bedrock_agentcore_policy_implementation_guide.html (2026) — Secondary.
- [L8] AWS. "Memory — Amazon Bedrock AgentCore". https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/harness-memory.html (n.d.) — Primary.
- [L9] AWS ML Blog. "Evaluate any agent framework with Amazon Bedrock AgentCore Evaluations". https://aws.amazon.com/blogs/machine-learning/evaluate-any-agent-framework-with-amazon-bedrock-agentcore-evaluations/ (Aug 2026) — Primary.
- [L10] H. Konishi. "Amazon Bedrock AgentCore Evaluations Practical Guide". https://hidekazu-konishi.com/entry/amazon_bedrock_agentcore_evaluations_practical_guide.html (2026) — Secondary.
- [L11] LangChain. "How to add TTLs to your application". https://docs.langchain.com/langsmith/configure-ttl (n.d.) — Primary.
- [L12] LangChain Forum. "TTL strategies — sliding TTL and a per-thread checkpoint cap?" https://forum.langchain.com/t/ttl-strategies-sliding-ttl-and-a-per-thread-checkpoint-cap/4622 (2026) — Community.
- [L13] LangChain. "Authentication & access control". https://docs.langchain.com/langsmith/auth (n.d.) — Primary.
- [L14] Google Cloud. "Manage sessions with Agent Development Kit". https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale/sessions/manage-with-adk (n.d.) — Primary.
- [L15] Google Cloud. "Agent Platform Memory Bank". https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale/memory-bank (n.d.) — Primary.
- [L16] Google. "Safety and Security for AI Agents — ADK". https://adk.dev/safety/ (n.d.) — Primary.
- [L17] OpenAI. "Guardrails — OpenAI Agents SDK". https://openai.github.io/openai-agents-python/guardrails/ (n.d.) — Primary.
- [L18] OpenAI. "Sessions — OpenAI Agents SDK". https://openai.github.io/openai-agents-python/sessions/ (n.d.) — Primary.
- [L19] OpenAI. "Data controls in the OpenAI platform". https://developers.openai.com/api/docs/guides/your-data (n.d.) — Primary.
- [L20] Microsoft Learn. "AG-UI Integration with Agent Framework". https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/ui/ag-ui/ (updated 2026-09-08) — Primary.
- [L21] Microsoft Learn. "Observability in generative AI — Microsoft Foundry". https://learn.microsoft.com/en-us/azure/foundry/concepts/observability (n.d.) — Primary.
- [L22] Microsoft Learn. "Agent tracing overview — Microsoft Foundry". https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept (n.d.) — Primary.
- [L23] Microsoft Learn. "Prompt Shields in Microsoft Foundry". https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields (n.d.) — Primary.
- [L24] Microsoft DevBlogs. "Microsoft Agent Framework Version 1.0". https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/ (2026) — Primary.
- [L25] Microsoft Learn. "Microsoft Agent Framework Overview". https://learn.microsoft.com/en-us/agent-framework/overview/ (updated 2026-08-25) — Primary.
- [L26] Mastra. "Guardrails". https://mastra.ai/docs/agents/guardrails (n.d.) — Primary.
- [L27] Mastra. "Memory overview". https://mastra.ai/docs/memory/overview (n.d.) — Primary.
- [L28] Letta. "Memory blocks (core memory)". https://docs.letta.com/v1-sdk/memory/memory-blocks (n.d.) — Primary.
- [L29] Vercel. "How to protect your AI endpoints with Vercel BotID". https://vercel.com/kb/guide/protect-ai-endpoints-with-vercel-botid (n.d.) — Primary/vendor.
- [L30] Vercel. "Protecting against token theft". https://vercel.com/blog/protecting-against-token-theft (2026) — Vendor claim.
- [L31] Vercel. "Add Rate Limiting with Vercel". https://vercel.com/kb/guide/add-rate-limiting-vercel (n.d.) — Primary.
- [L32] Vercel. "Telemetry — AI SDK Core" and "streamText". https://ai-sdk.dev/v5/docs/ai-sdk-core/telemetry ; https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text (n.d.) — Primary.
- [L33] Cloudflare. "Spend limits — AI Gateway". https://developers.cloudflare.com/ai-gateway/features/spend-limits/ (n.d.) — Primary.
- [L34] Cloudflare. "Control AI costs with spend limits" (changelog). https://developers.cloudflare.com/changelog/post/2026-06-05-spend-limits/ (2026-06-05) — Primary.
- [L35] Cloudflare. "Agent class internals"; "Chat agents". https://developers.cloudflare.com/agents/runtime/lifecycle/agent-class/ ; https://developers.cloudflare.com/agents/communication-channels/chat/chat-agents/ (n.d.) — Primary.
- [L36] Cloudflare. "Turnstile docs" (pre-clearance). https://developers.cloudflare.com/turnstile/ (n.d.) — Primary.
- [L37] OpenTelemetry. "Inside the LLM Call: GenAI Observability with OpenTelemetry". https://opentelemetry.io/blog/2026/genai-observability/ (2026-05-14) — Primary.
- [L38] Greptime. "How OpenTelemetry Traces LLM Calls, Agent Reasoning, and MCP Tools". https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions (2026-05-09) — Secondary.
- [L39] Dash0. "OpenTelemetry GenAI Semantic Conventions Explained". https://www.dash0.com/knowledge/opentelemetry-genai-semantic-conventions-explained (mid-2026) — Secondary.
- [L40] CopilotKit. "Introducing AG-UI 1.0". https://www.copilotkit.ai/blog/ag-ui-1.0 (2026-09-30) — Primary (sponsor).
- [L41] CopilotKit. "The Developer's Guide to the AG-UI Protocol". https://www.copilotkit.ai/blog/developers-guide-to-the-ag-ui-protocol (2026-09-29; metadata only) — Primary (sponsor).
- [L42] A2UI project (Google). https://a2ui.org/ (n.d.) — Primary.
- [L43] Google Developers Blog. "A2UI v0.9". https://developers.googleblog.com/a2ui-v0-9-generative-ui/ (2026) — Primary.
- [L44] CopilotKit. "A2UI v0.9: What's New". https://www.copilotkit.ai/blog/a2ui-whats-new-in-google-generative-ui-spec (2026-04-17) — Secondary.
- [L45] artificialintelligenceact.eu. "Article 50". https://artificialintelligenceact.eu/article/50/ (n.d.) — Secondary (unofficial text).
- [L46] artificialintelligenceact.eu. "The EU AI Act's Transparency Rules: A Practical Guide to Article 50". https://artificialintelligenceact.eu/transparency-rules-article-50/ (2026) — Secondary.
- [L47] European Commission. "Code of Practice on Transparency of AI-generated Content". https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content (2026) — Primary.
- [L48] Cooley. "EU AI Act: Transparency Obligations Take Effect 2 August 2026". https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026 (2026-08-03) — Secondary (legal).
- [L49] Morgan Lewis. "EU AI Act's Transparency Rules: What Went Into Effect on 2 August?" https://www.morganlewis.com/blogs/sourcingatmorganlewis/2026/08/eu-ai-acts-transparency-rules-what-went-into-effect-on-2-august (2026-08) — Secondary (legal).
- [L50] Cooley. "AI Chatbots at the Crossroads". https://www.cooley.com/news/insight/2025/2025-10-21-ai-chatbots-at-the-crossroads-navigating-new-laws-and-compliance-risks (2025-10-21) — Secondary (legal).
- [L51] StackCyber. "State AI Chatbot Laws: Compliance Guide". https://stackcyber.com/posts/ai-chatbot-laws (2026) — Secondary.
- [L52] OWASP GenAI Security Project. "Top 10 for LLM Applications 2025" (LLM06, LLM07, LLM10). https://genai.owasp.org/llm-top-10/ (2025) — Primary (standard).
- [L53] Beurer-Kellner et al. "Design Patterns for Securing LLM Agents against Prompt Injections". arXiv:2506.08837v3. https://arxiv.org/abs/2506.08837 (2025-06-27) — Preprint.
- [L54] S. Willison. "Design Patterns for Securing LLM Agents against Prompt Injections". https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/ (2025-06-13) — Secondary.
- [L55] Zou et al. "PoisonedRAG". USENIX Security 2025. https://www.usenix.org/system/files/usenixsecurity25-zou-poisonedrag.pdf (2025-08) — Peer-reviewed.
- [L56] Anthropic. "Introducing Contextual Retrieval". https://www.anthropic.com/engineering/contextual-retrieval (2024-09-19, modified 2026-01-07) — Primary/vendor.
- [L57] "Evaluating Chunking Strategies for RAG on Academic Texts". arXiv:2607.01852. https://arxiv.org/html/2607.01852v1 (2026-07) — Preprint.
- [L58] Agenta. "The Ultimate Guide to RAG Chunking Strategies". https://agenta.ai/blog/the-ultimate-guide-for-chunking-strategies (n.d.) — Secondary.
- [L59] Ragas. "Faithfulness"; "List of available metrics". https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/ (n.d.) — Primary.
- [L60] EDPB. "Opinion 28/2024 on certain data protection aspects related to the processing of personal data in the context of AI models". https://www.edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf (2024-12-17) — Primary.
- [L61] Debevoise. "GDPR Considerations When Developing and Deploying AI Models". https://www.debevoisedatablog.com/2025/04/14/gdpr-considerations-when-developing-and-deploying-ai-models-the-edpbs-opinion-on-compliance/ (2025-04-14) — Secondary (legal).
- [L62] American Bar Association. "BC Tribunal Confirms Companies Remain Liable for Information Provided by AI Chatbot". https://www.americanbar.org/groups/business_law/resources/business-law-today/2024-february/bc-tribunal-confirms-companies-remain-liable-information-provided-ai-chatbot/ (2024-02) — Secondary (legal).
- [L63] LiteLLM. "Budgets, Rate Limits". https://docs.litellm.ai/docs/proxy/users (n.d.) — Primary.
- [L64] LiteLLM. "Customers / End-Users". https://docs.litellm.ai/docs/proxy/customers (n.d.) — Primary.
- [L65] Envoy AI Gateway / Agent Router. "Usage-based Rate Limiting". https://aigateway.envoyproxy.io/docs/next/capabilities/traffic/usage-based-ratelimiting/ (n.d.; latest docs v1.1) — Primary.
- [L66] Agent Router. "Envoy AI Gateway is becoming Agent Router, an Agentic AI Foundation project". https://theagentrouter.ai/ (2026-09) — Primary.
- [L67] Supabase. "Anonymous Sign-Ins". https://supabase.com/docs/guides/auth/auth-anonymous (n.d.) — Primary.
- [L68] Qualified. "Customer Case Studies — Piper AI SDR Agent". https://www.qualified.com/customers (2026) — Vendor claim.
- [L69] Adobe. "Adobe Analytics: Traffic to U.S. retail websites from Generative AI sources jumps 1,200 percent". https://blog.adobe.com/en/publish/2025/03/17/adobe-analytics-traffic-to-us-retail-websites-from-generative-ai-sources-jumps-1200-percent (2025-03-17) — Panel data (vendor).
- [L70] MarketingTech News. "AI referrals drive higher ecommerce traffic and conversions". https://www.marketingtechnews.net/news/ai-referrals-ecommerce-traffic-conversions/ (2026, May data) — Secondary reporting Adobe panel data.
- [L71] Digital Commerce 360. "Adobe: AI-referral traffic spending, converting more than counterparts". https://www.digitalcommerce360.com/2026/08/19/adobe-ai-referral-traffic-data-july-2026/ (2026-08-19) — Secondary reporting Adobe panel data.
- [L72] OpenAI. "Introducing AgentKit". https://openai.com/index/introducing-agentkit/ (2025-10) — Primary/vendor.
- [L73] Microsoft Learn. "Build with runtime components in Foundry Agent Service". https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/runtime-components (n.d.) — Primary.
- [L74] OpenAI Developer Community. "Setting score_threshold parameter for file search tool". https://community.openai.com/t/setting-score-threshold-parameter-for-file-search-tool/1005231 (2024) — Community.
