---
type: Concept
title: "Flint core infrastructure"
description: "What Flint core infrastructure covers and its status: an existing infrastructure source whose current deployment was not audited."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - flint
  - infrastructure
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: infra-readme
    resource: https://github.com/Prometheus-AGS/flint-infra/blob/main/README.md
    title: "Flint core infrastructure README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Flint core infrastructure

Flint core infrastructure is the shared identity, authorization, data and realtime infrastructure configuration for the platform.[^pf] The portfolio's status is "Existing infrastructure source; current deployment not audited."[^pf]

## Flint core infrastructure status and version

Flint core infrastructure has {{v:core-infra}}. The portfolio did not audit the current deployment, and the portfolio withholds operational details.[^pf] This page does not describe hosting, addresses or deployment.

## What Flint core infrastructure covers

* The repository holds infrastructure-as-code for the platform's core stack, plus the automation that builds, validates and deploys it.[^infra-readme]
* The README groups the stack by capability: identity, an authorization edge, a data plane, and realtime.[^infra-readme]
* The data plane in that list is Flint Forge's Quarry, the authorization edge is Flint Gate, and the realtime component is Flint Realtime Fabric.[^infra-readme]
* The portfolio notes that architecture Markdown exists but no verified public standalone publication of it.[^pf]

## How Flint core infrastructure relates to other products

The repository's README places Flint Gate, Flint Forge's Quarry and Flint Realtime Fabric in the stack it configures.[^infra-readme] The portfolio treats relationships as architectural intent, not proof of completed integration or of a running deployment.[^pf]
