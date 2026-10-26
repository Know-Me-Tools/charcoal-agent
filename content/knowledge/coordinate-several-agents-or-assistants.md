# Coordinate several agents or assistants (Solutions)

A visitor asks: "I have several agents or assistants. How do I make them share work and messages?" The only released piece is the Universal Agent Runtime's protocol support. The coordination products are designs and a local prototype. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Coordinate agents: what ships [shipped] (Solutions)

The Universal Agent Runtime, release v1.2.3, has an A2A endpoint for agent-to-agent calls, an MCP client with a governed tool bridge, an AG-UI event stream for clients and A2UI surfaces for validated declarative interfaces. Prometheus Entity Management (v4.1.1) lists an A2A reference server among its packages.

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: Prometheus Entity Management README, retrieved 2026-10-25.

## Coordinate agents: what is a design or prototype [planned] (Solutions)

- Companion (a provisional working name): a tested local Axum and Postgres prototype with task hierarchy, events and five MCP tools. Cloud deployment is blocked on reauthentication and verification.
- Flint Agent Mesh: a specification for identity, authorization, group encryption, ordered delivery, discovery and synchronization. No deployed mesh is established.
- Synaxis: a published design for durable messaging, orchestration and shared memory. An operating service is not established.
- Numen: an architecture proposal for governed orchestration across interchangeable hosts.
- Know Meet: a synthetic prototype whose README names persistent dots as meeting participants.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Know Meet repository README, retrieved 2026-10-25.

## Coordinate agents: how the products fit together (Solutions)

- Agents calling each other through UAR's A2A endpoint: [shipped] as a protocol surface.
- Companion as a shared workspace for dot, Locus and other agent systems: [planned]. The portfolio says no live cross-agent integration is verified.
- Flint Agent Mesh and the other Flint products: no source states a relationship. The shared Flint name is not a stated integration.

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Coordinate agents: what is not stated (Solutions)

- No source shows two released products coordinating through Companion, the Mesh, Synaxis or Numen.
- No source gives throughput, latency or scale figures for A2A in UAR.

## Coordinate agents: start here (Solutions)

Read the UAR README on protocol surfaces and run it locally. See [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
