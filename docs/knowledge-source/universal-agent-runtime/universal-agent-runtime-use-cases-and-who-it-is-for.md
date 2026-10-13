---
type: Concept
title: Universal Agent Runtime use cases and who it is for
description: Documented uses of UAR, its stated design intent, and where it does not fit yet.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:05:39+00:00"
tags:
  - universal-agent-runtime
  - use-cases
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: uar-licensing
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/licensing/LICENSING.md
    title: Universal Agent Runtime licensing model
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: uar-deploy
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/DEPLOYMENT.md
    title: Universal Agent Runtime production deployment guide
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: knowme-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: KnowMe client README
    last_modified: "2026-10-13T00:05:39+00:00"
---

# Universal Agent Runtime use cases and who it is for

## Who the Universal Agent Runtime is for

UAR suits developers and teams who want model access, tool permissions, retrieval and auditing in one server they run themselves, with clients that only render what the server sends.[^uar-readme] It is infrastructure, not an app for end users: a person meets it through a client such as KnowMe.[^knowme-readme]

## Documented uses of the Universal Agent Runtime

The KnowMe client uses UAR as the runtime for the KnowMe agent.[^knowme-readme] BossFang is documented as a client of UAR's OpenAI-compatible API.[^uar-matrix] UAR's memory documentation gives a personal assistant that remembers people and their relationships across sessions as an example.[^uar-memory] Any OpenAI-compatible client can use UAR's `/v1` API.[^uar-readme]

## Universal Agent Runtime design intent: many small nodes

Design intent, not a shipped capability: UAR's licensing note says it is designed to run decentralized, on phones, laptops and small always-on machines that find and serve each other peer to peer, and that this is why it moved to MIT.[^uar-licensing] Today mobile is Experimental and web is the Stable platform.[^uar-matrix]

## When the Universal Agent Runtime may not fit yet

Some limits are documented plainly. Arbitrary WASM cannot run in the browser. The Windows native archive and mobile support are Experimental. The container image is about 3 GB.[^uar-matrix][^uar-deploy] A production setup needs its own authentication, secrets, trusted origins and tool policy before it is exposed.[^uar-readme] If you need a hosted service with nothing to operate, UAR does not describe one.
