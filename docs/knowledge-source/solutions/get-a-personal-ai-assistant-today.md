---
type: Concept
title: "Get a personal AI assistant you can install today"
description: "What a visitor who wants an AI assistant now can actually install, what is not yet released, and how the released pieces fit together."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - personal-assistant
  - download
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-release
    resource: https://github.com/Prometheus-AGS/the-boss/releases/tag/v2.2.42
    title: "The Boss v2.2.42 release notes"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: "The Boss integration artifacts manifest"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: "The Boss UAR model source adapter"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: "Prometheus Skill Pack README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: "Prometheus Skills Mini README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Get a personal AI assistant you can install today

A visitor asks: "I just want an AI assistant I can install now. What can I get?" One KnowMe AI, LLC product has a download: The Boss. KnowMe itself has no release.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Install an assistant today: The Boss [shipped]

The Boss is a free, open-source AI desktop workspace for macOS and Windows. The latest release is {{v:boss}}. Download it from https://the-boss.know-me.tools; no account is required.[^boss-site] You can hold conversations with cloud or local model providers, run agent sessions with MCP tools, skills and approval boundaries, and work with knowledge, documents and code. Provider access needs your own credentials.[^boss-readme] The portfolio notes that current-source features are not automatically in released installers.[^pf]

## Install an assistant today: what comes in the installer

The v2.2.42 release notes say the installers include complete pinned Universal Agent Runtime sidecar payloads for macOS Apple Silicon, macOS Intel and Windows x64.[^boss-release] The integration manifest on the main branch also lists BossFang, but the release notes do not name it, and the portfolio notes that current-source features are not automatically in released installers. This page does not establish that BossFang is in the installer.[^boss-build][^pf] The Surreal Memory Server is not in the installer. The Boss works with it over MCP as a separate service.[^boss-memory-adapter]

## Install an assistant today: what is not yet released

- KnowMe, the personal AI platform, has no public release and no announced date.[^pf] See [KnowMe platforms and status](/knowme/knowme-platforms-and-status.md).
- KnowMe Concierge, the agent on this site, has no download. It is an existing implementation without a release.[^pf]
- Locus (Private Dot) is a design proposal.[^pf]

## Install an assistant today: for coding assistants

The Prometheus Skill Pack ({{v:skills}}) and Skills Mini ({{v:mini}}) are released add-ons for supported coding assistants, not standalone assistants.[^full-readme][^mini-readme]

## Install an assistant today: what is not stated

- No source gives an iOS or Android build of The Boss.
- No source states cross-device sync for The Boss.
- KnowMe's multi-device sync is still being built, per the KnowMe features page.

## Install an assistant today: start here

Download The Boss from https://the-boss.know-me.tools and add a model provider in its settings.
