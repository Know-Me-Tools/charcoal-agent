# Surreal Memory Server use cases and who it is for

## Who the Surreal Memory Server is for

Developers who build agents and want memory that lasts between sessions, is kept apart per user, agent or session, and can be checked after the fact. It is a backend component: people meet it through an agent or an application, not directly.

Source: Surreal Memory Server documentation introduction, retrieved 2026-10-12.

## Memory inside an agent runtime (Surreal Memory Server)

The Universal Agent Runtime uses the Surreal Memory Server library for its optional memory system, which stores facts from conversations and brings relevant ones back into later prompts. The Universal Agent Runtime's memory guide gives a personal assistant that remembers people and their relationships across sessions as an example.

Source: Universal Agent Runtime memory system, retrieved 2026-10-12.

## Memory for an agent operating system (Surreal Memory Server)

BossFang uses the Surreal Memory Server library as its memory layer, with an embedded database so no separate database service is required.

Source: BossFang AGENTS.md, fork additions, retrieved 2026-10-12.

## Memory for coding agents and their skills (Surreal Memory Server)

The full Prometheus skill pack lists the Surreal Memory Server as its optional durable memory service. Prometheus Skills Mini can publish a team's lessons to the memory server's REST API, and its supplied container stack runs SurrealDB with the memory server.

Source: Prometheus Skill Pack README, retrieved 2026-10-12.
Source: Prometheus Skills Mini README, retrieved 2026-10-12.

## Keeping writes reliable in the Surreal Memory Server

For integrations that cannot afford a lost or doubled write, the operation ledger lets a caller retry safely and read back a definite outcome instead of guessing from a timeout.

Source: Surreal Memory Server README, retrieved 2026-10-12.
