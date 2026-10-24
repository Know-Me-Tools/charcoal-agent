---
type: Concept
title: "Flint Realtime Fabric"
description: "What Flint Realtime Fabric is, its phase-18 status and what its README says is still deferred."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - flint
  - realtime
  - event-spine
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: frf-readme
    resource: https://github.com/Prometheus-AGS/flint-realtime-fabric/blob/main/README.md
    title: "Flint Realtime Fabric README"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: "Flint Forge README"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: sync-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-sync/blob/main/README.md
    title: "Prometheus Entity Sync README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Flint Realtime Fabric

Flint Realtime Fabric is a realtime substrate written in Rust: a durable event spine, one multiplexed client connection, and separate transports for media, peer CRDT synchronization and federation.[^pf][^frf-readme] The portfolio's status is "README reports phase-18 scope complete; full media loop and broader integration remain qualified separately."[^pf]

## Flint Realtime Fabric status and version

Flint Realtime Fabric has {{v:fabric}}. The phase-18 completion is the README's own statement.[^frf-readme]

## What Flint Realtime Fabric states

* The event spine is built on Apache Iggy.[^frf-readme]
* The repository holds the core, the gateway and the SDKs, with the SDKs generated from one frozen protocol contract.[^frf-readme]
* Flint Realtime Fabric's README says phase 18 completed media, federation and authentication-flow work, including a WebRTC negotiation spike, Matrix inbound sync and AT Protocol outbound writes.[^frf-readme]
* Flint Realtime Fabric's README lists work still deferred: full sovereign SFU media, LiveKit cross-node inbound, full OIDC login and AT Protocol outbound gateway wiring.[^frf-readme]

## How Flint Realtime Fabric relates to other products

Flint Forge's README says Forge consumes Fabric as its realtime source.[^forge-readme] The Prometheus Entity Sync README says Entity Sync is built on Fabric and reuses its change capture, CRDT and operation-log code.[^sync-readme] These are statements of design. The portfolio does not treat them as proof of a completed integration.[^pf]
