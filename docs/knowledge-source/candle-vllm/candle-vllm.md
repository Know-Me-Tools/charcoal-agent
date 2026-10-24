---
type: Concept
title: "Candle-VLLM, the Prometheus fork"
description: "What the Prometheus fork of Candle-VLLM is, what was verified at commit 10f844d and what was not."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - candle-vllm
  - inference
  - parking-lot
  - fork
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: cv-readme
    resource: https://github.com/GQAdonis/candle-vllm/blob/main/README.md
    title: "Candle-VLLM Prometheus fork README"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: cv-lock
    resource: https://github.com/GQAdonis/candle-vllm/blob/10f844d219ae502d655944aeb223130ffaf24fd9/Cargo.lock
    title: "Candle-VLLM Cargo.lock at 10f844d"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Candle-VLLM, the Prometheus fork

Candle-VLLM, the Prometheus fork, serves local language models through an OpenAI-compatible API and integrates Prometheus Parking Lot into its inference-serving engine.[^pf][^cv-readme] The portfolio's status is "Code integration verified at 10f844d: completion and streaming paths submit work through the pool." It is a fork of the upstream Candle-VLLM project, not an original product.[^pf][^cv-readme]

## Candle-VLLM status and version

The fork has {{v:candle-vllm}}. At commit 10f844d, the lockfile still pins Parking Lot 0.1.0 at Git revision 32b481d, not the published 0.3.0 release.[^pf][^cv-lock]

## What the Candle-VLLM fork states

* The integration combines KV-cache-aware resource accounting, configurable worker capacity, bounded request queues and streaming-result delivery.[^pf]
* The Candle-VLLM fork's README describes a four-crate workspace and a scheduler that applies backpressure and uses a dedicated thread pool.[^cv-readme]
* The README lists an MCP client, a declarative model configuration file, a pluggable request queue, and prompt caching.[^cv-readme]
* The portfolio found no production-scale benchmark and no live Numen integration. The inspected engine uses its first pipeline, and multiple GPU executors remain future work.[^pf]
* Streaming uses separate threads, so worker capacity alone is not a proven cap on concurrent stream generation.[^pf]

## How Candle-VLLM relates to other products

The fork submits work through Prometheus Parking Lot.[^pf] The portfolio calls the fork a key part of the inference infrastructure supporting Numen work. That is portfolio direction only. No live Numen integration is verified.[^pf]
