---
type: Report
title: Portfolio gap report, Edition 2
description: What the pinned portfolio edition and every sublink it references say that the knowledge base and product-facts do not yet cover, with contradictions, drift and graph-ready relationships.
status: draft
generated:
  by: portfolio-gap-crawl/claude-sonnet-5.5
  at: "2026-10-25T00:00:00+00:00"
tags:
  - portfolio
  - gap-report
  - coverage
external_claims: true
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: crates
    resource: https://crates.io/crates/prometheus_parking_lot
    title: "prometheus_parking_lot on crates.io"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-releases
    resource: https://github.com/Prometheus-AGS/the-boss/releases
    title: "The Boss releases"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Portfolio gap report, Edition 2

Step B0 of the approved plan. This report is an input to later pull requests. It adds no knowledge-base content and changes no product fact.

## 1. Scope, method and limits

- **Source.** Portfolio Edition 2 (24 October 2026), the immutable address that `product-facts.json` is pinned to. Crawled on 25 October 2026.
- **Crawl.** The index was fetched with curl, then every distinct link it contains: 384 pages, all HTTP 200, no failures. The index itself makes 385. Pages were converted to text and heading outlines. Downloaded content was treated as data and never executed.
- **Diff.** Each entry and each linked document was compared with `docs/knowledge-source/**` (the build manifest and every product, portfolio, solutions and landscape page) and with `product-facts.json`. Coverage was judged by reading the KB page, not by matching titles. Where a long document was compared, its section outline and its status paragraph were read, and its topics were searched for in the KB.
- **Rule D-002.** Repositories, the registry and the cluster win over the portfolio. Registry and release facts below were re-checked on 25 October 2026 (crates.io API, GitHub releases API, GitHub repository visibility).
- **Carried caveats.** Publication is not shipment. Research is not ownership. Missing and private are different. LiveKit, Iggy, Temporal, EdgeQuake, Obsidian, Kubo, Cherry Studio, OpenSpec and the DID standards are external references, not products.
- **Withheld material.** Client-program records, anything marked private, prices and the four withheld terms in `product-facts.json` are listed only as "withheld: privacy review needed". Their content is not summarised here. Client entries are numbered C1 to C6 by their index position (45, 46, 47, 50, 54, 55) and not named.

**What I could not fetch or verify**

- 144 "local HTML records" are listed in the index with "public URL not verified". They are not linked, so they were not fetchable. Their titles appear in the index, and the gap is recorded per entry below.
- Know Meet inner pages (agents, auth, dashboard, recordings, settings, join) and the two panels return 34 to 282 characters of static text; the screens are rendered by script, and curl does not run script. Only the landing page and the meeting page text were captured.
- `the-boss.know-me.tools` and the Lampas "external artifact" address returned an empty script shell. No content was captured.
- Praxis was read in its 1.2 record set. The five edition sets (1.0, 1.1, 1.2 full, 1.2 share, stable pointer) were not diffed against each other. Four specification pages have identical size, one set is about 3 percent smaller, and the share entry is a small page that points to the full specification.
- Edition 3 (25 October) is not linked from Edition 2 and was not located. The three facts rows tagged Edition 3 were not checked against it.
- Repository READMEs were read only for the repos linked from the portfolio, plus five spot checks. The Know-Me-Tools/locus README returned 404 because the repository is private (section 4).
- Counts in the index (58 entries, 423 links, 144 local records) were checked: the 144 reconcile exactly and the links give 421 to 424 depending on whether asset links count. Not reconciled to the exact unit.

## 2. Summary counts

| Measure | Count |
|---|---|
| Pages fetched, distinct links | 384 (all HTTP 200), plus the index |
| Distinct page bodies | 168 (the five Praxis editions and the stable pointers repeat bodies) |
| Directory entries in Edition 2 | 58 (`product-facts.json` has 61 rows; the extra 3 come from Edition 3) |
| Entries with a built KB page | 52 (51 backed by `docs/knowledge-source`, 1 hand-written in `content/knowledge` with no source file: IPFS Sync for Obsidian) |
| Entries held out of the KB on purpose | 6 (C1 to C6, all client work; 5 have a source directory that is not in the build manifest, 1 has none) |
| Praxis source records S00 to S44 | 45 (225 record pages across 5 editions) |
| Praxis source records usable for new KB pages | 31 (S01 to S30 plus S00); S31 to S38 are the Private Dot set; S39 to S44 withheld |
| Sections of the two flagship design documents | 13 (K01 to K13) plus 18 (D01 to D18) |
| Local HTML records, "public URL not verified" | 144 (cannot be covered until published) |
| Contradictions or drift found | 7 (section 4) |
| Graph-ready relationships recorded | 42 (section 7) |
| Proposed pull requests, by family | 7 (section 6) |

