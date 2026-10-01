# Thread D: agent-driven UI protocol landscape (as of 2026-10-01)

Scope: evidence for positioning a website that uses AG-UI (event transport) and A2UI (declarative UI format). Every claim below cites a page that was fetched and read on 2026-10-01 (Firecrawl scrape). Where a claim comes only from a vendor about itself, it is marked **self-reported**.

## Comparison table

| Protocol / framework | What it is | Version & date | Governance | Production adopters (sourced) | Security model | Relation to AG-UI / A2UI |
| --- | --- | --- | --- | --- | --- | --- |
| **AG-UI** (Agent-User Interaction Protocol) | Event-based, bi-directional protocol between an agent backend and a user-facing app. Typed event stream: lifecycle, text, tool calls, state snapshot/delta, activity, reasoning, subagent, custom/raw. [1][2][3] | **1.0 stable**, announced 2026-09-30, JSON-Schema-defined, backwards compatible with 0.x. [1][4] | MIT, GitHub org `ag-ui-protocol`, run by CopilotKit (spec authored by CopilotKit; Anthropic, Pydantic AI, TanStack gave feedback). Not in any foundation (absent from AAIF project list). [1][5][17] | Framework-side support verified on the adopter's own docs: Microsoft Agent Framework [6], AWS Bedrock AgentCore Runtime [7], Google ADK [8], LangChain Deep Agents [9], CrewAI [10], Mastra (`@ag-ui/mastra`) [11], Pydantic AI [12], Oracle Agent Spec (2025-12-22) [13]. **Self-reported**: "adopted by Google, Microsoft, Amazon and Oracle". [1] No named end-user production deployment found. | Transport only. Carries text, state, tool calls; it does not define what is rendered. Security of rendered UI depends on the gen-UI spec it carries. [14] | Is the transport. AG-UI docs: "AG-UI is not a generative UI specification"; it carries A2UI, MCP-UI/MCP Apps, Open-JSON-UI. [14] |
| **A2UI** (Agent-to-UI) | Declarative JSON format: agent sends a flat, streamable component list + data model; client renders from its own catalog of native components. [15][16] | **v0.9.1 current** (production); **v1.0 Candidate** (last updated 2026-06-08); v0.9 released 2026-04-17; launched 2025-12-15 at v0.8. README: "Early stage public preview ... Expect changes." [15][16][18][19][20] | Apache 2.0; "created by Google with contributions from CopilotKit"; repo moved from `google/A2UI` to `a2ui-project/a2ui`. Not in any foundation. [15][16][17] | Listed by the project ("A2UI in the World", **self-reported**): Google Opal, Gemini Enterprise, Flutter GenUI SDK, ADK Web, AG2, CopilotKit. [21] Independently confirmed: Gemini Enterprise docs (A2A-registered agents render A2UI basic + Material catalogs, updated 2026-09-29) [22]; Android Jetpack Compose renderer (alpha) [23][24]. | "Declarative data format, not executable code"; agent can only request components in the client's catalog; client controls styling; custom "Smart Wrappers" (incl. iframes) put sandboxing on the developer. [16][18] | The UI payload. Designed to ride AG-UI or A2A; AG-UI/CopilotKit had day-zero support. [18][21] |
| **MCP Apps** (successor to MCP-UI) | Official MCP extension (SEP-1865): tools declare `_meta.ui.resourceUri`; host renders a `ui://` HTML/JS resource in a sandboxed iframe; JSON-RPC over `postMessage`. [25][26] | Spec `2026-01-26`; "live as an official MCP extension ... ready for production" on 2026-01-26. [25] | Part of MCP, which the Linux Foundation's Agentic AI Foundation (AAIF) hosts since 2025-12-09. [27][17] | Claude (web/desktop), Goose, VS Code Insiders, ChatGPT (per MCP blog, 2026-01-26). [25] ChatGPT docs: "ChatGPT implements the open MCP Apps standard". [28] | **Runs third-party code**: sandboxed iframe, pre-declared templates, auditable JSON-RPC, optional user consent for UI-initiated tool calls. [25] | Different model: opaque sandboxed HTML vs A2UI's native components. Google: A2UI "native-first ... distinct from the resource-fetching model of MCP Apps". [18] AG-UI carries both. [2][14] |
| **OpenAI Apps SDK** (now documented as ChatGPT "plugins") | ChatGPT's UI-in-chat layer on MCP. New UI should use MCP Apps; `window.openai` is a ChatGPT-only extension layer (checkout, file upload, modals, widget state). [28] | Launch date not verified from a read page; current docs read 2026-10-01. [28] | OpenAI-controlled; portable part is MCP Apps (AAIF). [28][25] | ChatGPT. [28] | Same as MCP Apps: iframe + `postMessage` bridge. [28] | Converged into MCP Apps. Chat-client surface, not a website surface. |
| **Vercel AI SDK generative UI** | AI SDK UI: map tool-call results to your React components (controlled gen UI). AI SDK RSC `streamUI`: server-streamed React components. [29][30] | RSC: "currently experimental. We recommend using AI SDK UI for production"; template page: "Development of AI SDK RSC is currently paused." [29][31] | Vercel, open source. | Not verified (no adopter page read). | Developer-authored components only; no agent-authored code. [30] | Framework alternative to AG-UI for the host app; Google lists it beside AG-UI as a "host" framework that A2UI complements. [18] Vercel's `json-render` is listed as an A2UI ecosystem renderer. [23][32] |
| **Thesys C1 / OpenUI** | Commercial generative-UI API (OpenAI-compatible endpoint that returns UI) plus open-source **OpenUI Lang**, a code-like (non-JSON) rendering spec, launched March 2026; successor to Crayon. [33][34] | OpenUI launched ~2026-03 (C1 "March release" adopts it). [34] | Thesys (open core). | **Self-reported**: ">10,000 developers"; customer quotes from Fieldcamp, Mili, Shovels, GradientFlo, Point Labs. [34][35] | Renders from a component library; no arbitrary code execution described. [33][34] | Competitor to A2UI on format. Thesys argues JSON (A2UI, json-render) is verbose and error-prone: "67% fewer tokens", "3x faster rendering" (**self-reported** benchmarks). [34] |
| **Open-JSON-UI** | Described as "open standardization of OpenAI's internal declarative Generative UI schema". [14] | Unknown. | **Unverified**: only CopilotKit/AG-UI pages describe it; no OpenAI source found. [14][36] | None found. | Declarative. [36] | Carried by AG-UI as a gen-UI spec. [14] |
| **Google generative UI (Search AI Mode / AI Overviews, Gemini dynamic view)** | Model "designs and codes" a custom interface per prompt; outputs HTML/CSS/JS. [37] | Research + rollout 2025-11-18; I/O 2026 (2026-05-19): available "for everyone in Search this summer, free of charge"; rolling into AI Overviews. [37][38][39] | Google proprietary. | Google Search, Gemini app. [37][38] | **Generated code**, not catalog-constrained. [37] | Shows Google itself uses open (code) gen UI on its biggest public surface, not A2UI. |
| **WebMCP** | Proposed web standard: sites expose structured tools / annotated forms to in-browser agents (`navigator.modelContext`). [40] | Chrome **origin trial**; doc published 2026-05-18, updated 2026-08-07. [40] | W3C Web Machine Learning community (explainer under `webmachinelearning`). [40] | Not verified. | Site-defined tools; agent acts on the page. | Inverse direction: agents operating a website, not a website rendering agent UI. Complementary. |
| **NLWeb** | Microsoft open project: natural-language endpoint for websites over Schema.org/RSS; every instance is an MCP server. [41] | Announced May 2025. [41] | Microsoft open project. | "Small cohort of early adopters" (**self-reported**). [41] | Query/answer, not UI generation. | Adjacent: conversational site access, no UI protocol. |
| **Standards bodies** | AAIF (Linux Foundation) formed 2025-12-09 with MCP, goose, AGENTS.md; platinum: AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI. [27] Current projects: MCP, goose, AGENTS.md, agentgateway, A2A, Agent Router. [17] A2A joined 2026-08-17; A2A v1.0 shipped March 2026. [42] W3C AI Agent Protocol Community Group: agent discovery, identity, metadata; no UI scope. [43] | — | — | — | — | **Neither AG-UI nor A2UI is under a foundation or W3C.** [17] |

