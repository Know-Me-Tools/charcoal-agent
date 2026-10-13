# How to choose between these tools (Landscape)

This page turns the landscape comparisons in this knowledge base into guidance by need. For each need it names when another vendor's tool is the better fit and when a KnowMe AI, LLC or Prometheus AGS product is. It makes no claim that any product outranks another; the comparisons behind it are capability and trade-off descriptions taken from each maker's own pages as of 2026-10-12, and those facts change. KnowMe is not released, so where KnowMe is named the fit is a design fit, not something you can install today.

## If your first need is that your data stays on your own hardware (Landscape)

Today, a local-first assistant is the fit: Jan states full offline support with no account, and LM Studio's privacy policy states that chats with local models never leave the device and that it has no telemetry. Open WebUI, self-hosted, is the fit if several people share one instance. The Boss keeps you in one desktop workspace with your own provider credentials or local models, with the caveat that its own telemetry statement has not yet been published. KnowMe is being designed for exactly this need, with an encrypted local database and sync only between your own devices and servers you run, but it is not released; it is the one to watch, not the one to install.

Source: Jan home page, retrieved 2026-10-12.
Source: LM Studio app privacy policy (effective June 2026), retrieved 2026-10-12.
Source: Open WebUI documentation, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## If your first need is an agent that works while you are away (Landscape)

An always-on cloud agent from a large vendor is the fit, within its plan and region: OpenAI dots on eligible ChatGPT plans (not available to Pro users in the EEA, Switzerland or the UK per OpenAI's help page), Gemini Spark for Google AI Pro or Ultra subscribers outside the EEA, Nigeria, Switzerland and the UK, Claude Cowork on Anthropic's paid plans with scheduling, or Microsoft Autopilot for organisations in private preview. No KnowMe AI, LLC or Prometheus AGS product does this today. KnowMe's design puts agents on hardware the person controls, which means they do not run while that hardware is off unless the person runs a server; its scheduled agents (Hands) are not built.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.

## If you are a developer building agents (Landscape)

If you write Python and want graph-shaped, durable agents with a mature tracing product, LangGraph is the fit. If you build on OpenAI's models and want a small library with MCP and voice, the OpenAI Agents SDK is the fit. If you write TypeScript, Mastra is the fit. If you build in C# or on Azure, the Microsoft Agent Framework is the fit. The Universal Agent Runtime is the fit when you want a separate, governed server that enforces Cedar tool policy and audit for every client, speaks the OpenAI-compatible API, AG-UI, A2UI, MCP and A2A, and keeps clients thin, and you accept running a server with a small ecosystem and a recent 1.0.0 release.

Source: LangChain documentation, LangGraph overview, retrieved 2026-10-12.
Source: OpenAI Agents SDK documentation (Python), retrieved 2026-10-12.
Source: Mastra documentation, retrieved 2026-10-12.
Source: Microsoft Learn, Agent Framework overview (page updated 2026-08-25), retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.

## If you need a memory layer for agents (Landscape)

If you want a managed service with SDKs in several languages, Mem0 is the fit. If your facts change over time and you want history kept, Zep or self-hosted Graphiti is the fit. If you already use LangGraph, LangMem is the natural add-on. The Surreal Memory Server is the fit only if you build on the Universal Agent Runtime or BossFang, where it is already embedded, or if you want its durable operation ledger and self-hosting enough to accept software that was published for review on 2026-10-05 and is not a tested release, with scope separation documented as incomplete.

Source: Mem0 documentation, Introduction, retrieved 2026-10-12.
Source: Graphiti repository, retrieved 2026-10-12.
Source: LangMem documentation, retrieved 2026-10-12.
Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-12.

## If you want a desktop client for several model providers (Landscape)

Cherry Studio is the fit if you need Linux or want the upstream project's own releases. LibreChat is the fit for a self-hosted web platform shared by several people with login. Claude Desktop or the ChatGPT desktop app is the fit if you want one vendor's assistant with account sync and do not mind being tied to its models. The Boss is the fit if you want Cherry Studio's multi-provider client plus a bundled, governed agent runtime, BossFang, agent protocols and no account, on macOS or Windows, and you accept large, unsigned Windows installers and no Linux build.

Source: Cherry Studio repository, retrieved 2026-10-12.
Source: LibreChat site, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## If you want an assistant that adapts to you over time (Landscape)

Today, the hosted assistants hold the most adaptive memory: OpenAI's dots receive and create memories across channels, and Claude Desktop syncs memory across devices through an account, in each case inside the vendor's systems. KnowMe is being designed for adaptation from a knowledge graph on your own devices, with no central account and no training on your data; that design is the reason to follow KnowMe, and the reason it cannot yet be recommended for use, since it has not shipped.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## If you want something from KnowMe AI, LLC today (Landscape)

The Boss is the only KnowMe AI, LLC product you can download today: a free, open-source desktop workspace for macOS and Windows that needs no account. The Universal Agent Runtime, BossFang and the Surreal Memory Server are Prometheus AGS projects with public source; the runtime is at version 1.0.0 with an MIT licence, BossFang's end-user release path is not established, and the Surreal Memory Server is source published for review. KnowMe has no public release and no announced date; pricing has not been announced.

Source: The Boss download page, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-12.

## How this guidance was built (Landscape)

Each recommendation on this page rests on facts recorded in the landscape pages of this knowledge base, taken from the makers' own pages on 2026-10-12 and attributed there. Where a maker's page did not state something, those pages say "not stated". Nothing here reports benchmarks, prices or independent reviews, because this knowledge base has none to cite.
