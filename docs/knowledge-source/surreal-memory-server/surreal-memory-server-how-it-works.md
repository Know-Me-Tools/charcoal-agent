---
type: Concept
title: How the Surreal Memory Server works
description: The Surreal Memory Server's memory kinds, search, REST and MCP surfaces, durable operation ledger and optional Memory Palace.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - surreal-memory-server
  - architecture
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
  - id: sms-ops
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/operations.md
    title: Surreal Memory Server operations reference
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-taskstreams
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/TASKSTREAMS-API.md
    title: Surreal Memory Server TaskStreams REST API
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-palace
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/PALACE.md
    title: Surreal Memory Server Memory Palace architecture
    last_modified: "2026-10-13T01:28:18+00:00"
---

# How the Surreal Memory Server works

## What the Surreal Memory Server stores

Four kinds of record. Memories are pieces of text tagged with a user, agent or session ID and optional categories.[^sms-contract] The knowledge graph holds named entities, their observations and the relations between them, with history so you can ask what the graph looked like at an earlier time.[^sms-contract] Task streams are named working contexts with token budgets and rolling summaries.[^sms-taskstreams] Mind maps are node-and-edge maps that export to JSON, Mermaid or Markdown.[^sms-contract]

## How the Surreal Memory Server searches

Search combines vector similarity with BM25 full-text ranking. Category filters apply inside both parts of the search, so a filtered query still returns up to the requested number of matches. Results leave out the embedding vectors unless you ask for them.[^sms-ops]

## Surreal Memory Server REST and MCP

The same operations are offered as REST endpoints and as MCP (Model Context Protocol, the open standard agents use to call tools) tools, and a published contract matrix lists each pair with its validation rules. Some graph tools exist only on MCP.[^sms-contract] MCP clients connect over stdio or HTTP.[^sms-intro] One documented limit: a memory added with user, agent or session IDs stores those IDs, which work as filters, but its scope field currently stays at the default, global.[^sms-contract]

## The Surreal Memory Server operation ledger

New write integrations send each write as an operation with a caller-chosen ID and a hash of its payload. The server answers 202 when it has durably accepted a new operation, returns the stored receipt when the same operation is sent again, and refuses a different payload under an existing ID. Callers follow progress as an event stream and only trust a receipt marked committed or rejected. Paused operations are retried every 60 seconds.[^sms-readme]

## Long memories and restarts in the Surreal Memory Server

A long memory is split into parts using the active tokenizer. The plan and its progress are saved, so after a restart the server resumes only the unfinished parts and then commits one logical memory.[^sms-readme] Health and readiness endpoints report on the ledger, storage, tokenizer, executor and search.[^sms-readme]

## The optional Surreal Memory Server Memory Palace

An opt-in build feature called Memory Palace adds a spatial layout for knowledge (wings, rooms, halls and drawers), a four-layer recall stack, offline local embeddings that need no API key, and rank fusion across memory, graph and palace results. It is built on the third-party mempalace-rs project. When the feature is off, its tools report that it is not enabled.[^sms-palace]
