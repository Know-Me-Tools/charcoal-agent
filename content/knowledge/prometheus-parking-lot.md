# Prometheus Parking Lot

Prometheus Parking Lot is a Rust library for resource-aware background work, bounded execution and retrieving results after the initiating request has returned. It is published on crates.io, so it can be reused outside a single application. Registry publication is not runtime qualification.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: prometheus_parking_lot on crates.io, retrieved 2026-10-24.

## Prometheus Parking Lot status and version

The registry version is v0.4.0, as checked on 25 October 2026. The registry lists prometheus_parking_lot and its six component crates (core, embedded, iggy, pg, runtime-tokio and wasm), all seven at 0.4.0 and non-yanked; 0.4.0 was published on 25 October 2026. The portfolio of 24 October recorded 0.3.0, the version current on that date. The Candle-VLLM fork integrates an earlier 0.1.0 Git revision. Publication of 0.4.0 does not mean every consumer has upgraded. The portfolio notes that seven packages are verified as published and a foreign-function package is not published. Registry publication is separate from runtime qualification and application-scale results.

Source: prometheus_parking_lot on crates.io, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## What Prometheus Parking Lot does

* Each task declares a cost, such as units of GPU memory. A pool starts it when the cost fits free capacity and nothing waits ahead, and otherwise parks it.
* Parked tasks start by priority, then in submission order. A task costing more than the pool's total capacity is rejected at submission.
* One pool runs async work on tokio and delivers results to a mailbox, so a client that disconnected can collect them later.
* Another runs work on dedicated operating-system threads. A durable mode parks tasks in a Postgres or redb queue so accepted work survives a crash.
* Each execution runs under a time budget, and work past its budget is cancelled.

Source: Prometheus Parking Lot README, retrieved 2026-10-24.

## How Prometheus Parking Lot relates to other products

The Candle-VLLM Prometheus fork submits completion and streaming work through a Parking Lot pool. Its lockfile pins the 0.1.0 revision.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
