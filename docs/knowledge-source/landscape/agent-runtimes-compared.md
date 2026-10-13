---
type: Concept
title: Agent runtimes and frameworks compared with the Universal Agent Runtime
description: "LangGraph, CrewAI, the OpenAI Agents SDK, Mastra and the Microsoft Agent Framework compared with the Universal Agent Runtime by capability, protocol support, governance and licence, with 'not stated' where the pages read did not say."
status: draft
generated:
  by: km-cmo/fable
  at: "2026-10-12T22:00:00+00:00"
stale_after: "2026-11-10T00:00:00+00:00"
tags: [landscape, agent-runtimes, langgraph, crewai, openai-agents-sdk, mastra, microsoft-agent-framework, universal-agent-runtime]
sources:
  - id: langgraph
    resource: https://docs.langchain.com/oss/python/langgraph/overview
    title: "LangChain documentation, LangGraph overview"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: crewai
    resource: https://docs.crewai.com/en/introduction
    title: "CrewAI documentation, Introduction"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: openai-agents
    resource: https://openai.github.io/openai-agents-python/
    title: "OpenAI Agents SDK documentation (Python)"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: mastra
    resource: https://mastra.ai/docs
    title: "Mastra documentation"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: ms-agent-framework
    resource: https://learn.microsoft.com/en-us/agent-framework/overview/
    title: "Microsoft Learn, Agent Framework overview"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-arch
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/ARCHITECTURE.md
    title: "Universal Agent Runtime architecture overview"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: "Universal Agent Runtime product support matrix"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-license
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/LICENSE
    title: "Universal Agent Runtime LICENSE"
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Agent runtimes and frameworks compared with the Universal Agent Runtime

This page compares five agent frameworks and runtimes with the Universal Agent Runtime (UAR), the server made by Prometheus AGS that KnowMe is built on and The Boss bundles. The facts about the other five come from one official documentation page each, read on 2026-10-12; where a page did not say something, this page says "not stated" rather than guessing. UAR's facts come from its public repository. The comparison is by capability and trade-off, not a ranking.

## What an agent framework is: the five libraries

An agent framework is a library a developer uses to build agents: it provides the loop that calls a model, runs tools and keeps state. LangGraph, CrewAI, the OpenAI Agents SDK and Mastra present themselves mainly as libraries in Python or TypeScript; the Microsoft Agent Framework is a library in C#, Python and Go.[^langgraph][^crewai][^openai-agents][^mastra][^ms-agent-framework]

## What an agent runtime is: the Universal Agent Runtime

An agent runtime is a running service that does the same work for applications that connect to it. The Universal Agent Runtime is a server process written in Rust that clients reach over HTTP and server-sent events; the browser never talks to model providers, tools or storage directly.[^uar-readme] That shape difference, library versus server, drives most of what follows.

## LangGraph, according to its documentation

According to LangChain's documentation, LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents that mixes deterministic and model-driven steps in one graph; it is built by LangChain Inc but usable without LangChain. Listed capabilities: persistence and durable execution (resume after failure), streaming, human-in-the-loop inspection and modification of state, and short-term and long-term memory. LangSmith, a separate product, covers tracing, evaluation and deployment.[^langgraph] Not stated on the page: licence, MCP, A2A, AG-UI, permission features beyond human-in-the-loop, limits.

## CrewAI, according to its documentation

According to CrewAI's documentation, CrewAI is an open-source framework for autonomous agent teams (Crews) and event-driven workflows (Flows), and its guidance is to start production applications with a Flow, which offers persisted state, conditions, loops and branching. The page uses general enterprise-security language without describing concrete permission or policy features.[^crewai] Not stated: licence, hosting model, protocols, memory detail, streaming support, limits.

## OpenAI Agents SDK, according to its documentation

According to its documentation, the OpenAI Agents SDK is a lightweight Python library with few abstractions, presented as the production-ready successor of the earlier Swarm experiment. Its primitives are agents, handoffs or agents-as-tools, and guardrails for input and output validation. It lists built-in MCP integration for remote tools, persistent Sessions memory, human-in-the-loop with interruptions and resume, sandboxed agent workspaces, realtime and voice agents, and tracing. It uses OpenAI's Responses API by default, with a Models page covering other providers.[^openai-agents] Not stated: licence, hosting model, A2A, AG-UI.

## Mastra, according to its documentation

According to its documentation, Mastra is a TypeScript framework for AI agents and applications; Node.js 22.18.0+ can run its TypeScript examples directly. It provides a local Studio interface for agents, workflows and tools, a model router addressed by provider and model strings, and integrations with common web frameworks. Memory appears in the quickstart harness.[^mastra] The maker is not named on the page. Not stated: licence, protocols, governance, hosting detail, limits.

## Microsoft Agent Framework, according to its documentation

According to Microsoft Learn, the Microsoft Agent Framework provides agents, a harness agent for long multi-step tasks (planning, context compaction, file access, memory, tool approval), graph and functional workflows, and integrations, in C#, Python and Go, with Go in public preview with listed gaps. It is presented as the successor to Semantic Kernel and AutoGen. Named providers include Foundry, Anthropic, Azure OpenAI, OpenAI and Ollama. MCP clients and hosted MCP tools are mentioned; middleware and filters are listed under safety, and the page says users are responsible for third-party systems, data flows and their own content filters.[^ms-agent-framework] Not stated: licence, hosting model, A2A, AG-UI.

