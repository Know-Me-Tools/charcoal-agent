# Candle-VLLM, the Prometheus fork (Candle-VLLM, Prometheus fork)

Candle-VLLM, the Prometheus fork, serves local language models through an OpenAI-compatible API and integrates Prometheus Parking Lot into its inference-serving engine. The portfolio's status is "Code integration verified at 10f844d: completion and streaming paths submit work through the pool." It is a fork of the upstream Candle-VLLM project, not an original product.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Candle-VLLM Prometheus fork README, retrieved 2026-10-24.

## Candle-VLLM status and version (Candle-VLLM, Prometheus fork)

The fork has no tagged release (last commit 2026-05-26). At commit 10f844d, the lockfile still pins Parking Lot 0.1.0 at Git revision 32b481d, not the published 0.3.0 release.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Candle-VLLM Cargo.lock at 10f844d, retrieved 2026-10-24.

## What the Candle-VLLM fork states (Candle-VLLM, Prometheus fork)

* The integration combines KV-cache-aware resource accounting, configurable worker capacity, bounded request queues and streaming-result delivery.
* The Candle-VLLM fork's README describes a four-crate workspace and a scheduler that applies backpressure and uses a dedicated thread pool.
* The README lists an MCP client, a declarative model configuration file, a pluggable request queue, and prompt caching.
* The portfolio found no production-scale benchmark and no live Numen integration. The inspected engine uses its first pipeline, and multiple GPU executors remain future work.
* Streaming uses separate threads, so worker capacity alone is not a proven cap on concurrent stream generation.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Candle-VLLM Prometheus fork README, retrieved 2026-10-24.

## How Candle-VLLM relates to other products (Candle-VLLM, Prometheus fork)

The fork submits work through Prometheus Parking Lot. The portfolio calls the fork a key part of the inference infrastructure supporting Numen work. That is portfolio direction only. No live Numen integration is verified.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
