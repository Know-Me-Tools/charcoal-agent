# Surreal Memory Server overview

## What the Surreal Memory Server is

The Surreal Memory Server is a memory service for AI agents, written in Rust on top of SurrealDB. It holds a knowledge graph, scoped memories, hybrid search, task streams and mind maps, and it reaches agents through MCP and a REST API. Writes go through a durable operation ledger, so a caller can confirm what was stored after a timeout or a restart.

Source: Surreal Memory Server README, retrieved 2026-10-12.

## The problem the Surreal Memory Server addresses

Agents forget between turns. Its documentation names the usual shortcuts and why they fail: a plain vector store returns what was written last rather than what is most relevant, nothing separates a lasting fact from a passing remark, and one user's memory is not kept apart from another's. The server treats memory as typed, scoped and durable instead.

Source: Surreal Memory Server documentation introduction, retrieved 2026-10-12.

## Two parts of the Surreal Memory Server

The project ships two things from one workspace: a server binary that MCP clients reach over stdio or HTTP, and a Rust library. Its documentation calls the library the more important part, because the Universal Agent Runtime depends on it directly.

Source: Surreal Memory Server documentation introduction, retrieved 2026-10-12.

## Which products use the Surreal Memory Server

The Universal Agent Runtime's optional memory system is built on it. BossFang uses it for memory, with an embedded database so no separate SurrealDB service is needed. The server's README notes that The Boss uses a dedicated database user for memory.

Source: Universal Agent Runtime memory system, retrieved 2026-10-12.
Source: BossFang AGENTS.md, fork additions, retrieved 2026-10-12.
Source: Surreal Memory Server README, retrieved 2026-10-12.

## More about the Surreal Memory Server

* [How it works](/surreal-memory-server/surreal-memory-server-how-it-works.md)
* [Use cases](/surreal-memory-server/surreal-memory-server-use-cases-and-who-it-is-for.md)
* [Status and licence](/surreal-memory-server/surreal-memory-server-status-and-licence.md)
* [Questions](/surreal-memory-server/surreal-memory-server-faq.md)
