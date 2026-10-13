---
type: Concept
title: BossFang status and licence
description: BossFang's status as recorded in its own feature ledger, the known gaps, and its MIT licence and lineage.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - bossfang
  - status
  - licence
sources:
  - id: bf-ledger
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang/feature-ledger.md
    title: BossFang feature ledger
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-releases
    resource: https://github.com/GQAdonis/librefang/releases
    title: BossFang fork releases page
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-readme
    resource: https://github.com/GQAdonis/librefang/blob/main/README.md
    title: BossFang repository README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: bf-license
    resource: https://github.com/GQAdonis/librefang/blob/main/LICENSE
    title: BossFang repository LICENSE
    last_modified: "2026-10-13T01:28:18+00:00"
---

# BossFang status and licence

## How BossFang tracks its own status

BossFang keeps a feature ledger of every BossFang-only feature with a status: GREEN means shipped with an automated guard, PARTIAL means shipped with an incomplete guard or known debt, DEFERRED means a gap left open on purpose, and DRIFT means the documentation and the code disagree.[^bf-ledger] Most rows are GREEN or PARTIAL.[^bf-ledger]

## Known gaps in BossFang

Remote SurrealDB mode is tested through configuration only, not against a live server. BossFang does not yet start its Surreal Memory Server-based semantic memory when it boots, and the ledger notes that this backend's writes are currently rejected. Several recent upstream schema changes have no SurrealDB counterpart yet.[^bf-ledger]

## Status of the BossFang connection to the Universal Agent Runtime

The current connection design, where BossFang connects to an existing runtime and never runs it, is described in its documentation as implemented in source, not yet built or tested. Desktop packaging and real desktop operation remain to be done.[^bf-uar]

## BossFang releases

The BossFang fork's releases page carries native BossFang payloads built for The Boss's integrated desktop app: 14 entries when checked on 2026-10-13, named like "BossFang sidecar" or "BossFang payload" with a source commit, several marked pre-release. Their notes say application operation and release acceptance are tracked separately.[^bf-releases] No end-user BossFang release or tested install path is established here.

## Installing BossFang

The README mixes upstream LibreFang package channels with fork-specific steps, such as an install script and a Cargo install from the fork.[^bf-readme] No tested end-user install path is established, so this knowledge base gives no install command.

## BossFang licence

BossFang is MIT licensed. Its LICENSE file is the MIT licence with copyright held by the LibreFang contributors, because BossFang is a fork of LibreFang.[^bf-license]
