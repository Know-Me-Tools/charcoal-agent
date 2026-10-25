---
type: Concept
title: How the KnowMe AI, LLC products relate to each other
description: The few relationships between KnowMe AI, LLC and Prometheus products that the sources state, with the portfolio's framing that they are architectural intent.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - portfolio
  - relationships
  - products
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: knowme-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: KnowMe client README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: The Boss integration artifacts manifest
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: The Boss README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: The Boss UAR model source adapter
    last_modified: "2026-10-12T00:00:00+00:00"
---

# How the KnowMe AI, LLC products relate to each other

In short: the portfolio frames the relationships between the products, including the Universal Agent Runtime that The Boss bundles and the KnowMe client connects to, as architectural intent, not proof of completed integration. Few relationships are stated in the sources, and they are listed below.

## How do the KnowMe AI, LLC products relate to each other?

The portfolio says its relationships are architectural intent, not proof of completed integration.[^portfolio] The relationships the sources state most clearly are these.

- The Boss is built on the open-source Cherry Studio client.[^boss-readme]
- The Boss installers bundle the Universal Agent Runtime and BossFang as programs that run beside it.[^boss-build]
- The KnowMe client README says the KnowMe agent runs inside the Universal Agent Runtime and the client connects to it.[^knowme-readme]
- The Boss works with the Surreal Memory Server over MCP as a separate service. The server is not in the installer.[^boss-memory-adapter]

Most other products have no stated relationship. See the stated relationships page for the full list.
