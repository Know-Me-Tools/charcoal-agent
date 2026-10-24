# Product relationships (Prometheus)

## How do the KnowMe AI, LLC products relate to each other? (Prometheus)

KnowMe AI, LLC makes KnowMe, The Boss and IPFS Sync for Obsidian. Prometheus AGS makes the Universal Agent Runtime, BossFang, the Surreal Memory Server and the Prometheus skill packages.

KnowMe and The Boss are built on the Universal Agent Runtime. The Boss bundles the Universal Agent Runtime and BossFang, works with the Surreal Memory Server over MCP, and is built on Cherry Studio. BossFang is a client of the Universal Agent Runtime and uses the Surreal Memory Server library.

Not stated: any link between IPFS Sync for Obsidian and the other products, or between the Prometheus skill packages and KnowMe, the Universal Agent Runtime or BossFang.

## More stated links in the product map (Prometheus)

The Universal Agent Runtime's optional memory uses the Surreal Memory Server library. The skill packages list the Surreal Memory Server as optional memory.

## Who makes the products in this relationship map (Prometheus)

- KnowMe AI, LLC makes KnowMe, The Boss and IPFS Sync for Obsidian. Stated in prometheus-and-its-products.md and company.md.
- Prometheus AGS makes the Universal Agent Runtime, BossFang, the Surreal Memory Server and both Prometheus skill packages (the full Prometheus Skill Pack and Prometheus Skills Mini). Stated in prometheus-and-its-products.md.
- KnowMe AI, LLC builds KnowMe and The Boss on parts made by Prometheus AGS: the Universal Agent Runtime, BossFang and, through MCP, the Surreal Memory Server. Stated in prometheus-and-its-products.md and faq.md.

## KnowMe and the Universal Agent Runtime relationship (Prometheus)

- KnowMe is built on the Universal Agent Runtime. Stated in knowme-platforms-and-status.md and the-boss.md.
- The KnowMe agent runs inside the Universal Agent Runtime. The KnowMe web and desktop client streams the agent's replies from it, keeps threads locally and syncs KnowMe's built-in skills to it. Stated in universal-agent-runtime-overview.md.
- KnowMe is designed to route work through the Universal Agent Runtime, which can use local models or several model providers. This is design intent, because KnowMe has not shipped. Stated in knowme-privacy.md.
- The KnowMe agent on this site, which is not the KnowMe app, runs on the Universal Agent Runtime. Stated in company.md, faq.md and knowme-features.md.

Source: KnowMe client README, retrieved 2026-10-13.

## KnowMe and The Boss relationship (Prometheus)

- The Boss is not an edition or tier of KnowMe and is not built on KnowMe. Stated in the-boss.md, knowme-platforms-and-status.md and faq.md.
- KnowMe and The Boss share the Universal Agent Runtime: The Boss bundles it as a program that runs beside The Boss, and KnowMe is built on it. Stated in the-boss.md and knowme-platforms-and-status.md.
- The Boss is available to download now; KnowMe has not been publicly released. Stated in knowme-platforms-and-status.md.

## KnowMe, BossFang and the Surreal Memory Server relationships (Prometheus)

- KnowMe is designed to sync between a person's own devices and servers the person runs (BossFang), peer to peer. This is design intent; the sync systems are still being built. Stated in knowme-privacy.md.
- KnowMe works with the Surreal Memory Server through MCP as a separate service. Stated in prometheus-and-its-products.md.

## The Boss and the Universal Agent Runtime relationship (Prometheus)

- The Boss installers include the Universal Agent Runtime as a bundled program that runs beside The Boss. Stated in the-boss.md and faq.md.
- The Boss is also the operator-facing administration surface for the Universal Agent Runtime and its integrations. Stated in the-boss.md.

Source: The Boss integration artifacts manifest, retrieved 2026-10-12.
Source: The Boss product context, retrieved 2026-10-12.

## The Boss and BossFang relationship (Prometheus)

- The Boss installers include BossFang, with its dashboard, as a bundled program that runs beside The Boss. Stated in the-boss.md.
- BossFang is not The Boss. The BossFang fork's releases are payloads built for The Boss. Stated in bossfang-faq.md.

Source: The Boss integration artifacts manifest, retrieved 2026-10-12.
Source: BossFang fork releases page, retrieved 2026-10-13.

## The Boss and the Surreal Memory Server relationship (Prometheus)

- The Surreal Memory Server is not inside The Boss installer. The Boss works with it over MCP as a separate service that The Boss can manage or connect to. Stated in the-boss.md and faq.md.
- Running the Surreal Memory Server as a service managed by The Boss needs a container runtime, because The Boss pins it as a container image. Stated in the-boss.md.

