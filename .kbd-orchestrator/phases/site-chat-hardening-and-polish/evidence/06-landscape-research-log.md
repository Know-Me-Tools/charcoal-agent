# Landscape research log (task 12.2)

Rule: primary sources first; each entry records URL, retrieval date and a **paraphrase** of the facts relied on (no long quotes, because these are third-party pages). Claims in `docs/knowledge-source/landscape/**` cite these entries by URL and date. Retrieved by the main thread with the Firecrawl scrape tool.

## OpenAI dots (always-on cloud agents)

### S1. https://openai.com/index/introducing-dots/ (OpenAI announcement dated 2026-09-29; retrieved 2026-10-12)
- Dots are described as always-on agents. Each dot has its own cloud computer and browser, is powered by GPT-6 Astra, works toward goals around the clock, learns from feedback, and connects through plugins to over 4,000 apps.
- Reach: ChatGPT (desktop, web, mobile), Slack and Teams; voice calls; texting is described as coming. A dot can message the user with progress and questions.
- Control: users choose which apps a dot may access; Custom Rules let the user allow, require approval for, or block specific actions; certain sensitive actions (for example changing a password) always stay with the user; an Activity View shows progress; a monitoring system can pause or stop a dot. The user's own computer stays separate unless they connect it.
- Background behaviour: when idle, a dot does "proactive research" using read-only access to connected apps.
- Data: OpenAI says content from ChatGPT Business, Enterprise and Edu workspaces is not used to improve models by default; on personal plans the user controls this. Dots carry context across channels and remember preferences.
- Availability at announcement: rolling out in ChatGPT to Pro and Business Premium plans in eligible markets; Enterprise (including Edu and Healthcare) beta enabled by an admin. The first dot is included in the plan at no extra cost; paid add-on dots are described as a future option. A preview of "specialist dots" with their own identity and credentials for organisations; a Microsoft Agent 365 integration is described as in progress.

### S2. https://help.openai.com/en/articles/20001530-getting-started-with-your-dot (OpenAI Help Center; page marked updated "yesterday"; retrieved 2026-10-12)
- Setup is done in the ChatGPT desktop app or desktop web; mobile can talk to an existing dot but cannot create one; dots are not supported on mobile web. Pro availability excludes the European Economic Area, Switzerland and the UK; Business Premium is available across supported regions; Enterprise is off by default until an admin enables it.
- A dot has its own cloud computer; access to the user's local computer is optional and off by default; the user can take over the dot's cloud browser.
- Memory: a dot receives memories from ChatGPT and creates its own, including from connected apps. Disconnecting an app does not delete information already obtained from it; deleting a dot's saved data requires deleting (resetting) the dot, which removes its conversations, memories and scheduled tasks.
- Limits at launch: a dot cannot place calls to the user; no standalone email address for the dot; texting is a limited US-only Pro beta using a third-party provider.
- Controls: Custom Rules with four behaviours (act without asking, act if pre-approved, ask before acting, hand off to the user); pause and resume; the page states a dot can make mistakes, including when following rules.

### Facts that matter for comparison with KnowMe (derived, not quoted)
- Dots run on OpenAI's infrastructure with OpenAI's model, tied to an OpenAI plan; data lives in OpenAI's systems under OpenAI's controls.
- Dots' strengths per these sources: broad app integration (4,000+), always-on background work, cross-channel presence, voice, specialist enterprise variants, and live availability for eligible plans.
- Open point for our content: any statement about what KnowMe does better must come from KnowMe's own design intent (local data, vendor independence), stated as such, not as a verified superiority claim.

(Further entries are appended below as the other categories are researched.)

## Agent runtimes and frameworks (fetched by a research subagent with Firecrawl, 2026-10-12; paraphrased relay, one official page per product, not independently re-read)

### LangGraph - https://docs.langchain.com/oss/python/langgraph/overview
- A low-level orchestration framework and runtime for long-running, stateful agents; mixes deterministic and LLM-driven steps in one graph; built by LangChain Inc but usable without LangChain; Python install shown.
- Listed capabilities: persistence and durable execution (resume after failure), streaming, human-in-the-loop (inspect and modify state), short-term and long-term memory. Sits under LangChain and Deep Agents in the vendor's stack; LangSmith covers tracing, evaluation and deployment.
- Not stated on this page: licence, protocols (MCP, A2A, AG-UI), governance or permission features beyond human-in-the-loop, limits.

### CrewAI - https://docs.crewai.com/en/introduction (the fetched URL carried a versioned path, v1.15.27; meaning of the number unconfirmed)
- An open-source framework for autonomous agent teams (Crews) and event-driven workflows (Flows); guidance is to start production applications with a Flow. Flows offer persisted state, conditions, loops and branching.
- Marketing language about "enterprise security and compliance" with no concrete permission or policy features described. Not stated: licence, hosting model, protocols, memory detail, streaming support, limits. The page carried a `noindex` robots tag.

