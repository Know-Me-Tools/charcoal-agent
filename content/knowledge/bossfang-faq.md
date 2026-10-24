# BossFang questions

## What is BossFang?

BossFang is a fork of LibreFang, an open-source agent operating system written in Rust. It adds SurrealDB storage, the Surreal Memory Server library for memory, and a connection to the Universal Agent Runtime (the connection is implemented in source, not yet built or tested).

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.
Source: BossFang connects to UAR, retrieved 2026-10-13.

## Is BossFang the same thing as The Boss?

No. BossFang is an agent operating system forked from LibreFang. The Boss is a desktop workspace for AI conversations, agents, tools and project work, built on Cherry Studio. The Boss installers include the Universal Agent Runtime and BossFang as bundled programs that run beside The Boss; the BossFang fork's releases are payloads built for The Boss.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.
Source: The Boss README, retrieved 2026-10-13.
Source: BossFang fork releases page, retrieved 2026-10-13.

## Is BossFang free?

BossFang is open source under the MIT licence, inherited from LibreFang.

Source: BossFang repository LICENSE, retrieved 2026-10-13.

## Does BossFang need a cloud account?

No account is needed. BossFang runs locally, with its API and dashboard on your own machine by default, and its embedded database needs no separate service. Using a model provider needs that provider's own credentials.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.

## How is BossFang different from LibreFang?

BossFang keeps LibreFang's agent operating system and changes storage to SurrealDB by default, memory to the Surreal Memory Server library, and model access to include the Universal Agent Runtime. It also has its own branding, desktop identity and plugin host. Ask about BossFang and upstream LibreFang for the full list.

Source: BossFang feature ledger, retrieved 2026-10-13.

## How is BossFang different from the Universal Agent Runtime?

BossFang manages agents, channels and a dashboard. The Universal Agent Runtime is a separate service that BossFang connects to for model access and governed runs; BossFang never starts or stops it. That connection is implemented in source, not yet built or tested.

Source: BossFang connects to UAR, retrieved 2026-10-13.

## How do I install BossFang?

Install steps exist in the fork's README, but they mix upstream LibreFang package channels with fork-specific scripts. The fork's releases are native payloads built for The Boss, and their notes say release acceptance is tracked separately. No tested end-user install path is established, so this knowledge base gives no command.

Source: BossFang repository README, retrieved 2026-10-13.
Source: BossFang fork releases page, retrieved 2026-10-13.

## How do I report a bug in or contribute to BossFang?

The fork's CONTRIBUTING.md asks for bug reports with reproduction steps through GitHub Issues on https://github.com/GQAdonis/librefang, and describes how to contribute code.

Source: BossFang contribution guide, retrieved 2026-10-13.

## Who makes BossFang?

Prometheus AGS makes BossFang. Its source code is at https://github.com/GQAdonis/librefang. The Boss installers bundle BossFang as a sidecar. No end-user BossFang release is established.

## What is Prometheus, behind BossFang?

Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. Prometheus is the name of its server-side AI platform work.
