# Universal Agent Runtime status and licence

## Universal Agent Runtime version

UAR is at version 1.0.0, dated 2026-07-12 in its changelog. It follows semantic versioning for the HTTP, event, configuration and artifact contracts that its support matrix marks Stable. Preview and Experimental features do not get that compatibility promise.

Source: Universal Agent Runtime changelog, retrieved 2026-10-12.

## What the Universal Agent Runtime support levels mean

The support matrix is UAR's public release contract. Stable rows have executable release gates. Preview and Experimental rows promise less. Being listed in a catalog is not a promise that something works.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.

## Universal Agent Runtime release bundles

Server full is Stable and is the distributed server and sidecar product. Minimal headless is Stable but is not shipped as the customer archive. Desktop full (Tauri) is Preview. Server with PostgreSQL is Preview. The in-memory bundle is for development only.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.

## Universal Agent Runtime platforms

Web is Stable. Desktop and native WASM are Preview. Mobile is Experimental. Running arbitrary WASM in the browser is Unsupported; browsers only render validated A2UI. The Windows native archive is Experimental, while the Linux and macOS archives are required release gates.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.

## Universal Agent Runtime provider tiers and routing

Tier 1 means named, capability-specific execution evidence: OpenAI-compatible chat, streaming, tools, vision and structured output; Anthropic chat, streaming, tools and vision; and local FastEmbed embeddings. Tier 2 means native registry support and basic chat and streaming. Tier 3 is catalog metadata only. Catalog, availability and policy routing are Stable; adaptive learned routing is Experimental. Native WASM tools are Preview and off unless enabled.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.

## Universal Agent Runtime licence

UAR's code, including its Rust, Python and TypeScript SDKs, is MIT licensed. Its documentation is CC-BY-4.0. It was relicensed from AGPL-3.0-only to MIT on 2026-08-07, and there is no commercial licence to buy. The licence does not grant trademark rights.

Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Universal Agent Runtime licensing model, retrieved 2026-10-12.