### OpenAI Agents SDK - https://openai.github.io/openai-agents-python/
- A lightweight Python library with few abstractions, presented as the production-ready successor of the earlier Swarm experiment. Primitives: agents, handoffs/agents-as-tools, guardrails (input/output validation).
- Built-in MCP integration for remote tools; persistent "Sessions" memory; human-in-the-loop with interruptions and resume; sandboxed agent workspaces; realtime and voice agents; tracing. Uses OpenAI's Responses API by default; a Models page covers other providers. Not stated: licence, hosting model, A2A, AG-UI.

### Mastra - https://mastra.ai/docs
- A TypeScript framework for AI agents and applications; maker not named on the page; Node.js 22.18.0 or later for direct TypeScript execution; a local Studio UI for agents, workflows and tools; a model router with provider/model strings; integrations with common web frameworks. Memory appears only inside the quickstart harness. Not stated: licence, protocols, governance, hosting detail, limits.
- Note: the page contained text addressed to AI agents (model IDs and function signatures); it was ignored and is treated as vendor documentation, not confirmation.

### Microsoft Agent Framework - https://learn.microsoft.com/en-us/agent-framework/overview/ (docs page last updated 2026-08-25)
- Agents, a harness agent for long multi-step tasks (planning, context compaction, file access, memory, tool approval), graph and functional workflows, and integrations. C#, Python and Go (Go in public preview with listed gaps). Presented as the successor to Semantic Kernel and AutoGen. Providers named include Foundry, Anthropic, Azure OpenAI, OpenAI and Ollama.
- MCP clients and hosted MCP tools are mentioned; A2A and AG-UI are not. Middleware and filters are listed under safety; the page says users are responsible for third-party systems, data flows and their own content filters. Not stated: licence, hosting model.

### Gaps for this category
Licences are not stated on any of the five pages (the repositories were not opened); A2A and AG-UI are not mentioned on any of them; notability as of October 2026 was not independently verified; only one page per product was read, so no cross-source contradiction check was possible. Before any comparison sentence relies on a licence or a protocol, that fact needs its own source.

## Other personal and always-on agents (research subagent with Firecrawl, 2026-10-12; paraphrased relay, not independently re-read)

### Gemini Spark (Google) - https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/ (announcement dated 2026-05-19) and https://support.google.com/gemini/answer/17094507?hl=en (help page, undated)
- Described as a 24/7 personal agent that runs in the cloud on Gemini 3.5, so it keeps working when the device is off; integrates with Workspace apps; supports recurring or event-triggered tasks, reusable skills and multi-step workflows; MCP connections to some third-party services were announced.
- Help page: requires age 18+, a personal Google account, a Google AI Pro or Ultra subscription and Keep Activity on; available in the Gemini mobile app, Mac app and web, not in the EEA, Nigeria, Switzerland or the UK; up to 15 tasks at once; runs in a remote browser and computer or the user's local Chrome; remote browser data persists until the user deletes it; asks for confirmation before sending communications, modifying data, purchases, form submissions and Google sign-in; pauses for the user on passwords and payments.
- Stated risks: experimental, early-stage; safeguards do not guarantee protection; prompt-injection warning; scheduled tasks running offline may not be stoppable. Data-use and training terms are not on these pages (the help page points to a privacy hub that was not read in full).

### Claude Cowork (Anthropic) - https://claude.com/product/cowork and https://www.anthropic.com/engineering/how-we-contain-claude (engineering post dated 2026-05-25)
- An agent for handing off knowledge-work tasks that works in folders and tools the user chooses; the desktop app is the full version, web and mobile are labelled beta; tasks can be scheduled; a built-in browser (blog dated 2026-08-26); computer use is a research preview; plans Pro, Max, Team and Enterprise; usage limits apply; can run through a Claude account or the customer's own cloud (Bedrock, Google Cloud, Microsoft Foundry).
- Controls: user-selected folders and tools, deletions need approval, an optional plan-approval setting, admin toggles, spend limits and role-based permissions, activity export to a SIEM.
- Containment design (engineering post): agent loop on the host, code execution in a local VM, only the selected workspace mounted with read-only, read-write and no-delete modes, credentials kept in the host keychain, a past exfiltration route through an allowed API domain was fixed with an in-VM proxy, persistent-memory poisoning listed as a future risk.
- Not stated on the product page: memory behaviour, training or data-use terms.

