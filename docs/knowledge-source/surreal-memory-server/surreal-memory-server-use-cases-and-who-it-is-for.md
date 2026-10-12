---
type: Concept
title: Surreal Memory Server use cases and who it is for
description: Documented uses of the Surreal Memory Server and the people it is built for.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-12T00:00:00+00:00"
tags:
  - surreal-memory-server
  - use-cases
sources:
  - id: sms-intro
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/website/docs/intro.md
    title: Surreal Memory Server documentation introduction
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: Surreal Memory Server README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: bossfang-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, fork additions
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Surreal Memory Server use cases and who it is for

## Who the Surreal Memory Server is for

Developers who build agents and want memory that lasts between sessions, is kept apart per user, agent or session, and can be checked after the fact. It is a backend component: people meet it through an agent or an application, not directly.[^sms-intro]

## Memory inside an agent runtime

The Universal Agent Runtime uses the Surreal Memory Server library for its optional memory system, which stores facts from conversations and brings relevant ones back into later prompts.[^uar-memory] The Universal Agent Runtime's memory guide gives a personal assistant that remembers people and their relationships across sessions as an example.[^uar-memory]

## Memory for an agent operating system

BossFang uses the Surreal Memory Server library as its memory layer, with an embedded database so no separate database service is required.[^bossfang-agents]

## Memory for coding agents and their skills

The full Prometheus skill pack lists the Surreal Memory Server as its optional durable memory service.[^full-readme] Prometheus Skills Mini can publish a team's lessons to the memory server's REST API, and its supplied container stack runs SurrealDB with the memory server.[^mini-readme]

## Keeping writes reliable in the Surreal Memory Server

For integrations that cannot afford a lost or doubled write, the operation ledger lets a caller retry safely and read back a definite outcome instead of guessing from a timeout.[^sms-readme]
