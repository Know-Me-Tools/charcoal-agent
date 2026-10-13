---
type: Concept
title: Universal Agent Runtime protocols
description: The open protocols UAR speaks, as documented, OpenAI-compatible API, AG-UI, A2UI, MCP and A2A.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - universal-agent-runtime
  - protocols
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-arch
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/ARCHITECTURE.md
    title: Universal Agent Runtime architecture overview
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-changelog
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/CHANGELOG.md
    title: Universal Agent Runtime changelog
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-deploy
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/DEPLOYMENT.md
    title: Universal Agent Runtime production deployment guide
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Universal Agent Runtime protocols

## Which protocols the Universal Agent Runtime speaks

UAR exposes an OpenAI-compatible API under `/v1`, an AG-UI event stream, A2UI surfaces for declarative interfaces, an MCP (Model Context Protocol, the open standard agents use to call tools) client with a governed tool bridge, and an A2A endpoint for other agents.[^uar-readme] Version 1.0.0 published versioned contracts for the OpenAI-compatible API, AG-UI, A2UI and MCP.[^uar-changelog]

## The OpenAI-compatible API in the Universal Agent Runtime

Clients that already speak the OpenAI API can point at UAR's `/v1` endpoints.[^uar-readme] A client can ask for OpenAI-compatible streaming, AG-UI events, or both where the endpoint supports it. UAR normalizes each provider's output once, inside the runtime.[^uar-arch]

## AG-UI in the Universal Agent Runtime

AG-UI is the event vocabulary UAR uses to stream runs: text, tool calls, state and lifecycle events. It does not tell a client which interface components to use.[^uar-arch]

## A2UI in the Universal Agent Runtime

A2UI lets an agent describe an interface as data. UAR validates each A2UI artifact and maps it to an approved list of components; it never runs HTML or JavaScript supplied by a model, and an unknown component type is refused.[^uar-readme][^uar-arch] The documented catalog has 9 protocol components plus 7 UAR entity components. React is the first-party renderer; Lit and Svelte renderers share the same conformance tests.[^uar-readme]

## MCP and A2A in the Universal Agent Runtime

UAR is an MCP client: tools it discovers on MCP servers go through the same schema check, policy decision and audit as built-in tools.[^uar-arch] For agent-to-agent work UAR has an A2A endpoint; the native service packages bind A2A over gRPC on port 50051 on the local machine by default.[^uar-deploy]
