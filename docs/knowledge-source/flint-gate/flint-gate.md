---
type: Concept
title: "Flint Gate"
description: "What Flint Gate is, its status as an existing but not independently audited implementation, and its version line."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - flint
  - gate
  - authentication
  - streaming
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: gate-readme
    resource: https://github.com/Know-Me-Tools/flint-gate/blob/main/README.md
    title: "Flint Gate README"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: "Flint Forge README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Flint Gate

Flint Gate is an authentication and authorization proxy for streaming AI workloads, with policy hooks and runtime routing.[^pf] The portfolio's status is "Existing implementation; production qualification not independently audited."[^pf]

## Flint Gate status and version

Flint Gate has {{v:gate}}. The portfolio status stands: an existing implementation whose production qualification has not been independently audited.[^pf]

## What Flint Gate does

* Flint Gate's README describes it as a replacement for Ory Oathkeeper built for streaming language-model traffic. It authenticates, authorizes and enriches requests, then passes them to upstream services.[^gate-readme]
* Flint Gate passes server-sent event streams through without buffering the response, and it can validate or filter AG-UI events and filter A2UI intents.[^gate-readme]
* Flint Gate reloads configuration while running, and routes can be created and changed through an admin API, stored in Postgres.[^gate-readme]
* Flint Gate counts tokens mid-stream from message-content deltas, and a session watchdog ends active streams when a session expires.[^gate-readme]
* Flint Gate's authentication options include a session from an identity service, JWT verification, a database-backed API key and anonymous access.[^gate-readme]

## How Flint Gate relates to other products

The Flint Gate sources state no relationship. Flint Forge's README says Forge sits behind Flint Gate, which handles ingress and authentication.[^forge-readme] These are repository statements of design, not proof that the two run together in a given deployment.[^pf]
