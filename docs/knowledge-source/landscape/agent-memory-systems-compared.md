---
type: Concept
title: Agent memory systems compared with the Surreal Memory Server
description: "Mem0, Zep and Graphiti, Letta, Cognee and LangMem compared with the Surreal Memory Server by what they store, how they search, how they are hosted and licensed, and their status, with pluses and minuses on both sides."
status: draft
generated:
  by: km-cmo/fable
  at: "2026-10-12T22:00:00+00:00"
stale_after: "2026-11-10T00:00:00+00:00"
tags: [landscape, agent-memory, mem0, zep, graphiti, letta, cognee, langmem, surreal-memory-server]
sources:
  - id: mem0-repo
    resource: https://github.com/mem0ai/mem0
    title: "Mem0 repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: mem0-docs
    resource: https://docs.mem0.ai/introduction
    title: "Mem0 documentation, Introduction"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: zep-overview
    resource: https://help.getzep.com/overview
    title: "Zep documentation, Overview"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: zep-context-lake
    resource: https://help.getzep.com/context-lake
    title: "Zep documentation, Context lake"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: graphiti
    resource: https://github.com/getzep/graphiti
    title: "Graphiti repository README"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: letta-docs
    resource: https://docs.letta.com/
    title: "Letta documentation"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: letta-memory
    resource: https://docs.letta.com/configuration/memory
    title: "Letta documentation, Memory configuration"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: letta-repo
    resource: https://github.com/letta-ai/letta
    title: "Letta repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: letta-code
    resource: https://github.com/letta-ai/letta-code
    title: "Letta Code repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: cognee
    resource: https://github.com/topoteretes/cognee
    title: "Cognee repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: langmem
    resource: https://langchain-ai.github.io/langmem/
    title: "LangMem documentation"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: langmem-repo
    resource: https://github.com/langchain-ai/langmem
    title: "LangMem repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: "Surreal Memory Server README"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-intro
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/website/docs/intro.md
    title: "Surreal Memory Server documentation introduction"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-contract
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/MCP_REST_CONTRACT_MATRIX.md
    title: "Surreal Memory Server contract matrix"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-taskstreams
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/TASKSTREAMS-API.md
    title: "Surreal Memory Server TaskStreams REST API"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: "Surreal Memory Server source publication note (2026-10-05)"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-ops
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/operations.md
    title: "Surreal Memory Server operations reference"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: "Universal Agent Runtime memory system"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: "BossFang AGENTS.md"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: bf-ledger
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang/feature-ledger.md
    title: "BossFang feature ledger"
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Agent memory systems compared with the Surreal Memory Server

An agent memory system gives an AI agent something to remember between turns and sessions. This page compares five of them (Mem0, Zep and its open-source Graphiti, Letta, Cognee and LangMem) with the Surreal Memory Server, made by Prometheus AGS. The other products' facts are paraphrased from their own pages read on 2026-10-12. Vendor benchmark figures are not repeated here, because they are self-reported. Prices are out of scope for this knowledge base.

## Mem0, according to its pages

According to its repository and documentation, Mem0 is a memory layer for agents under the Apache 2.0 licence, available as a library, a self-hosted server and a managed cloud. It scopes memories by user, session and agent, retrieves with a hybrid of semantic, keyword and entity search with time-aware ranking, offers Python and TypeScript SDKs, a command-line interface and REST, and requires a language model.[^mem0-repo][^mem0-docs] Mem0 publishes benchmark figures for its managed platform; they are self-reported, and the vendor says the managed platform has optimisations not in the open-source SDK, so this knowledge base does not repeat the numbers.[^mem0-repo] Mem0 offers a managed cloud; see its own pricing page.

## Zep, according to its pages

According to Zep's documentation, Zep is a context layer built on temporal context graphs, in which a fact can be invalidated while its history is kept, with per-user and shared graphs and SDKs for Python, TypeScript and Go. Its documentation says context does not guarantee accuracy and that the application owns tool permissions.[^zep-overview][^zep-context-lake] Zep offers a managed cloud; see its own pricing page.

## Graphiti, according to its README

Graphiti's README describes Zep as a managed platform on a proprietary graph database, and describes Graphiti itself as Zep's Apache 2.0 open-source framework for temporal context graphs, self-hosted on a graph database the person supplies, with hybrid search and an MCP server.[^graphiti]

## Letta, according to its pages

Letta's repositories state the Apache 2.0 licence and describe Letta as formerly MemGPT; the V1 server repository is archived and development has moved to a new repository.[^letta-repo][^letta-code] According to its documentation, Letta is a platform for stateful agents in which memory is a git-backed filesystem the agent can inspect and edit, available as a cloud service or self-hosted, with an SDK, a command-line interface, a desktop app and chat-channel integrations.[^letta-docs][^letta-memory] Not stated on the pages read: storage engine and search methods.

## Cognee, according to its pages

According to its repository, Cognee is an open-source AI memory platform under the Apache 2.0 licence that combines graph, vector and relational storage, offers keyword, hybrid and graph search, scopes by dataset, session and node set, and provides Python, TypeScript and Rust clients plus MCP and REST, self-hosted or in its cloud.[^cognee] Cloud pricing and limits were not checked.

## LangMem, according to its pages

According to its documentation and repository, LangMem is a Python library under the MIT licence for long-term agent memory. It provides a core memory API that works with any storage system, with native integration into LangGraph's long-term memory store, including LangGraph Platform deployments; LangMem itself is a library, with hot-path tools the agent calls during a conversation and a background memory manager.[^langmem][^langmem-repo] The documentation may be stale.

