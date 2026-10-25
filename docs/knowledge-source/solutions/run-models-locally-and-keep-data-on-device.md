---
type: Concept
title: "Run models locally and keep data on your device"
description: "How a visitor who wants language models on their own hardware can use The Boss, the Universal Agent Runtime and the Candle-VLLM fork, with each flow tagged shipped or planned and the limits stated."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - local-models
  - privacy
  - inference
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: cv-readme
    resource: https://github.com/GQAdonis/candle-vllm/blob/main/README.md
    title: "Candle-VLLM Prometheus fork README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: cv-lock
    resource: https://github.com/GQAdonis/candle-vllm/blob/10f844d219ae502d655944aeb223130ffaf24fd9/Cargo.lock
    title: "Candle-VLLM Cargo.lock at 10f844d"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: parking-readme
    resource: https://github.com/Prometheus-AGS/prometheus-parking-lot-rs/blob/main/README.md
    title: "Prometheus Parking Lot README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Run models locally and keep data on your device

A visitor asks: "I don't want my data going to a cloud model. Can I run models on my own machine?" Parts of the portfolio support local models today. KnowMe's full on-device design has no release.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Run local models: what works today [shipped]

The Boss, release {{v:boss}}, holds conversations across cloud and local model providers.[^boss-readme] The Universal Agent Runtime, release {{v:uar}}, lists local FastEmbed embeddings as a Tier 1 path with named capability evidence. OpenAI-compatible and Anthropic execution paths are also Tier 1.[^uar-readme] Which provider you pick decides where your prompts go.

## Run local models: the Candle-VLLM fork [planned, source only]

The Candle-VLLM Prometheus fork serves local language models through an OpenAI-compatible API and submits completion and streaming work through a Prometheus Parking Lot pool. The fork has {{v:candle-vllm}}.[^cv-readme][^pf] The portfolio found no production-scale benchmark. At the inspected commit the lockfile pins an earlier Parking Lot revision, not the published {{v:parking}}.[^pf][^cv-lock]

## Run local models: how the products fit together

- The Boss with a local model provider: [shipped].[^boss-readme]
- The Candle-VLLM fork as a model source for the Universal Agent Runtime or The Boss: no source states this pairing. UAR has an OpenAI-compatible path and the fork exposes an OpenAI-compatible API, but this page does not infer an integration.[^uar-readme][^cv-readme]
- Prometheus Parking Lot, a Rust crate on crates.io ({{v:parking}}), for resource-aware queues inside a serving engine: [shipped] as a library. Registry publication is not runtime qualification.[^parking-readme][^pf]

## Run local models: what KnowMe is designed to do

KnowMe is designed to run models on the person's hardware and make cloud use need explicit approval, provider by provider. KnowMe has no release, so this is design intent. See [KnowMe privacy and data model](/knowme/knowme-privacy.md). The agent on this site is not the KnowMe app. Its messages reach a cloud model.

## Run local models: what is not stated

- No source gives hardware requirements or a list of supported local models.
- No source states that The Boss keeps all data on the device in every configuration.

## Run local models: start here

Download The Boss from https://the-boss.know-me.tools and choose a local provider in its settings.[^boss-site]
