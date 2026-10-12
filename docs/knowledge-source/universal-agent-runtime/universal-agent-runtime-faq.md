---
type: Concept
title: Universal Agent Runtime questions
description: Visitor questions about UAR, answered from its own documentation.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-12T00:00:00+00:00"
tags:
  - universal-agent-runtime
  - faq
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: knowme-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: KnowMe client README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: bossfang-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: sms-intro
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/website/docs/intro.md
    title: Surreal Memory Server documentation introduction
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Universal Agent Runtime questions

## What is the Universal Agent Runtime?

A Rust server that runs AI agents. It routes requests to models, runs tools under a policy with an audit trail, searches documents, keeps memory, and streams results to interfaces over open protocols.[^uar-readme] The KnowMe agent runs on it.[^knowme-readme]

## Is the Universal Agent Runtime free?

The code is MIT licensed, including its SDKs, and its README says there is no commercial licence to buy.[^uar-readme] You supply your own model provider accounts and keys; UAR keeps provider credentials on the server.[^uar-readme]

## Does the Universal Agent Runtime need a cloud account?

No account with KnowMe AI, LLC is needed. You run UAR yourself, and by default it listens only on your own machine.[^uar-readme] Hosted models need that provider's credentials. The distributed server bundle includes local model support, and local FastEmbed embeddings are in the top provider tier.[^uar-matrix]

## Which models does the Universal Agent Runtime support best?

The strongest evidence covers OpenAI-compatible endpoints and Anthropic, plus local FastEmbed embeddings. Many more providers are listed in its catalog, but a listing is metadata, not a promise that a provider works.[^uar-matrix]

## Does the Universal Agent Runtime run on Windows, desktop or mobile?

Web is Stable. Desktop is Preview. Mobile is Experimental. The Windows native archive is Experimental; the Linux and macOS archives are required release gates.[^uar-matrix]

## How is the Universal Agent Runtime different from BossFang?

UAR owns inference, routing, agent execution and governance.[^uar-readme] BossFang is an agent operating system with its own dashboard and orchestration; it connects to a UAR instance as a separate service rather than containing it.[^bossfang-uar]

## How is the Universal Agent Runtime different from the Surreal Memory Server?

UAR is the whole agent runtime. Its optional memory system is built on the Surreal Memory Server's library and SurrealDB.[^uar-memory] The Surreal Memory Server ships that library together with a standalone server that MCP clients can reach directly.[^sms-intro]
