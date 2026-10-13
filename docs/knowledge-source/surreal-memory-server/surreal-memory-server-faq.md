---
type: Concept
title: Surreal Memory Server questions
description: Visitor questions about the Surreal Memory Server, answered from its own documentation.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - surreal-memory-server
  - faq
sources:
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: Surreal Memory Server README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-intro
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/website/docs/intro.md
    title: Surreal Memory Server documentation introduction
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: Surreal Memory Server source publication note, 2026-10-05
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-crate
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/crates/surreal-memory/Cargo.toml
    title: surreal-memory library package manifest
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-palace
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/PALACE.md
    title: Surreal Memory Server Memory Palace architecture
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-license
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/LICENSE
    title: Surreal Memory Server LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
---

# Surreal Memory Server questions

## What is the Surreal Memory Server?

A Rust memory service for AI agents, built on SurrealDB. It keeps a knowledge graph, scoped memories, task streams and mind maps, offers hybrid search, and speaks both MCP (Model Context Protocol, the open standard agents use to call tools) and REST.[^sms-readme] Its source was published for review on 2026-10-05; it is not a release.[^sms-publication]

## Is the Surreal Memory Server free?

The Surreal Memory Server is free to use under the MIT licence: it is MIT licensed (LICENSE file in the repository).[^sms-license] Its library package manifest also declares MIT.[^sms-crate]

## Does the Surreal Memory Server need a cloud account?

No account is needed. You run it yourself as a local service, pointed at your own SurrealDB and an embedding provider you choose.[^sms-readme] A hosted embedding provider needs that provider's key; the optional Memory Palace feature adds local embeddings that work offline without one.[^sms-palace]

## Is the Surreal Memory Server ready for production?

Its authors do not say so. The source was published for review on 2026-10-05; the note says this is not a release.[^sms-publication] The owner plans to resume testing once the code base has stabilised.

## Can I use the Surreal Memory Server from my own MCP client?

The server is built for MCP clients, which connect over stdio or HTTP.[^sms-intro] Check that your client supports one of those transports.

## How is the Surreal Memory Server different from the Universal Agent Runtime's memory?

They share code. The Universal Agent Runtime's memory system is built on the Surreal Memory Server library and adds automatic capture and prompt injection inside the runtime.[^uar-memory] The Surreal Memory Server is the standalone service and the library itself.[^sms-intro]

## Who makes the Surreal Memory Server?

Prometheus AGS makes the Surreal Memory Server.

## What is Prometheus, behind the Surreal Memory Server?

Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. Prometheus is the name of its server-side AI platform work.