## Findings (with URLs and dates)

1. **AG-UI reached 1.0 on 2026-09-30, one day before this research.** Stable spec plus JSON Schema; TS, Python and .NET SDKs generated from the schema; adds subagents, metadata, multimodal tool results, interrupts, token usage; backwards compatible with 0.x; TS breaking renames (`SubAgentInfo` to `SubagentInfo`, validators moved to `@ag-ui/core/schemas`, custom event fields replaced by `metadata`). [1][4] Interrupts and meta events still appear as "Draft" on the concepts/events page, so docs lag the release. [3]
2. **AG-UI support is real on the adopter side.** Microsoft Learn [6], AWS AgentCore ("deploy and run AG-UI servers") [7], ADK [8], LangChain Deep Agents [9], CrewAI ("CrewAI runs behind AG-UI in three shapes") [10], Mastra [11], Pydantic AI [12], Oracle (2025-12-22) [13]. Microsoft contributed a .NET SDK (CopilotKit blog listing, 2026-09-25, title only). [1]
3. **A2UI is Google-led, still pre-1.0, and multi-version.** v0.8 legacy, v0.9 stable (2026-04-17), v0.9.1 current, v1.0 candidate (2026-06-08). The React renderer supports v0.8 and v0.9.1; v1.0 renderers are "Planned" for all platforms. [15][19][20][23] Anything built today targets v0.9.1 and will need a v1.0 migration.
4. **A2UI's security claim is specific and bounded.** No executable code; the client catalog limits which components can appear. [16][18] Custom components, including iframes, are the developer's responsibility ("trust ladders"). [16] The declarative format limits *which* components render. It does not stop prompt-injected *content* (text, links, data) inside allowed components. That gap is our inference, not a vendor statement.
5. **Named A2UI production use is Google-internal or Google-cloud.** Opal ("hundreds of thousands of people", self-reported) and Gemini Enterprise, which only renders A2UI for A2A-registered agents, not ADK/Agent Engine ones. [21][22] Third-party production use is framework support (AG2, CopilotKit), not named sites. [21]
6. **MCP Apps is the chat-client standard, and it executes code.** It went official on 2026-01-26 and runs in Claude, ChatGPT, Goose and VS Code. [25] ChatGPT now tells developers to start with MCP Apps and use `window.openai` only as an extension. [28] Its security is an iframe sandbox, not catalog constraint. [25]
7. **Positioning: complementary, not competing, at the transport layer.** AG-UI docs place AG-UI beside MCP (tools) and A2A (agent-to-agent) and call A2UI, MCP-UI and Open-JSON-UI "generative UI specifications" it carries. [2][14] Google's launch post says A2UI is "complementary" to AG-UI. [18] CopilotKit sorts gen UI into controlled (own components), declarative (A2UI, Open-JSON-UI), open (sandboxed agent HTML) and MCP Apps. [44]
8. **The format layer is contested.** Thesys OpenUI Lang argues against JSON formats such as A2UI and json-render. [34] Vercel's json-render is an A2UI ecosystem renderer that uses Zod catalogs. [23][32] The sources disagree on who made MCP-UI: AG-UI docs say "Microsoft + Shopify" [14]; the MCP blog credits Ido Salomon and Liad Yosef. [25]
9. **Vercel's RSC generative UI is a dead end.** It is "experimental" and "paused", and Vercel recommends AI SDK UI (tool result to React component). [29][31]
10. **No neutral governance for the two protocols we depend on.** AAIF hosts MCP and A2A, but not AG-UI or A2UI. [17][42] W3C's agent work covers discovery and identity [43] and in-browser tools via WebMCP [40], not UI rendering.

