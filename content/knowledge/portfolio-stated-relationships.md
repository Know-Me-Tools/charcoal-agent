# Stated relationships between products (KnowMe and Prometheus portfolio)

## How do the KnowMe and Prometheus products relate to each other? (KnowMe and Prometheus portfolio)

The portfolio says its relationships are architectural intent, not proof of completed integration. This page lists only relationships that the portfolio or a repository states, and each one names its source. A listed relationship does not mean two products run together today. Two are stated in repositories: the KnowMe Concierge README says the agent runs inside the Universal Agent Runtime, and The Boss installers include the Universal Agent Runtime and BossFang as bundled programs.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: KnowMe Concierge repository README, retrieved 2026-10-24.
Source: The Boss integration artifacts manifest, retrieved 2026-10-12.

## The Universal Agent Runtime and its users (KnowMe and Prometheus portfolio)

- The portfolio calls the Universal Agent Runtime a shared runtime dependency used by multiple portfolio applications. It also says work on it stopped and its current qualification is not established. The repository lists release v1.2.3 and pre-release v1.3.0, and its changelog records functional acceptance of the Linux amd64 image within a defined scope. The repository is the newer record.
- The KnowMe Concierge README says the agent runs inside the Universal Agent Runtime and the client connects to it.
- The Boss installers include the Universal Agent Runtime and BossFang as bundled programs that run beside The Boss.
- BossFang connects to a Universal Agent Runtime instance that already exists and never starts it. That connection is implemented in source, not yet built or tested.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Universal Agent Runtime changelog, retrieved 2026-10-13.
Source: KnowMe Concierge repository README, retrieved 2026-10-24.
Source: The Boss integration artifacts manifest, retrieved 2026-10-12.
Source: BossFang connects to UAR, retrieved 2026-10-13.

## The Boss, BossFang and memory (KnowMe and Prometheus portfolio)

- The Boss works with the Surreal Memory Server over MCP as a separate service. The Surreal Memory Server is not in the installer.
- The Boss is built on the open-source Cherry Studio client.
- BossFang uses the Surreal Memory Server library as its memory layer.
- The Universal Agent Runtime's optional memory system is built on the Surreal Memory Server library. It is off until turned on.

Source: The Boss UAR model source adapter, retrieved 2026-10-12.
Source: The Boss README, retrieved 2026-10-12.
Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.
Source: Universal Agent Runtime memory system, retrieved 2026-10-13.

## Skill packages (KnowMe and Prometheus portfolio)

- The full Prometheus Skill Pack lists the Surreal Memory Server as its optional memory service.
- Prometheus Skills Mini can publish lessons to the Surreal Memory Server's REST API.
- The full pack and Mini share skill names, so they should not share a home directory.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## The Flint platform: Gate, Forge and Fabric (KnowMe and Prometheus portfolio)

- Flint Forge's README says Forge sits behind Flint Gate, which handles ingress and authentication, and consumes Flint Realtime Fabric as its realtime source.

Source: Flint Forge README, retrieved 2026-10-24.

## The Flint platform: sync and demos (KnowMe and Prometheus portfolio)

- The Prometheus Entity Sync README says Entity Sync is built on Flint Realtime Fabric and reuses its change capture, CRDT and operation-log code.
- The demo hosting platform's README assigns roles: the Universal Agent Runtime runs agents, Flint Gate owns identity, Flint Forge supplies data, Flint Realtime Fabric supplies live updates. These are design statements.

Source: Prometheus Entity Sync README, retrieved 2026-10-24.
Source: demos README, retrieved 2026-10-24.

## Numen and inference (KnowMe and Prometheus portfolio)

- The portfolio says Numen Enclave adds a proposed deployment boundary to the Numen execution fabric.
- The portfolio says the Candle-VLLM fork is part of the intended inference infrastructure for Numen. No live Numen integration is verified.
- The portfolio says Tranquil's private agent-job design is covered by the Numen identity edition, which the portfolio lists as current and which calls itself an unpublished Revision 2 candidate.
- The Candle-VLLM fork submits completion and streaming work through a Parking Lot pool. Its lockfile pins an earlier Parking Lot revision, not the published 0.4.0.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Candle-VLLM Cargo.lock at 10f844d, retrieved 2026-10-24.

## Locus, dot and meetings (KnowMe and Prometheus portfolio)

- The portfolio says Prometheus Pulse is a capability mapped into Locus and its project-learning workflow.
- The portfolio describes Companion as a potential shared workspace for dot, Locus and other agent systems. It says no live cross-agent integration is verified.
- The portfolio says full integration of the KnowMe Concierge with the KnowMe App, Locus and an authentic voice is not established.
- The Know Meet README names persistent dots as meeting participants.
- Per the portfolio, the Private Dot (Locus) documents are among the published Praxis source records.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Know Meet repository README, retrieved 2026-10-24.

## Tools and skills (KnowMe and Prometheus portfolio)

- The portfolio groups Prometheus Skills, Know Decision, Phase Exit, Project Management and Doc Forge as tools that support building and governing the work.
- The Phase Exit README says the preview was published for use in a Universal Agent Runtime release phase.
- The Project Management README lists other skills it needs, such as kbd-init and agent-team-creator.
- The Know Decision README describes Know Decision as a planned decision layer for KnowMe's products. The portfolio lists it as pre-implementation. Know Decision names no integration that exists.
- The portfolio describes gen_ui as the intended shared core for KnowMe's surfaces.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Phase Exit README, retrieved 2026-10-24.
Source: know-me-project-management README, retrieved 2026-10-24.
Source: Know Decision repository README, retrieved 2026-10-24.

## Integrations outside the portfolio (KnowMe and Prometheus portfolio)

- The portfolio says Poppy is not a KnowMe-owned product. The integration is a KnowMe design that uses Poppy's protocol.
- The portfolio says upstream dependencies of the inference forks are not claimed as owned products.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## What the sources do not state (KnowMe and Prometheus portfolio)

- The sources state no relationship for HTMX Doc Forge, IPFS Sync for Obsidian, Prometheus Studio, Knowtes, Kaia, Logos, Light Creator, Prometheus Tune, Lampas or the realtor assistant with the products above, beyond the groupings listed.

## What the sources do not state: Flint and other products (KnowMe and Prometheus portfolio)

- They state no relationship between Flint Agent Mesh or Flint AI Code Companion and the other Flint products. The shared Flint name is not a stated integration.
- They state no relationship between DocuMind, Knowledge Gateway or the native agent creator and other products.
- A relationship described as intent is intent. It is not proof that two products work together, or that either one is finished.
