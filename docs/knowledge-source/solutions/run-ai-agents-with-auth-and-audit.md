---
type: Concept
title: "Run AI agents with authentication and an audit trail"
description: "How a visitor who wants agents that act only with permission and leave a record can use the Universal Agent Runtime and Flint Gate, with each flow tagged shipped or planned."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - governance
  - authentication
  - audit
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: gate-readme
    resource: https://github.com/Know-Me-Tools/flint-gate/blob/main/README.md
    title: "Flint Gate README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: demos-readme
    resource: https://github.com/Know-Me-Tools/demos/blob/main/README.md
    title: "demos README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-release
    resource: https://github.com/Prometheus-AGS/the-boss/releases/tag/v2.2.41
    title: "The Boss v2.2.41 release notes"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Run AI agents with authentication and an audit trail

A visitor asks: "I want agents that act for my team, but only with permission, and I need a record of what they did." Two products address this: the Universal Agent Runtime, which has a release, and Flint Gate, which is existing source without one.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Run agents with auth and audit: the Universal Agent Runtime [shipped]

The Universal Agent Runtime (UAR), release {{v:uar}}, runs every tool call through the same path. The README says tools found through MCP and built-in tools share schema validation, Cedar policy, approval, hard-deny and audit controls, and that a Cedar Deny cannot be overridden by user approval.[^uar-readme] By default every API request requires a JWT.[^uar-readme] The portfolio's status for UAR is "Work stopped; current runtime qualification not established." The repository is the newer record, and {{v:uar:pre}} is a pre-release with verification pending.[^pf]

## Run agents with auth and audit: Flint Gate [planned, source only]

Flint Gate is an authentication and authorization proxy for streaming AI workloads, with {{v:gate}}. Its README lists session, JWT, API-key and anonymous authentication.[^gate-readme] It treats agent and service identities as separate kinds from human users, so a policy can allow an agent a tool that a person may not call.[^gate-readme] Token budgets can be set per agent, and an outage of the budget store denies agent requests rather than allowing them.[^gate-readme] The portfolio status is "Existing implementation; production qualification not independently audited."[^pf]

## Run agents with auth and audit: human approval in Flint Gate

A Cedar policy in Flint Gate can mark a tool call for human approval. The gateway pauses the call, an operator approves or denies it in the admin API or the web interface, and an undecided request is denied when its time limit passes (300 seconds by default).[^gate-readme] The README says pending approvals live in the memory of one replica in this release, so a multi-replica deployment is a stated limit.[^gate-readme] Identity issue, rotation and revocation are written to an audit trail, and revocation takes effect on the next authorization.[^gate-readme]

## Run agents with auth and audit: how the products fit together

- UAR alone, with its token requirement, Cedar policy and audit controls: [shipped].[^uar-readme]
- Flint Gate in front of UAR for edge authentication: [planned]. The UAR README says Flint Gate owns edge auth enforcement, and the demo platform README assigns Gate identity and UAR agent execution. Those are design statements, and Gate has no release.[^uar-readme][^demos-readme]
- The Boss: its agent sessions use MCP tools, skills and approval boundaries, and the v2.2.41 release notes say its installers include UAR sidecar payloads [shipped].[^boss-readme][^boss-release]

## Run agents with auth and audit: what is not stated

- No source gives an independent audit of either product's production use.
- No source says Flint Gate is deployed in front of the UAR instance on this site.
- The Gate README names a single-replica limit for approvals.[^gate-readme]
- The sources for these products make no regulatory-compliance statement.

## Run agents with auth and audit: start here

Read the UAR README security section and run UAR locally, then read the Flint Gate README on non-human identities. Commands are in [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
