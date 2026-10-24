# Prometheus Entity Sync

Prometheus Entity Sync is a Rust-native engine for bidirectional database synchronization, with client SDKs for the browser, Flutter and native apps. The portfolio's status is "Existing implementation and prototype; deployment qualification not audited."

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## Prometheus Entity Sync status and version

Prometheus Entity Sync has no tagged release (last commit 2026-09-17). Deployment qualification has not been audited.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## What Prometheus Entity Sync does

* Its README describes replication from Postgres to PGlite to SQLite, and says the code is MIT-licensed.
* Its server reads the Postgres write-ahead log, sorts changes into per-user buckets with a TOML rule file, and streams them over a WebSocket using MessagePack.
* A component maps JWT claims to the data buckets a user may read, using parameterized SQL only.
* Client SDKs cover TypeScript with PGlite, Dart for Flutter with SQLite, native Rust, and a Tauri plugin for desktop.
* The portfolio lists one related prototype record, a Forge Electric PGlite prototype.

Source: Prometheus Entity Sync README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## How Prometheus Entity Sync relates to other products

Its README says Entity Sync is built on Flint Realtime Fabric and reuses its change capture, CRDT and operation-log code. The portfolio treats such relationships as architectural intent, not proof of completed integration.

Source: Prometheus Entity Sync README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
