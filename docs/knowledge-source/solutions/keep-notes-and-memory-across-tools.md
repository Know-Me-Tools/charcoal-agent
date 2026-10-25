---
type: Concept
title: "Keep notes and AI memory across tools"
description: "How a visitor who wants one memory shared by several AI tools and note apps can use the KnowMe and Prometheus products, with each flow tagged shipped or planned."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - memory
  - notes
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: "Surreal Memory Server README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: "Surreal Memory Server source publication note, 2026-10-05"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pk-readme
    resource: https://github.com/Prometheus-AGS/prometheus-knowledge-rs/blob/main/README.md
    title: "Prometheus Knowledge README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: "The Boss UAR model source adapter"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: "Universal Agent Runtime memory system"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: "Prometheus Skill Pack README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: "Prometheus Skills Mini README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sms-contract
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/MCP_REST_CONTRACT_MATRIX.md
    title: "Surreal Memory Server MCP, REST and storage contract matrix"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Keep notes and AI memory across tools

Short answer: the Surreal Memory Server is the piece meant to give several AI tools one shared memory, and it is [planned], source only, not released. The Boss, a released desktop workspace, can work with it over MCP as a separate service.

A visitor asks: "I use several AI tools and note apps, and each one forgets what the others know. How do I keep one memory?" No product in the portfolio is a finished answer today. The nearest pieces are a memory server whose source is public but not released, and a desktop workspace that is released.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Keep notes and memory across tools: the products that help

- Surreal Memory Server [planned, source only]: a Rust memory service with a knowledge graph, scoped memories, hybrid search and MCP and REST access. Latest tag {{v:memory}}. The owner calls its 5 October 2026 publication a source publication, not a release.[^sms-readme][^sms-publication]
- Prometheus Knowledge [planned, source only]: Markdown knowledge records, immutable prompt snapshots and reconciliation of memory operations. Latest tag {{v:knowledge}}.[^pk-readme]
- The Boss [shipped]: the desktop workspace, release {{v:boss}}. It works with the Surreal Memory Server over MCP as a separate service.[^boss-memory-adapter]

## Keep notes and memory across tools: more products that help

- Universal Agent Runtime [shipped], release {{v:uar}}: its optional memory system is built on the Surreal Memory Server library and is off until turned on.[^uar-memory]
- Prometheus Skill Pack [shipped] and Prometheus Skills Mini [shipped]: the full pack lists the Surreal Memory Server as its optional memory service, and Mini can publish lessons to its REST API.[^full-readme][^mini-readme]
- IPFS Sync for Obsidian [planned, pre-release]: {{v:ipfs}}, tested on fixture vaults only, with wider deployment unverified.[^pf]

## Keep notes and memory across tools: how the products fit together

- The Boss working with the Surreal Memory Server over MCP: [planned], because the memory server has no release.[^boss-memory-adapter]
- The Universal Agent Runtime memory system on the Surreal Memory Server library: [planned]. The repository documents it. This page does not establish that it is in release {{v:uar}}.[^uar-memory]
- The skill packages publishing lessons to the Surreal Memory Server: [planned], for the same reason.[^mini-readme]
- The portfolio says relationships are architectural intent, not proof of completed integration.[^pf]

## Keep notes and memory across tools: what is not stated

- No source states a single memory shared by The Boss and tools made by other companies.
- No source connects IPFS Sync for Obsidian to the Surreal Memory Server.
- The portfolio says the Surreal Memory Server's remediation and per-user brain design have separate qualification, and its contract matrix documents full scope separation as still incomplete.[^pf][^sms-contract]
- KnowMe, which is designed around a local memory graph, has no release. See [KnowMe features](/knowme/knowme-features.md).

## Keep notes and memory across tools: start here

Download The Boss for a released workspace ({{v:boss}}) from https://the-boss.know-me.tools.[^boss-site] To try the memory service, read the Surreal Memory Server README and build it from source. See [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
