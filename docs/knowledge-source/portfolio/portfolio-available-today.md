---
type: Concept
title: What can I use today
description: Which KnowMe and Prometheus products have a published release or package you can use today, and which are not available to use yet.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - portfolio
  - availability
  - status
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: The Boss download page
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: The Boss integration artifacts manifest
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: skill-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: parking-registry
    resource: https://crates.io/crates/prometheus_parking_lot
    title: prometheus_parking_lot on crates.io
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pem-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-management/blob/main/README.md
    title: Prometheus Entity Management README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: forge-release
    resource: https://github.com/Know-Me-Tools/flint-forge/releases/tag/v1.0.0
    title: Flint Forge release v1.0.0
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: uar-releases
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/releases
    title: Universal Agent Runtime releases
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: uar-changelog
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/CHANGELOG.md
    title: Universal Agent Runtime changelog
    last_modified: "2026-10-13T01:28:18+00:00"
---

# What you can use today

## What can I use today?

Use today: The Boss, which you can download from https://the-boss.know-me.tools, the Prometheus skill packages, and some libraries with a published release.[^boss-site][^portfolio]

Not available to use yet: KnowMe, the KnowMe Concierge and most other products. The portfolio records no release, package or install route for them.[^portfolio]

Most of the portfolio is in development, a prototype or a design. Statuses are the portfolio's own wording, not independent audits.[^portfolio]

## Use today: The Boss

The Boss is a free, open-source AI desktop workspace for macOS and Windows. You can download it from https://the-boss.know-me.tools with no account.[^boss-site] The latest release is {{v:boss}}. The portfolio notes that current-source features are not automatically in released installers.[^portfolio] The installers also include the Universal Agent Runtime and BossFang as bundled programs.[^boss-build] BossFang has no separate release; it comes only with The Boss.[^boss-build]

## Use today: skills and libraries

- Prometheus Skill Pack: release {{v:skills}}. Its README gives an install script for supported coding assistants.[^skill-readme]
- Prometheus Skills Mini: release {{v:mini}}. Its README gives a setup check and a copy step.[^mini-readme]
- Prometheus Parking Lot: {{v:parking}} on crates.io, a Rust library. Registry publication is not runtime qualification.[^parking-registry]
- Prometheus Entity Management: release {{v:pem}}. Its README says thirteen npm packages were published at that version.[^pem-readme]

## Published, with a stated caveat

- Universal Agent Runtime: The portfolio says work stopped and current runtime qualification is not established.[^uar-releases] The repository lists release {{v:uar}} and pre-release {{v:uar:pre}}. Its changelog records functional acceptance of the Linux amd64 image within a defined scope.[^uar-changelog] The repository is the newer record.
- Flint Forge: release {{v:forge}} exists. The README reports v1.0-ready, which the portfolio treats as a source claim, not an audit.[^forge-release]
- IPFS Sync for Obsidian: pre-release {{v:ipfs}}, tested on fixture vaults only. The portfolio says wider deployment is unverified.[^portfolio]

## Not available to use yet

The portfolio records no release, package or install route for the following. Treat them as not available to use yet.[^portfolio]

- KnowMe Concierge: the agent on this site. It has no download or install route.[^portfolio]
- Applications: KnowMe, Locus, Know Meet, DocuMind, Flint AI Code Companion, Prometheus Studio, the realtor assistant.
- Agents and memory: Surreal Memory Server, Prometheus Knowledge, Knowledge Gateway, Tranquil, Praxis, Numen, Numen Enclave, Synaxis.

## Not available to use yet: platform, tools and the rest

The portfolio records no release, package or install route for these either.[^portfolio]

- Platform: Flint Gate, Flint Realtime Fabric, Prometheus Entity Sync, the demo hosting platform, Flint Agent Mesh.
- Tools: Phase Exit, KnowMe Project Management, HTMX Doc Forge, Native agent creator, Artifact Refiner, Prometheus Tune, Light Creator, gen_ui, Companion, Logos, Know Decision.

## Not available to use yet: integrations, services and research

The portfolio records no release, package or install route for these either.[^portfolio]

- Integrations, services and research: Candle-VLLM fork, inference forks, Poppy integration, dot, Authentic Digital Twin, Prometheus Pulse, the Operator Service, Lampas, Kaia, Knowtes.

A product can have source code without a release. Where the portfolio lists a repository for these, it records no GitHub release. Some carry a git tag, which is not a release.[^portfolio]
