---
type: Concept
title: Surreal Memory Server overview
description: What the Surreal Memory Server is, what it stores, and the products that use it.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - surreal-memory-server
  - overview
sources:
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: Surreal Memory Server README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-intro
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/website/docs/intro.md
    title: Surreal Memory Server documentation introduction
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-contract
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/MCP_REST_CONTRACT_MATRIX.md
    title: Surreal Memory Server MCP, REST and storage contract matrix
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bossfang-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, fork additions
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Surreal Memory Server overview

## What the Surreal Memory Server is

The Surreal Memory Server is a memory service for AI agents, written in Rust on top of SurrealDB. It holds a knowledge graph, scoped memories, hybrid search, task streams and mind maps, and it reaches agents through MCP (Model Context Protocol, the open standard agents use to call tools) and a REST API.[^sms-readme] Writes go through a durable operation ledger, so a caller can confirm what was stored after a timeout or a restart.[^sms-readme] The Surreal Memory Server is made by Prometheus AGS.

## The problem the Surreal Memory Server addresses

Agents forget between turns. Its documentation names the usual shortcuts and why they fail: a plain vector store returns what was written last rather than what is most relevant, nothing separates a lasting fact from a passing remark, and one user's memory is not kept apart from another's. Its answer is typed, durable memory.[^sms-intro] The server tags each memory with its owner and keeps a durable record of every write; full scope separation is documented as still incomplete.[^sms-contract]

## Two parts of the Surreal Memory Server

The project ships two things from one workspace: a server binary that MCP clients reach over stdio or HTTP, and a Rust library. Its documentation calls the library the more important part, because the Universal Agent Runtime depends on it directly.[^sms-intro]

## Which products use the Surreal Memory Server

The Universal Agent Runtime's optional memory system is built on it.[^uar-memory] BossFang uses it for memory, with an embedded database so no separate SurrealDB service is needed.[^bossfang-agents]

## Where to get the Surreal Memory Server

The Surreal Memory Server's source is public at https://github.com/Prometheus-AGS/surreal-memory-server. Its README builds it with `cargo build --release` and runs it as a native local service pointed at your SurrealDB.[^sms-readme] Its source was published for review and is not a tested release; see its status and licence.

## More about the Surreal Memory Server

You can also ask how it works, how to run it, its status and licence, and common questions.
