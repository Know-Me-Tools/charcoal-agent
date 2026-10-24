# Phase Exit

Phase Exit decides whether a stage of work is complete, using evidence checked against a contract the team has adopted, with optional bounded semantic judgments. The portfolio lists Phase Exit as an existing preview under reliability hardening, and says it draws no inference about whether a downstream project is complete.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## Phase Exit status and version

Phase Exit has no tagged release (last commit 2026-10-16). Its README calls it a published preview. Its capability matrix records a bounded first-pass acceptance on a Mac; several coding-host integrations are listed as unverified. The Phase Exit source is public under the Apache License 2.0.

Source: Phase Exit README, retrieved 2026-10-24.
Source: Phase Exit capability and qualification matrix, retrieved 2026-10-24.
Source: Phase Exit LICENSE, retrieved 2026-10-24.

## What Phase Exit does

- A Rust engine checks artifact identity and evidence against the adopted contract.
- Phase Exit returns one of six verdicts: COMPLETE, CONTINUE, WAIT, BLOCKED, REVIEW_REQUIRED or INVALID, each with an exit code.
- The engine reads receipts. It does not run commands embedded in a contract, invent tests, add release requirements or accept a model's narrative in place of observed results.
- A contract is imported, frozen after review and then explicitly adopted before it is used.
- Node hooks and Agent Skills are the route by which Phase Exit gives its decision to coding hosts. Several of those host integrations are listed as unverified.

Source: Phase Exit README, retrieved 2026-10-24.
Source: Phase Exit capability and qualification matrix, retrieved 2026-10-24.

## How Phase Exit relates to other products

The portfolio groups Phase Exit with Prometheus Skills, Know Decision, Project Management and Doc Forge as tools that support building and governing the work, and says these relationships are architectural intent, not proof of completed integration. The README says the preview was published for use in a Universal Agent Runtime release phase. Its capability matrix lists a read-only evidence adapter for that runtime.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Phase Exit README, retrieved 2026-10-24.
Source: Phase Exit capability and qualification matrix, retrieved 2026-10-24.
