# Review record: product pages (`/products` and ten `/products/<slug>`)

- **Piece:** `content/site/products.ts` (`PRODUCT_PAGES`, the ten pages) and `content/site/products-copy.ts` (`PRODUCTS_COPY`, the page-level strings), introduced by change `site-product-pages` (phase `usefulness-update`), branch `feat/site-product-pages`. Both files carry a "DRAFT, pending operator approval" comment that points here.
- **Status:** awaiting operator approval. Approval is recorded at the bottom by the operator (name, date, git hash of the approved files); merge of the PR is read as approval, as for the earlier site PRs.
- **Pre-review:** none yet. km-chief-content-officer's editorial review is an AI pre-review and is not the human review.

## What is generated and what is copy

Not copy, not reviewed here: each page's status label, version line(s) and the "Checked ..." date. They come from `content/site/directory.ts` (generated from `docs/knowledge-source/product-facts.json`), through `DirectoryEntry.status`, `.versionLines`, `.versionKind` and `.checked`. `versionKind` and `checked` are two fields this change added to the generator. The wording of "Checked against {source}" follows the version kind: stable is "the release page", registry "the registry", tag/untagged/manifest "the repository", none "the portfolio"; a page with several rows joins the distinct sources ("the release page and the repository"). `scripts/site/check-products.mjs` (CI) refuses a status, version, date or release-tag URL in the copy, and the unit test renders every page against the directory.

## String groups

| # | Group | Strings | Where |
|---|---|---|---|
| 1 | Header link | "Products" | Header, from 640 px; current page on `/products` |
| 2 | Directory link | "See all products" | `/`, under the directory lead |
| 3 | `/products` | h1 "Products"; lead "Every product and project from KnowMe AI, LLC, with the status its own source gives. Ask the concierge about any of them."; filter group "Show family"; "All"; "Showing {n} of {total}"; "What the labels mean" | `/products` |
| 4 | Label definitions (6) | Released: A version has been published as a release or a package. Pre-release: A version has been published and marked as a pre-release. In development: Working source exists. No version has been released. Prototype: A prototype or demonstration, not a finished product. Design only: Written designs or specifications. No implementation yet. Under assessment: Its scope or status is still being confirmed. | `/products#labels` |
| 5 | Product page chrome | "Breadcrumb" (landmark); "Products" (breadcrumb root); "Key facts"; "Questions worth asking"; "Sources"; "Parts" (accessible name of the several-row list, not shown); "(opens in a new tab)" (screen readers); "Ask about {name}" (composer placeholder) | each page |
| 6 | Checked line | "Checked against {source} on {date}" with the four sources above | each page's plate |
| 7 | Head | title "{name} · KnowMe AI, LLC"; `/products` title "Products · KnowMe AI, LLC"; description = the page lead (`/products`: its lead); canonical `https://know-me.tools/products[/slug]` | document head |
| 8 | Ten pages | below | each page |

Reused unchanged: the AI disclosure lines (`ai-disclosure.ts`), the directory names, summaries and tile questions (`directory-copy.ts`, approved with site-home-directory). The first question of every page is that tile's question.

## The ten pages, each fact with its source

Source paths are under `docs/knowledge-source/`; `facts:<id>` is a row of `product-facts.json`. The check fails when a path does not exist.

### The Boss (/products/the-boss)

- Rows: boss. Label (generated): The Boss: released.
- Lead (20 words): An open-source AI desktop workspace for macOS and Windows, with conversations, agent sessions, tools and project work in one application.
- Questions: "What can I do with The Boss today?"; "How do I install The Boss?"; "How is The Boss different from BossFang?"
- Sources: https://the-boss.know-me.tools, https://github.com/Prometheus-AGS/the-boss/releases

| Fact label | Value | Source |
|---|---|---|
| Built on | Cherry Studio, the open-source client, extended by KnowMe AI, LLC. | `the-boss/the-boss.md` |
| Platforms | macOS 12 or later and Windows 10 or later. Linux is not offered. | `the-boss/the-boss.md` |
| Includes | Release installers include the Universal Agent Runtime and BossFang as programs that run beside it. | `the-boss/the-boss.md` |
| Get it | A download page and GitHub releases; no account is required. | `the-boss/the-boss.md` |
| Releases | Features in the current source are not always in the released installers. | `facts:boss` |

### BossFang (/products/bossfang)

- Rows: bossfang. Label (generated): BossFang: development.
- Lead (20 words): A Rust agent operating system for running AI agents with tools, memory and messaging, separate from The Boss desktop workspace.
- Questions: "How is BossFang different from The Boss?"; "How is BossFang different from LibreFang?"; "How does BossFang connect to the Universal Agent Runtime?"
- Sources: https://github.com/GQAdonis/librefang, https://github.com/GQAdonis/librefang/releases

