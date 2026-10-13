---
type: Concept
title: Surreal Memory Server status and licence
description: The Surreal Memory Server's publication status, how it is run, and its MIT licence (a LICENSE file has been proposed in the repository).
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - surreal-memory-server
  - status
  - licence
sources:
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: Surreal Memory Server source publication note, 2026-10-05
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-cargo
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/Cargo.toml
    title: Surreal Memory Server workspace manifest
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-crate
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/crates/surreal-memory/Cargo.toml
    title: surreal-memory library package manifest
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: Surreal Memory Server README
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Surreal Memory Server status and licence

## Surreal Memory Server publication status

On 2026-10-05 the owner published the completed source and documentation for review. The publication note is explicit: this is a source publication, not a release and not a certification of any installed runtime.[^sms-publication] The owner plans to resume testing once the code base has stabilised. No release tags are part of the publication.[^sms-publication]

## Surreal Memory Server version

The Surreal Memory Server's workspace manifest gives version 1.10.2.[^sms-cargo] Treat that as the source version, not as a tested release, given the publication note above.

## How the Surreal Memory Server is run

Its README names the native service as the standard local deployment. You point it at a SurrealDB endpoint and an embedding provider through environment variables; containers are optional packaging for development.[^sms-readme] It can sign in to SurrealDB as a root, namespace or database user, so it does not need root access to a shared database.[^sms-readme]

## Surreal Memory Server licence

The Surreal Memory Server is MIT licensed. The owners state it is MIT licensed; a LICENSE file has been proposed in the repository. Its library package manifest already declares MIT.[^sms-crate]
