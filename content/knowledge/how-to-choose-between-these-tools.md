# How to choose between these tools (Landscape)

This page turns the landscape comparisons in this knowledge base into guidance by need. For each need it names when another vendor's tool is the better fit and when a KnowMe AI, LLC or Prometheus AGS product is. It makes no claim that any product outranks another; the comparisons behind it are capability and trade-off descriptions taken from each maker's own pages as of 2026-10-12, and those facts change. KnowMe is not released, so where KnowMe is named the fit is a design fit, not something you can install today.

## If your first need is that your data stays on your own hardware: tools available today (Landscape)

A local-first assistant is the fit: Jan states full offline support with no account, and LM Studio's privacy policy states that chats with local models never leave the device and that it has no telemetry. Open WebUI, self-hosted, is the fit if several people share one instance. The Boss keeps you in one desktop workspace with your own provider credentials or local models, with the caveat that its own telemetry statement has not yet been published.

Source: Jan home page, retrieved 2026-10-12.
Source: LM Studio app privacy policy, retrieved 2026-10-12.
Source: Open WebUI documentation, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## If your first need is that your data stays on your own hardware: KnowMe (Landscape)

KnowMe is being designed for exactly this need, with an encrypted local database and sync only between your own devices and servers you run, but it is not released; it is the one to watch, not the one to install. Until it ships, the tools in the previous section are what you can use.

## If your first need is an agent that works while you are away: dots and Spark (Landscape)

An always-on cloud agent from a large vendor is the fit, within its plan and region. OpenAI dots run on eligible ChatGPT plans and are not available to Pro users in the EEA, Switzerland or the UK per OpenAI's help page. Gemini Spark is for Google AI Pro or Ultra subscribers outside the EEA, Nigeria, Switzerland and the UK, and Google says it keeps working when you close your laptop or lock your phone.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Google blog, The next evolution of the Gemini app (2026-05-19), retrieved 2026-10-12.

## If your first need is an agent that works while you are away: Cowork and Autopilot (Landscape)

Claude Cowork, which Anthropic says runs scheduled tasks unattended and keeps working in the cloud when the laptop is closed, runs through a Claude account or the customer's own cloud. Microsoft Autopilot lives in the customer's tenant per Microsoft and is an enterprise offering.

Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

## Why no KnowMe AI, LLC product is an always-on agent today (Landscape)

No KnowMe AI, LLC or Prometheus AGS product works while you are away today. KnowMe's design puts agents on hardware the person controls, which means they do not run while that hardware is off unless the person runs a server; its scheduled agents (Hands) are not built. The Boss is a desktop workspace, not an always-on agent.

Source: The Boss download page, retrieved 2026-10-12.

## If you are a developer building agents: the frameworks (Landscape)

If you write Python and want graph-shaped, durable agents with a mature tracing product, LangGraph is the fit. If you build on OpenAI's models and want a small library with MCP and voice, the OpenAI Agents SDK is the fit. If you write TypeScript, Mastra is the fit. If you build in C# or on Azure, the Microsoft Agent Framework is the fit.

Source: LangChain documentation, LangGraph overview, retrieved 2026-10-12.
Source: OpenAI Agents SDK documentation (Python), retrieved 2026-10-12.
Source: Mastra documentation, retrieved 2026-10-12.
Source: Microsoft Learn, Agent Framework overview, retrieved 2026-10-12.

## If you are a developer building agents: the Universal Agent Runtime (Landscape)

The Universal Agent Runtime is the fit when you want a separate, governed server that enforces Cedar tool policy and audit for every client, speaks the OpenAI-compatible API, AG-UI, A2UI, MCP and A2A, and keeps clients thin, and you accept running a server with a small ecosystem and a 1.x line that began on 2026-07-12, with v1.2.3 the latest stable release.

Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Universal Agent Runtime releases, retrieved 2026-10-24.

## If you need a memory layer for agents: the hosted and library options (Landscape)

If you want a managed service with SDKs in several languages, Mem0 is the fit. If your facts change over time and you want history kept, Zep or self-hosted Graphiti is the fit. If you already use LangGraph, LangMem is the natural add-on.

Source: Mem0 documentation, Introduction, retrieved 2026-10-12.
Source: Graphiti repository README, retrieved 2026-10-12.
Source: LangMem documentation, retrieved 2026-10-12.

## If you need a memory layer for agents: the Surreal Memory Server (Landscape)

The Surreal Memory Server is the fit only if you build on the Universal Agent Runtime, whose optional memory system is built on it, or if you want its durable operation ledger and self-hosting enough to accept source published for review on 2026-10-05, not a tested release, with scope separation documented as incomplete. BossFang uses its library, but BossFang's own status notes that this backend is not yet started at boot and that its writes are currently rejected.

Source: Universal Agent Runtime memory system, retrieved 2026-10-12.
Source: Surreal Memory Server source publication note (2026-10-05), retrieved 2026-10-12.
Source: Surreal Memory Server contract matrix, retrieved 2026-10-12.
Source: BossFang feature ledger, retrieved 2026-10-12.

## If you want a desktop client for several model providers (Landscape)

Cherry Studio is the fit if you need Linux or want the upstream project's own releases. LibreChat is the fit for a self-hosted web platform shared by several people with login. Msty is the fit if you want local and hosted models in one workspace with a stated no-telemetry claim. Claude Desktop or the ChatGPT desktop app is the fit if you want one vendor's assistant with account sync and you accept that it works only with its maker's models.

Source: Cherry Studio repository, retrieved 2026-10-12.
Source: LibreChat site, retrieved 2026-10-12.
Source: Msty home page, retrieved 2026-10-12.
Source: Anthropic, Claude download page, retrieved 2026-10-12.

## If you want a desktop client for several model providers: The Boss (Landscape)

The Boss is the fit if you want Cherry Studio's multi-provider client plus a bundled, governed agent runtime, BossFang, agent protocols and no account, on macOS or Windows, and you accept large, unsigned Windows installers and no Linux build.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss integration artifacts manifest, retrieved 2026-10-12.

## If you want an assistant that adapts to you over time (Landscape)

Today, the hosted assistants offer cross-device memory: OpenAI's dots receive and create memories across channels, and Claude Desktop syncs memory across devices through an account, in each case inside the vendor's systems. KnowMe is being designed for adaptation from a knowledge graph on your own devices, with no central account and no training on your data; that design is the reason to follow KnowMe, and the reason it cannot yet be recommended for use, since it has not shipped.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Anthropic, Claude download page, retrieved 2026-10-12.

## If you want something from KnowMe AI, LLC today (Landscape)

The Boss is the only KnowMe AI, LLC product you can download today: a free, open-source desktop workspace for macOS and Windows that needs no account. The Universal Agent Runtime, BossFang and the Surreal Memory Server are Prometheus AGS projects with public source; the runtime is at version v1.2.3 with an MIT licence, BossFang's end-user release path is not established, and the Surreal Memory Server is source published for review. KnowMe has no public release and no announced date; pricing has not been announced.

Source: The Boss download page, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Surreal Memory Server source publication note (2026-10-05), retrieved 2026-10-12.

## How this guidance was built (Landscape)

Each recommendation on this page rests on facts recorded in the landscape pages of this knowledge base, taken from the makers' own pages on 2026-10-12 and attributed there. Where a maker's page did not state something, those pages say "not stated". Nothing here reports benchmarks, prices or independent reviews, because this knowledge base has none to cite.