| Fact label | Value | Source |
|---|---|---|
| Forked from | LibreFang, an open-source project; upstream changes are merged in over time. | `bossfang/bossfang-overview.md` |
| Changes | Where data is stored, how memory works and how it reaches models through the Universal Agent Runtime. | `bossfang/bossfang-overview.md` |
| Runtime link | Connects to an existing Universal Agent Runtime and never starts one; documented as not yet built or tested. | `bossfang/bossfang-status-and-licence.md` |
| Licence | MIT, with copyright held by the LibreFang contributors. | `bossfang/bossfang-status-and-licence.md` |
| Install | No tested end-user install path is established yet. | `bossfang/bossfang-status-and-licence.md` |

### Universal Agent Runtime (/products/universal-agent-runtime)

- Rows: uar. Label (generated): Universal Agent Runtime: released.
- Lead (22 words): A Rust server that runs AI agents: it calls models, runs tools under a policy and streams results to a user interface.
- Questions: "What does the Universal Agent Runtime do?"; "Which products run on the Universal Agent Runtime?"; "What do Stable and Preview mean for the Universal Agent Runtime?"
- Sources: https://github.com/Prometheus-AGS/universal-agent-runtime, https://github.com/Prometheus-AGS/universal-agent-runtime/releases, https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md

| Fact label | Value | Source |
|---|---|---|
| Written in | Rust. Its own operator interface is a React web app. | `universal-agent-runtime/universal-agent-runtime-overview.md` |
| Clients | Clients reach it over HTTP and server-sent events; every action is checked and recorded. | `universal-agent-runtime/universal-agent-runtime-overview.md` |
| Used by | The Boss bundles it, KnowMe is built on it and the agent on this site runs inside it. | `universal-agent-runtime/universal-agent-runtime-overview.md` |
| Support levels | Its support matrix marks each feature Stable, Preview or Experimental; only Stable rows are backed by release checks. | `universal-agent-runtime/universal-agent-runtime-status-and-licence.md` |
| Licence | MIT for the code; the documentation is CC-BY-4.0. | `universal-agent-runtime/universal-agent-runtime-status-and-licence.md` |

### Surreal Memory Server (/products/surreal-memory-server)

- Rows: memory. Label (generated): Surreal Memory Server: development.
- Lead (20 words): A memory service for AI agents, written in Rust on SurrealDB, with a knowledge graph, scoped memories and hybrid search.
- Questions: "How does the Surreal Memory Server store agent memory?"; "Which products use the Surreal Memory Server?"; "How do I run the Surreal Memory Server?"
- Sources: https://github.com/Prometheus-AGS/surreal-memory-server, https://github.com/Prometheus-AGS/surreal-memory-server/tags

| Fact label | Value | Source |
|---|---|---|
| Reached through | MCP, over stdio or HTTP, and a REST API. | `surreal-memory-server/surreal-memory-server-overview.md` |
| Writes | Go through a durable operation ledger, so a caller can confirm what was stored after a timeout or restart. | `surreal-memory-server/surreal-memory-server-overview.md` |
| Used by | The Universal Agent Runtime's optional memory system and BossFang are built on it. | `surreal-memory-server/surreal-memory-server-overview.md` |
| Published as | Source published for review; the owner's note says it is not a release. | `surreal-memory-server/surreal-memory-server-status-and-licence.md` |
| Licence | MIT, with Prometheus AGS as copyright holder. | `surreal-memory-server/surreal-memory-server-status-and-licence.md` |

### Prometheus Skill Pack (/products/prometheus-skill-pack)

- Rows: skills, mini. Label (generated): Prometheus Skill Pack: released; Prometheus Skills Mini: released.
- Lead (21 words): Two packages of reusable skills for AI coding assistants: the full Prometheus Skill Pack and the smaller, portable Prometheus Skills Mini.
- Questions: "What is in the Prometheus Skill Pack?"; "Should I choose Prometheus Skill Pack or Prometheus Skills Mini?"; "How do I install Prometheus Skills Mini?"
- Sources: https://github.com/Prometheus-AGS/prometheus-skill-system, https://github.com/Prometheus-AGS/prometheus-skills-mini

| Fact label | Value | Source |
|---|---|---|
| A skill is | A packaged set of instructions an AI coding assistant can load for a kind of task. | `skill-packages/prometheus-skill-packages-overview.md` |
| Full pack | Covers many languages and domains and can add native services for durable memory, model routing and research. | `skill-packages/prometheus-skill-packages-overview.md` |
| Mini | Process, team, research and UI skills; needs Node 22 or later and Git and runs on Windows, macOS and Linux. | `skill-packages/prometheus-skill-packages-choosing-full-or-mini.md` |
| Install | Do not install both in the same home: they share skill names, so one can hide the other. | `skill-packages/prometheus-skill-packages-choosing-full-or-mini.md` |

