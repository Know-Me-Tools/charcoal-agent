# The Boss

The Boss is a free, open-source AI desktop workspace from KnowMe AI, LLC for macOS and Windows: conversations with cloud or local models, agent sessions, tools and project work in one application. You can download The Boss today from https://the-boss.know-me.tools; no account is required. The Boss is built on Cherry Studio and released under the GNU Affero General Public License v3.0.

Source: The Boss README, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss LICENSE, retrieved 2026-10-12.

## What The Boss is

The Boss is an Electron desktop application with a React interface, built on the open-source Cherry Studio client and extended by KnowMe AI, LLC. The Boss describes itself as an agent studio for builders: it adds artifact authoring, context management, skills selection, agent protocols (A2A, AG-UI and A2UI) and memory-aware agents to the Cherry Studio foundation. The Boss is also the operator-facing administration surface for the Universal Agent Runtime and its integrations.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss product context, retrieved 2026-10-12.

## Who The Boss is for

The Boss is built for developers and technical operators who want one daily AI workspace in which they can also administer local agent runtimes, project tools, models, memory and supporting services without leaving the application.

Source: The Boss product context, retrieved 2026-10-12.

## The Boss is not an edition of KnowMe

The Boss is not a KnowMe edition or tier and is not built on KnowMe. The two share the Universal Agent Runtime: The Boss bundles it as a program that runs beside The Boss, and KnowMe, which is still in development, is built on it. The Boss is what KnowMe AI, LLC offers for download today.

## What you can do with The Boss today

- Hold conversations and run assistants across cloud and local model providers.
- Run agent sessions with workspace context, MCP tools, skills and approval boundaries.
- Work with knowledge, documents, code and Markdown.
- Manage packaged skills, workspace indexing, tools and optional services from the settings.

Provider access and optional integrations each need their own configuration, for example your own credentials for a cloud model provider.

Source: The Boss README, retrieved 2026-10-12.

## What The Boss includes: Universal Agent Runtime, BossFang and the Surreal Memory Server

All installers in the latest release, v2.2.41, include the Universal Agent Runtime and BossFang (with its dashboard) as bundled programs that run beside The Boss. The Surreal Memory Server is not inside the installer: The Boss works with it over MCP as a separate service that The Boss can manage or connect to. Running the Surreal Memory Server as a service managed by The Boss needs a container runtime, because The Boss pins it as a container image.

Source: The Boss integration artifacts manifest, retrieved 2026-10-12.
Source: The Boss UAR model source adapter, retrieved 2026-10-12.
Source: The Boss managed services manifest, retrieved 2026-10-12.

## Platforms The Boss supports

The Boss runs on macOS and Windows. The latest release is v2.2.41, published 2026-10-23, with installers for macOS on Apple Silicon (719.3 MB, signed with a Developer ID and notarized), macOS on Intel (754.2 MB, notarized) and Windows x64 (612.3 MB, unsigned). No Windows ARM64 installer is published in that release; an older release, v2.2.30, has one. The Boss needs macOS 12 or later or Windows 10 or later. Linux is not offered.

Source: The Boss release records, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## Signing and installer sizes for The Boss

The macOS builds of The Boss are signed with a Developer ID and notarized. The Windows installers are unsigned, so Windows may show a warning during installation; the download page publishes a SHA-256 checksum for every installer so you can verify what you downloaded. Installer sizes recorded in The Boss release records for v2.2.41: macOS Apple Silicon 719.3 MB, macOS Intel 754.2 MB and Windows x64 612.3 MB.

Source: The Boss release records, retrieved 2026-10-12.

## Getting The Boss

The Boss is free, open source and needs no account. Download it from https://the-boss.know-me.tools or from the GitHub releases page at https://github.com/Prometheus-AGS/the-boss/releases. Each release entry records its source commit, checksum, size and signing status.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss release records, retrieved 2026-10-12.

## The Boss licence and attribution

The Boss is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). The LICENSE file in The Boss repository is the authoritative statement of its licence; the public download page uses different words. The Boss is derived from Cherry Studio; upstream contributors, copyright notices and licence obligations remain applicable, and The Boss name and logo identify this fork.

Source: The Boss LICENSE, retrieved 2026-10-12.
Source: The Boss README, retrieved 2026-10-12.

## The Boss privacy policy and telemetry

KnowMe AI, LLC has not yet published The Boss's own telemetry behaviour. The project it is built on, Cherry Studio, describes collecting basic operational data by default in its own privacy policy, which The Boss repository currently carries as its PRIVACY.md.

Source: The Boss privacy policy, retrieved 2026-10-12.
