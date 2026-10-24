# Universal Agent Runtime status and licence

## What is the latest version of the Universal Agent Runtime, and is there a pre-release?

The latest stable release of the Universal Agent Runtime (UAR) is v1.2.3. v1.3.0 is published as a pre-release, and its release notes mark verification as pending. UAR is MIT licensed and is made by Prometheus AGS.

Source: Universal Agent Runtime changelog, retrieved 2026-10-13.
Source: Universal Agent Runtime releases, retrieved 2026-10-24.
Source: Universal Agent Runtime LICENSE, retrieved 2026-10-13.

## Who makes the Universal Agent Runtime and what licence it uses

Prometheus AGS makes the Universal Agent Runtime (UAR), and its LICENSE file names Prometheus AGS as copyright holder. UAR is MIT licensed, and its documentation is CC-BY-4.0. KnowMe AI, LLC builds KnowMe and The Boss on it.

Source: Universal Agent Runtime LICENSE, retrieved 2026-10-13.

## Universal Agent Runtime version

The latest stable release of UAR is v1.2.3, which its changelog dates 2026-10-22. The changelog records that functional acceptance of the published Linux amd64 image passed within a defined scope; arm64 acceptance is outside that scope. v1.3.0 is published as a pre-release, and its release notes mark verification as pending. The 1.x line began with 1.0.0 on 2026-07-12. UAR follows semantic versioning for the HTTP, event, configuration and artifact contracts that its support matrix marks Stable. Preview and Experimental features do not get that compatibility promise.

Source: Universal Agent Runtime changelog, retrieved 2026-10-13.
Source: Universal Agent Runtime releases, retrieved 2026-10-24.

## What the Universal Agent Runtime support levels mean

The support matrix is UAR's public release contract. Stable rows are backed by automated release checks. Preview and Experimental rows are not. Being listed in a catalog is not a promise that something works.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## Universal Agent Runtime release bundles

Server full is Stable and is the distributed server and sidecar product. Minimal headless is Stable but is not shipped as the customer archive. Desktop full (Tauri) is Preview. Server with PostgreSQL is Preview. The in-memory bundle is for development only.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## Universal Agent Runtime platforms

Web is Stable. Desktop and native WASM are Preview. Mobile is Experimental. Running arbitrary WASM in the browser is Unsupported; browsers only render validated A2UI. The Windows native archive is Experimental, while the Linux and macOS archives are required release gates.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## Universal Agent Runtime provider tiers and routing

Tier 1 means named, capability-specific execution evidence: OpenAI-compatible chat, streaming, tools, vision and structured output; Anthropic chat, streaming, tools and vision; and local FastEmbed embeddings. Tier 2 means native registry support and basic chat and streaming. Tier 3 is catalog metadata only. Catalog, availability and policy routing are Stable; adaptive learned routing is Experimental. Native WASM tools are Preview and off unless enabled.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.
Source: Universal Agent Runtime README, retrieved 2026-10-13.

## Universal Agent Runtime licence

UAR's code, including its Rust, Python and TypeScript SDKs, is MIT licensed, and the repository has a LICENSE file. Its documentation is CC-BY-4.0. It was relicensed from AGPL-3.0-only to MIT on 2026-08-07, and there is no commercial licence to buy. The licence does not grant trademark rights.

Source: Universal Agent Runtime LICENSE, retrieved 2026-10-13.
Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime licensing model, retrieved 2026-10-13.
