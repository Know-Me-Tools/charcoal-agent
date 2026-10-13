# Universal Agent Runtime questions

## What is the Universal Agent Runtime?

A Rust server that runs AI agents. It routes requests to models, runs tools under a policy with an audit trail, searches documents, keeps memory, and streams results to interfaces over open protocols. The KnowMe agent runs on it.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: KnowMe client README, retrieved 2026-10-13.

## Is the Universal Agent Runtime free?

The code is MIT licensed, including its SDKs, and its README says there is no commercial licence to buy. You supply your own model provider accounts and keys; UAR keeps provider credentials on the server.

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