## 3. Gap table

### 3.1 Directory entries

Status vocabulary: **shipped** (a tagged release, registry package or pre-release the repository shows), **source-only** (code exists, no tag or release), **planned** (design, specification, proposal, prototype or synthetic demonstration), **unknown** (the portfolio says unresolved). "Flag" is the publication or privacy flag: `public`, `pending-consent` and `withheld` come from `product-facts.json`; `review` marks a public entry whose linked documents hold material that needs a privacy decision.

| # | Entry (facts id) | KB coverage | Gap | Proposed page or fact | Status | Flag |
|---|---|---|---|---|---|---|
| 1 | KnowMe App (`knowme`) | `knowme/` six pages: overview, features, platforms, privacy, FAQ, company | Two design documents are linked and unread by the KB: Assistant Platform Design (K01 to K13) and Local Specialist Assistant Architecture (D01 to D18). The KB has no architecture: roles, authority boundaries, durable action lifecycle, UAR deployment choices, acceptance gates. 27 local editions (gateway, agent runtime and identity standards, moodboard, decision-layer edition, intern lesson plan) are unpublished | `knowme-assistant-platform-design` (new, split in 2) and `knowme-local-specialist-assistant` (new) | source-only | public; review |
| 2 | Locus / Private Dot (`locus`) | `locus/locus.md`: status, README facts | The durable Locus paper (3 parts, 20 sections plus 6 supplements) is not covered: versioned protocol, inbox and delivery ledger, outbox, orchestration, late results, fencing, encrypted artifacts, mobile limits, testable acceptance scenarios. The A18 mindmap (Book of Locus A0 to A17, 287 requirement IDs) and the 8 Private Dot parts are not covered. The canonical Book is unpublished | `locus-durable-cooperation-architecture` (new, Parts I and II only) | planned | public; Part III holds client sections: withheld; the repository is private (section 4) |
| 3 | KnowMe dot (`dot`) | `knowme-dot/` status page | The operator paper (v3, 47 headings) is not covered: durable operator with replaceable workers, operating loop, prompt contract, evidence matrices, many durable dots with one authoritative turn each, failure modes, adoption checklist. The synthetic preview (snapshot and event panels) is not described | `dot-operator-pattern` (new) | planned | public |
| 4 | Synaxis (`synaxis`) | `synaxis/` status page | Part I technical design is not covered: control-plane records, message and task contracts, wire envelope, derived graph and provenance, deletion and rebuild, artifact storage, enrollment, 32 acceptance gates, delivery tiers. Part II is commercial (meters, tiers, margins): withheld, not summarised | `synaxis-architecture` (new, Part I only) | planned | public; Part II prices and terms: withheld |
| 5 | Numen (`numen`) | `numen/` status page | Both editions (27 sections) are not covered: hydrate, authorize, execute, checkpoint protocol; leases, fencing, idempotency; owner-domain gateway; Kubernetes coexistence; offline and mobile lifecycle; threat model; 12 executable acceptance scenarios; identity model for humans and agents; DID method choices | `numen-architecture` and `numen-identity-and-credentials` (new) | planned | public |
| 6 | Praxis (`praxis`) | `knowme-praxis/` editions only | The 1.2 specification (17 chapters, 45 records, 811 mappings) is not covered at all. No KB page says what the workspace is, what the container substrate is, or what the plugin, A2UI, context and LiveKit chapters require | `praxis-workspace-specification` (new, 3 pages: workspace and containers; plugins and A2UI; context, models and identity) | planned | public; some records mention client work |
| 7 | Know Meet (`meet`) | `know-meet/` status, README, screen list | The prototype's feature set and flow are not described: dot memory across meetings, dispatching registered agents, a private agent panel, shared meeting knowledge, record and transcribe, summary and action items sent at close, calendar connection, guest invitation | Extend `know-meet.md` | planned | public; prototype is synthetic |
| 8 | Know Decision (`decision`) | `know-decision/` README-based | The linked harness essay (bounded completion: close the phase, name the failure, ask for a decision) is not mentioned. It responds to a third party's experiment. Local decision-layer HTML is unpublished | Extend `know-decision.md` with one related-research paragraph | planned | public |
| 9 | Operator Service (`operator`) | `operator-service/` status page | Two executive briefs are not covered: the four problems, the operator model (named owner per agent output, flat plan, business-owned control plane), onboarding, lane per kind of work, exit. Tiers, prices and the default-model claim are commercial terms | `operator-model-explained` (new; no tiers, prices or margins) | planned | public; commercial terms: withheld |
| 10 | Lampas (`lampas`) | `lampas/` status page | Two reports are linked (business-case validation; measured local and cloud strategy with a six-week decision test). Both carry hardware and price detail and withheld terms | None until reviewed; at most a method-only page | planned | review: withheld terms and prices |
| 11 | The Boss (`boss`) | `the-boss/the-boss.md` (6.9 KB) | Release drift: v2.2.42 exists (section 4). Product website returned an empty shell. Capability-test and devtools records are local | Refresh fact `boss` | shipped | public |
| 12 | BossFang (`bossfang`) | `bossfang/` six pages | LibreFang repository page and local site records only; no gap found against the portfolio | none | source-only | public |
| 13 | KnowMe Concierge (`concierge`) | `knowme-concierge/` | Local brand and primitives records only | none | source-only | public |
| 14 | Flint AI Code Companion (`flint`) | `flint-code-companion/` | 9 local editions (PMPO technical specification v1.0, human-process specification, cognition engine) unpublished | none until published | planned | public |
| 15 | Flint Agent Mesh (`mesh`) | `flint-agent-mesh/` | 6 local editions (decisions and contract freeze, whitepaper, appendices) unpublished | none until published | planned | public |
| 16 | Flint Gate (`gate`) | `flint-gate/` | No linked document | none | source-only | public |
| 17 | Flint Forge (`forge`) | `flint-forge/` | 12 local editions unpublished, including the A2UI series, a competitive analysis against a hosted backend, the functional specification and the metadata-extension plan | none until published | shipped (v1.0.0) | public |
| 18 | Flint Realtime Fabric (`fabric`) | `flint-realtime-fabric/` | 3 local records (test report, admin, implementation plan) unpublished | none | source-only | public |
| 19 | Flint core infrastructure (`core-infra`) | `flint-core-infrastructure/` | Portfolio withholds operational details. Repository is private (section 4) | Review the page against the repository visibility | source-only | review |
| 20 | Prometheus Entity Management (`pem`) | `prometheus-entity-management/` | A comparative review against three query libraries exists only as a local record. Nothing in `landscape/` covers state libraries | `landscape/entity-graph-vs-query-libraries` only after the review is published and each claim is checked | shipped (v4.1.1) | public |
| 21 | Prometheus Entity Sync (`sync`) | `prometheus-entity-sync/` | One local prototype record | none | source-only | public |
| 22 | gen_ui (`genui`) | `gen-ui/` | The specification is public as Praxis record S03 (28 KB): shared Rust core, thin web, desktop and Flutter surfaces. Not covered | `gen-ui-architecture` (new, from S03) | source-only | public |
| 23 | Demo hosting platform (`demos`) | `demo-hosting-platform/` | The repository is private (section 4) | Review citations | planned | review |
| 24 | DocuMind (`documind`) | `documind/` | 10 local editions unpublished (operator console, knowledge-based development method documents) | none until published | planned | public |
| 25 | Knowledge Gateway (`knowledge-gateway`) | `knowledge-gateway/` | No linked document | none | source-only | public |
| 26 | Surreal Memory Server (`memory`) | `surreal-memory-server/` five pages | The documentation site states facts the KB lacks: 59 MCP tools, 21 migrations, two vector sizes, text plus vector retrieval fused by rank, REST v1 and v2, streamable HTTP and SSE transports. The repository README does not state the tool count, so verify against source before adding | Extend `surreal-memory-server-how-it-works.md` after a source check | source-only (tag v1.10.2) | public |
| 27 | Prometheus Knowledge (`knowledge`) | `prometheus-knowledge/` | No linked document | none | source-only (tag) | public |
| 28 | Prometheus Parking Lot (`parking`) | `prometheus-parking-lot/` | Version drift (0.4.0, section 4). The KB says "six component crates" and does not name them. A local control-plane specification is unpublished | Name the seven crates; refresh fact `parking` | shipped | public |
| 29 | Prometheus Skill Pack (`skills`) | `skill-packages/` seven pages | The documentation site describes surfaces the KB lacks: bounded execution of Python, Node, Bash and WASM with a signed receipt, durable operations, bounded context, plugin distribution, companion and mobile boundaries. Local production-readiness record is for v1.5.0 against current v1.13.0 | Extend `prometheus-skill-packages-how-it-works.md` | shipped (v1.13.0) | public |
| 30 | Prometheus Skills Mini (`mini`) | `skill-packages/` | Site feature list not in the KB: KBD lifecycle as a Node state machine, adversarial review, ideation map, progress memory, artifact refinement, copy-mode plugin distribution | Extend the choosing page | shipped (v1.12.1) | public |
| 31 | Native agent creator (`native-agent`) | `native-agent-creator/` | No linked document | none | planned | public |
| 32 | Phase Exit (`phase-exit`) | `phase-exit/` | Related essay not mentioned (see entry 8) | One related-research line | source-only | public |
| 33 | KnowMe Project Management (`setup`) | `knowme-project-management/` | Site lists what it installs; KB covers it | none | source-only | public |
| 34 | HTMX Doc Forge (`docforge`) | `htmx-doc-forge/` | The repository is private (section 4) | Review citations | source-only | review |
| 35 | Artifact Refiner (`refiner`) | `artifact-refiner/` | No linked document | none | source-only | public |
| 36 | Prometheus Tune (`tune`) | `prometheus-tune/` | Specification only; matches | none | planned | public |
| 37 | Logos (`logos`) | `logos/` | 5 local editions unpublished (functional specification v3.0, brand guide, dashboard prototype) | none until published | planned | public |
| 38 | Knowtes (`knowtes`) | `knowtes/` | Purpose unresolved in the portfolio | none | unknown | public |
| 39 | Prometheus Studio (`studio`) | `prometheus-studio/` | Two local records | none | unknown | public |
| 40 | Light Creator (`light`) | `light-creator/` | Ownership lineage unresolved | none | unknown | public |
| 41 | Universal Agent Runtime (`uar`) | `universal-agent-runtime/` seven pages | The linked capability assessment is a 18 October snapshot of UAR 1.1.1 (12 capability families, Round 5 not ready). The portfolio calls it rejected and stale. The KB does not cite it, correctly | None. Record as historical; build any capability page from the repository (D-002) | shipped (v1.2.3, pre-release v1.3.0) | public |
| 42 | Prometheus Pulse (`pulse`) | `prometheus-pulse/` | Specified inside the unpublished Book of Locus | none | planned | public |
| 43 | Tranquil / Parlour (`tranquil`) | `tranquil/` | Numen section 26 is a source-level inspection of the identity and public-data substrate: reusable implemented foundations; public data is not private agent context; multi-instance primitives are not a high-availability contract. Not in the KB | Extend `tranquil.md` from Numen section 26 | planned | public |
| 44 | KnowMe integration with Poppy (`poppy`) | `knowme-poppy-integration/` | The specification (v0.1, 14 October, 13 sections) is not covered: scope, enforceable commitments, protocol boundary, approval and durable operation lifecycle, threat model, release gates, non-goals. External protocol; not a KnowMe product | `knowme-poppy-integration-design` (extend, then split if over 800 lines) | planned | public |
| 45 | C1 | Held out | withheld: privacy review needed | none | n/a | withheld |
| 46 | C2 | Held out | withheld: privacy review needed | none | n/a | withheld |
| 47 | C3 | Held out | withheld: privacy review needed | none | n/a | withheld |
| 48 | KnowMe realtor assistant (`realtor`) | `knowme-realtor-assistant/` | The synthetic demonstration (19 October) shows an opportunity queue, buyer preferences, conversion view, draft follow-up and a simulated human approval for an appointment. Not described | Extend the page; keep the "synthetic, nothing sent" caveat | planned | public |
| 49 | Kaia (`kaia`) | `kaia/` | Assessment details are confidential-only | none | unknown | review |
| 50 | C4 | Held out | withheld: privacy review needed | none | n/a | withheld |
| 51 | Authentic Digital Twin (`voice`) | `authentic-digital-twin/` | Corpus and assessments withheld | none | planned | public |
| 52 | Agentic IPFS / Obsidian sync (`ipfs`) | `content/knowledge/ipfs-sync-for-obsidian.md` only | No source file in `docs/knowledge-source`; the page is not rebuilt from the bundle. Repository not identified | Add a source concept or record why it is hand-written | shipped (pre-release v0.2.0) | public |
| 53 | Inference forks (`inference`) | `inference-forks/` | liter-llm fork scope not documented beyond the umbrella line | none | source-only | public |
| 54 | C5 | Held out | withheld: privacy review needed | none | n/a | withheld |
| 55 | C6 | Held out | withheld: privacy review needed | none | n/a | withheld |
| 56 | Candle-VLLM fork (`candle-vllm`) | `candle-vllm/` | Verified against the fork's lockfile at commit 10f844d: the pin is Parking Lot 0.1.0 at revision 32b481d. No gap | none | source-only | public |
| 57 | Numen Enclave (`numen-enclave`) | `numen-enclave/` four bullets | The standard (v0.1, sections 00 to 11) is not covered: data placement as a contract, identity and assurance, private connectivity with a bounded management plane, durable containers, recovery, lifecycle, deployment profiles, finite conformance record. The clinical profile and a pilot plan are client material: withheld | `numen-enclave-standard` (new, sections 00 to 08 and 10 to 11 only) | planned | public; the clinical profile and pilot pages: withheld |
| 58 | Companion (`companion`) | `companion/` | KB quotation of the cloud status is not the portfolio's wording (section 4) | Correct the quotation | planned | public |