Source: The Boss UAR model source adapter, retrieved 2026-10-12.
Source: The Boss managed services manifest, retrieved 2026-10-12.

## The Boss and the Prometheus skill packages relationship

- On a machine that already has the full Prometheus Skill Pack, Prometheus Skills Mini's README says to use Mini only inside The Boss application's own data directory. Stated in prometheus-skill-packages-faq.md and prometheus-skill-packages-choosing-full-or-mini.md.
- The Boss website describes Prometheus Skills Mini as a development process an agent can follow: assess, plan, execute, reflect, with OpenSpec holding the specifications. Stated in prometheus-skill-packages-overview.md.

Source: Prometheus Skills Mini README, retrieved 2026-10-13.
Source: The Boss download page, retrieved 2026-10-12.

## The Boss and what it is built on (Prometheus)

- The Boss is built on the open-source Cherry Studio client. Stated in the-boss.md and desktop-ai-clients-compared.md.

Source: The Boss README, retrieved 2026-10-12.

## BossFang and the Universal Agent Runtime relationship (Prometheus)

- BossFang connects to a Universal Agent Runtime instance that already exists, which can be one The Boss manages, and sends agent runs to it. BossFang never installs, starts, stops or supervises it. Stated in bossfang-overview.md and universal-agent-runtime-overview.md.
- This BossFang connection is implemented in source, not yet built or tested. Stated in bossfang-status-and-licence.md and bossfang-faq.md.
- BossFang is documented as a client of the Universal Agent Runtime's OpenAI-compatible API. Stated in universal-agent-runtime-use-cases-and-who-it-is-for.md.
- An older note in the Universal Agent Runtime's README and support matrix describes BossFang supervising it; BossFang's later document is the current design. Stated in universal-agent-runtime-overview.md.
- The Universal Agent Runtime owns inference, routing, agent execution and governance; BossFang manages agents, channels and a dashboard. Stated in universal-agent-runtime-faq.md and bossfang-faq.md.

Source: BossFang connects to UAR, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## BossFang and the Surreal Memory Server relationship (Prometheus)

- BossFang uses the Surreal Memory Server library as its memory layer, with an embedded database so no separate database service is needed. Stated in bossfang-overview.md and surreal-memory-server-overview.md.
- BossFang does not yet start its Surreal Memory Server-based semantic memory when it boots, and the feature ledger notes that this backend's writes are currently rejected. Stated in bossfang-status-and-licence.md.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.
Source: BossFang feature ledger, retrieved 2026-10-13.

## The Universal Agent Runtime and the Surreal Memory Server relationship (Prometheus)

- The Universal Agent Runtime's optional memory system is built on the Surreal Memory Server library and SurrealDB. That memory system is off until you turn it on. Stated in universal-agent-runtime-how-it-works.md and surreal-memory-server-overview.md.
- The Surreal Memory Server ships the library together with a standalone server that MCP clients can reach directly, and the Universal Agent Runtime depends on the library directly. Stated in surreal-memory-server-overview.md and universal-agent-runtime-faq.md.

Source: Universal Agent Runtime memory system, retrieved 2026-10-13.
Source: Surreal Memory Server documentation introduction, retrieved 2026-10-13.

## The Prometheus skill packages and the Surreal Memory Server relationship

- The full Prometheus Skill Pack lists the Surreal Memory Server as its optional durable memory service. Stated in surreal-memory-server-use-cases-and-who-it-is-for.md and prometheus-skill-packages-how-it-works.md.
- Prometheus Skills Mini can publish a team's lessons to the Surreal Memory Server's REST API, and its optional container stack runs SurrealDB with the Surreal Memory Server. Stated in surreal-memory-server-use-cases-and-who-it-is-for.md.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## The two Prometheus skill packages and each other

- The full Prometheus Skill Pack and Prometheus Skills Mini share skill names and can hide each other, so they should not be installed in the same home directory. Stated in prometheus-skill-packages-faq.md and prometheus-skill-packages-choosing-full-or-mini.md.

Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## Pairs with no stated relationship (Prometheus)

Say "not stated" for these instead of drawing a link:

- IPFS Sync for Obsidian and any of the other products.
- The Prometheus skill packages and KnowMe, the Universal Agent Runtime or BossFang.
- Whether KnowMe or The Boss is built on the Prometheus skill packages.
- How KnowMe AI, LLC and Prometheus AGS are related as companies.
- Whether KnowMe will bundle or depend on BossFang or the Surreal Memory Server, beyond the design intent and MCP connection listed above.