## The Universal Agent Runtime, according to its repository

According to its README and architecture document, the Universal Agent Runtime is one Rust process at version 1.0.0 that picks and calls models through a router, runs tools under a policy, searches documents with hybrid retrieval and streams citations, keeps optional memory, and streams results to a user interface over HTTP and server-sent events. Its own operator interface is a React web app. Tools can come from MCP servers or be built in. SurrealDB is the authoritative store in the default server bundle.[^uar-readme][^uar-arch] It is made by Prometheus AGS.

## Protocol support in the Universal Agent Runtime

The Universal Agent Runtime's README lists an OpenAI-compatible API under `/v1`, an AG-UI event stream, A2UI surfaces for declarative interfaces, an MCP client with a governed tool bridge, and an A2A endpoint for other agents.[^uar-readme]

## Protocol support in the five frameworks, as stated

- OpenAI Agents SDK: MCP built in; A2A and AG-UI not stated.[^openai-agents]
- Microsoft Agent Framework: MCP clients and hosted MCP tools; A2A and AG-UI not stated.[^ms-agent-framework]
- LangGraph, CrewAI, Mastra: MCP, A2A and AG-UI not stated on the pages read.[^langgraph][^crewai][^mastra]

"Not stated" means the single page read did not mention it; the project may support the protocol elsewhere in its documentation. It is not a shortcoming.

## Governance and permissions in the Universal Agent Runtime

In the Universal Agent Runtime, every tool call, from an MCP server or built in, is checked against the tool's schema, then a policy written in the Cedar policy language returns Allow, RequireApproval or Deny, and the decision is written to an audit record; a user's approval cannot override a Deny. By default every API request needs a signed token.[^uar-arch][^uar-readme]

## Governance and permissions in the five frameworks, as stated

The OpenAI Agents SDK describes guardrails for input and output validation and human-in-the-loop interruptions.[^openai-agents] LangGraph describes human-in-the-loop inspection and modification of state.[^langgraph] The Microsoft Agent Framework describes tool approval in its harness agent and middleware and filters under safety.[^ms-agent-framework] CrewAI's and Mastra's pages do not describe concrete permission features.[^crewai][^mastra]

## Licences across agent runtimes and frameworks

The Universal Agent Runtime's code, including its Rust, Python and TypeScript SDKs, is MIT licensed and the repository has a LICENSE file; its README records relicensing from AGPL-3.0-only to MIT on 2026-08-07.[^uar-license][^uar-readme] For LangGraph, CrewAI, the OpenAI Agents SDK, Mastra and the Microsoft Agent Framework, the licence is not stated on the documentation pages read, and their repositories were not opened for this knowledge base, so no licence is stated here for any of them. Check each project's repository before relying on its licence.

## Where the Universal Agent Runtime is weaker: deployment and ecosystem (our minuses)

- A server to deploy rather than a library to import: developers who want to add an agent loop to a Python or TypeScript program will find LangGraph, the OpenAI Agents SDK, Mastra or the Microsoft Agent Framework a shorter path.
- A far smaller community and ecosystem than LangChain's, OpenAI's or Microsoft's, and no hosted service comparable to LangSmith.
- Its adoption as of October 2026 is not independently verified by any source in this knowledge base.

## Where the Universal Agent Runtime is weaker: maturity (our minuses)

- Several areas are Preview or Experimental in its own support matrix: desktop and native WASM are Preview, mobile is Experimental, and the Windows native archive is Experimental.[^uar-matrix]
- Version 1.0.0 is recent; its compatibility promise covers only rows its matrix marks Stable.[^uar-matrix]

## Differences: shape

The frameworks run inside the developer's own program, so there is no extra process to deploy and the developer's language is the integration surface; the Universal Agent Runtime runs as a separate server, so every client shares one policy and audit path but must reach it over the network.[^langgraph][^uar-readme]

## Differences: governance

UAR documents a Cedar policy decision and an audit record for every tool call, while the frameworks document in-process controls: guardrails and human-in-the-loop in the OpenAI Agents SDK, state inspection in LangGraph, tool approval and middleware in the Microsoft Agent Framework.[^uar-arch][^openai-agents][^ms-agent-framework]

## Differences: tooling and ecosystem

LangChain pairs LangGraph with LangSmith for tracing, evaluation and deployment, and OpenAI's SDK documents tracing, realtime and voice agents; UAR documents no hosted tooling and no voice agents.[^langgraph][^openai-agents][^uar-readme] UAR documents hybrid document retrieval with streamed citations and an operator web interface inside the runtime, which the five framework pages do not describe in that form.[^uar-readme] The frameworks have larger communities; UAR's version 1.0.0 is recent and its support matrix marks several areas Preview or Experimental.[^uar-matrix]

## Choosing an agent runtime or framework

If you write Python and want graph-shaped, durable agents with a mature tracing product, LangGraph fits. If you build on OpenAI's models and want a small library with MCP and voice, the OpenAI Agents SDK fits. If you write TypeScript, Mastra fits. If you build in C# or on Azure, the Microsoft Agent Framework fits. If you want a team-of-agents abstraction, CrewAI fits. If you want a separate, governed runtime process that enforces tool policy and audit for every client, speaks several agent protocols, and keeps your clients thin, the Universal Agent Runtime is built for that, with the deployment and ecosystem costs above.
