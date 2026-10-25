# Add an AI agent to an existing product (Solutions)

A visitor asks: "We already have a product. How do we add an AI agent to it?" The Universal Agent Runtime is the portfolio's runtime for this. It has a stable release, and some of its client libraries are not confirmed as published. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Add an agent: the Universal Agent Runtime [shipped] (Solutions)

The Universal Agent Runtime (UAR), release v1.2.3, is a Rust and Axum server for governed agent execution, model routing, tools and retrieval. Clients reach it over one REST and server-sent-events boundary on port 1906. Its protocol surfaces are an OpenAI-compatible API under /v1, an A2A endpoint, an MCP client with a governed tool bridge, an AG-UI event stream and validated A2UI surfaces. The browser never talks to model providers, tools or storage directly.

Source: Universal Agent Runtime README, retrieved 2026-10-25.

## Add an agent: client libraries and interface parts (Solutions)

- UAR includes SDK source packages for Rust, Python and TypeScript. The README says registry publication is release-ordered, so this page does not establish that they are published [planned].
- A2UI renderers exist for React, Lit and Svelte.
- Prometheus Entity Management lists an A2UI React renderer and an A2A reference server among its packages (v4.1.1).
- The KnowMe Concierge client, the code behind this site's agent, streams UAR's replies, keeps threads locally and syncs skills to the runtime. It is an existing implementation, not a packaged library.

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: Prometheus Entity Management README, retrieved 2026-10-25.
Source: KnowMe Concierge repository README, retrieved 2026-10-25.

## Add an agent: how the products fit together (Solutions)

- Your application calling UAR over the OpenAI-compatible API or the run endpoints: [shipped], with the portfolio's caveat that UAR's current qualification is not established.
- Flint Gate in front of UAR for authentication: [planned]. Gate has no release.
- The Surreal Memory Server library behind UAR's optional memory: [planned].

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Universal Agent Runtime memory system, retrieved 2026-10-25.

## Add an agent: what is not stated (Solutions)

- No source gives a hosted UAR service or support terms.
- No source gives sizing guidance or a performance figure for UAR.
- UAR's support matrix marks the Windows native archive Experimental, and mobile and desktop as Preview or Experimental.
- The UAR README states its own version as 1.0.0. The latest release comes from the repository's release record.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Add an agent: start here (Solutions)

Run UAR locally as the README describes, then call it from your application. The commands are in [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
