# Keep notes and AI memory across tools (Solutions)

A visitor asks: "I use several AI tools and note apps, and each one forgets what the others know. How do I keep one memory?" No product in the portfolio is a finished answer today. The nearest pieces are a memory server whose source is public but not released, and a desktop workspace that is released. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Keep notes and memory across tools: the products that help (Solutions)

- Surreal Memory Server [planned, source only]: a Rust memory service with a knowledge graph, scoped memories, hybrid search and MCP and REST access. Latest tag v1.10.2. The owner calls its 5 October 2026 publication a source publication, not a release.
- Prometheus Knowledge [planned, source only]: Markdown knowledge records, immutable prompt snapshots and reconciliation of memory operations. Latest tag v1.11.0.
- The Boss [shipped]: the desktop workspace, release v2.2.41. It works with the Surreal Memory Server over MCP as a separate service.

Source: Surreal Memory Server README, retrieved 2026-10-25.
Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-25.
Source: Prometheus Knowledge README, retrieved 2026-10-25.
Source: The Boss UAR model source adapter, retrieved 2026-10-25.

## Keep notes and memory across tools: more products that help (Solutions)

- Universal Agent Runtime [shipped], release v1.2.3: its optional memory system is built on the Surreal Memory Server library and is off until turned on.
- Prometheus Skill Pack [shipped] and Prometheus Skills Mini [shipped]: the full pack lists the Surreal Memory Server as its optional memory service, and Mini can publish lessons to its REST API.
- IPFS Sync for Obsidian [planned, pre-release]: v0.2.0, tested on fixture vaults only, with wider deployment unverified.

Source: Universal Agent Runtime memory system, retrieved 2026-10-25.
Source: Prometheus Skill Pack README, retrieved 2026-10-25.
Source: Prometheus Skills Mini README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Keep notes and memory across tools: how the products fit together (Solutions)

- The Boss working with the Surreal Memory Server over MCP: [planned], because the memory server has no release.
- The Universal Agent Runtime memory system on the Surreal Memory Server library: [planned]. The repository documents it. This page does not establish that it is in release v1.2.3.
- The skill packages publishing lessons to the Surreal Memory Server: [planned], for the same reason.
- The portfolio says relationships are architectural intent, not proof of completed integration.

Source: The Boss UAR model source adapter, retrieved 2026-10-25.
Source: Universal Agent Runtime memory system, retrieved 2026-10-25.
Source: Prometheus Skills Mini README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Keep notes and memory across tools: what is not stated (Solutions)

- No source states a single memory shared by The Boss and tools made by other companies.
- No source connects IPFS Sync for Obsidian to the Surreal Memory Server.
- The portfolio says the Surreal Memory Server's remediation and per-user brain design have separate qualification, and its contract matrix documents full scope separation as still incomplete.
- KnowMe, which is designed around a local memory graph, has no release. See [KnowMe features](/knowme/knowme-features.md).

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Surreal Memory Server MCP, REST and storage contract matrix, retrieved 2026-10-25.

## Keep notes and memory across tools: start here (Solutions)

Download The Boss for a released workspace (v2.2.41) from https://the-boss.know-me.tools. To try the memory service, read the Surreal Memory Server README and build it from source. See [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).

Source: The Boss download page, retrieved 2026-10-25.
