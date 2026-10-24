---
type: Concept
title: Universal Agent Runtime status and licence
description: UAR's version, its Stable, Preview and Experimental support levels as documented, provider tiers, and its MIT licence.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - universal-agent-runtime
  - status
  - licence
sources:
  - id: uar-releases
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/releases
    title: Universal Agent Runtime releases
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-changelog
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/CHANGELOG.md
    title: Universal Agent Runtime changelog
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-license
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/LICENSE
    title: Universal Agent Runtime LICENSE
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: uar-licensing
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/licensing/LICENSING.md
    title: Universal Agent Runtime licensing model
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Universal Agent Runtime status and licence

## What is the latest version of the Universal Agent Runtime, and is there a pre-release?

The latest stable release of the Universal Agent Runtime (UAR) is {{v:uar}}.[^uar-changelog] {{v:uar:pre}} is published as a pre-release, and its release notes mark verification as pending.[^uar-releases] UAR is MIT licensed and is made by Prometheus AGS.[^uar-license]

## Who makes the Universal Agent Runtime and what licence it uses

Prometheus AGS makes the Universal Agent Runtime (UAR), and its LICENSE file names Prometheus AGS as copyright holder.[^uar-license] UAR is MIT licensed, and its documentation is CC-BY-4.0.[^uar-license] KnowMe AI, LLC builds KnowMe and The Boss on it.

## Universal Agent Runtime version

The latest stable release of UAR is {{v:uar}}, which its changelog dates 2026-10-22. The changelog records that functional acceptance of the published Linux amd64 image passed within a defined scope; arm64 acceptance is outside that scope.[^uar-changelog] {{v:uar:pre}} is published as a pre-release, and its release notes mark verification as pending.[^uar-releases] The 1.x line began with 1.0.0 on 2026-07-12. UAR follows semantic versioning for the HTTP, event, configuration and artifact contracts that its support matrix marks Stable. Preview and Experimental features do not get that compatibility promise.[^uar-changelog]

## What the Universal Agent Runtime support levels mean

The support matrix is UAR's public release contract. Stable rows are backed by automated release checks. Preview and Experimental rows are not. Being listed in a catalog is not a promise that something works.[^uar-matrix]

## Universal Agent Runtime release bundles

Server full is Stable and is the distributed server and sidecar product. Minimal headless is Stable but is not shipped as the customer archive. Desktop full (Tauri) is Preview. Server with PostgreSQL is Preview. The in-memory bundle is for development only.[^uar-matrix]

## Universal Agent Runtime platforms

Web is Stable. Desktop and native WASM are Preview. Mobile is Experimental. Running arbitrary WASM in the browser is Unsupported; browsers only render validated A2UI. The Windows native archive is Experimental, while the Linux and macOS archives are required release gates.[^uar-matrix]

## Universal Agent Runtime provider tiers and routing

Tier 1 means named, capability-specific execution evidence: OpenAI-compatible chat, streaming, tools, vision and structured output; Anthropic chat, streaming, tools and vision; and local FastEmbed embeddings. Tier 2 means native registry support and basic chat and streaming. Tier 3 is catalog metadata only.[^uar-matrix] Catalog, availability and policy routing are Stable; adaptive learned routing is Experimental. Native WASM tools are Preview and off unless enabled.[^uar-readme]

## Universal Agent Runtime licence

UAR's code, including its Rust, Python and TypeScript SDKs, is MIT licensed, and the repository has a LICENSE file.[^uar-license] Its documentation is CC-BY-4.0. It was relicensed from AGPL-3.0-only to MIT on 2026-08-07, and there is no commercial licence to buy.[^uar-readme] The licence does not grant trademark rights.[^uar-licensing]