### Flint platform (/products/flint-platform)

- Rows: gate, forge, fabric. Label (generated): Flint Gate: development; Flint Forge: released; Flint Realtime Fabric: development.
- Lead (23 words): Flint Gate, Forge and Realtime Fabric: an auth proxy for streaming AI traffic, a data and edge-compute plane, and a realtime event spine.
- Questions: "What are Flint Gate, Forge and Realtime Fabric?"; "How does Flint Gate handle streaming AI traffic?"; "What do Quarry, Anvil and Kiln do in Flint Forge?"
- Sources: https://github.com/Know-Me-Tools/flint-gate, https://github.com/Know-Me-Tools/flint-forge, https://github.com/Prometheus-AGS/flint-realtime-fabric

| Fact label | Value | Source |
|---|---|---|
| Flint Gate | Authenticates, authorizes and enriches requests, and can validate AG-UI events. | `flint-gate/flint-gate.md` |
| Flint Forge | Quarry offers REST and GraphQL over Postgres, Anvil adds extensions and Kiln runs signed WebAssembly edge functions. | `flint-forge/flint-forge.md` |
| Realtime Fabric | A durable event spine on Apache Iggy, with separate transports for media, peer CRDT sync and federation. | `flint-realtime-fabric/flint-realtime-fabric.md` |
| How they fit | Forge's README says it sits behind Gate and uses the Fabric; design statements, not proof of a deployment. | `flint-forge/flint-forge.md` |

### Prometheus Entity Management (/products/prometheus-entity-management)

- Rows: pem. Label (generated): Prometheus Entity Management: released.
- Lead (15 words): A normalized, reactive entity graph for web, mobile, desktop and local-first apps, with generated-UI integration.
- Questions: "What problem does Prometheus Entity Management solve?"; "Which platforms does Prometheus Entity Management support?"; "How does Prometheus Entity Management keep views in step?"
- Sources: https://github.com/Prometheus-AGS/prometheus-entity-management, https://github.com/Prometheus-AGS/prometheus-entity-management/releases

| Fact label | Value | Source |
|---|---|---|
| Also called | entity-graph. | `prometheus-entity-management/prometheus-entity-management.md` |
| How it works | Each entity lives once at a type and id address, so one write updates every view of it. | `prometheus-entity-management/prometheus-entity-management.md` |
| Packages | Published as npm packages, with a Flutter package on pub.dev and a DevTools extension as a developer-mode ZIP. | `prometheus-entity-management/prometheus-entity-management.md` |
| Version records | Portfolio snapshots disagree on version numbers, so check the project's releases for the current one. | `prometheus-entity-management/prometheus-entity-management.md` |

### Parking Lot (/products/parking-lot)

- Rows: parking. Label (generated): Parking Lot: released.
- Lead (20 words): A Rust library for resource-aware background work, bounded execution and collecting results after the request that started them has returned.
- Questions: "When would I use Parking Lot?"; "How does Parking Lot decide which task starts next?"; "Can Parking Lot keep work across a crash?"
- Sources: https://crates.io/crates/prometheus_parking_lot, https://github.com/Prometheus-AGS/prometheus-parking-lot-rs

| Fact label | Value | Source |
|---|---|---|
| How it works | Each task declares a cost; a pool starts it when the cost fits free capacity and parks it otherwise. | `prometheus-parking-lot/prometheus-parking-lot.md` |
| Ordering | Parked tasks start by priority, then in submission order; a task costing more than the pool's capacity is rejected. | `prometheus-parking-lot/prometheus-parking-lot.md` |
| Durable mode | Tasks can be parked in a Postgres or redb queue so accepted work survives a crash. | `prometheus-parking-lot/prometheus-parking-lot.md` |
| Registry | Published on crates.io; registry publication is not runtime qualification. | `prometheus-parking-lot/prometheus-parking-lot.md` |
| Used by | The Candle-VLLM Prometheus fork submits completion and streaming work through a pool. | `prometheus-parking-lot/prometheus-parking-lot.md` |

### KnowMe (/products/knowme)

- Rows: knowme. Label (generated): KnowMe: development.
- Lead (19 words): A personal AI platform from KnowMe AI, LLC that is still in development and has not been publicly released.
- Questions: "What is KnowMe, and can I use it yet?"; "Is KnowMe the same as The Boss?"; "Which devices is KnowMe being built for?"
- Sources: https://github.com/Know-Me-Tools/know-me-system

