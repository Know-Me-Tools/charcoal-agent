---
type: Concept
title: BossFang and upstream LibreFang
description: Which parts of BossFang are BossFang-specific and which are inherited from upstream LibreFang.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - bossfang
  - librefang
  - lineage
sources:
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, product identity and fork additions
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-ledger
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang/feature-ledger.md
    title: BossFang feature ledger
    last_modified: "2026-10-13T01:28:18+00:00"
---

# BossFang and upstream LibreFang

## What BossFang inherits from LibreFang

The agent operating system itself comes from LibreFang: the kernel that runs agents, their tools and memory, messaging channels, networking between agents, the web dashboard and the command line. LibreFang is written in Rust.[^bf-agents] Package listings, partner announcements, install scripts and project statistics in the repository README describe upstream LibreFang. They are not BossFang claims, and this knowledge base does not repeat them.

## BossFang-specific storage

BossFang makes SurrealDB its default operational store, embedded on disk or reached as a remote server, where upstream uses SQLite. SQLite stays as a fallback, and a command imports existing SQLite data into SurrealDB, though the ledger notes the importer covers only some tables.[^bf-ledger] Its configuration store in SurrealDB records only the names of environment variables for secrets, never secret values.[^bf-ledger]

## BossFang-specific memory and model access

BossFang uses the Surreal Memory Server library for memory.[^bf-agents] It adds an opt-in driver and a manifest translator so agents can run their model calls through the Universal Agent Runtime.[^bf-ledger]

## Other BossFang-specific features

BossFang adds a plugin host (WASI components) that grants plugins no permissions unless the owner allows them. It carries BossFang branding in the dashboard and desktop app, with its own desktop identity and update channel. Its `BOSSFANG_*` environment variables take priority over the `LIBREFANG_*` names, which still work.[^bf-ledger] Internal crate and function names keep their LibreFang names on purpose.[^bf-ledger]
