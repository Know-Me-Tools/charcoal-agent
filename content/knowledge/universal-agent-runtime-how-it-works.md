# How the Universal Agent Runtime works

## A Universal Agent Runtime run, step by step

A client asks UAR to start a run and opens a stream. UAR's run manager checks each action with its policy engine, sends the request to a model chosen by its router, and streams text, tool activity and citations back to the client as events. A client that joins late can catch up on the current interface state by replay. UAR is one Rust process; the React interface only shows state and sends requests.

Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.

## What governed agent execution means in the Universal Agent Runtime

Every tool call takes the same path, whether the tool came from an MCP server or is built in. UAR checks the inputs against the tool's schema, a Cedar policy returns Allow, RequireApproval or Deny, and the decision is written to an audit record. A user's approval cannot override a Deny. By default every API request needs a signed token (JWT), and production setups must configure authentication, their own secrets, trusted origins and an explicit tool policy.

Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.

## How the Universal Agent Runtime chooses a model

Models are named as provider and model, for example `openai/gpt-4o`, through the liter-llm client library. The router filters by catalog data, by which providers are available and by policy, and returns the best available model that meets the stated needs. That is not a promise that every listed model supports every capability.

Source: Universal Agent Runtime provider configuration guide, retrieved 2026-10-12.
Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.

## Where the Universal Agent Runtime keeps data

SurrealDB is the authoritative store in the default server bundle. Browser and desktop clients keep a local copy of threads and messages in PGlite. When the two disagree, the server's version wins, and a draft you have not sent stays on your device. PostgreSQL with pgvector is available as a Preview option.

Source: Universal Agent Runtime architecture overview, retrieved 2026-10-12.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.

## Retrieval and memory in the Universal Agent Runtime

UAR searches documents with a hybrid method, checks matches against the text, and streams citations with the answer. Its memory system is off until you turn it on. When on, it stores facts from conversations, adds relevant memories to the prompt before each model call, and exposes memory actions as MCP tools. Each memory has a scope: session, user, agent, global or task. The memory system is built on the Surreal Memory Server library and SurrealDB.

Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Universal Agent Runtime memory system, retrieved 2026-10-12.