## Websites rendering agent-generated UI to anonymous visitors

**Result: no public company or marketing website was found that renders AG-UI- or A2UI-driven UI to anonymous visitors.** The closest cases:

| Example | What it is | Anonymous? | Protocol | Source |
| --- | --- | --- | --- | --- |
| Google Search AI Mode / AI Overviews generative UI | Model-generated HTML/CSS/JS layouts, tools and simulations inside search results | Public search surface. "Everyone ... free of charge" (I/O 2026). Signed-out availability not stated. | Proprietary, code-generating | [37][38][39] |
| Thesys demo (demo.thesys.dev) | Public chat assistant "that responds with UI" | Landing page loaded without a login in the scrape. Whether generating needs sign-in was not verified. | OpenUI / C1 | [45] |
| AG-UI Dojo (dojo.ag-ui.com) | Developer demos of each integration | Public developer demo, not a product site | AG-UI | [2][46] |
| generativeui.github.io | Google Research gallery of pre-generated outputs | Public, but static (pre-rendered) | n/a | [47] |
| Landbot "agentic website experience" | Adapts *conversation flows* by visitor signals | Yes, but no generated UI | none | [48] |
| Mergetic "Ask Mergetic" | Counter-pattern: "a deterministic, non-generative website interface" answering from pre-approved claims, locally | Yes | none (deliberately) | [49] |

