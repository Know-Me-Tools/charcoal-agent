# Universal Agent Runtime questions

## What is the Universal Agent Runtime?

A Rust server that runs AI agents. It routes requests to models, runs tools, including tools from MCP (Model Context Protocol, the open standard agents use to call tools) servers, under a policy with an audit trail, searches documents, keeps memory, and streams results to interfaces over open protocols. The KnowMe agent runs on it.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: KnowMe client README, retrieved 2026-10-13.

## Is the Universal Agent Runtime free?

The code is MIT licensed, including its SDKs, and the repository has a LICENSE file. Its README says there is no commercial licence to buy. You supply your own model provider accounts and keys; UAR keeps provider credentials on the server.

Source: Universal Agent Runtime LICENSE, retrieved 2026-10-13.
Source: Universal Agent Runtime README, retrieved 2026-10-13.

## Does the Universal Agent Runtime need a cloud account?

No account with KnowMe AI, LLC is needed. You run UAR yourself, and by default it listens only on your own machine. Hosted models need that provider's credentials. The distributed server bundle includes local model support, and local FastEmbed embeddings are in the top provider tier.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## Which models does the Universal Agent Runtime support best?

The strongest evidence covers OpenAI-compatible endpoints and Anthropic, plus local FastEmbed embeddings. Many more providers are listed in its catalog, but a listing is metadata, not a promise that a provider works.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## Does the Universal Agent Runtime run on Windows, desktop or mobile?

Web is Stable. Desktop is Preview. Mobile is Experimental. The Windows native archive is Experimental; the Linux and macOS archives are required release gates.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## How is the Universal Agent Runtime different from BossFang?

UAR owns inference, routing, agent execution and governance. BossFang is an agent operating system with its own dashboard and orchestration; it connects to a UAR instance as a separate service rather than containing it.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: BossFang connects to UAR, retrieved 2026-10-13.

## How is the Universal Agent Runtime different from the Surreal Memory Server?

UAR is the whole agent runtime. Its optional memory system is built on the Surreal Memory Server's library and SurrealDB. The Surreal Memory Server ships that library together with a standalone server that MCP clients can reach directly.

Source: Universal Agent Runtime memory system, retrieved 2026-10-13.
Source: Surreal Memory Server documentation introduction, retrieved 2026-10-13.

## Where do I download the Universal Agent Runtime?

The Universal Agent Runtime's source is public at https://github.com/Prometheus-AGS/universal-agent-runtime. You can build it from source or install it as a native service with the packages under `packaging/native/`, as its README describes. The Boss desktop app can also run a managed UAR instance as a sidecar program. No tested end-user release of UAR is claimed here.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: The Boss agent fabric convergence notes, retrieved 2026-10-13.

## Does the Universal Agent Runtime need SurrealDB installed separately?

No, not for the default setup. The default server bundle includes an embedded SurrealDB, which is its authoritative store. Its memory guide also describes pointing memory at an external SurrealDB server for production instead of the embedded mode.

Source: Universal Agent Runtime changelog, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.
Source: Universal Agent Runtime memory system, retrieved 2026-10-13.

## How do I report a bug in or contribute to the Universal Agent Runtime?

Read CONTRIBUTING.md in https://github.com/Prometheus-AGS/universal-agent-runtime before contributing; contributions are accepted under MIT. Report security vulnerabilities as the repository's SECURITY.md describes, which uses a 90-day coordinated-disclosure default.

Source: Universal Agent Runtime contribution guide, retrieved 2026-10-13.
Source: Universal Agent Runtime README, retrieved 2026-10-13.
