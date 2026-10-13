---
type: Concept
title: Surreal Memory Server status and licence
description: The Surreal Memory Server's publication status, how it is run, and its licence (stated as MIT, but no LICENSE file is in the repository yet).
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:25:33+00:00"
tags:
  - surreal-memory-server
  - status
  - licence
sources:
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: Surreal Memory Server source publication note, 2026-10-05
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: sms-cargo
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/Cargo.toml
    title: Surreal Memory Server workspace manifest
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: sms-crate
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/crates/surreal-memory/Cargo.toml
    title: surreal-memory library package manifest
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: Surreal Memory Server README
    last_modified: "2026-10-13T00:25:33+00:00"
---

# Surreal Memory Server status and licence

## Surreal Memory Server publication status

On 2026-10-05 the owner published the completed source and documentation for review. The publication note is explicit: this is a source publication, not a release and not a certification of any installed runtime.[^sms-publication] An earlier release integration did not pass as a whole, and the owner stopped further product testing and the planned rollout. No release tags are part of the publication.[^sms-publication]

## Surreal Memory Server version

The Surreal Memory Server's workspace manifest gives version 1.10.2.[^sms-cargo] Treat that as the source version, not as a tested release, given the publication note above.

## How the Surreal Memory Server is run

Its README names the native service as the standard local deployment. You point it at a SurrealDB endpoint and an embedding provider through environment variables; containers are optional packaging for development.[^sms-readme] It can sign in to SurrealDB as a root, namespace or database user, so it does not need root access to a shared database.[^sms-readme]

## Surreal Memory Server licence

The Surreal Memory Server's authors state that it is MIT licensed, and its library package manifest declares MIT.[^sms-crate] The repository does not yet contain a LICENSE file, so check the repository before relying on that.
