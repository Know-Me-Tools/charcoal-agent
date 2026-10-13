# Agent runtimes and frameworks compared with the Universal Agent Runtime (Landscape)

This page compares five agent frameworks and runtimes with the Universal Agent Runtime (UAR), the server made by Prometheus AGS that KnowMe is built on and The Boss bundles. The facts about the other five come from one official documentation page each, read on 2026-10-12; where a page did not say something, this page says "not stated" rather than guessing. UAR's facts come from its public repository. The comparison is by capability and trade-off, not a ranking.

## What an agent runtime or framework is (Landscape)

An agent framework is a library a developer uses to build agents: it provides the loop that calls a model, runs tools and keeps state. An agent runtime is a running service that does the same for applications that connect to it. LangGraph, CrewAI, the OpenAI Agents SDK and Mastra present themselves mainly as libraries in Python or TypeScript; the Microsoft Agent Framework is a library in C#, Python and Go; the Universal Agent Runtime is a server process written in Rust that clients reach over HTTP and server-sent events. That shape difference drives most of what follows.

Source: LangChain documentation, LangGraph overview, retrieved 2026-10-12.
Source: CrewAI documentation, Introduction, retrieved 2026-10-12.
Source: OpenAI Agents SDK documentation (Python), retrieved 2026-10-12.
Source: Mastra documentation, retrieved 2026-10-12.
Source: Microsoft Learn, Agent Framework overview (page updated 2026-08-25), retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.

## LangGraph, according to its documentation (Landscape)

According to LangChain's documentation, LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents that mixes deterministic and model-driven steps in one graph; it is built by LangChain Inc but usable without LangChain. Listed capabilities: persistence and durable execution (resume after failure), streaming, human-in-the-loop inspection and modification of state, and short-term and long-term memory. LangSmith, a separate product, covers tracing, evaluation and deployment. Not stated on the page: licence, support for MCP, A2A or AG-UI, permission or policy features beyond human-in-the-loop, limits.

Source: LangChain documentation, LangGraph overview, retrieved 2026-10-12.

## CrewAI, according to its documentation (Landscape)

According to CrewAI's documentation, CrewAI is an open-source framework for autonomous agent teams (Crews) and event-driven workflows (Flows), and its guidance is to start production applications with a Flow, which offers persisted state, conditions, loops and branching. The page uses general enterprise-security language without describing concrete permission or policy features. Not stated: licence, hosting model, protocols, memory detail, streaming support, limits.

Source: CrewAI documentation, Introduction, retrieved 2026-10-12.

## OpenAI Agents SDK, according to its documentation (Landscape)

According to its documentation, the OpenAI Agents SDK is a lightweight Python library with few abstractions, presented as the production-ready successor of the earlier Swarm experiment. Its primitives are agents, handoffs or agents-as-tools, and guardrails for input and output validation. It lists built-in MCP integration for remote tools, persistent Sessions memory, human-in-the-loop with interruptions and resume, sandboxed agent workspaces, realtime and voice agents, and tracing. It uses OpenAI's Responses API by default, with a Models page covering other providers. Not stated: licence, hosting model, A2A, AG-UI.

Source: OpenAI Agents SDK documentation (Python), retrieved 2026-10-12.

## Mastra, according to its documentation (Landscape)

According to its documentation, Mastra is a TypeScript framework for AI agents and applications that needs Node.js 22.18.0 or later for direct TypeScript execution, provides a local Studio interface for agents, workflows and tools, a model router addressed by provider and model strings, and integrations with common web frameworks. Memory appears in the quickstart harness. The maker is not named on the page. Not stated: licence, protocols, governance, hosting detail, limits.

Source: Mastra documentation, retrieved 2026-10-12.

## Microsoft Agent Framework, according to its documentation (Landscape)

According to Microsoft Learn, the Microsoft Agent Framework provides agents, a harness agent for long multi-step tasks (planning, context compaction, file access, memory, tool approval), graph and functional workflows, and integrations, in C#, Python and Go, with Go in public preview with listed gaps. It is presented as the successor to Semantic Kernel and AutoGen. Named providers include Foundry, Anthropic, Azure OpenAI, OpenAI and Ollama. MCP clients and hosted MCP tools are mentioned; middleware and filters are listed under safety, and the page says users are responsible for third-party systems, data flows and their own content filters. Not stated: licence, hosting model, A2A, AG-UI.

Source: Microsoft Learn, Agent Framework overview (page updated 2026-08-25), retrieved 2026-10-12.

## The Universal Agent Runtime, according to its repository (Landscape)

According to its README and architecture document, the Universal Agent Runtime is one Rust process at version 1.0.0 that picks and calls models through a router, runs tools under a policy, searches documents with hybrid retrieval and streams citations, keeps optional memory, and streams results to a user interface over HTTP and server-sent events. Its own operator interface is a React web app. Tools can come from MCP servers or be built in. SurrealDB is the authoritative store in the default server bundle. It is made by Prometheus AGS.

Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.

