---
type: Concept
title: "Build local-first apps with a synced entity graph"
description: "How a visitor building a web, mobile or desktop app that works offline and stays in sync can use Prometheus Entity Management and the Flint platform, with each flow tagged shipped or planned."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - local-first
  - entity-graph
  - sync
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pem-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-management/blob/main/README.md
    title: "Prometheus Entity Management README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sync-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-sync/blob/main/README.md
    title: "Prometheus Entity Sync README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: "Flint Forge README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Build local-first apps with a synced entity graph

A visitor asks: "I'm building an app that must work offline and show the same data in every view. What can I use?" Prometheus Entity Management has a stable release. The sync and realtime parts it can connect to are existing source without releases.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Local-first apps: Prometheus Entity Management [shipped]

Prometheus Entity Management is a normalized, reactive entity graph. Each entity is stored once at a type and id address, so one write updates every list row and detail view. The latest stable release is {{v:pem}}. Its README lists React 19, Flutter with Riverpod 3, Svelte 5, Solid, Alpine, Web Components and HTMX bindings, plus Tauri 2 for desktop and mobile.[^pem-readme] Local-first support is PGlite persistence, Loro convergence, offline queues and reconnect recovery.[^pem-readme] The portfolio notes that version records differ across snapshots.[^pf]

## Local-first apps: transports and the Flint platform

Prometheus Entity Management lists REST, GraphQL, WebSocket, Supabase Realtime and Flint Realtime Fabric as transports.[^pem-readme] The Flint adapter turns Fabric events into graph changes and resumes from an acknowledged checkpoint after a reconnect.[^pem-readme] Flint Realtime Fabric is existing source with {{v:fabric}}.[^pf] Prometheus Entity Sync, which replicates Postgres to PGlite and SQLite, is existing source with {{v:sync}}.[^sync-readme]

## Local-first apps: how the products fit together

- The entity graph with PGlite persistence in the browser: [shipped].[^pem-readme]
- The entity graph reading Fabric events through the Flint adapter: [planned]. The adapter is in the README, and Fabric has no release.[^pem-readme]
- Flint Forge behind Flint Gate, consuming Fabric as its realtime source: [planned]. This is a repository statement of design.[^forge-readme]
- Entity Sync built on Fabric's change capture and operation-log code: [planned].[^sync-readme]

## Local-first apps: what is not stated

- No source says Prometheus Entity Management and Prometheus Entity Sync work together. The entity graph has its own sync package for CRDT and local-first providers.[^pem-readme]
- The portfolio says Entity Sync's deployment qualification is not audited, and Fabric's full media loop and broader integration are qualified separately.[^pf]
- The README's example table calls its five example apps implemented and says that is bounded evidence, not a claim about stable promotion of every package.[^pem-readme]

## Local-first apps: start here

Install the core package and the React binding, or the Flutter package, with the commands in [code recipes from READMEs](/solutions/code-recipes-from-readmes.md). Then read the README's package chooser.
