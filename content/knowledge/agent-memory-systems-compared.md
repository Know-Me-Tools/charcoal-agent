# Agent memory systems compared with the Surreal Memory Server (Landscape)

An agent memory system gives an AI agent something to remember between turns and sessions. This page compares five of them (Mem0, Zep and its open-source Graphiti, Letta, Cognee and LangMem) with the Surreal Memory Server, made by Prometheus AGS, which the Universal Agent Runtime and BossFang use. The other products' facts are paraphrased from their own pages read on 2026-10-12. Vendor benchmark figures are not repeated here, because they are self-reported. Prices are out of scope for this knowledge base.

## Mem0, according to its pages (Landscape)

According to its repository and documentation, Mem0 is a memory layer for agents under the Apache 2.0 licence, available as a library, a self-hosted server and a managed cloud. It scopes memories by user, session and agent, retrieves with a hybrid of semantic, keyword and entity search with time-aware ranking, offers Python and TypeScript SDKs, a command-line interface and REST, and requires a language model. Mem0 publishes benchmark figures for its managed platform; they are self-reported, and the vendor says the managed platform has optimisations not in the open-source SDK, so this knowledge base does not repeat the numbers. It offers a free tier, paid tiers and an enterprise option with on-premises deployment.

Source: Mem0 repository, retrieved 2026-10-12.
Source: Mem0 documentation, Introduction, retrieved 2026-10-12.

## Zep and Graphiti, according to their pages (Landscape)

According to Zep's documentation, Zep is a cloud-managed context layer built on temporal context graphs, in which a fact can be invalidated while its history is kept, with per-user and shared graphs, SDKs for Python, TypeScript and Go, bring-your-own-cloud on enterprise plans and credit-based pricing. Graphiti is Zep's Apache 2.0 open-source framework for temporal context graphs, self-hosted on a graph database the person supplies, with hybrid search and an MCP server. Zep's documentation says context does not guarantee accuracy and that the application owns tool permissions. Whether Zep itself (as distinct from Graphiti) is open source is not stated.

Source: Zep documentation, Overview, retrieved 2026-10-12.
Source: Zep documentation, Context lake, retrieved 2026-10-12.
Source: Graphiti repository, retrieved 2026-10-12.

## Letta, according to its pages (Landscape)

According to its documentation, Letta (formerly MemGPT) is a platform for stateful agents under the Apache 2.0 licence, in which memory is a git-backed filesystem the agent can inspect and edit, available as a cloud service or self-hosted, with an SDK, a command-line interface, a desktop app and chat-channel integrations. Its older server repository is archived and development has moved to a new repository. Not stated on the pages read: storage engine and search methods.

Source: Letta documentation, retrieved 2026-10-12.
Source: Letta documentation, Memory configuration, retrieved 2026-10-12.

## Cognee, according to its pages (Landscape)

According to its repository, Cognee is an open-source AI memory platform under the Apache 2.0 licence that combines graph, vector and relational storage, offers keyword, hybrid and graph search, scopes by dataset, session and node set, and provides Python, TypeScript and Rust clients plus MCP and REST, self-hosted or in its cloud. The latest release shown was v1.6.1 (2026-09-24), with a newer reference on the page that was not reconciled. Cloud pricing and limits were not checked.

Source: Cognee repository, retrieved 2026-10-12.

## LangMem, according to its pages (Landscape)

According to its documentation, LangMem is a Python library under the MIT licence for long-term agent memory, with hot-path tools the agent calls during a conversation and a background memory manager. Storage and search are delegated to the LangGraph store, and there is no hosted service. The documentation may be stale.

Source: LangMem documentation, retrieved 2026-10-12.

## The Surreal Memory Server, according to its repository (Landscape)

According to its README, the Surreal Memory Server is a memory service for AI agents written in Rust on SurrealDB. It holds a knowledge graph with history, scoped memories, hybrid search, task streams (named working contexts with token budgets and rolling summaries) and mind maps, reached through MCP over stdio or HTTP and through a REST API, with a published contract matrix pairing each REST endpoint with its MCP tool. Search combines vector similarity with BM25 full-text ranking. Writes go through a durable operation ledger with caller-chosen IDs and payload hashes, so a caller can confirm after a timeout or restart exactly what was stored. It ships as a server binary and as a Rust library; the Universal Agent Runtime depends on the library directly.

Source: Surreal Memory Server README, retrieved 2026-10-12.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-12.
Source: Surreal Memory Server operations reference, retrieved 2026-10-12.

## What each agent memory system stores and how it searches (Landscape)

