# Universal Agent Runtime protocols

## Which protocols the Universal Agent Runtime speaks

UAR exposes an OpenAI-compatible API under `/v1`, an AG-UI event stream, A2UI surfaces for declarative interfaces, an MCP (Model Context Protocol, the open standard agents use to call tools) client with a governed tool bridge, and an A2A endpoint for other agents. Version 1.0.0 published versioned contracts for the OpenAI-compatible API, AG-UI, A2UI and MCP. After the 1.0.0 contracts, releases 1.2.1 to v1.2.3 added caller-owned function declarations across the OpenAI Chat Completions, Anthropic Messages, AG-UI, A2A 1.0 and ACP interfaces. The changelog marks 1.2.1 as acceptance pending and the published 1.2.2 image as having failed one acceptance case; it records that functional acceptance of the published v1.2.3 Linux amd64 image passed within a defined scope, with arm64 outside it.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime changelog, retrieved 2026-10-13.

## The OpenAI-compatible API in the Universal Agent Runtime

Clients that already speak the OpenAI API can point at UAR's `/v1` endpoints. A client can ask for OpenAI-compatible streaming, AG-UI events, or both where the endpoint supports it. UAR normalizes each provider's output once, inside the runtime.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime architecture overview, retrieved 2026-10-13.

## AG-UI in the Universal Agent Runtime

AG-UI is the event vocabulary UAR uses to stream runs: text, tool calls, state and lifecycle events. It does not tell a client which interface components to use.

Source: Universal Agent Runtime architecture overview, retrieved 2026-10-13.

## A2UI in the Universal Agent Runtime

A2UI lets an agent describe an interface as data. UAR validates each A2UI artifact and maps it to an approved list of components; it never runs HTML or JavaScript supplied by a model, and an unknown component type is refused. The documented catalog has 9 protocol components plus 7 UAR entity components. React is the first-party renderer; Lit and Svelte renderers share the same conformance tests.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime architecture overview, retrieved 2026-10-13.

## MCP and A2A in the Universal Agent Runtime

UAR is an MCP client: tools it discovers on MCP servers go through the same schema check, policy decision and audit as built-in tools. For agent-to-agent work UAR has an A2A endpoint; the native service packages bind A2A over gRPC on port 50051 on the local machine by default.

Source: Universal Agent Runtime architecture overview, retrieved 2026-10-13.
Source: Universal Agent Runtime production deployment guide, retrieved 2026-10-13.
