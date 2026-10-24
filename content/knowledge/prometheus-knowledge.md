# Prometheus Knowledge and its learning worker (Prometheus Knowledge / learning worker)

Prometheus Knowledge is a Rust runtime for human-readable Markdown knowledge records, bounded and immutable prompt snapshots, and durable reconciliation of memory operations. The portfolio's status is "Existing runtime; current deployment coverage not audited."

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Prometheus Knowledge README, retrieved 2026-10-24.

## Prometheus Knowledge status and version (Prometheus Knowledge / learning worker)

The latest tag is v1.11.0, a git tag without a GitHub release. Current deployment coverage has not been audited.

Source: Prometheus Knowledge README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## What Prometheus Knowledge does (Prometheus Knowledge / learning worker)

* Project, shared and global snapshots are published as immutable generations, each with an atomic pointer to the current one.
* Prompt context reads one validated generation per scope and applies fixed size budgets.
* Stop hooks write a queue record to disk and do no inference or network work. A separate learning worker does the extraction, queue transitions and snapshot publishing.
* The worker submits memory operations and reconciles their receipts. Operations whose receipt stops changing are marked stale after a configurable time, six hours by default.
* A doctor command reports on snapshots, queue state and project scope without changing anything.

Source: Prometheus Knowledge README, retrieved 2026-10-24.

## How Prometheus Knowledge relates to other products (Prometheus Knowledge / learning worker)

The sources read for this page do not name another portfolio product that Prometheus Knowledge works with. Its README refers to a memory service by its operation and receipt contract, not by product name.

Source: Prometheus Knowledge README, retrieved 2026-10-24.
