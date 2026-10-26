---
type: Concept
title: "KnowMe and Prometheus product combinations and their status"
description: "Pairs and triples of KnowMe and Prometheus products that a repository or the portfolio states, each tagged shipped or planned, and the pairs the sources do not relate."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - combinations
  - status
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-release
    resource: https://github.com/Prometheus-AGS/the-boss/releases/tag/v2.2.42
    title: "The Boss v2.2.42 release notes"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-build
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/build/integration-artifacts.json
    title: "The Boss integration artifacts manifest"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: bossfang-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: "BossFang connects to UAR"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-memory-adapter
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/src/main/ai/runtime/uar/UarModelSourceAdapter.ts
    title: "The Boss UAR model source adapter"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-memory
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/MEMORY_SYSTEM.md
    title: "Universal Agent Runtime memory system"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: "BossFang AGENTS.md, product identity and fork additions"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: "Prometheus Skill Pack README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: "Prometheus Skills Mini README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: concierge-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: "KnowMe Concierge repository README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: "Flint Forge README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sync-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-sync/blob/main/README.md
    title: "Prometheus Entity Sync README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: demos-readme
    resource: https://github.com/Know-Me-Tools/demos/blob/main/README.md
    title: "demos README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pem-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-management/blob/main/README.md
    title: "Prometheus Entity Management README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: cv-lock
    resource: https://github.com/GQAdonis/candle-vllm/blob/10f844d219ae502d655944aeb223130ffaf24fd9/Cargo.lock
    title: "Candle-VLLM Cargo.lock at 10f844d"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pe-readme
    resource: https://github.com/Know-Me-Tools/phase-exit/blob/main/README.md
    title: "Phase Exit README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: kpm-readme
    resource: https://github.com/Know-Me-Tools/know-me-project-management/blob/main/README.md
    title: "know-me-project-management README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: meet-readme
    resource: https://github.com/Know-Me-Tools/know-meet/blob/main/README.md
    title: "Know Meet repository README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# KnowMe and Prometheus product combinations and their status

A visitor asks: "Which of these products work together, and which combinations are only planned?" This page lists only combinations that the portfolio or a repository states. It infers nothing. The portfolio says its relationships are architectural intent, not proof of completed integration.[^pf] A combination is [shipped] only when every product in it has a published release and a source states the link. Otherwise it is [planned]. For the full list of stated relationships, see [stated relationships between products](/portfolio/portfolio-stated-relationships.md).

## Combinations: the one shipped pairing

- The Boss with the Universal Agent Runtime: [shipped]. The v2.2.42 release notes say the installers include complete pinned Universal Agent Runtime sidecar payloads for macOS Apple Silicon, macOS Intel and Windows x64.[^boss-release] The integration manifest on the main branch also lists BossFang, but the release notes do not name it, and the portfolio notes that current-source features are not automatically in released installers. This page does not establish that BossFang is in the installer.[^boss-build][^pf]
- BossFang bundled with The Boss: [planned], as stated above. BossFang's connection to a Universal Agent Runtime instance is [planned]. BossFang's own document says it is implemented in source, not yet built or tested.[^bossfang-uar]

## Combinations: memory and runtime [planned]

- The Boss with the Surreal Memory Server over MCP, as a separate service: [planned]. The memory server has {{v:memory}} and no release.[^boss-memory-adapter]
- The Universal Agent Runtime with the Surreal Memory Server library as its optional memory: [planned].[^uar-memory]
- BossFang with the Surreal Memory Server library as its memory layer: [planned].[^bf-agents]
- The Prometheus skill packages with the Surreal Memory Server: [planned]. The full pack lists it as optional memory, and Mini can publish lessons to its REST API.[^full-readme][^mini-readme]
- KnowMe Concierge with the Universal Agent Runtime: the agent on this site runs inside UAR. The Concierge has no release, so the combination is [planned] as a product.[^concierge-readme][^pf]

## Combinations: the Flint platform [planned]

- Flint Gate, Flint Forge and Flint Realtime Fabric: Forge's README says it sits behind Gate and consumes Fabric as its realtime source.[^forge-readme]
- Prometheus Entity Sync on Flint Realtime Fabric: Entity Sync reuses Fabric's change capture, CRDT and operation-log code.[^sync-readme]
- The Universal Agent Runtime, Flint Gate, Flint Forge and Flint Realtime Fabric: the demo hosting platform's README assigns roles. UAR runs agents, Gate owns identity, Forge supplies data and Fabric supplies live updates. These are design statements.[^demos-readme]
- Flint Gate in front of the Universal Agent Runtime for edge authentication: the UAR README says Gate owns edge auth enforcement, and the demo platform README assigns Gate identity.[^uar-readme][^demos-readme]

## Combinations: libraries and inference [planned]

- Prometheus Entity Management with Flint Realtime Fabric through the Flint adapter: the adapter ships in the {{v:pem}} README, and Fabric has no release.[^pem-readme]
- The Candle-VLLM fork with Prometheus Parking Lot: the fork submits completion and streaming work through a pool, but its lockfile pins an earlier revision than the published {{v:parking}}.[^cv-lock][^pf]
- Numen with the Candle-VLLM fork and Numen Enclave: the portfolio calls the fork part of the intended inference infrastructure and says no live Numen integration is verified.[^pf]

## Combinations: tools and meetings [planned]

- Phase Exit with the Universal Agent Runtime release phase: the preview was published for use there.[^pe-readme]
- KnowMe Project Management with the skills kbd-init and agent-team-creator, which its README lists as needed.[^kpm-readme]
- Companion as a possible shared workspace for dot, Locus and other agent systems; no live cross-agent integration is verified.[^pf]
- Know Meet with persistent dots as meeting participants, per its README. Know Meet is a synthetic prototype.[^meet-readme][^pf]
- Prometheus Pulse as a capability mapped into Locus.[^pf]

## Combinations: pairs the sources do not relate

- The sources state no relationship between Flint Agent Mesh or Flint AI Code Companion and the other Flint products. A shared name is not a stated integration.[^pf]
- No source states that the Universal Agent Runtime uses Prometheus Entity Management, or that Prometheus Entity Management and Prometheus Entity Sync work together.
- No source states that The Boss is deployed behind Flint Gate.
- Triples built by joining the pairs above are not stated either. A visitor who wants one should ask what each link is based on.
