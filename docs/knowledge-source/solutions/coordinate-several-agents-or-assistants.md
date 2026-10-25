---
type: Concept
title: "Coordinate several agents or assistants"
description: "How a visitor who wants several agents to share tasks and messages can use the protocols the Universal Agent Runtime supports, and which coordination products are only designs or prototypes."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - multi-agent
  - coordination
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pem-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-management/blob/main/README.md
    title: "Prometheus Entity Management README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: meet-readme
    resource: https://github.com/Know-Me-Tools/know-meet/blob/main/README.md
    title: "Know Meet repository README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Coordinate several agents or assistants

A visitor asks: "I have several agents or assistants. How do I make them share work and messages?" The only released piece is the Universal Agent Runtime's protocol support. The coordination products are designs and a local prototype.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Coordinate agents: what ships [shipped]

The Universal Agent Runtime, release {{v:uar}}, has an A2A endpoint for agent-to-agent calls, an MCP client with a governed tool bridge, an AG-UI event stream for clients and A2UI surfaces for validated declarative interfaces.[^uar-readme] Prometheus Entity Management ({{v:pem}}) lists an A2A reference server among its packages.[^pem-readme]

## Coordinate agents: what is a design or prototype [planned]

- Companion (a provisional working name): a tested local Axum and Postgres prototype with task hierarchy, events and five MCP tools. Cloud deployment is not verified.[^pf]
- Flint Agent Mesh: a specification for identity, authorization, group encryption, ordered delivery, discovery and synchronization. No deployed mesh is established.[^pf]
- Synaxis: a published design for durable messaging, orchestration and shared memory. An operating service is not established.[^pf]
- Numen: an architecture proposal for governed orchestration across interchangeable hosts.[^pf]
- Know Meet: a synthetic prototype whose README names persistent dots as meeting participants.[^meet-readme]

## Coordinate agents: how the products fit together

- Agents calling each other through UAR's A2A endpoint: [shipped] as a protocol surface.[^uar-readme]
- Companion as a shared workspace for dot, Locus and other agent systems: [planned]. The portfolio says no live cross-agent integration is verified.[^pf]
- Flint Agent Mesh and the other Flint products: no source states a relationship. The shared Flint name is not a stated integration.[^pf]

## Coordinate agents: what is not stated

- No source shows two released products coordinating through Companion, the Mesh, Synaxis or Numen.
- No source gives throughput, latency or scale figures for A2A in UAR.

## Coordinate agents: start here

Read the UAR README on protocol surfaces and run it locally. See [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