### Microsoft Scout, now Autopilot - https://www.microsoft.com/en-us/copilot/blog/2026/06/02/introducing-microsoft-scout-your-always-on-personal-agent/ (2026-06-02) and https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/ (2026-09-25)
- Always-on agents with their own governed identity, memory, computer and workspace, living in the customer's tenant; talk to them in Teams and Outlook; enterprise governance (scoped credentials, approved resources, sensitivity labels, data-loss prevention, human sign-off for sensitive actions). Scout was built on OpenClaw open-source technology; the September post says Autopilot was previously called Scout, cloud-hosted, in private preview, with usage-based billing separate from per-user licences.
- The June and September posts describe the product differently (experimental desktop release versus tenant-hosted cloud agent) and do not say whether it is a re-architecture. Both are enterprise or tenant-bound, not a consumer assistant. Training and memory-deletion terms are not stated.

### Perplexity Comet - https://www.perplexity.ai/comet (thin evidence)
- A browser that acts as a personal assistant on Mac, Windows, iOS and Android; the assistant asks before interacting with the browser. No always-on behaviour, memory detail, cloud-versus-local detail or training statement was found. A weak match for this category; to be swapped or dropped rather than relied on.

### Gaps for this category
No first-party Anthropic page on Cowork memory or training was fetched; Google's privacy hub was not read; the Google announcement (US Ultra beta) and help page (Pro or Ultra) differ on tiers; Microsoft's two posts describe Autopilot differently; only one primary page per product beyond those listed.

## Local-first assistants and model runners (research subagent with Firecrawl, 2026-10-12; paraphrased relay; dollar amounts deliberately omitted because they change)

### Ollama - https://github.com/ollama/ollama and https://ollama.com/pricing
- A runner for open models with a CLI and REST API on macOS, Windows, Linux and Docker; MIT licence shown on the repository; llama.cpp backend named; `ollama launch` connects it to coding tools and a messaging assistant integration. Local use is stated to be free and unlimited; paid plans are for cloud-hosted models, which need an account; the pricing page says cloud prompts and responses are not logged or trained on. Not stated: whether local use needs an account; memory.

### LM Studio and Bionic - https://lmstudio.ai/ , https://lmstudio.ai/docs/app , https://lmstudio.ai/app-privacy
- The home page now leads with Bionic, described as a separate agent app for open models that can use local models, a cloud service for open models with a zero-data-retention claim, or remote models from another device. Classic LM Studio runs llama.cpp and MLX models on macOS, Windows and Linux, acts as an MCP client, serves OpenAI-compatible endpoints and supports offline document chat. The privacy policy (effective June 2026) says messages, chats and documents with local models never leave the device and states no telemetry. A post says LM Studio is free for work as well as home. Not stated: whether the app is open source; whether the classic app requires an account; paid-plan prices.

### Jan - https://www.jan.ai/ and https://www.jan.ai/docs/desktop
- Presented as an open-source ChatGPT replacement for macOS, Windows and Linux with full offline support and no account needed; Apache 2.0 stated in its docs; llama.cpp inference; local OpenAI-compatible server; MCP connectors; a preview mode for autonomous file and web tasks; a separate agent product and a hosted web version also exist. Memory is marked "coming soon" on the home page while the agent docs list a Memory section (status unclear). Version banners on the home page and docs disagree (staleness).

### Open WebUI - https://docs.openwebui.com/ and https://docs.openwebui.com/license
- A self-hosted AI platform and front end (not a model runner) that works with Ollama and OpenAI-compatible APIs and is described as able to run fully offline; Docker, pip, Kubernetes and a desktop app are install routes. Agent-style tools (a terminal tool, a local agent runtime), RAG, web search and an MCP-to-OpenAPI bridge are listed. Licence: BSD-3-Clause up to v0.6.5; from v0.6.6 a branding-protection clause applies and the page says this is not an OSI-approved open-source licence.

### GPT4All - https://www.nomic.ai/gpt4all and https://github.com/nomic-ai/gpt4all
- A local chatbot from Nomic AI for Windows, macOS and Linux with local document chat; MIT licence. The visible repository activity suggests it is in maintenance mode (last commit May 2025, last README-listed release July 2024); whether it is actively developed in October 2026 is unverified. The product page has a `noindex` robots tag.

### Gaps
Account requirements for local use are not stated on official pages for Ollama and classic LM Studio; Jan's privacy and telemetry details were not fetched; no independent third-party source was used for any comparative claim (security audits, performance); AnythingLLM and llamafile were not researched.

## Agent memory systems (research subagent with Firecrawl, 2026-10-12; paraphrased relay; some pricing and release facts came from model-extracted answers and need a spot-check)

