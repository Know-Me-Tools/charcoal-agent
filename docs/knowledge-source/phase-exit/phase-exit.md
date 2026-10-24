---
type: Concept
title: Phase Exit
description: What Phase Exit is, its preview status, the decisions it returns and its stated relationships.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - phase-exit
  - tools
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: KnowMe and Prometheus portfolio, Edition 2
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pe-readme
    resource: https://github.com/Know-Me-Tools/phase-exit/blob/main/README.md
    title: Phase Exit README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pe-capabilities
    resource: https://github.com/Know-Me-Tools/phase-exit/blob/main/docs/capabilities.md
    title: Phase Exit capability and qualification matrix
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pe-license
    resource: https://github.com/Know-Me-Tools/phase-exit/blob/main/LICENSE
    title: Phase Exit LICENSE
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Phase Exit

Phase Exit decides whether a stage of work is complete, using evidence checked against a contract the team has adopted, with optional bounded semantic judgments.[^portfolio] The portfolio lists Phase Exit as an existing preview under reliability hardening, and says it draws no inference about whether a downstream project is complete.[^portfolio]

## Phase Exit status and version

Phase Exit has {{v:phase-exit}}. Its README calls it a published preview.[^pe-readme] Its capability matrix records a bounded first-pass acceptance on a Mac; several coding-host integrations are listed as unverified.[^pe-capabilities] The Phase Exit source is public under the Apache License 2.0.[^pe-license]

## What Phase Exit does

- A Rust engine checks artifact identity and evidence against the adopted contract.[^pe-readme]
- Phase Exit returns one of six verdicts: COMPLETE, CONTINUE, WAIT, BLOCKED, REVIEW_REQUIRED or INVALID, each with an exit code.[^pe-readme]
- The engine reads receipts. It does not run commands embedded in a contract, invent tests, add release requirements or accept a model's narrative in place of observed results.[^pe-readme]
- A contract is imported, frozen after review and then explicitly adopted before it is used.[^pe-readme]
- Node hooks and Agent Skills are the route by which Phase Exit gives its decision to coding hosts.[^pe-readme] Several of those host integrations are listed as unverified.[^pe-capabilities]

## How Phase Exit relates to other products

The portfolio groups Phase Exit with Prometheus Skills, Know Decision, Project Management and Doc Forge as tools that support building and governing the work, and says these relationships are architectural intent, not proof of completed integration.[^portfolio] The README says the preview was published for use in a Universal Agent Runtime release phase.[^pe-readme] Its capability matrix lists a read-only evidence adapter for that runtime.[^pe-capabilities]