### 3.2 Praxis source records (S00 to S44)

All 45 are published as pages in each of five editions. None has any content in the KB; `knowme-praxis.md` lists editions only. "Covered by" is therefore "none" in every row. Proposed pages are grouped by subject, not one per record.

| Record | Subject | Proposed page | Flag |
|---|---|---|---|
| S00 | Original Agentic Triptych paper (historical) | Lineage paragraph in `praxis-workspace-specification` | public; one client-program mention: review |
| S01 | Functional specification and architecture | `praxis-workspace-specification` | public |
| S02 | Mobile platform architecture standard | `praxis-workspace-specification` | public; client-name mentions: review |
| S03 | gen_ui technical specification | `gen-ui-architecture` | public |
| S04 | Interactive design specimen (HTML) | Reference only | public |
| S05 | Flutter UI and UX specification | `praxis-ui-ux-standard` (new, with S06) | public |
| S06 | UI and UX standard (Flat 2.0) | same | public |
| S07 | Context fabric specification | `praxis-context-and-models` (new, with S25, S26, S30) | public |
| S08 | Builder extensibility: local-first, realtime, WASM | `praxis-plugins-and-extensibility` (new, with S09, S18 to S24) | public |
| S09 | ADR-001 WASM target | same | public |
| S10 | ADR-002 container substrate | `praxis-workspace-specification` | public; client mention: review |
| S11 | Agent fabric convergence | `praxis-workspace-specification` | public |
| S12 | AFC C11 durable intent contract | same | public |
| S13 | Corrections of 16 July 2026 | Use as the precedence rule in every Praxis page | public |
| S14 | Implementation roadmap | `praxis-workspace-specification` | public |
| S15 | Platform support policy | same | public |
| S16 | Engagement and relationship model | `praxis-containers-and-engagements` (new, with S17) | public; client mentions: review |
| S17 | Agentic goal management | same | public; client mention: review |
| S18 | Plugin strategy: capability-centric model | `praxis-plugins-and-extensibility` | public |
| S19 | Universal plugin system plan | same | public |
| S20 | UAR plugin system research | same | public |
| S21 | Agent execution strategy: placements, hooks | same | public |
| S22 | A2UI strategy | same | public |
| S23 | AG-UI event transport strategy | same | public |
| S24 | Skill support strategy | same | public |
| S25 | Provider and model configuration | `praxis-context-and-models` | public |
| S26 | Local model acquisition and management | same | withheld terms present: review before any quotation |
| S27 | BossFang strategy | Extend `bossfang-overview.md` | public |
| S28 | Conversation UX decision record | `praxis-ui-ux-standard` | public |
| S29 | KnowMe and UAR runtime integration | Extend `knowme-platforms-and-status.md` | public |
| S30 | UAR knowledge base, RAG and wiki strategy | `praxis-context-and-models` | public |
| S31 | Private Dot: architecture | covered by entry 2 plan | withheld term present: review |
| S32 | Private Dot: business | not proposed | commercial terms: withheld |
| S33 | Private Dot: operator | entry 3 plan | commercial terms: withheld |
| S34 | Private Dot: implementation | entry 2 plan | client mention: review |
| S35 | Private Dot: sources | entry 2 plan | public |
| S36 | Private Dot: specification | entry 2 plan | public |
| S37 | Private Dot: white paper | entry 2 plan | public |
| S38 | Private Dot: workflows | entry 2 plan | public |
| S39 | Client workspace architecture and plan | none | withheld: privacy review needed |
| S40 | Client workspace operating philosophy | none | withheld: privacy review needed |
| S41 | Client workspace pane layout | none | withheld: privacy review needed |
| S42 | Mini-app schema | none | withheld: privacy review needed (provenance not stated) |
| S43 | Workspace image requirements | none | withheld: privacy review needed |
| S44 | Unbuilt-modules requirement | none | provenance not stated; review with S39 to S43 |

