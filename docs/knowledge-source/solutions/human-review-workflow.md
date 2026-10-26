---
type: Concept
title: "Human review workflow: who approves what before an agent acts"
description: "How approval works in the Universal Agent Runtime, Flint Gate and The Boss, which tools skip approval, how long a pending approval lasts, and what a person still has to check in an answer."
status: draft
generated:
  by: km-content-creator/sonnet-5-5
  at: "2026-10-26T00:00:00+00:00"
tags:
  - solutions
  - private-data
  - approval
  - governance
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-manager
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/v1.3.0/src/uar/runtime/manager.rs
    title: "Universal Agent Runtime v1.3.0 source: run manager tool decision"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-registry
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/v1.3.0/src/mcp/registry.rs
    title: "Universal Agent Runtime v1.3.0 source: tool registry and approval defaults"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-approvals
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/v1.3.0/src/uar/runtime/thread/approvals.rs
    title: "Universal Agent Runtime v1.3.0 source: pending approvals"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-approval-records
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/v1.3.0/src/uar/persistence/approval_decisions.rs
    title: "Universal Agent Runtime v1.3.0 source: approval records"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: gate-readme
    resource: https://github.com/Know-Me-Tools/flint-gate/blob/main/README.md
    title: "Flint Gate README"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-26T00:00:00+00:00"
---

# Human review workflow: who approves what before an agent acts

A visitor asks: "Who approves an agent's action before it happens, and how long does the approval last?" In the Universal Agent Runtime (UAR), only tools marked read-only skip approval by default, and a pending approval expires after 300 seconds.[^uar-registry][^uar-approvals] Every tool call in a run is decided before it runs: a Cedar policy can deny it, and a tool, the host or the run policy can require a person to approve it.[^uar-manager] This page reads UAR at its {{v:uar:pre}} tag; the stable release is {{v:uar}}.

## Human review workflow: the Universal Agent Runtime [shipped]

- Read-only tools: a tool declares its effect, and only a read-only effect defaults to no approval. Tools that change something outside, run code, or declare nothing need approval.[^uar-registry]
- Tools from an MCP server: the server's own read-only hint is not trusted. Approval is waived only for tools the administrator lists as pre-approved for that server.[^uar-registry]
- A denied call: a denial emits a tool-call-denied event, and the README says a Cedar denial cannot be overridden by a person's approval.[^uar-manager][^uar-readme]
- The record: an approval record keeps who decided, the decision and when, and the states pending, approved, denied, cancelled, expired, interrupted and invalidated.[^uar-approval-records]
- The time limit: a pending approval that nobody answers within 300 seconds expires.[^uar-approvals]

## Human review workflow: Flint Gate and The Boss

- Flint Gate [planned, source only], {{v:gate}}: a Cedar policy can mark a tool call for human approval. The call pauses, an operator approves or denies it, and an undecided request is denied when its limit passes (300 seconds by default). The README says pending approvals live in the memory of one replica, so a multi-replica setup is a stated limit.[^gate-readme] The portfolio status is "Existing implementation; production qualification not independently audited."[^pf]
- The Boss [shipped], release {{v:boss}}: agent sessions use MCP tools and skills with approval boundaries, and you supply your own model provider credentials.[^boss-readme]

## Human review workflow: what a person still has to check

Approval covers an action, not the quality of an answer. An agent's draft, or a count it produced, still needs a person who knows the data to check it against a known figure. Plan reviewer time into the pilot. See [Scope a pilot](/solutions/scope-a-pilot.md).

## Human review workflow: what is not stated

- No source says an approval step was tested with a reviewer working on a real data set.
- No source gives how long reviewers take, or how often they reject a call.
- No source says Flint Gate is deployed in front of the UAR instance on this site.

## Human review workflow: start here

List the tools your agent would use, and mark each one read, write or code. Decide who approves each non-read tool and what happens when nobody answers in 300 seconds. Then ask the KnowMe Concierge how the pieces fit.