## The Surreal Memory Server, according to its repository

According to its README, the Surreal Memory Server is a memory service for AI agents written in Rust on SurrealDB. It holds a knowledge graph with history, scoped memories, hybrid search, task streams and mind maps, reached through MCP over stdio or HTTP and through a REST API, with a published contract matrix pairing each REST endpoint with its MCP tool.[^sms-readme][^sms-contract] Writes go through a durable operation ledger with caller-chosen IDs and payload hashes, so a caller can confirm after a timeout or restart exactly what was stored.[^sms-readme]

## How the Surreal Memory Server searches and what it ships

Search combines vector similarity with BM25 full-text ranking, with category filters applied inside both parts.[^sms-ops] Task streams are named working contexts with token budgets and rolling summaries.[^sms-taskstreams] The project ships a server binary and a Rust library; its documentation calls the library the more important part because the Universal Agent Runtime depends on it directly.[^sms-intro]

## Which products use the Surreal Memory Server

The Universal Agent Runtime's optional memory system is built on it; BossFang uses its library, but BossFang's own status notes that this backend is not yet started at boot and that its writes are currently rejected.[^uar-memory][^bf-agents][^bf-ledger]

## What Mem0, Zep and Letta store and how they search

- Mem0: memories scoped by user, session and agent; semantic, keyword and entity search with time-aware ranking.[^mem0-docs]
- Zep and Graphiti: temporal context graphs with invalidated facts kept in history; hybrid search.[^zep-context-lake][^graphiti]
- Letta: a git-backed memory filesystem the agent edits; storage and search methods not stated.[^letta-memory]

## What Cognee, LangMem and the Surreal Memory Server store and how they search

- Cognee: graph, vector and relational storage; keyword, hybrid and graph search; scoped by dataset, session and node set.[^cognee]
- LangMem: whatever storage system the application supplies, with native LangGraph store integration.[^langmem]
- Surreal Memory Server: scoped memories, a knowledge graph with history, task streams and mind maps; vector plus BM25 hybrid search with category filters applied inside both parts.[^sms-contract][^sms-ops]

## Hosting and licences: Mem0, Zep and Graphiti, Letta

- Mem0: Apache 2.0; library, self-hosted server or managed cloud.[^mem0-repo]
- Zep: a managed platform; Graphiti: Apache 2.0, self-hosted.[^graphiti]
- Letta: Apache 2.0; cloud or self-hosted.[^letta-repo][^letta-docs]

## Hosting and licences: Cognee, LangMem and the Surreal Memory Server

- Cognee: Apache 2.0; self-hosted or cloud.[^cognee]
- LangMem: MIT; a library with no hosted service.[^langmem-repo][^langmem]
- Surreal Memory Server: MIT, stated by its owners with a LICENSE file proposed in the repository; self-hosted as a native service pointed at a SurrealDB endpoint and an embedding provider, with containers as optional packaging; no hosted service.[^sms-readme]

## Status of the Surreal Memory Server

On 2026-10-05 the owner published the completed source and documentation for review; the publication note says this is a source publication, not a release, and not a statement that any installed copy has been verified. No release tags are part of the publication, and the owner plans to resume testing once the code base has stabilised.[^sms-publication] Its contract matrix documents that full scope separation is still incomplete: a memory added with user, agent or session IDs stores those IDs as filters, but its scope field currently stays at the default, global.[^sms-contract] Mem0, Zep, Letta and Cognee describe released software and hosted services.

## Where the Surreal Memory Server is weaker: status and scope (our minuses)

- Not a tested release: source published for review, with testing planned.[^sms-publication]
- Scope separation incomplete, as documented above, where Mem0, Cognee and Zep describe working scoping by user, session or dataset.[^sms-contract][^mem0-docs]

## Where the Surreal Memory Server is weaker: hosting and SDKs (our minuses)

- No managed cloud; the person runs SurrealDB and an embedding provider themselves.[^sms-readme]
- Clients are REST and MCP plus a Rust library; no Python or TypeScript SDK is stated, where Mem0, Zep and Cognee list several language SDKs.[^sms-readme][^mem0-docs][^zep-overview][^cognee]
- A small community compared with the projects above.

## Differences in the Surreal Memory Server's favour: ledger and record kinds (our pluses)

These are documented design differences, not measured results. The durable operation ledger, with idempotent operation IDs, payload hashes and receipts marked committed or rejected, is a write-confirmation design that none of the other pages read describes.[^sms-readme] Task streams and mind maps are record kinds the others do not list.[^sms-contract][^sms-taskstreams]

## Differences in the Surreal Memory Server's favour: hosting (our pluses)

It is a native, self-hosted service with no account and no cloud dependency, where Mem0 and Zep lead with managed services and Mem0's published benchmarks apply to its managed platform rather than its open-source SDK.[^mem0-repo][^graphiti] Its library is what the Universal Agent Runtime's optional memory system is built on.[^uar-memory]

## Choosing an agent memory system

If you want a managed service with SDKs in several languages, Mem0 is the direct fit. If your problem is facts that change over time and you want a graph that keeps history, Zep or self-hosted Graphiti fit. If you build with LangGraph in Python, LangMem is the natural add-on. If you want agents that edit their own memory files, Letta fits. If you need graph, vector and relational storage together with Rust, Python and TypeScript clients, Cognee fits. If you are building on the Universal Agent Runtime, the Surreal Memory Server is what its optional memory system is built on; choosing it on its own today means accepting source-published, not-yet-tested software and running your own database.
