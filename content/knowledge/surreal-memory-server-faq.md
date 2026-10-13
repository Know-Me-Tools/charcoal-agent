# Surreal Memory Server questions

## What is the Surreal Memory Server?

A Rust memory service for AI agents, built on SurrealDB. It keeps a knowledge graph, scoped memories, task streams and mind maps, offers hybrid search, and speaks both MCP (Model Context Protocol, the open standard agents use to call tools) and REST. Its source was published for review on 2026-10-05; it is not a release.

Source: Surreal Memory Server README, retrieved 2026-10-13.
Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-13.

## Is the Surreal Memory Server free?

The Surreal Memory Server is free to use under the MIT licence. The owners state it is MIT licensed; a LICENSE file has been proposed in the repository. Its library package manifest already declares MIT.

Source: surreal-memory library package manifest, retrieved 2026-10-13.

## Does the Surreal Memory Server need a cloud account?

No account is needed. You run it yourself as a local service, pointed at your own SurrealDB and an embedding provider you choose. A hosted embedding provider needs that provider's key; the optional Memory Palace feature adds local embeddings that work offline without one.

Source: Surreal Memory Server README, retrieved 2026-10-13.
Source: Surreal Memory Server Memory Palace architecture, retrieved 2026-10-13.

## Is the Surreal Memory Server ready for production?

Its authors do not say so. The source was published for review on 2026-10-05; the note says this is not a release. The owner plans to resume testing once the code base has stabilised.

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-13.

## Can I use the Surreal Memory Server from my own MCP client?

The server is built for MCP clients, which connect over stdio or HTTP. Check that your client supports one of those transports.

Source: Surreal Memory Server documentation introduction, retrieved 2026-10-13.

## How is the Surreal Memory Server different from the Universal Agent Runtime's memory?

They share code. The Universal Agent Runtime's memory system is built on the Surreal Memory Server library and adds automatic capture and prompt injection inside the runtime. The Surreal Memory Server is the standalone service and the library itself.

Source: Universal Agent Runtime memory system, retrieved 2026-10-13.
Source: Surreal Memory Server documentation introduction, retrieved 2026-10-13.

## Who makes the Surreal Memory Server?

Prometheus AGS makes the Surreal Memory Server.

## What is Prometheus, behind the Surreal Memory Server?

Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. Prometheus is the name of its server-side AI platform work.
