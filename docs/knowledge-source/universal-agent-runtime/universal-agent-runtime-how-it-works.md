---
type: Concept
title: How the Universal Agent Runtime works
description: Plain-language description of a UAR run, governed tool execution, model routing, storage, retrieval and memory.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:25:33+00:00"
tags:
  - universal-agent-runtime
  - architecture
  - governance
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: uar-arch
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/ARCHITECTURE.md
    title: Universal Agent Runtime architecture overview
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: uar-providers
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/PROVIDER_CONFIGURATION.md
    title: Universal Agent Runtime provider configuration guide
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: Universal Agent Runtime memory system
    last_modified: "2026-10-13T00:25:33+00:00"
---

# How the Universal Agent Runtime works

## A Universal Agent Runtime run, step by step

A client asks UAR to start a run and opens a stream. UAR's run manager checks each action with its policy engine, sends the request to a model chosen by its router, and streams text, tool activity and citations back to the client as events. A client that joins late can catch up on the current interface state by replay.[^uar-readme] UAR is one Rust process; the React interface only shows state and sends requests.[^uar-arch]

## What governed agent execution means in the Universal Agent Runtime

Every tool call takes the same path, whether the tool came from an MCP (Model Context Protocol, the open standard agents use to call tools) server or is built in. UAR checks the inputs against the tool's schema, a policy, written in the Cedar policy language, returns Allow, RequireApproval or Deny, and the decision is written to an audit record. A user's approval cannot override a Deny.[^uar-arch] By default every API request needs a signed token (JWT), and production setups must configure authentication, their own secrets, trusted origins and an explicit tool policy.[^uar-readme]

## How the Universal Agent Runtime chooses a model

Models are named as provider and model, for example `openai/gpt-4o`, through the liter-llm client library.[^uar-providers] The router filters by catalog data, by which providers are available and by policy, and returns the best available model that meets the stated needs. That is not a promise that every listed model supports every capability.[^uar-arch]

## Where the Universal Agent Runtime keeps data

SurrealDB is the authoritative store in the default server bundle. Browser and desktop clients keep a local copy of threads and messages in PGlite. When the two disagree, the server's version wins, and a draft you have not sent stays on your device.[^uar-arch] PostgreSQL with pgvector is available as a Preview option.[^uar-matrix]

## Retrieval and memory in the Universal Agent Runtime

UAR searches documents with a hybrid method, checks matches against the text, and streams citations with the answer.[^uar-readme] Its memory system is off until you turn it on. When on, it stores facts from conversations, adds relevant memories to the prompt before each model call, and exposes memory actions as MCP tools. Each memory has a scope: session, user, agent, global or task. The memory system is built on the Surreal Memory Server library and SurrealDB.[^uar-memory]