- Mem0: memories scoped by user, session and agent; semantic, keyword and entity search with time-aware ranking.
- Zep and Graphiti: temporal context graphs with invalidated facts kept in history; hybrid search.
- Letta: a git-backed memory filesystem the agent edits; storage and search methods not stated.
- Cognee: graph, vector and relational storage; keyword, hybrid and graph search; scoped by dataset, session and node set.
- LangMem: whatever the LangGraph store provides.
- Surreal Memory Server: scoped memories, a knowledge graph with history, task streams and mind maps; vector plus BM25 hybrid search with category filters applied inside both parts.

Source: Mem0 documentation, Introduction, retrieved 2026-10-12.
Source: Zep documentation, Context lake, retrieved 2026-10-12.
Source: Graphiti repository, retrieved 2026-10-12.
Source: Letta documentation, Memory configuration, retrieved 2026-10-12.
Source: Cognee repository, retrieved 2026-10-12.
Source: LangMem documentation, retrieved 2026-10-12.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-12.
Source: Surreal Memory Server operations reference, retrieved 2026-10-12.

## Hosting and licences across agent memory systems (Landscape)

- Mem0: Apache 2.0; library, self-hosted server or managed cloud.
- Zep: cloud-managed, with bring-your-own-cloud on enterprise plans; Graphiti: Apache 2.0, self-hosted.
- Letta: Apache 2.0; cloud or self-hosted.
- Cognee: Apache 2.0; self-hosted or cloud.
- LangMem: MIT; a library with no hosted service.
- Surreal Memory Server: MIT, stated by its owners with a LICENSE file proposed in the repository; self-hosted as a native service pointed at a SurrealDB endpoint and an embedding provider, with containers as optional packaging; no hosted service.

Source: Mem0 repository, retrieved 2026-10-12.
Source: Zep documentation, Overview, retrieved 2026-10-12.
Source: Graphiti repository, retrieved 2026-10-12.
Source: Letta documentation, retrieved 2026-10-12.
Source: Cognee repository, retrieved 2026-10-12.
Source: LangMem documentation, retrieved 2026-10-12.
Source: Surreal Memory Server README, retrieved 2026-10-12.

## Status of the Surreal Memory Server, honestly stated (Landscape)

On 2026-10-05 the owner published the completed source and documentation for review; the publication note says this is a source publication, not a release, and not a statement that any installed copy has been verified. No release tags are part of the publication, and the owner plans to resume testing once the code base has stabilised. Its contract matrix documents that full scope separation is still incomplete: a memory added with user, agent or session IDs stores those IDs as filters, but its scope field currently stays at the default, global. Anyone comparing it with Mem0, Zep, Letta or Cognee should weigh that those products describe released software and hosted services.

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-12.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-12.

## Where the Surreal Memory Server is weaker (our minuses) (Landscape)

- Not a tested release: source published for review, with testing planned.
- Scope separation incomplete, as documented above; Mem0, Cognee and Zep describe working scoping by user, session or dataset.
- No managed cloud; the person runs SurrealDB and an embedding provider themselves.
- Clients are REST and MCP plus a Rust library; no Python or TypeScript SDK is stated, where Mem0, Zep and Cognee list several language SDKs.
- A small community compared with the projects above.

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-12.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-12.
Source: Mem0 documentation, Introduction, retrieved 2026-10-12.
Source: Cognee repository, retrieved 2026-10-12.
Source: Zep documentation, Overview, retrieved 2026-10-12.
Source: Surreal Memory Server README, retrieved 2026-10-12.

## Where the Surreal Memory Server differs in its favour (their minuses, our pluses) (Landscape)

These are documented design differences, not measured results. The durable operation ledger, with idempotent operation IDs, payload hashes and receipts marked committed or rejected, is a write-confirmation design that none of the other pages read describes. Task streams and mind maps are record kinds the others do not list. It is a native, self-hosted service with no account and no cloud dependency, where Mem0 and Zep lead with managed services and Mem0's published benchmarks apply to its managed platform rather than its open-source SDK. Its library is embedded in two products, the Universal Agent Runtime and BossFang, rather than being an add-on.

Source: Surreal Memory Server README, retrieved 2026-10-12.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-12.
Source: Mem0 repository, retrieved 2026-10-12.
Source: Zep documentation, Overview, retrieved 2026-10-12.

## Choosing an agent memory system (Landscape)

If you want a managed memory service with SDKs in several languages and a free tier to start, Mem0 is the direct fit. If your problem is facts that change over time and you want a graph that keeps history, Zep or self-hosted Graphiti fit. If you build with LangGraph in Python, LangMem is the natural add-on. If you want agents that edit their own memory files, Letta fits. If you need graph, vector and relational storage together with Rust, Python and TypeScript clients, Cognee fits. If you are building on the Universal Agent Runtime or BossFang, the Surreal Memory Server is already part of them; choosing it on its own today means accepting source-published, not-yet-tested software and running your own database.