### 3.3 Sub-sites and linked documents beyond the directory entries

| Item | KB coverage | Gap and proposal | Flag |
|---|---|---|---|
| Praxis coverage matrix (117 KB), home specimen | none | Reference only. Use the matrix to cite clauses | public |
| Locus mindmap A0 to A17 (598 KB) | none | Fold into the Locus page; a historical snapshot, narrower than the paper | public |
| Private Dot site and 8 parts | none | Same as S31 to S38 | review |
| Assistant Platform Design K01 to K13 | none | Entry 1 plan. K05 is a set of original prompts: summarise structure, do not copy | public |
| Local Specialist Assistant D01 to D18 | none | Entry 1 plan; D03 and D12 use a synthetic scheduling case | public |
| Numen edition pages, Synaxis edition page | none | Edition metadata only | public |
| Know Meet pages (9 per host, 2 hosts) | partial | See entry 7 | public; script-rendered |
| Operator briefs (2) | none | Entry 9 | public; commercial: withheld |
| UAR capability assessment | none | Historical; entry 41 | public |
| Harness essay | none | Entries 8 and 32 | public; third-party names |
| Appliance reports (2) | none | Entry 10 | review: withheld terms, prices |
| Numen Enclave review worksheet | none | Entry 57 | public |
| Client investigation, pilot plan, pilot checklist, publication details, workspace paper | held out | withheld: privacy review needed | withheld |
| Poppy specification | partial | Entry 44 | public |
| Parking Lot registry records (7) | partial | Entry 28 | public |
| Candle-VLLM fork pages (README, lockfile, engine, worker pool) | covered | None | public |
| LibreFang, Know Decision, Entity Management repository pages | covered | None | public |
| Documentation sites (skill system, skills mini, memory server, project setup) | partial | Entries 26, 29, 30 | public |
| Realtor demonstration site | partial | Entry 48 | public; synthetic |
| The Boss site, Lampas external artifact | not captured | Empty script shells | n/a |

