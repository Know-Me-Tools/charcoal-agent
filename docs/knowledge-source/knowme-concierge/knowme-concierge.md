---
type: Concept
title: "KnowMe Concierge (charcoal-agent) status and what is stated"
description: "KnowMe Concierge is the KnowMe web and desktop client for the KnowMe agent; the portfolio lists an existing implementation."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags: [concierge, charcoal-agent, client]
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

# KnowMe Concierge (charcoal-agent) status and what is stated

KnowMe Concierge, also named charcoal-agent after its repository, is the KnowMe web and desktop client. It streams agent replies, keeps threads locally and synchronizes skills to the runtime. The portfolio lists it as an existing implementation. Full App/Locus and authentic-voice integration is not established.[^portfolio]

## KnowMe Concierge status and version

The portfolio status for KnowMe Concierge is "Existing implementation; full App/Locus and authentic-voice integration not established."[^portfolio] Its repository is Know-Me-Tools/charcoal-agent. Version line: {{v:concierge}}.

## What KnowMe Concierge is stated to do

- KnowMe Concierge is the web and desktop client for the KnowMe agent.[^concierge-readme]
- It streams the agent's replies, keeps your threads locally, and syncs KnowMe's built-in skills to your runtime.[^concierge-readme]
- The README lists React 19, Vite, Tailwind CSS 4, PGlite in the browser for local threads, and Tauri 2 for the desktop app.[^concierge-readme]
- Some internal identifiers still say "charcoal", such as the local database name and storage keys.[^concierge-readme]

## How KnowMe Concierge relates to other products

The README says the agent runs inside the Universal Agent Runtime, a separate Rust service, and that this client connects to it.[^concierge-readme] The portfolio says integration with the KnowMe App, Locus and an authentic voice is not established.[^portfolio] The portfolio treats such relationships as architectural intent, not proof of completed integration.