Searched (Firecrawl, 2026-10-01): "generative UI website personalized for each visitor agent generates page layout"; "agent-led website AI generates the page for anonymous visitors marketing site generative UI"; "\"generative website\" homepage rebuilt by AI agent for every visitor launch 2026"; "company replaced its homepage with an AI agent that generates the interface"; "\"A2UI\" marketing website production public no login"; "\"AG-UI\" public website concierge agent landing page production case study"; "\"agent-first website\" OR \"agentic website\" homepage generated UI case study"; "A2UI website public demo landing page generated by agent visitors". Results were chat widgets, website *builders* (10Web, Lokuma), personalization tools and explainer articles. None was a live site of this kind. Absence from search results does not prove no such site exists. Treat it as unverified, not as proven.

## Risks: maturity and churn

- **AG-UI 1.0 is one day old.** SDKs had breaking renames at 1.0 [1]. Concept pages still mark interrupts as draft [3]. Expect patch churn in `@ag-ui/*` and the CopilotKit layers over the next releases. The spec promises the 1.0 wire format "won't change" [1]. That promise comes from one vendor, and no foundation enforces it.
- **A2UI has four live spec versions, and v1.0 is a candidate with no shipping web renderer.** [15][23] The README still says "Early stage public preview ... Expect changes." [16] A v0.9.1 build will need a v1.0 migration: `actionResponse` RPC, action IDs, and `theme` renamed to `surfaceProperties`. [15]
- **Single-vendor stewardship for both.** AG-UI is CopilotKit's (whose commercial runtime is "CopilotKit Intelligence") [2]. A2UI is Google-led [15]. Neither is in AAIF [17]. If either sponsor changes course, nothing neutral holds the spec, as Vercel's paused RSC work shows. [31]
- **Google does not use A2UI on its largest public gen-UI surface.** Search and Gemini generate code. [37] So the "declarative is the future" argument for A2UI has no proof at public-web scale.
- **The format layer is still contested.** OpenUI Lang [34], json-render [32], Open-JSON-UI (unverified origin) [14] and MCP Apps [25] compete with A2UI. Our A2UI catalog could become a translation layer later.
- **Security claims are narrower than the marketing.** A2UI blocks code injection, not content injection. On a site anonymous visitors use, prompt-injected text or links inside allowed components is still a live threat (our inference, not stated by a vendor).
- **No precedent.** We found no public site rendering AG-UI/A2UI UI to anonymous visitors. We would be first or nearly first. That helps the pitch and hurts us operationally: there are no reference load, abuse or cost profiles to copy.

## Sources (all read 2026-10-01)