## 4. Contradictions and drift

Registry, repositories and the cluster win (D-002).

| # | What the portfolio or KB says | What the primary source says | Action |
|---|---|---|---|
| 1 | Portfolio entry 41: UAR "Work stopped; current runtime qualification not established"; the capability snapshot is "rejected/stale" | Repository: stable v1.2.3 (23 October) and pre-release v1.3.0 (24 October); the cluster serves chat on 1.3.0 | Already recorded in `product-facts.json` (`portfolioDisagreement`) and in the KB overview. No new action |
| 2 | Portfolio and facts row `parking`: 0.3.0, seven packages, all non-yanked, checked 24 October | crates.io API on 25 October: 0.4.0 published 25 October 15:13 UTC, not yanked; the index files for all seven crates list 0.3.0 and 0.4.0. The portfolio was right on its date | Refresh `parking` to 0.4.0. The pinned fork still uses 0.1.0, so the "earlier revision" sentence stays true |
| 3 | Facts row `boss`: v2.2.41, 23 October | GitHub releases: v2.2.42 stable, 24 October 15:25 UTC | Refresh `boss` |
| 4 | Portfolio entry 58: Companion cloud deployment "is blocked on reauthentication and verification" | `companion/companion.md` puts "Cloud deployment is not verified" inside quotation marks and calls it a paraphrase | Replace the quotation with the portfolio's words or drop the quote marks |
| 5 | `portfolio/portfolio-overview.md` says the portfolio groups products in six families, with names the portfolio does not use | The index filter has eight categories: Applications, Capabilities, Client & partner work, Infrastructure, Integrations, Research & concepts, Services, Tools. `product-facts.json` uses those eight. The KB also moves Tranquil and Knowledge Gateway to "Agents and memory", where the portfolio says Infrastructure | Reword to "grouped here in six sections" or use the eight |
| 6 | `product-facts.json` marks Locus, flint-infra, demos and htmx-doc-forge as `publication: public` with repository links | GitHub reports those four repositories as private on 25 October. The KB cites the Locus README and status note, the flint-infra README and the demos README | Decision needed: either the facts and citations change, or the repositories are meant to be public. Not a portfolio contradiction |
| 7 | Portfolio entry 5 lists the Numen identity edition as "current" | The edition's own header reads "Revision 2 candidate ... not published" | Carry both on the Numen page; the portfolio wording governs the label |

