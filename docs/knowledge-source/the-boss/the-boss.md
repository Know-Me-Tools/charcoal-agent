---
type: Concept
title: The Boss
description: "The Boss, KnowMe AI, LLC's free, open-source AI desktop workspace: what it is, who it is for, what it packages, platforms and downloads today, signing, licence and privacy policy."
status: stable
generated:
  by: km-cmo/fable
  at: "2026-10-12T19:00:00+00:00"
tags: [the-boss, desktop, download]
sources:
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
  - id: boss-releases
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/RELEASES.md
    title: The Boss release records
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-license
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/LICENSE
    title: The Boss LICENSE
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: The Boss integration artifacts manifest
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: The Boss UAR model source adapter
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-privacy
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/PRIVACY.md
    title: The Boss privacy policy
    last_modified: "2026-10-12T00:00:00+00:00"
---

# The Boss

The Boss is a free, open-source AI desktop workspace from KnowMe AI, LLC for macOS and Windows: conversations with cloud or local models, agent sessions, tools and project work in one application.[^boss-readme] You can download The Boss today from https://the-boss.know-me.tools; no account is required.[^boss-site] The Boss is built on Cherry Studio and released under the GNU Affero General Public License v3.0.[^boss-license]

## What The Boss is

The Boss is an Electron desktop application with a React interface, built on the open-source Cherry Studio client and extended by KnowMe AI, LLC. The Boss describes itself as an agent studio for builders: it adds artifact authoring, context management, skills selection, agent protocols (A2A, AG-UI and A2UI) and memory-aware agents to the Cherry Studio foundation.[^boss-site] The Boss is also the operator-facing administration surface for the Universal Agent Runtime and its integrations.[^boss-product]

## Who The Boss is for

The Boss is built for developers and technical operators who want one daily AI workspace in which they can also administer local agent runtimes, project tools, models, memory and supporting services without leaving the application.[^boss-product]

## What you can do with The Boss today

- Hold conversations and run assistants across cloud and local model providers.
- Run agent sessions with workspace context, MCP tools, skills and approval boundaries.
- Work with knowledge, documents, code and Markdown.
- Manage packaged skills, workspace indexing, tools and optional services in the Prometheus settings.

Provider access and optional integrations each need their own configuration, for example your own credentials for a cloud model provider.[^boss-readme]

## What The Boss packages: Universal Agent Runtime, BossFang and Surreal Memory

The Boss release installers (the "uar-enabled" profile) package the Universal Agent Runtime as a sidecar program, and the same build manifest packages BossFang, with its dashboard, as a second sidecar, for macOS on Apple Silicon and for Windows x64.[^boss-build] The Boss works with the Surreal Memory Server over MCP: the memory server runs as a separate service that The Boss can manage or connect to, and it is not inside the installer.[^boss-memory-adapter]

## Platforms The Boss supports

The Boss runs on macOS and Windows. Today the download page offers The Boss v2.2.36 for macOS on Apple Silicon and for Windows x64. The Intel Mac and Windows ARM64 downloads are the older v2.2.30 builds; the v2.2.36 update for those two platforms is pending. The Boss needs macOS 12 or later or Windows 10 or later. Linux is not offered.[^boss-site]

## Signing and installer sizes for The Boss

The macOS builds of The Boss are signed with a Developer ID and notarized. The Windows installers are unsigned, so Windows may show a warning during installation; the download page publishes a SHA-256 checksum for every installer so you can verify what you downloaded. Installer sizes recorded in The Boss release records: v2.2.36 macOS Apple Silicon 685.0 MB and Windows x64 509.6 MB; v2.2.30 macOS Intel 713.2 MB and Windows ARM64 472.0 MB.[^boss-releases]

## Getting The Boss

Download The Boss from https://the-boss.know-me.tools, which is free, open source and needs no account, or from the GitHub releases page at https://github.com/Prometheus-AGS/the-boss/releases. Each release entry records its source commit, checksum, size and signing status.[^boss-site][^boss-releases]

## The Boss licence and attribution

The Boss is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). It is derived from Cherry Studio; upstream contributors, copyright notices and licence obligations remain applicable, and The Boss name and logo identify this fork.[^boss-license][^boss-readme]

## The Boss privacy policy

The Boss repository carries the privacy policy of its upstream project, Cherry Studio, in PRIVACY.md. Read it before installing: it describes what the application may collect and the model services it can connect to.[^boss-privacy]
