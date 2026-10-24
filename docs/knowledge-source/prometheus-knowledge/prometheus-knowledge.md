---
type: Concept
title: "Prometheus Knowledge and its learning worker"
description: "What Prometheus Knowledge is: a Rust runtime for Markdown knowledge records, immutable prompt snapshots and memory reconciliation."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - prometheus
  - knowledge
  - learning-worker
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pk-readme
    resource: https://github.com/Prometheus-AGS/prometheus-knowledge-rs/blob/main/README.md
    title: "Prometheus Knowledge README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Prometheus Knowledge and its learning worker

Prometheus Knowledge is a Rust runtime for human-readable Markdown knowledge records, bounded and immutable prompt snapshots, and durable reconciliation of memory operations.[^pf][^pk-readme] The portfolio's status is "Existing runtime; current deployment coverage not audited."[^pf]

## Prometheus Knowledge status and version

The latest tag is {{v:knowledge}}, a git tag without a GitHub release.[^pk-readme] Current deployment coverage has not been audited.[^pf]

## What Prometheus Knowledge does

* Project, shared and global snapshots are published as immutable generations, each with an atomic pointer to the current one.[^pk-readme]
* Prompt context reads one validated generation per scope and applies fixed size budgets.[^pk-readme]
* Stop hooks write a queue record to disk and do no inference or network work. A separate learning worker does the extraction, queue transitions and snapshot publishing.[^pk-readme]
* The worker submits memory operations and reconciles their receipts. Operations whose receipt stops changing are marked stale after a configurable time, six hours by default.[^pk-readme]
* A doctor command reports on snapshots, queue state and project scope without changing anything.[^pk-readme]

## How Prometheus Knowledge relates to other products

The sources read for this page do not name another portfolio product that Prometheus Knowledge works with. Its README refers to a memory service by its operation and receipt contract, not by product name.[^pk-readme]
