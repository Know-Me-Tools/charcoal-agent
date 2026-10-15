---
type: Concept
title: Product relationships
description: "How the company, KnowMe, The Boss, IPFS Sync for Obsidian, the Universal Agent Runtime, BossFang, the Surreal Memory Server and the Prometheus skill packages relate, as the knowledge base states it, and which pairs it does not state."
status: draft
generated:
  by: km-chief-content-officer/sonnet
  at: "2026-10-15T09:00:00+00:00"
stale_after: "2026-10-29T09:00:00+00:00"
tags:
  - prometheus
  - relationships
  - products
sources:
  - id: knowme-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: KnowMe client README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bossfang-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, product identity and fork additions
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-ledger
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang/feature-ledger.md
    title: BossFang feature ledger
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-releases
    resource: https://github.com/GQAdonis/librefang/releases
    title: BossFang fork releases page
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: The Boss download page
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: The Boss README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-product
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/PRODUCT.md
    title: The Boss product context
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: The Boss integration artifacts manifest
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-payload
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/prometheus-payload/release-manifest.json
    title: The Boss managed services manifest
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: The Boss UAR model source adapter
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-intro
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/website/docs/intro.md
    title: Surreal Memory Server documentation introduction
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Product relationships

This file lists how the products on this site relate, one relationship per line, each as the knowledge base already states it. The eight things are KnowMe AI, LLC, KnowMe, The Boss, IPFS Sync for Obsidian, the Universal Agent Runtime, BossFang, the Surreal Memory Server and the Prometheus skill packages. KnowMe has not been publicly released, so statements about KnowMe describe how it is built or designed. A pair that is not listed here has no stated relationship; see the last section.

## Who makes the products in this relationship map

- KnowMe AI, LLC makes KnowMe, The Boss and IPFS Sync for Obsidian. Stated in prometheus-and-its-products.md and company.md.
- Prometheus AGS makes the Universal Agent Runtime, BossFang, the Surreal Memory Server and both Prometheus skill packages (the full Prometheus Skill Pack and Prometheus Skills Mini). Stated in prometheus-and-its-products.md.
- KnowMe AI, LLC builds KnowMe and The Boss on parts made by Prometheus AGS: the Universal Agent Runtime, BossFang and, through MCP, the Surreal Memory Server. Stated in prometheus-and-its-products.md and faq.md.

## KnowMe and the Universal Agent Runtime relationship

- KnowMe is built on the Universal Agent Runtime. Stated in knowme-platforms-and-status.md and the-boss.md.
- The KnowMe agent runs inside the Universal Agent Runtime. The KnowMe web and desktop client streams the agent's replies from it, keeps threads locally and syncs KnowMe's built-in skills to it.[^knowme-readme] Stated in universal-agent-runtime-overview.md.
- KnowMe is designed to route work through the Universal Agent Runtime, which can use local models or several model providers. This is design intent, because KnowMe has not shipped. Stated in knowme-privacy.md.
- The KnowMe agent on this site, which is not the KnowMe app, runs on the Universal Agent Runtime. Stated in company.md, faq.md and knowme-features.md.

## KnowMe and The Boss relationship

- The Boss is not an edition or tier of KnowMe and is not built on KnowMe. Stated in the-boss.md, knowme-platforms-and-status.md and faq.md.
- KnowMe and The Boss share the Universal Agent Runtime: The Boss bundles it as a program that runs beside The Boss, and KnowMe is built on it. Stated in the-boss.md and knowme-platforms-and-status.md.
- The Boss is available to download now; KnowMe has not been publicly released. Stated in knowme-platforms-and-status.md.

## KnowMe, BossFang and the Surreal Memory Server relationships

- KnowMe is designed to sync between a person's own devices and servers the person runs (BossFang), peer to peer. This is design intent; the sync systems are still being built. Stated in knowme-privacy.md.
- KnowMe works with the Surreal Memory Server through MCP as a separate service. Stated in prometheus-and-its-products.md.

## The Boss and the Universal Agent Runtime relationship

- The Boss installers include the Universal Agent Runtime as a bundled program that runs beside The Boss.[^boss-build] Stated in the-boss.md and faq.md.
- The Boss is also the operator-facing administration surface for the Universal Agent Runtime and its integrations.[^boss-product] Stated in the-boss.md.

## The Boss and BossFang relationship

- The Boss installers include BossFang, with its dashboard, as a bundled program that runs beside The Boss.[^boss-build] Stated in the-boss.md.
- BossFang is not The Boss. The BossFang fork's releases are payloads built for The Boss.[^bf-releases] Stated in bossfang-faq.md.

## The Boss and the Surreal Memory Server relationship

- The Surreal Memory Server is not inside The Boss installer. The Boss works with it over MCP as a separate service that The Boss can manage or connect to.[^boss-memory-adapter] Stated in the-boss.md and faq.md.
- Running the Surreal Memory Server as a service managed by The Boss needs a container runtime, because The Boss pins it as a container image.[^boss-payload] Stated in the-boss.md.

