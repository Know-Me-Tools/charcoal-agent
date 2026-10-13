# Review record: knowledge sources for the Prometheus stack

Corpus: the concept files under `docs/knowledge-source/universal-agent-runtime/`, `surreal-memory-server/`, `bossfang/` and `skill-packages/`, built into 25 files in `content/knowledge/` (`universal-agent-runtime-*`, `surreal-memory-server-*`, `bossfang-*`, `prometheus-skill-packages-*`). Branch `feat/kb-prometheus-stack`. Content hash: to be recorded at approval, from the approved commit.

## Sources checked
- Universal Agent Runtime: README, CHANGELOG, LICENSE, CONTRIBUTING, `docs/product-support-matrix.md`, `docs/ARCHITECTURE.md`, `docs/MEMORY_SYSTEM.md`, `docs/PROVIDER_CONFIGURATION.md`, `docs/DEPLOYMENT.md`, `docs/licensing/LICENSING.md` (public repository Prometheus-AGS/universal-agent-runtime).
- Surreal Memory Server: README, `Cargo.toml`, `crates/surreal-memory/Cargo.toml`, `website/docs/intro.md`, `docs/MCP_REST_CONTRACT_MATRIX.md`, `docs/PALACE.md`, `docs/operations.md`, `TASKSTREAMS-API.md`, `docs/source-publication-20261005.md`.
- BossFang: README, AGENTS.md, LICENSE, CONTRIBUTING, `docs/bossfang/feature-ledger.md`, `docs/bossfang-uar-connections.md`, and the fork's releases page (GQAdonis/librefang).
- Skill packages: full pack README, SKILLS.md, `skill-system.json`, LICENSE, CONTRIBUTING, `docs/guide/01`, `17`, `19`; Mini README, `package.json`, `docs/maintenance.md`, `docs/source-publication-20261005.md`.
- The Boss: README and `docs/agent-fabric-convergence.md`, `docs/agent-fabric/supported-profiles.md`; the-boss.know-me.tools.

## Editorial review (km-chief-content-officer, 2026-10-13)
An AI pre-review. It is not the human review that publishing needs. Its edits (jargon, filler, claim discipline, headings, links, missing questions) were applied on this branch. The sentences below were left in place but need the operator's decision before publication.

## Sentences that need the operator's approval
1. The UAR, BossFang and The Boss paragraph in `universal-agent-runtime-overview`: the statement that UAR's README and support matrix describe BossFang supervising UAR, and the ruling that BossFang's later document is the current design.
2. The Surreal Memory Server publication note: "the owner stopped further product testing and the planned rollout" (status and licence; the FAQ's "an earlier release integration did not pass as a whole"), and the same wording for Mini in the skill packages status.
3. https://github.com/GQAdonis/librefang presented as BossFang's public home (BossFang overview, status, FAQ).
4. Ownership of these products. `company.md` says the company has three products; these files do not say who makes UAR, the Surreal Memory Server, BossFang or the skill packages.
5. UAR licence statements: "no commercial licence to buy", "relicensed from AGPL-3.0-only to MIT on 2026-08-07", and the design-intent statement that UAR moved to MIT to run decentralized on small machines.
6. The Compass licence ("MIT or Apache-2.0"), taken from The Boss website, not from a LICENSE file.
7. BossFang: "This knowledge base therefore gives no install command."
8. Public statements that product documents disagree: the BossFang binary name (`librefang` versus documents saying otherwise), the full pack's skill counts, and Mini's README linking a contribution guide and LICENSE that are not in its repository.
9. "No account with KnowMe AI, LLC is needed" (all four FAQs).

## Open questions for the operator
- Who makes these products: should the content name a maker, and which one?
- What is Prometheus (Prometheus AGS, the Prometheus skill packages): how should it be described, if at all?
- Pricing: should these files carry the mandated sentence "pricing has not been announced"?

## Approval
Not approved. Operator name, date and the approved file's git hash go here.
