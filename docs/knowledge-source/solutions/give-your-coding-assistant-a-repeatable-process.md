---
type: Concept
title: "Give your coding assistant a repeatable process"
description: "How a developer who wants an AI coding assistant to plan, execute and review work the same way each time can use the Prometheus skill packages and related tools, with each flow tagged shipped or planned."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - coding-assistants
  - skills
  - process
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: "Prometheus Skill Pack README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: "Prometheus Skills Mini README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: kpm-readme
    resource: https://github.com/Know-Me-Tools/know-me-project-management/blob/main/README.md
    title: "know-me-project-management README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pe-readme
    resource: https://github.com/Know-Me-Tools/phase-exit/blob/main/README.md
    title: "Phase Exit README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pk-readme
    resource: https://github.com/Prometheus-AGS/prometheus-knowledge-rs/blob/main/README.md
    title: "Prometheus Knowledge README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Give your coding assistant a repeatable process

A visitor asks: "My coding assistant does different things every session. How do I get it to plan, build and review the same way?" Two released skill packages and several supporting tools address this.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Repeatable process: the skill packages [shipped]

The Prometheus Skill Pack, release {{v:skills}}, is the broad distribution. It covers many languages and domains, process orchestration and learning, and optional native services. Prometheus Skills Mini, release {{v:mini}}, is a smaller portable set with Node entry points.[^full-readme][^mini-readme] Both share skill names and the KBD workflow, the packages' name for the assess, plan, execute, reflect cycle. They share skill names, so they should not share a home directory.[^mini-readme]

## Repeatable process: supporting tools

- KnowMe Project Management [planned, source only]: sets up or converts a project with shared agent instructions, a spec-driven change workflow, an agent team and a documentation site.[^kpm-readme]
- Phase Exit [planned, preview]: returns one of six verdicts on whether a stage is complete, from receipts checked against an adopted contract.[^pe-readme]
- Prometheus Knowledge [planned, source only]: stop hooks write a queue record, and a separate learning worker publishes immutable knowledge snapshots.[^pk-readme]

## Repeatable process: how the products fit together

- Skill packages with the Surreal Memory Server as optional memory: [planned], because the memory server has no release.[^full-readme]
- Project Management using kbd-init and agent-team-creator: [planned].[^kpm-readme]
- Phase Exit with the Universal Agent Runtime release phase: [planned].[^pe-readme]
- The portfolio calls such groupings architectural intent.[^pf]

## Repeatable process: what is not stated

- A copied skill or an exported team definition does not prove that a given coding assistant can run it.[^full-readme]
- Phase Exit lists several coding-host integrations as unverified.[^pe-readme]

## Repeatable process: start here

Follow the Skills Mini README setup check and copy step, or the full pack's install script, in a test project first.[^mini-readme][^full-readme]