1. CopilotKit, "Introducing AG-UI 1.0", 2026-09-30 — https://www.copilotkit.ai/blog/ag-ui-1.0
2. AG-UI docs, Introduction — https://docs.ag-ui.com/introduction
3. AG-UI docs, Events — https://docs.ag-ui.com/concepts/events
4. AG-UI 1.0 specification — https://docs.ag-ui.com/spec/1.0
5. AG-UI GitHub (MIT, 16.2k stars) — https://github.com/ag-ui-protocol/ag-ui
6. Microsoft Learn, AG-UI Integration with Agent Framework — https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/ui/ag-ui/
7. AWS, Deploy AG-UI servers in AgentCore Runtime — https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-agui.html
8. ADK docs, AG-UI user interface for ADK — https://google.github.io/adk-docs/tools/third-party/ag-ui/ (redirects to adk.dev/integrations/ag-ui/)
9. LangChain docs, Deep Agents AG-UI — https://docs.langchain.com/oss/python/deepagents/ag-ui
10. CrewAI docs, Frontend Overview — https://docs.crewai.com/en/guides/frontend/overview
11. Mastra docs, CopilotKit / Agentic UI — https://mastra.ai/integrations/agentic-ui/copilotkit
12. Pydantic docs, AG-UI — https://pydantic.dev/docs/ai/integrations/ui/ag-ui/
13. Oracle, "announcing AG-UI integration for Open Agent Specification", 2025-12-22 — https://blogs.oracle.com/ai-and-datascience/announcing-ag-ui-integration-for-agent-spec
14. AG-UI docs, Generative UI Specs — https://docs.ag-ui.com/concepts/generative-ui-specs
15. A2UI homepage (version table) — https://a2ui.org/
16. A2UI GitHub README — https://github.com/a2ui-project/a2ui (redirect from github.com/google/A2UI)
17. AAIF Projects — https://aaif.io/projects
18. Google Developers Blog, "Introducing A2UI", 2025-12-15 — https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/
19. Google Developers Blog, "A2UI v0.9", 2026-04-17 — https://developers.googleblog.com/a2ui-v0-9-generative-ui/
20. A2UI v1.0 Candidate spec (last updated 2026-06-08) — https://a2ui.org/specification/v1.0-a2ui/
21. A2UI in the World — https://a2ui.org/ecosystem/a2ui-in-the-world/
22. Gemini Enterprise, Register and manage agents using A2UI and A2A (updated 2026-09-29) — https://docs.cloud.google.com/gemini/enterprise/docs/a2ui-agents/register-and-manage-an-a2ui-agent
23. A2UI Renderers — https://a2ui.org/reference/renderers/
24. Android Developers, A2UI renderer for Jetpack Compose (updated 2026-09-25) — https://developer.android.com/develop/ui/compose/agentic
25. MCP Blog, "MCP Apps", 2026-01-26 — https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/
26. SEP-1865 MCP Apps — https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp
27. Linux Foundation, AAIF formation, 2025-12-09 — https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
28. OpenAI Developers, Add UI to your MCP server — https://developers.openai.com/plugins/build/chatgpt-ui
29. AI SDK RSC streamUI reference — https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui
30. AI SDK UI, Generative User Interfaces — https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces
31. Vercel template, Generative UI Chatbot with RSC — https://vercel.com/templates/other/rsc-genui
32. json-render — https://json-render.dev/
33. Thesys, Generative UI architecture (C1 API) — https://www.thesys.dev/blogs/generative-ui-architecture
34. Thesys, "OpenUI" (March 2026) — https://www.thesys.dev/blogs/openui
35. Thesys customers — https://www.thesys.dev/customers
36. CopilotKit generative-ui repo (search result only) — https://github.com/CopilotKit/generative-ui
37. Google Research, "Generative UI", 2025-11-18 — https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/
38. Google, Search I/O 2026, 2026-05-19 — https://blog.google/products-and-platforms/products/search/search-io-2026/
39. Search Engine Journal, "Google Expands Generative UI Beyond AI Mode Into AI Overviews" (undated in scrape) — https://www.searchenginejournal.com/google-expands-generative-ui-beyond-ai-mode-into-ai-overviews/586452/
40. Chrome for Developers, WebMCP (2026-05-18, updated 2026-08-07) — https://developer.chrome.com/docs/ai/webmcp
41. Microsoft, "Introducing NLWeb" — https://news.microsoft.com/source/features/company-news/introducing-nlweb-bringing-conversational-interfaces-directly-to-the-web/
42. AAIF, "A2A joins AAIF", 2026-08-17 — https://aaif.io/blog/a2a-joins-aaif
43. W3C AI Agent Protocol Community Group — https://www.w3.org/community/agentprotocol/
44. CopilotKit, Generative UI — https://www.copilotkit.ai/generative-ui
45. Thesys demo — https://demo.thesys.dev/
46. AG-UI Dojo — https://dojo.ag-ui.com/
47. Generative UI project page — https://generativeui.github.io/
48. Landbot, Agentic Website Experience — https://landbot.io/agentic-web-experience
49. Mergetic, Public Claims Register — https://mergetic.com/claims