No contradiction was found in: the Candle-VLLM lockfile claim (verified: Parking Lot 0.1.0 at revision 32b481d), the 144 local records, the Praxis counts (239 related parts in the index; 45 sources and 811 mappings in the specification), or the Know Meet "synthetic" label against its README badge.

## 5. Top 10 gaps

Ranked by how much public, sourced content is missing and how often a visitor is likely to ask.

1. **Numen architecture and identity** (entry 5). 27 sections of design, one status paragraph in the KB.
2. **KnowMe assistant design** (entry 1, K01 to K13 and D01 to D18). The flagship has no architecture page.
3. **Praxis 1.2** (entry 6, S00 to S30). 17 chapters, no content.
4. **Locus durable cooperation** (entry 2, Parts I and II). A 139 KB paper with a status page.
5. **Synaxis architecture** (entry 4, Part I only).
6. **Numen Enclave standard** (entry 57, minus the clinical profile).
7. **dot operator pattern** (entry 3).
8. **Operator model explained** (entry 9, without tiers or prices).
9. **Poppy integration design** (entry 44).
10. **Skill packs, memory server and Parking Lot detail** (entries 26, 28, 29, 30): site facts, crate names and current versions.

Next: Know Meet feature flow, gen_ui from S03, the Praxis plugin, A2UI and AG-UI records, and the two drift fixes (section 4, rows 2 to 5) which cost the least.

