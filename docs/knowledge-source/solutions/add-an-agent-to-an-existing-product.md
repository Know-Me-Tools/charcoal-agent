---
type: Concept
title: "Add an AI agent to an existing product"
description: "How a visitor who wants to put an agent inside an app they already have can use the Universal Agent Runtime and related pieces, with each flow tagged shipped or planned."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - agents
  - integration
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
  - id: concierge-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: "KnowMe Concierge repository README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: "Universal Agent Runtime memory system"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: "Universal Agent Runtime product support matrix"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Add an AI agent to an existing product

A visitor asks: "We already have a product. How do we add an AI agent to it?" The Universal Agent Runtime is the portfolio's runtime for this. It has a stable release, and some of its client libraries are not confirmed as published.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Add an agent: the Universal Agent Runtime [shipped]

The Universal Agent Runtime (UAR), release {{v:uar}}, is a Rust and Axum server for governed agent execution, model routing, tools and retrieval. Clients reach it over one REST and server-sent-events boundary on port 1906.[^uar-readme] Its protocol surfaces are an OpenAI-compatible API under /v1, an A2A endpoint, an MCP client with a governed tool bridge, an AG-UI event stream and validated A2UI surfaces.[^uar-readme] The browser never talks to model providers, tools or storage directly.[^uar-readme]

## Add an agent: client libraries and interface parts

- UAR includes SDK source packages for Rust, Python and TypeScript. The README says registry publication is release-ordered, so this page does not establish that they are published [planned].[^uar-readme]
- A2UI renderers exist for React, Lit and Svelte.[^uar-readme]
- Prometheus Entity Management lists an A2UI React renderer and an A2A reference server among its packages ({{v:pem}}).[^pem-readme]
- The KnowMe Concierge client, the code behind this site's agent, streams UAR's replies, keeps threads locally and syncs skills to the runtime. It is an existing implementation, not a packaged library.[^concierge-readme]

## Add an agent: how the products fit together

- Your application calling UAR over the OpenAI-compatible API or the run endpoints: [shipped], with the portfolio's caveat that UAR's current qualification is not established.[^uar-readme][^pf]
- Flint Gate in front of UAR for authentication: [planned]. Gate has no release.[^uar-readme]
- The Surreal Memory Server library behind UAR's optional memory: [planned].[^uar-memory]

## Add an agent: what is not stated

- No source gives a hosted UAR service or support terms.
- No source gives sizing guidance or a performance figure for UAR.
- UAR's support matrix marks the Windows native archive Experimental, and mobile and desktop as Preview or Experimental.[^uar-matrix]
- The UAR README states its own version as 1.0.0. The latest release comes from the repository's release record.[^pf]

## Add an agent: start here

Run UAR locally as the README describes, then call it from your application. The commands are in [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
