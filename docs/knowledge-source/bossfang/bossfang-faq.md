---
type: Concept
title: BossFang questions
description: Visitor questions about BossFang, answered from its own repository documentation.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:05:39+00:00"
tags:
  - bossfang
  - faq
sources:
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, product identity and fork additions
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-ledger
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang/feature-ledger.md
    title: BossFang feature ledger
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-releases
    resource: https://github.com/GQAdonis/librefang/releases
    title: BossFang fork releases page
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-readme
    resource: https://github.com/GQAdonis/librefang/blob/main/README.md
    title: BossFang repository README
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-license
    resource: https://github.com/GQAdonis/librefang/blob/main/LICENSE
    title: BossFang repository LICENSE
    last_modified: "2026-10-13T00:05:39+00:00"
---

# BossFang questions

## What is BossFang?

BossFang is a fork of LibreFang, an open-source agent operating system written in Rust. It adds SurrealDB storage, the Surreal Memory Server library for memory, and a connection to the Universal Agent Runtime.[^bf-agents]

## Is BossFang free?

BossFang is open source under the MIT licence, inherited from LibreFang.[^bf-license]

## Does BossFang need a cloud account?

No account with KnowMe AI, LLC is needed. BossFang runs locally, with its API and dashboard on your own machine by default, and its embedded database needs no separate service.[^bf-agents] Using a model provider needs that provider's own credentials.

## How is BossFang different from LibreFang?

BossFang keeps LibreFang's agent operating system and changes storage to SurrealDB by default, memory to the Surreal Memory Server library, and model access to include the Universal Agent Runtime. It also has its own branding, desktop identity and plugin host.[^bf-ledger] See [BossFang and upstream LibreFang](/bossfang/bossfang-and-upstream-librefang.md).

## How is BossFang different from the Universal Agent Runtime?

BossFang manages agents, channels and a dashboard. The Universal Agent Runtime is a separate service that BossFang connects to for model access and governed runs; BossFang never starts or stops it. That connection is implemented in source but not yet built or tested.[^bf-uar]

## How do I install BossFang?

Install steps exist in the fork's README, but they mix upstream LibreFang package channels with fork-specific scripts, and BossFang's feature ledger records that its binary name is not settled.[^bf-readme][^bf-ledger] The fork's releases are native payloads built for The Boss, and their notes say release acceptance is tracked separately.[^bf-releases] No tested end-user install path is established, so this knowledge base gives no command.