## 6. Proposed pull requests, by family

One pull request each, in this order. Each page needs sources with retrieval dates, status labels (planned, not shipped) and a check against `check-withheld-terms.mjs`.

| PR | Family | Content | Blocked by |
|---|---|---|---|
| P0 | Refresh | Facts: `parking` 0.4.0, `boss` v2.2.42. Fix section 4 rows 4 and 5. Decide row 6 | Operator decision on row 6 |
| P1 | Infrastructure | `numen-architecture`, `numen-identity-and-credentials`, `numen-enclave-standard`, `synaxis-architecture`, `praxis-workspace-specification` (3 pages), Tranquil extension | None |
| P2 | Applications | `knowme-assistant-platform-design`, `knowme-local-specialist-assistant`, `locus-durable-cooperation-architecture`, Know Meet and realtor extensions | Locus Part III review |
| P3 | Services | `dot-operator-pattern`, `operator-model-explained` | Commercial-terms review |
| P4 | Tools | Skill pack and mini extensions, memory server extension (after source check), Parking Lot crate list, `gen-ui-architecture`, Know Decision and Phase Exit essay line | Source check for memory server counts |
| P5 | Integrations | Poppy design page; IPFS Sync source concept | None |
| P6 | Research & concepts | Lampas method-only page | Privacy review of the two reports; may not ship |

Not proposed: any client entry (C1 to C6), Praxis S32, S33, S39 to S44, Locus Part III, Synaxis Part II, the Enclave clinical profile.

## 7. Graph-ready relationships stated in the sources

Subject, relation, object, source. "Proposed" means the source states it as design. "Verified" means checked in code or registry. Items marked ext are external references, not products.

