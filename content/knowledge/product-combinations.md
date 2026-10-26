# KnowMe and Prometheus product combinations and their status (Solutions)

A visitor asks: "Which of these products work together, and which combinations are only planned?" This page lists only combinations that the portfolio or a repository states. It infers nothing. The portfolio says its relationships are architectural intent, not proof of completed integration. A combination is [shipped] only when every product in it has a published release and a source states the link. Otherwise it is [planned]. For the full list of stated relationships, see [stated relationships between products](/portfolio/portfolio-stated-relationships.md).

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Combinations: the one shipped pairing (Solutions)

- The Boss with the Universal Agent Runtime: [shipped]. The v2.2.42 release notes say the installers include complete pinned Universal Agent Runtime sidecar payloads for macOS Apple Silicon, macOS Intel and Windows x64. The integration manifest on the main branch also lists BossFang, but the release notes do not name it, and the portfolio notes that current-source features are not automatically in released installers. This page does not establish that BossFang is in the installer.
- BossFang bundled with The Boss: [planned], as stated above. BossFang's connection to a Universal Agent Runtime instance is [planned]. BossFang's own document says it is implemented in source, not yet built or tested.

Source: The Boss v2.2.42 release notes, retrieved 2026-10-25.
Source: The Boss integration artifacts manifest, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: BossFang connects to UAR, retrieved 2026-10-25.

## Combinations: memory and runtime [planned] (Solutions)

- The Boss with the Surreal Memory Server over MCP, as a separate service: [planned]. The memory server has v1.10.2 and no release.
- The Universal Agent Runtime with the Surreal Memory Server library as its optional memory: [planned].
- BossFang with the Surreal Memory Server library as its memory layer: [planned].
- The Prometheus skill packages with the Surreal Memory Server: [planned]. The full pack lists it as optional memory, and Mini can publish lessons to its REST API.
- KnowMe Concierge with the Universal Agent Runtime: the agent on this site runs inside UAR. The Concierge has no release, so the combination is [planned] as a product.

Source: The Boss UAR model source adapter, retrieved 2026-10-25.
Source: Universal Agent Runtime memory system, retrieved 2026-10-25.
Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-25.
Source: Prometheus Skill Pack README, retrieved 2026-10-25.
Source: Prometheus Skills Mini README, retrieved 2026-10-25.
Source: KnowMe Concierge repository README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Combinations: the Flint platform [planned] (Solutions)

- Flint Gate, Flint Forge and Flint Realtime Fabric: Forge's README says it sits behind Gate and consumes Fabric as its realtime source.
- Prometheus Entity Sync on Flint Realtime Fabric: Entity Sync reuses Fabric's change capture, CRDT and operation-log code.
- The Universal Agent Runtime, Flint Gate, Flint Forge and Flint Realtime Fabric: the demo hosting platform's README assigns roles. UAR runs agents, Gate owns identity, Forge supplies data and Fabric supplies live updates. These are design statements.
- Flint Gate in front of the Universal Agent Runtime for edge authentication: the UAR README says Gate owns edge auth enforcement, and the demo platform README assigns Gate identity.
- The Flint core infrastructure README places Gate, Forge's Quarry and Fabric in the stack it configures.

Source: Flint Forge README, retrieved 2026-10-25.
Source: Prometheus Entity Sync README, retrieved 2026-10-25.
Source: demos README, retrieved 2026-10-25.
Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: Flint core infrastructure README, retrieved 2026-10-25.

## Combinations: libraries and inference [planned] (Solutions)

- Prometheus Entity Management with Flint Realtime Fabric through the Flint adapter: the adapter ships in the v4.1.1 README, and Fabric has no release.
- The Candle-VLLM fork with Prometheus Parking Lot: the fork submits completion and streaming work through a pool, but its lockfile pins an earlier revision than the published v0.4.0.
- Numen with the Candle-VLLM fork and Numen Enclave: the portfolio calls the fork part of the intended inference infrastructure and says no live Numen integration is verified.

Source: Prometheus Entity Management README, retrieved 2026-10-25.
Source: Candle-VLLM Cargo.lock at 10f844d, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Combinations: tools and meetings [planned] (Solutions)

- Phase Exit with the Universal Agent Runtime release phase: the preview was published for use there.
- KnowMe Project Management with the skills kbd-init and agent-team-creator, which its README lists as needed.
- Companion as a possible shared workspace for dot, Locus and other agent systems; no live cross-agent integration is verified.
- Know Meet with persistent dots as meeting participants, per its README. Know Meet is a synthetic prototype.
- Prometheus Pulse as a capability mapped into Locus.

Source: Phase Exit README, retrieved 2026-10-25.
Source: know-me-project-management README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Know Meet repository README, retrieved 2026-10-25.

## Combinations: pairs the sources do not relate (Solutions)

- The sources state no relationship between Flint Agent Mesh or Flint AI Code Companion and the other Flint products. A shared name is not a stated integration.
- No source states that the Universal Agent Runtime uses Prometheus Entity Management, or that Prometheus Entity Management and Prometheus Entity Sync work together.
- No source states that The Boss is deployed behind Flint Gate.
- Triples built by joining the pairs above are not stated either. A visitor who wants one should ask what each link is based on.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
