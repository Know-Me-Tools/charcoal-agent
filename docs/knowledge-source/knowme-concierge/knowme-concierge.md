---
type: Concept
title: "KnowMe Concierge status and what is stated"
description: "KnowMe Concierge is the KnowMe web and desktop client for the KnowMe agent, and its code is the concierge that answers on this site; the portfolio lists an existing implementation."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags: [concierge, client]
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: concierge-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: "KnowMe Concierge repository README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# KnowMe Concierge status and what is stated

KnowMe Concierge is the KnowMe web and desktop client for the KnowMe agent, and its code is the concierge that answers on this site. The portfolio lists it as an existing implementation, so something does exist and runs here. Full integration with the KnowMe App, Locus and an authentic voice is not established, and the sources announce no separate release.[^portfolio][^concierge-readme]

## KnowMe Concierge status and version

The portfolio status for KnowMe Concierge is "Existing implementation; full App/Locus and authentic-voice integration not established."[^portfolio] Its repository is the Know-Me-Tools repository cited below. Version line: {{v:concierge}}.

## What KnowMe Concierge is stated to do

- KnowMe Concierge is the web and desktop client for the KnowMe agent.[^concierge-readme]
- It streams the agent's replies, keeps your threads locally, and syncs KnowMe's built-in skills to your runtime.[^concierge-readme]
- The README lists React 19, Vite, Tailwind CSS 4, PGlite in the browser for local threads, and Tauri 2 for the desktop app.[^concierge-readme]

## How KnowMe Concierge relates to other products

The README says the agent runs inside the Universal Agent Runtime, a separate Rust service, and that this client connects to it.[^concierge-readme] The portfolio says integration with the KnowMe App, Locus and an authentic voice is not established.[^portfolio] The portfolio treats such relationships as architectural intent, not proof of completed integration.