| Subject | Relation | Object | Source record | State |
|---|---|---|---|---|
| Numen Enclave | adds deployment boundary to | Numen | Index entries 5, 57 | proposed |
| Candle-VLLM fork | intended inference infrastructure for | Numen | Index entry 56 | portfolio direction; no live integration |
| Candle-VLLM fork | submits completion and streaming work through | Prometheus Parking Lot | Index entry 56; fork lockfile at 10f844d | verified (0.1.0, revision 32b481d) |
| Prometheus Parking Lot | publishes crate | core, runtime-tokio, pg, embedded, iggy, wasm (FFI package not published) | Index entry 28; crates.io | verified |
| Tranquil | design covered by | Numen identity edition | Index entry 43 | stated |
| Numen identity edition | inspects substrate of | Tranquil / Parlour | Numen section 26 | stated |
| Numen | considers identity methods | did:plc, did:web, did:key, did:jwk, did:webvh (ext standards) | Numen section 27 | proposed |
| Prometheus Pulse | mapped into | Locus | Index entry 42 | stated |
| Companion | proposed coordination layer for | dot, Locus, other agents | Index entry 58 | proposed; local MVP only |
| Locus | proposes adapter to | Prometheus Parking Lot | Locus paper section 9 | proposed; the paper says the crate does not yet give late-result guarantees |
| Locus | orchestrates with | Temporal (ext) | Locus paper section 8 | proposed |
| Locus | stores encrypted payloads in | IPFS through Kubo (ext) | Locus paper section 12 | proposed |
| Locus | optional notifications through | Iggy (ext) | Locus paper section 15 | proposed |
| Locus | local store candidates | PGlite/WASM, PostgreSQL, SurrealDB | Locus paper section 6 | candidate; not selected |
| Locus | mobile shell | Flutter with Rust FFI | Locus reading guide | stated |
| Synaxis | pins evidence on | EdgeQuake (ext) | Synaxis section 2.1 | evidence pin |
| Synaxis | pins evidence on | Surreal Memory Server | Synaxis section 2.2 | evidence pin |
| Synaxis | optional role for | Temporal (ext) | Synaxis section 9 | proposed |
| Synaxis | artifact storage on | IPFS | Synaxis section 7 | proposed |
| Synaxis | works with, optionally | UAR, skill packs | Synaxis reading guide | stated |
| Know Meet | hosts | people, persistent dots, registered LiveKit agents | Know Meet README; prototype | synthetic prototype |
| Know Meet | built on | LiveKit (ext) | Know Meet README | stated |
| Praxis 1.2 | supersedes | Praxis 1.0, Praxis 1.1 | Index entry 6 | stated |
| Praxis | lineage from | TripTych original | Index entry 6 | stated |
| Praxis | carries as source records S31 to S38 | Private Dot (Locus) documents | Index entries 2, 6 | stated |
| Praxis | specifies | Flutter mobile, Tauri and React desktop, browser shell, Rust core, A2UI, optional private dots | Praxis chapter 00 | proposed |
| Praxis | carries realtime on | LiveKit rooms (ext) | Praxis chapter 11 | proposed |
| Local Specialist Assistant Architecture | targets | UAR, BossFang (LibreFang) | Document title | proposed |
| Assistant Platform Design | assigns execution authority to | UAR | K01 | proposed |
| Assistant Platform Design | assigns user-facing shell and channels to | BossFang | K01 | proposed |
| KnowMe Poppy integration | adapter sits behind | UAR tool and approval boundary | Poppy specification section 1 | proposed |
| Personal Agent Protocol | owned by | Poppy, not KnowMe | Index entry 44 | stated |
| Prometheus Skills Mini | scaled-down Windows-native port of | Prometheus Skill Pack | Skills Mini site | stated |
| Prometheus Skills Mini | spec backend | OpenSpec (ext) | Skills Mini site | stated |
| KnowMe Project Management | installs | OpenSpec, KBD orchestration, Prometheus context, agent team, design tools, docs site | Project setup site | stated |
| Know Decision | related research | Harness-completion essay | Index entry 8 | stated |
| Prometheus Skill Pack | related essay | Bounded-completion essay | Index entry 29 | stated |
| Operator Service | companion brief to | Why the Operator Model | Operator brief OM-002 | stated |
| dot operator paper | describes | durable operator with replaceable workers; one authoritative turn per dot | dot paper | proposed |
| Lampas reports | reference | candle-vllm fork, mistral.rs fork (ext upstream) | Appliance strategy report | stated; details withheld |
| UAR | shared runtime dependency of | multiple portfolio applications | Index entry 41 | stated |
| KnowMe Concierge | runs its agent inside | UAR | Concierge README (already in KB) | stated |

## 8. Self-check

- **Changed:** this file only.
- **Run:** the crawl (385 pages, 0 failures), registry and release checks, repository visibility checks. KB validation and the withheld-terms scan are run before commit; results are in the pull request.
- **Not verified:** the 144 unpublished local records; script-rendered screens; Edition 3; edition-to-edition differences in Praxis; the memory-server and skill-pack site claims against source.
- **Added without being asked:** section 4 rows 5 to 7 (found while diffing). Remove them if out of scope.

## Update, 2026-10-26

The operator excluded `Prometheus-AGS/flint-infra` (Flint core infrastructure, `core-infra`) as internal deployment only. Row 19 above was resolved by removing the page, the facts row and the directory entry. This report is otherwise unchanged as a historical record.
