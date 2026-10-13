---
type: Concept
title: BossFang use cases and who it is for
description: Who BossFang is for and its documented uses, with design intent labelled.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:25:33+00:00"
tags:
  - bossfang
  - use-cases
sources:
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, product identity and fork additions
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: bf-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: bf-ledger
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang/feature-ledger.md
    title: BossFang feature ledger
    last_modified: "2026-10-13T00:25:33+00:00"
---

# BossFang use cases and who it is for

## Who BossFang is for

Developers and technical users who want to run and manage a set of AI agents on their own machine, with tools, memory and messaging channels, from a dashboard and a command line.[^bf-agents] BossFang is for people who also want SurrealDB storage, the Surreal Memory Server library for memory, and model access through the Universal Agent Runtime instead of LibreFang's defaults.[^bf-agents]

## Running agents locally with BossFang

The documented use is the one inherited from LibreFang: a local agent operating system that runs agents backed by language models and manages their tools, memory, channels and networking.[^bf-agents]

## Using BossFang with the Universal Agent Runtime

As implemented in source, not yet built or tested, BossFang connects to an existing Universal Agent Runtime instance, including one that The Boss manages, and sends agent runs to it so model access and policy stay in the runtime.[^bf-uar]

## BossFang design intent

Design intent, not a finished capability: the ledger tracks channel routing and authorized observer copies across hosts as work in progress.[^bf-ledger]
