# Run models locally and keep data on your device (Solutions)

A visitor asks: "I don't want my data going to a cloud model. Can I run models on my own machine?" Parts of the portfolio support local models today. KnowMe's full on-device design has no release. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Run local models: what works today [shipped] (Solutions)

The Boss, release v2.2.41, holds conversations across cloud and local model providers. The Universal Agent Runtime, release v1.2.3, lists local FastEmbed embeddings as a Tier 1 path with named capability evidence. OpenAI-compatible and Anthropic execution paths are also Tier 1. Which provider you pick decides where your prompts go.

Source: The Boss README, retrieved 2026-10-25.
Source: Universal Agent Runtime README, retrieved 2026-10-25.

## Run local models: the Candle-VLLM fork [planned, source only] (Solutions)

The Candle-VLLM Prometheus fork serves local language models through an OpenAI-compatible API and submits completion and streaming work through a Prometheus Parking Lot pool. The fork has no tagged release (last commit 2026-05-26). The portfolio found no production-scale benchmark. At the inspected commit the lockfile pins an earlier Parking Lot revision, not the published v0.3.0.

Source: Candle-VLLM Prometheus fork README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Candle-VLLM Cargo.lock at 10f844d, retrieved 2026-10-25.

## Run local models: how the products fit together (Solutions)

- The Boss with a local model provider: [shipped].
- The Candle-VLLM fork as a model source for the Universal Agent Runtime or The Boss: no source states this pairing. UAR has an OpenAI-compatible path and the fork exposes an OpenAI-compatible API, but this page does not infer an integration.
- Prometheus Parking Lot, a Rust crate on crates.io (v0.3.0), for resource-aware queues inside a serving engine: [shipped] as a library. Registry publication is not runtime qualification.

Source: The Boss README, retrieved 2026-10-25.
Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: Candle-VLLM Prometheus fork README, retrieved 2026-10-25.
Source: Prometheus Parking Lot README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Run local models: what KnowMe is designed to do (Solutions)

KnowMe is designed to run models on the person's hardware and make cloud use need explicit approval, provider by provider. KnowMe has no release, so this is design intent. See [KnowMe privacy and data model](/knowme/knowme-privacy.md). The agent on this site is not the KnowMe app. Its messages reach a cloud model.

## Run local models: what is not stated (Solutions)

- No source gives hardware requirements or a list of supported local models.
- No source states that The Boss keeps all data on the device in every configuration.

## Run local models: start here (Solutions)

Download The Boss from https://the-boss.know-me.tools and choose a local provider in its settings.

Source: The Boss download page, retrieved 2026-10-25.
