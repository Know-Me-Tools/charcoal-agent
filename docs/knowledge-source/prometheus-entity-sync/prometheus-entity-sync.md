---
type: Concept
title: "Prometheus Entity Sync"
description: "What Prometheus Entity Sync is: a Rust database synchronization engine with client SDKs, an existing implementation and prototype."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - prometheus
  - entity-sync
  - synchronization
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: sync-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-sync/blob/main/README.md
    title: "Prometheus Entity Sync README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Prometheus Entity Sync

Prometheus Entity Sync is a Rust-native engine for bidirectional database synchronization, with client SDKs for the browser, Flutter and native apps.[^pf] The portfolio's status is "Existing implementation and prototype; deployment qualification not audited."[^pf]

## Prometheus Entity Sync status and version

Prometheus Entity Sync has {{v:sync}}. Deployment qualification has not been audited.[^pf]

## What Prometheus Entity Sync does

* Its README describes replication from Postgres to PGlite to SQLite, and says the code is MIT-licensed.[^sync-readme]
* Its server reads the Postgres write-ahead log, sorts changes into per-user buckets with a TOML rule file, and streams them over a WebSocket using MessagePack.[^sync-readme]
* A component maps JWT claims to the data buckets a user may read, using parameterized SQL only.[^sync-readme]
* Client SDKs cover TypeScript with PGlite, Dart for Flutter with SQLite, native Rust, and a Tauri plugin for desktop.[^sync-readme]
* The portfolio lists one related prototype record, a Forge Electric PGlite prototype.[^pf]

## How Prometheus Entity Sync relates to other products

Its README says Entity Sync is built on Flint Realtime Fabric and reuses its change capture, CRDT and operation-log code.[^sync-readme] The portfolio treats such relationships as architectural intent, not proof of completed integration.[^pf]
