# Surreal Memory Server overview

## What the Surreal Memory Server is

The Surreal Memory Server is a memory service for AI agents, written in Rust on top of SurrealDB. It holds a knowledge graph, scoped memories, hybrid search, task streams and mind maps, and it reaches agents through MCP (Model Context Protocol, the open standard agents use to call tools) and a REST API. Writes go through a durable operation ledger, so a caller can confirm what was stored after a timeout or a restart.

Source: Surreal Memory Server README, retrieved 2026-10-13.

## The problem the Surreal Memory Server addresses

Agents forget between turns. Its documentation names the usual shortcuts and why they fail: a plain vector store returns what was written last rather than what is most relevant, nothing separates a lasting fact from a passing remark, and one user's memory is not kept apart from another's. Its answer is typed, durable memory. The server tags each memory with its owner and keeps a durable record of every write; full scope separation is documented as still incomplete.

Source: Surreal Memory Server documentation introduction, retrieved 2026-10-13.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-13.

## Two parts of the Surreal Memory Server

The project ships two things from one workspace: a server binary that MCP clients reach over stdio or HTTP, and a Rust library. Its documentation calls the library the more important part, because the Universal Agent Runtime depends on it directly.

Source: Surreal Memory Server documentation introduction, retrieved 2026-10-13.

## Which products use the Surreal Memory Server

The Universal Agent Runtime's optional memory system is built on it. BossFang uses it for memory, with an embedded database so no separate SurrealDB service is needed.

Source: Universal Agent Runtime memory system, retrieved 2026-10-13.
Source: BossFang AGENTS.md, fork additions, retrieved 2026-10-13.

## Where to get the Surreal Memory Server

The Surreal Memory Server's source is public at https://github.com/Prometheus-AGS/surreal-memory-server. Its README builds it with `cargo build --release` and runs it as a native local service pointed at your SurrealDB. Its source was published for review and is not a tested release; see its status and licence.

Source: Surreal Memory Server README, retrieved 2026-10-13.

## More about the Surreal Memory Server

You can also ask how it works, how to run it, its status and licence, and common questions.