### Mem0 - https://github.com/mem0ai/mem0 and https://docs.mem0.ai/introduction
- A memory layer for agents; Apache 2.0; library, self-hosted server and managed cloud; scopes memories by user, session and agent; hybrid retrieval (semantic, keyword, entity) with time-aware ranking; Python and TypeScript SDKs, CLI, REST; requires an LLM. Published benchmark figures are for the managed platform and self-reported by the vendor, which says it has optimisations not in the open-source SDK. Pricing model: free tier, paid tiers, enterprise with on-premises; the free-tier allowance is described inconsistently on its own pricing page.

### Zep and Graphiti - https://help.getzep.com/overview , https://help.getzep.com/context-lake , https://github.com/getzep/graphiti
- Zep is a cloud-managed context layer built on temporal context graphs (facts can be invalidated with history kept), with per-user and shared graphs; SDKs for Python, TypeScript and Go; bring-your-own-cloud on enterprise plans; credit-based pricing. Graphiti is its Apache-2.0 open-source framework for temporal context graphs, self-hosted on a graph database you supply, with hybrid search and an MCP server. The docs say context does not guarantee accuracy and that the application owns tool permissions.

### Letta - https://docs.letta.com/ and https://docs.letta.com/configuration/memory
- A platform for stateful agents (formerly MemGPT); Apache-2.0 shown; memory is a git-backed filesystem the agent can inspect and edit; cloud or self-hosted; SDK, CLI, desktop app and chat-channel integrations; the older server repository is archived and development has moved to a new repository. Storage engine and search methods are not stated on the pages read.

### Cognee - https://github.com/topoteretes/cognee
- An open-source AI memory platform (Apache-2.0) combining graph, vector and relational storage; keyword, hybrid and graph search; scopes by dataset, session and node set; Python, TypeScript and Rust clients, MCP and REST; self-hosted or cloud. Latest release shown v1.6.1 (2026-09-24), with an unreconciled newer reference.

### LangMem - https://langchain-ai.github.io/langmem/
- A Python library (MIT) for long-term agent memory with hot-path tools and a background memory manager; storage and search are delegated to the LangGraph store; no hosted service; docs may be stale.

### Gaps
Letta's storage model and self-host pricing are not stated; Zep's own open-source status is not stated (only Graphiti); Cognee cloud pricing and limits were not checked; vendor benchmark claims are self-reported and must not be repeated as fact.

## Desktop and self-hosted AI clients (research subagent with Firecrawl, 2026-10-12; items marked [query-extract] came from a model-generated page extraction and are secondary until spot-checked)

### Cherry Studio - https://github.com/CherryHQ/cherry-studio and https://www.cherry-ai.com/
- A desktop client for many LLM providers by CherryHQ for Windows, macOS and Linux; community edition under AGPL-3.0; [query-extract] commercial use allowed when AGPL terms are met, with a commercial licence offered; MCP support; 300+ preset assistants; an enterprise edition with team knowledge bases; the official site says chat history, settings and knowledge-base files are stored locally; latest release shown v2.1.6 (2026-10-11) [query-extract]. This is the project The Boss is built on.

### LibreChat - https://www.librechat.ai/ and https://github.com/LibreChat-AI/LibreChat
- A self-hosted, open-source AI platform (web application run with Docker or Node, not a desktop installer); MIT [query-extract]; agents, code interpreter, artifacts, MCP, memory, web search, multi-user login and SSO; the docs banner says LibreChat is joining ClickHouse (not read). Setup creates an account and needs a model API key.

### Claude Desktop - https://claude.com/download
- Anthropic's desktop app for macOS, Windows and Linux (beta) with iOS and Android apps; accounts sync conversations, projects and memory across devices; connectors and locally installed extensions; Claude models only implied; source code and licence not stated (proprietary product, not stated on the page).

### ChatGPT desktop app - https://openai.com/chatgpt/download/
- OpenAI's desktop app bringing ChatGPT Work and Codex with context from files and screen content; sign-in implied; MCP, memory, local data and licence not stated on the download page.

### Msty Studio - https://msty.ai/products/studio/ and https://msty.ai/pricing/
- A desktop and web workspace combining local and hosted models with agent mode, a knowledge-stack feature, MCP tools and team controls; free to start with limited desktop features on the free tier; the home page claims zero product telemetry and says formal SOC 2 and ISO 27001 certification are not yet complete. Account requirement and whether data stays local are not stated on the pages read.

### Gaps
Cherry Studio's licence and commercial-use wording must be checked against its LICENSE file before publishing; the Cherry Studio site and README differ in wording ("free for personal use" versus AGPL-governed commercial use); no official statement on data location for LibreChat beyond "self-hosted"; Claude Desktop and ChatGPT desktop licence, retention and MCP details not on the pages read.