## The Boss and the Prometheus skill packages relationship

- On a machine that already has the full Prometheus Skill Pack, Prometheus Skills Mini's README says to use Mini only inside The Boss application's own data directory.[^mini-readme] Stated in prometheus-skill-packages-faq.md and prometheus-skill-packages-choosing-full-or-mini.md.
- The Boss website describes Prometheus Skills Mini as a development process an agent can follow: assess, plan, execute, reflect, with OpenSpec holding the specifications.[^boss-site] Stated in prometheus-skill-packages-overview.md.

## The Boss and what it is built on

- The Boss is built on the open-source Cherry Studio client.[^boss-readme] Stated in the-boss.md and desktop-ai-clients-compared.md.

## BossFang and the Universal Agent Runtime relationship

- BossFang connects to a Universal Agent Runtime instance that already exists, which can be one The Boss manages, and sends agent runs to it. BossFang never installs, starts, stops or supervises it.[^bossfang-uar] Stated in bossfang-overview.md and universal-agent-runtime-overview.md.
- This BossFang connection is implemented in source, not yet built or tested.[^bossfang-uar] Stated in bossfang-status-and-licence.md and bossfang-faq.md.
- BossFang is documented as a client of the Universal Agent Runtime's OpenAI-compatible API.[^uar-matrix] Stated in universal-agent-runtime-use-cases-and-who-it-is-for.md.
- An older note in the Universal Agent Runtime's README and support matrix describes BossFang supervising it; BossFang's later document is the current design.[^uar-matrix] Stated in universal-agent-runtime-overview.md.
- The Universal Agent Runtime owns inference, routing, agent execution and governance; BossFang manages agents, channels and a dashboard. Stated in universal-agent-runtime-faq.md and bossfang-faq.md.

## BossFang and the Surreal Memory Server relationship

- BossFang uses the Surreal Memory Server library as its memory layer, with an embedded database so no separate database service is needed.[^bf-agents] Stated in bossfang-overview.md and surreal-memory-server-overview.md.
- BossFang does not yet start its Surreal Memory Server-based semantic memory when it boots, and the feature ledger notes that this backend's writes are currently rejected.[^bf-ledger] Stated in bossfang-status-and-licence.md.

## The Universal Agent Runtime and the Surreal Memory Server relationship

- The Universal Agent Runtime's optional memory system is built on the Surreal Memory Server library and SurrealDB. That memory system is off until you turn it on.[^uar-memory] Stated in universal-agent-runtime-how-it-works.md and surreal-memory-server-overview.md.
- The Surreal Memory Server ships the library together with a standalone server that MCP clients can reach directly, and the Universal Agent Runtime depends on the library directly.[^sms-intro] Stated in surreal-memory-server-overview.md and universal-agent-runtime-faq.md.

## The Prometheus skill packages and the Surreal Memory Server relationship

- The full Prometheus Skill Pack lists the Surreal Memory Server as its optional durable memory service.[^full-readme] Stated in surreal-memory-server-use-cases-and-who-it-is-for.md and prometheus-skill-packages-how-it-works.md.
- Prometheus Skills Mini can publish a team's lessons to the Surreal Memory Server's REST API, and its optional container stack runs SurrealDB with the Surreal Memory Server.[^mini-readme] Stated in surreal-memory-server-use-cases-and-who-it-is-for.md.

## The two Prometheus skill packages and each other

- The full Prometheus Skill Pack and Prometheus Skills Mini share skill names and can hide each other, so they should not be installed in the same home directory.[^mini-readme] Stated in prometheus-skill-packages-faq.md and prometheus-skill-packages-choosing-full-or-mini.md.

## What the knowledge base does not state about product relationships

These relationships are not stated anywhere in the knowledge base. Say "not stated" instead of drawing or implying a link.

- Not stated: any relationship between IPFS Sync for Obsidian and KnowMe, The Boss, the Universal Agent Runtime, BossFang, the Surreal Memory Server or the Prometheus skill packages. The only stated link is that KnowMe AI, LLC makes IPFS Sync for Obsidian, KnowMe and The Boss.
- Not stated: any relationship between the Prometheus skill packages and KnowMe, the Universal Agent Runtime or BossFang.
- Not stated: whether KnowMe or The Boss is built on the Prometheus skill packages. The parts named as the base for KnowMe and The Boss are the Universal Agent Runtime, BossFang and the Surreal Memory Server.
- Not stated: how KnowMe AI, LLC and Prometheus AGS are related as companies. The knowledge base says only which products each makes and that KnowMe AI, LLC builds KnowMe and The Boss on Prometheus AGS parts.
- Not stated: any relationship between The Boss and IPFS Sync for Obsidian.
- Not stated: whether KnowMe will bundle, include or depend on BossFang or the Surreal Memory Server beyond the design intent and MCP connection listed above. KnowMe has not been publicly released.