| Fact label | Value | Source |
|---|---|---|
| Design intent | One application for phone, tablet and desktop, with models designed to run on your own hardware. | `knowme/knowme-overview.md` |
| Platforms | Being built for macOS, Windows, Linux, iOS and Android from one codebase; none is publicly released. | `knowme/knowme-platforms-and-status.md` |
| Built with | Tauri and React on desktop, and Flutter on phones. | `knowme/knowme-platforms-and-status.md` |
| Download | The desktop app you can download today is The Boss, which is not an edition of KnowMe. | `knowme/knowme-platforms-and-status.md` |

### Locus (/products/locus)

- Rows: locus. Label (generated): Locus: design.
- Lead (16 words): A proposed owner-controlled private assistant, still at the design stage, with no working Locus to use.
- Questions: "What is Locus meant to do?"; "How far along is Locus?"; "What is the Book of Locus?"
- Sources: none (repository is private, left out)

| Fact label | Value | Source |
|---|---|---|
| Also called | Private Dot. | `locus/locus.md` |
| Proposed to | Keep durable state, use selective memory and run work on replaceable execution workers. | `facts:locus` |
| What exists | A documentation-first specification, a design kit and a local capture wrapper with tests; no Locus runtime. | `locus/locus.md` |
| Unfinished | Book rendering, the full PDF and publication of the Book to IPFS. | `locus/locus.md` |


## Status wording

Labels are the generated six. Locus is "Design only" and its lead says "proposed ... still at the design stage, with no working Locus to use". KnowMe is "In development" and its lead says it "has not been publicly released". No page describes a proposed, design-stage or in-development product as available. The Universal Agent Runtime shows "Released" (green) from its stable tag, while the portfolio says work stopped (decision D-002); the fact "Support levels" says only Stable rows are backed by release checks.

## Checks

- Limits (enforced by the check and a test): name at most 32 characters; lead at most 25 words and one sentence; facts 3 to 5, label at most 3 words, value at most 20 words, no version or date, never a restatement of the lead; 2 to 4 questions of at most 70 characters, ending "?", naming the product, no pronoun or superlative (the tile question is exempt, it was approved with the directory); no price, compliance or certification claim, no banned word, no withheld term, no non-public row name.
- Sources: every link was checked on 24 Oct 2026 with `node scripts/site/check-products.mjs --online` (GitHub says `private: false` and the link answers 200; crates.io is checked through its API because it answers a script with 404 for the page and a browser with 200).
- `Know-Me-Tools/locus` is private (`gh api repos/Know-Me-Tools/locus --jq .private` is true), so the Locus page has no Sources section.

## Notes for the content officer

1. **Free.** The Boss KB page says "free, open-source". I wrote "open-source" only, because the brief bars pricing anywhere. Say if "free" may return.
2. **BossFang home page.** `bossfang.know-me.tools` appears in the BossFang knowledge page as its home page. It does not resolve (no DNS answer). I did not link it. The knowledge page needs a correction.
3. **Locus "Checked against the repository".** The row's version was read from a private repository, so a visitor cannot check it. The wording stays true; the operator may prefer "the portfolio" for Locus.
4. **Several-row pages** (Flint platform, Prometheus Skill Pack) put each row's own name, badge, version and summary inside the status plate, so there is never one badge for the group. The brief put that list after Key facts; I moved it up because the status is the first thing a visitor looks for and filled badges may sit only on `bg-tile`.
5. **KnowMe fact "Download".** "The desktop app you can download today is The Boss, which is not an edition of KnowMe" is from `knowme-platforms-and-status.md`; "today" will go stale, so review it with each facts update.
6. **UAR fact "Used by"** says the agent on this site runs inside the Universal Agent Runtime (from the overview page).
7. **Skill Pack fact "Mini"** carries "Node 22"; it is a runtime requirement, not a release number, and the check allows it.
8. **Canonical origin** `https://know-me.tools` is my choice (the cluster's apex host redirects www to it). The marketing officer should confirm.

## Mutations the tests catch

Unknown slug resolving to a product (unit and e2e fail); a chip sending a different prompt (e2e fails); and in `check-products.test.ts`: a slug that is not a tile, a non-public or unknown row, rows that differ from the tile, a missing page, a status or version field, a version or date in a fact or the lead, a release-tag URL, a private repository link, an empty sources list on a public repository, a non-https link, each copy limit, a restated lead, an untraceable source, each question rule, a price/certification claim, a banned word, a withheld term, a non-public row name, a design-stage lead that sounds available.

## Operator approval

(not yet recorded)