## Protocol support across agent runtimes and frameworks (Landscape)

- Universal Agent Runtime: an OpenAI-compatible API under `/v1`, an AG-UI event stream, A2UI surfaces for declarative interfaces, an MCP client with a governed tool bridge, and an A2A endpoint for other agents, per its README.
- OpenAI Agents SDK: MCP built in; A2A and AG-UI not stated.
- Microsoft Agent Framework: MCP clients and hosted MCP tools; A2A and AG-UI not stated.
- LangGraph, CrewAI, Mastra: MCP, A2A and AG-UI not stated on the pages read.

"Not stated" means the single page read did not mention it; the project may support the protocol elsewhere in its documentation.

Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: OpenAI Agents SDK documentation (Python), retrieved 2026-10-12.
Source: Microsoft Learn, Agent Framework overview (page updated 2026-08-25), retrieved 2026-10-12.
Source: LangChain documentation, LangGraph overview, retrieved 2026-10-12.
Source: CrewAI documentation, Introduction, retrieved 2026-10-12.
Source: Mastra documentation, retrieved 2026-10-12.

## Governance and permissions across agent runtimes and frameworks (Landscape)

In the Universal Agent Runtime, every tool call, from an MCP server or built in, is checked against the tool's schema, then a policy written in the Cedar policy language returns Allow, RequireApproval or Deny, and the decision is written to an audit record; a user's approval cannot override a Deny. By default every API request needs a signed token. The OpenAI Agents SDK describes guardrails for input and output validation and human-in-the-loop interruptions. LangGraph describes human-in-the-loop inspection and modification of state. The Microsoft Agent Framework describes tool approval in its harness agent and middleware and filters under safety. CrewAI's and Mastra's pages do not describe concrete permission features.

Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: OpenAI Agents SDK documentation (Python), retrieved 2026-10-12.
Source: LangChain documentation, LangGraph overview, retrieved 2026-10-12.
Source: Microsoft Learn, Agent Framework overview (page updated 2026-08-25), retrieved 2026-10-12.
Source: CrewAI documentation, Introduction, retrieved 2026-10-12.
Source: Mastra documentation, retrieved 2026-10-12.

## Licences across agent runtimes and frameworks (Landscape)

The Universal Agent Runtime's code, including its Rust, Python and TypeScript SDKs, is MIT licensed and the repository has a LICENSE file; its README records relicensing from AGPL-3.0-only to MIT on 2026-08-07. For LangGraph, CrewAI, the OpenAI Agents SDK, Mastra and the Microsoft Agent Framework, the licence is not stated on the documentation pages read, and their repositories were not opened for this knowledge base, so no licence is stated here for any of them. Check each project's repository before relying on its licence.

Source: Universal Agent Runtime LICENSE, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.

## Where the Universal Agent Runtime is weaker (our minuses) (Landscape)

- A server to deploy rather than a library to import: developers who want to add an agent loop to a Python or TypeScript program will find LangGraph, the OpenAI Agents SDK, Mastra or the Microsoft Agent Framework a shorter path.
- A far smaller community and ecosystem than LangChain's, OpenAI's or Microsoft's, and no hosted service comparable to LangSmith.
- Several areas are Preview or Experimental in its own support matrix: desktop and native WASM are Preview, mobile is Experimental, and the Windows native archive is Experimental.
- Version 1.0.0 is recent; its compatibility promise covers only rows its matrix marks Stable.
- Its notability and adoption as of October 2026 are not independently verified by any source in this knowledge base.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.

## Where the Universal Agent Runtime differs in its favour (their minuses, our pluses) (Landscape)

These are documented design differences, not benchmarks. UAR's documentation describes one governed path for every tool call with Cedar policy decisions and an audit record, which none of the five pages read describes in that form. UAR documents five protocols on one surface (OpenAI-compatible API, AG-UI, A2UI, MCP, A2A), where the pages read for the others state MCP at most. UAR states an MIT licence in a LICENSE file; the others' licences were not stated on the pages read. Because clients never talk to model providers, tools or storage directly, a browser or desktop client can be thin; that is a trade-off, since it also means running a server.

Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Universal Agent Runtime LICENSE, retrieved 2026-10-12.

## Choosing an agent runtime or framework (Landscape)

If you write Python and want graph-shaped, durable agents with a mature tracing product, LangGraph fits. If you build on OpenAI's models and want a small library with MCP and voice, the OpenAI Agents SDK fits. If you write TypeScript, Mastra fits. If you build in C# or on Azure, the Microsoft Agent Framework fits. If you want a team-of-agents abstraction, CrewAI fits. If you want a separate, governed runtime process that enforces tool policy and audit for every client, speaks several agent protocols, and keeps your clients thin, the Universal Agent Runtime is built for that, with the deployment and ecosystem costs above.
