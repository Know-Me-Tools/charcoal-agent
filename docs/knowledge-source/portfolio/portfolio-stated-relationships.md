---
type: Concept
title: Stated relationships between products
description: The relationships between KnowMe and Prometheus products that the portfolio or a repository states, each with its source, and the pairs the sources do not relate.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - portfolio
  - relationships
  - products
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: concierge-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: "KnowMe Concierge repository README"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: The Boss integration artifacts manifest
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: The Boss UAR model source adapter
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: The Boss README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: bossfang-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, product identity and fork additions
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: Flint Forge README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: sync-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-sync/blob/main/README.md
    title: Prometheus Entity Sync README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: infra-readme
    resource: https://github.com/Prometheus-AGS/flint-infra/blob/main/README.md
    title: Flint core infrastructure README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: demos-readme
    resource: https://github.com/Know-Me-Tools/demos/blob/main/README.md
    title: demos README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: cv-lock
    resource: https://github.com/GQAdonis/candle-vllm/blob/10f844d219ae502d655944aeb223130ffaf24fd9/Cargo.lock
    title: Candle-VLLM Cargo.lock at 10f844d
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: meet-readme
    resource: https://github.com/Know-Me-Tools/know-meet/blob/main/README.md
    title: Know Meet repository README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pe-readme
    resource: https://github.com/Know-Me-Tools/phase-exit/blob/main/README.md
    title: Phase Exit README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: kpm-readme
    resource: https://github.com/Know-Me-Tools/know-me-project-management/blob/main/README.md
    title: know-me-project-management README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: decision-readme
    resource: https://github.com/Know-Me-Tools/know-me-decision/blob/main/README.md
    title: Know Decision repository README
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Stated relationships between products

This page lists only relationships that the portfolio or a repository states. Each one names its source. The portfolio says its relationships are architectural intent, not proof of completed integration.[^portfolio] A listed relationship does not mean the two products run together today.

## The Universal Agent Runtime and its users

- The portfolio calls the Universal Agent Runtime a shared runtime dependency used by multiple portfolio applications. It also says work on it stopped and its current qualification is not established.[^portfolio]
- The KnowMe Concierge README says the agent runs inside the Universal Agent Runtime and the client connects to it.[^concierge-readme]
- The Boss installers include the Universal Agent Runtime and BossFang as bundled programs that run beside The Boss.[^boss-build]
- BossFang connects to a Universal Agent Runtime instance that already exists and never starts it. That connection is implemented in source, not yet built or tested.[^bossfang-uar]

## The Boss, BossFang and memory

- The Boss works with the Surreal Memory Server over MCP as a separate service. It is not in the installer.[^boss-memory-adapter]
- The Boss is built on the open-source Cherry Studio client.[^boss-readme]
- BossFang uses the Surreal Memory Server library as its memory layer.[^bf-agents]
- The Universal Agent Runtime's optional memory system is built on the Surreal Memory Server library. It is off until turned on.[^uar-memory]

## Skill packages

- The full Prometheus Skill Pack lists the Surreal Memory Server as its optional memory service.[^full-readme]
- Prometheus Skills Mini can publish lessons to the Surreal Memory Server's REST API.[^mini-readme]
- The full pack and Mini share skill names, so they should not share a home directory.[^mini-readme]

## The Flint platform

- Flint Forge's README says Forge sits behind Flint Gate, which handles ingress and authentication, and consumes Flint Realtime Fabric as its realtime source.[^forge-readme]
- The Prometheus Entity Sync README says Entity Sync is built on Flint Realtime Fabric and reuses its change capture, CRDT and operation-log code.[^sync-readme]
- The Flint core infrastructure README places Flint Gate, Flint Forge's Quarry and Flint Realtime Fabric in the stack it configures.[^infra-readme]
- The demo hosting platform's README assigns roles: the Universal Agent Runtime runs agents, Flint Gate owns identity, Flint Forge supplies data, Flint Realtime Fabric supplies live updates. These are design statements.[^demos-readme]

## Numen and inference

- The portfolio says Numen Enclave adds a proposed deployment boundary to the Numen execution fabric.[^portfolio]
- The portfolio says the Candle-VLLM fork is part of the intended inference infrastructure for Numen. No live Numen integration is verified.[^portfolio]
- The portfolio says Tranquil's private agent-job design is covered by the Numen identity edition.[^portfolio]
- The Candle-VLLM fork submits completion and streaming work through a Parking Lot pool. Its lockfile pins an earlier Parking Lot revision, not the published 0.3.0.[^cv-lock]

## Locus, dot and meetings

- The portfolio says Prometheus Pulse is a capability mapped into Locus and its project-learning workflow.[^portfolio]
- The portfolio describes Companion as a potential shared workspace for dot, Locus and other agent systems. It says no live cross-agent integration is verified.[^portfolio]
- The portfolio says full integration of the KnowMe Concierge with the KnowMe App, Locus and an authentic voice is not established.[^portfolio]
- The Know Meet README names persistent dots as meeting participants.[^meet-readme]
- The portfolio lists the Private Dot (Locus) documents among the published Praxis source records.[^portfolio]

## Tools and skills

- The portfolio groups Prometheus Skills, Know Decision, Phase Exit, Project Management and Doc Forge as tools that support building and governing the work.[^portfolio]
- The Phase Exit README says the preview was published for use in a Universal Agent Runtime release phase.[^pe-readme]
- The Project Management README lists other skills it needs, such as kbd-init and agent-team-creator.[^kpm-readme]
- The Know Decision README describes it as the decision layer shared by KnowMe's products. It names no integration that exists.[^decision-readme]
- The portfolio describes gen_ui as the shared core for KnowMe's surfaces.[^portfolio]

## Integrations outside the portfolio

- The portfolio says Poppy is not a KnowMe-owned product. The integration is a KnowMe design that uses Poppy's protocol.[^portfolio]
- The portfolio says upstream dependencies of the inference forks are not claimed as owned products.[^portfolio]

## What the sources do not state

- The sources state no relationship for Phase Exit, KnowMe Project Management, HTMX Doc Forge, IPFS Sync for Obsidian, Prometheus Studio, Knowtes, Kaia, Logos, Light Creator, Prometheus Tune, Lampas or the realtor assistant with the products above, beyond the groupings listed.
- They state no relationship between Flint Agent Mesh or Flint AI Code Companion and the other Flint products. The shared Flint name is not a stated integration.
- They state no relationship between DocuMind, Knowledge Gateway or the native agent creator and other products.
- A relationship described as intent is intent. It is not proof that two products work together, or that either one is finished.
