---
type: Concept
title: The Boss
description: "The Boss, KnowMe AI, LLC's free, open-source AI desktop workspace: what it is, who it is for, what it packages, platforms and downloads today, signing, licence and privacy policy."
status: stable
generated:
  by: km-cmo/fable
  at: "2026-10-12T19:00:00+00:00"
stale_after: "2026-10-26T19:00:00+00:00"
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
  - id: boss-release-assets
    resource: https://github.com/Prometheus-AGS/the-boss/releases/tag/v2.2.44
    title: "The Boss v2.2.44 release assets"
    last_modified: "2026-11-03T00:00:00+00:00"
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
  - id: boss-payload
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/prometheus-payload/release-manifest.json
    title: The Boss managed services manifest
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

## The Boss is not an edition of KnowMe

The Boss is not a KnowMe edition or tier and is not built on KnowMe. The two share the Universal Agent Runtime: The Boss bundles it as a program that runs beside The Boss, and KnowMe, which is still in development, is built on it. The Boss is what KnowMe AI, LLC offers for download today.

## What you can do with The Boss today

- Hold conversations and run assistants across cloud and local model providers.
- Run agent sessions with workspace context, MCP tools, skills and approval boundaries.
- Work with knowledge, documents, code and Markdown.
- Manage packaged skills, workspace indexing, tools and optional services from the settings.

Provider access and optional integrations each need their own configuration, for example your own credentials for a cloud model provider.[^boss-readme]

## What The Boss includes: Universal Agent Runtime, BossFang and the Surreal Memory Server

All installers in the latest release, {{v:boss}}, include the Universal Agent Runtime and BossFang (with its dashboard) as bundled programs that run beside The Boss.[^boss-build] The Surreal Memory Server is not inside the installer: The Boss works with it over MCP as a separate service that The Boss can manage or connect to.[^boss-memory-adapter] Running the Surreal Memory Server as a service managed by The Boss needs a container runtime, because The Boss pins it as a container image.[^boss-payload]

## Platforms The Boss supports

The Boss runs on macOS and Windows. The latest release is {{v:boss}}, published {{v:boss:date}}, with installers for macOS on Apple Silicon (707.4 MB), macOS on Intel (743.6 MB) and Windows x64 (604.1 MB); sizes are the attached release assets. The release notes list a Windows Arm64 target, but no Windows Arm64 installer is attached; an older release, v2.2.30, has one.[^boss-release-assets] The Boss needs macOS 12 or later or Windows 10 or later. Linux is not offered.[^boss-site]

## Signing and installer sizes for The Boss

The release records show the macOS builds of The Boss signed with a Developer ID and notarized, and the Windows installers unsigned, so Windows may show a warning during installation; the download page publishes a SHA-256 checksum for every installer so you can verify what you downloaded. The newest entry in the release records at the v2.2.44 tag is v2.2.43, so the signing status above is the one recorded for v2.2.43 and v2.2.42; the v2.2.44 signing status was not found in them. Installer sizes for {{v:boss}} from the attached release assets: macOS Apple Silicon 707.4 MB, macOS Intel 743.6 MB and Windows x64 604.1 MB.[^boss-releases][^boss-release-assets]

## Getting The Boss

The Boss is free, open source and needs no account. Download it from https://the-boss.know-me.tools or from the GitHub releases page at https://github.com/Prometheus-AGS/the-boss/releases. Each release entry records its source commit, checksum, size and signing status.[^boss-site][^boss-releases]

## The Boss licence and attribution

The Boss is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). The LICENSE file in The Boss repository is the authoritative statement of its licence; the public download page uses different words. The Boss is derived from Cherry Studio; upstream contributors, copyright notices and licence obligations remain applicable, and The Boss name and logo identify this fork.[^boss-license][^boss-readme]

## The Boss privacy policy and telemetry

KnowMe AI, LLC has not yet published The Boss's own telemetry behaviour. The project it is built on, Cherry Studio, describes collecting basic operational data by default in its own privacy policy, which The Boss repository currently carries as its PRIVACY.md.[^boss-privacy]
