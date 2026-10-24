---
type: Concept
title: "Prometheus Parking Lot"
description: "What Prometheus Parking Lot is: a published Rust library for resource-aware background work, with its crates.io version and the Candle-VLLM caveat."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - prometheus
  - parking-lot
  - rust
  - scheduling
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: parking-registry
    resource: https://crates.io/crates/prometheus_parking_lot
    title: "prometheus_parking_lot on crates.io"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: parking-readme
    resource: https://github.com/Prometheus-AGS/prometheus-parking-lot-rs/blob/main/README.md
    title: "Prometheus Parking Lot README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Prometheus Parking Lot

Prometheus Parking Lot is a Rust library for resource-aware background work, bounded execution and retrieving results after the initiating request has returned.[^pf] It is published on crates.io, so it can be reused outside a single application.[^parking-registry] Registry publication is not runtime qualification.[^pf]

## Prometheus Parking Lot status and version

The registry version is {{v:parking}}, as checked on 24 October 2026.[^parking-registry] The portfolio records prometheus_parking_lot 0.3.0 and six component crates, all non-yanked at that date. The Candle-VLLM fork integrates an earlier 0.1.0 Git revision. Publication of 0.3.0 does not mean every consumer has upgraded.[^pf] The portfolio notes that seven packages are verified as published and a foreign-function package is not published. Registry publication is separate from runtime qualification and application-scale results.[^pf]

## What Prometheus Parking Lot does

* Each task declares a cost, such as units of GPU memory. A pool starts it when the cost fits free capacity and nothing waits ahead, and otherwise parks it.[^parking-readme]
* Parked tasks start by priority, then in submission order. A task costing more than the pool's total capacity is rejected at submission.[^parking-readme]
* One pool runs async work on tokio and delivers results to a mailbox, so a client that disconnected can collect them later.[^parking-readme]
* Another runs work on dedicated operating-system threads. A durable mode parks tasks in a Postgres or redb queue so accepted work survives a crash.[^parking-readme]
* Each execution runs under a time budget, and work past its budget is cancelled.[^parking-readme]

## How Prometheus Parking Lot relates to other products

The Candle-VLLM Prometheus fork submits completion and streaming work through a Parking Lot pool. Its lockfile pins the 0.1.0 revision.[^pf]
