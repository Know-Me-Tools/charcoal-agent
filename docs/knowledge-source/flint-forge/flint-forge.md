---
type: Concept
title: "Flint Forge: Quarry, Anvil and Kiln"
description: "What Flint Forge is, its three parts, and the difference between its README's v1.0-ready claim and its v1.0.0 GitHub release."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - flint
  - forge
  - data-plane
  - edge-compute
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: "Flint Forge README"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: forge-release
    resource: https://github.com/Know-Me-Tools/flint-forge/releases/tag/v1.0.0
    title: "Flint Forge release v1.0.0"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: forge-backend
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/crates/fdb-postgres/src/backend.rs
    title: "Flint Forge source: fdb-postgres backend and row-level security"
    last_modified: "2026-10-26T00:00:00+00:00"
---

# Flint Forge: Quarry, Anvil and Kiln

Flint Forge is the data and edge-compute plane of the Flint platform: REST and GraphQL access to Postgres, database extensions, and signed WebAssembly edge functions.[^pf][^forge-readme] Its parts are named Quarry, Anvil and Kiln.[^forge-readme] The README's v1.0-ready is a source claim, and a v1.0.0 GitHub release exists; neither is an audit.[^pf][^forge-release] Quarry has no read-only mode, and its REST surface includes writes, so read-only access has to come from a read-only Postgres role.[^forge-backend]

## Flint Forge status and version

The portfolio's status is "README reports v1.0-ready; treated as a source claim, not a fresh release audit." That is a claim in the project's own README, not an audit.[^pf] Separately, a stable GitHub release exists: {{v:forge}}, dated {{v:forge:date}}.[^forge-release] A GitHub release is not evidence of an independent audit.

## What Flint Forge's parts do

* Quarry offers a PostgREST-compatible REST surface and a GraphQL surface over Postgres 18.[^forge-readme]
* Anvil is a suite of Postgres extensions for authentication context, webhooks, in-database language-model calls, an encrypted secret store and metadata.[^forge-readme]
* Kiln compiles and runs signed WebAssembly components as edge functions.[^forge-readme]
* The README also lists an operator command-line tool and client SDKs.[^forge-readme]

## How Flint Forge relates to other products

Flint Forge's README says it sits behind Flint Gate, which handles ingress and authentication, and consumes Flint Realtime Fabric for its realtime source.[^forge-readme] Realtime changes can come from Postgres notifications by default or from the Fabric stream when configured.[^forge-readme] The portfolio treats such relationships as architectural intent, not proof of completed integration.[^pf]
