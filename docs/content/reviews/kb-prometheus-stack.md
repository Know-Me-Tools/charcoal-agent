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

## Operator answers applied (D-10, 2026-10-13)
- Makers: Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages; "Prometheus" is the name of its server-side AI platform work. Each overview has one maker sentence, and each FAQ has "Who makes …?" and "What is Prometheus …?" answers. No sentence says KnowMe AI, LLC makes these products, and no relationship between the two companies is described.
- BossFang's home is https://bossfang.know-me.tools; https://github.com/GQAdonis/librefang is given as its source code.
- The owner-stopped statement is replaced everywhere with "The owner plans to resume testing once the code base has stabilised."
- Every sentence about the BossFang binary name is removed.
- Skill counts are now counted by listing the skill folders in each repository on 2026-10-13 (full pack: 120 skills, 404 SKILL.md files in total including nested helper skills; Mini: 100 skills). The "counts disagree" sentence is deleted.
- "No account with KnowMe AI, LLC is needed" is now "No account is needed" in all four FAQs.
- The Boss bundling sentence now reads "The Boss installers include the Universal Agent Runtime and BossFang as bundled programs that run beside The Boss", sourced to The Boss releases page.

## Temporary licence clause, to delete after the LICENSE pull requests merge
The clause "The owners state it is MIT licensed; a LICENSE file has been proposed in the repository." waits on Prometheus-AGS/surreal-memory-server PR 50 and Prometheus-AGS/prometheus-skills-mini PR 58. It appears in:
- `surreal-memory-server/surreal-memory-server-status-and-licence.md`, section "Surreal Memory Server licence", plus the description line ("a LICENSE file has been proposed in the repository").
- `surreal-memory-server/surreal-memory-server-faq.md`, answer "Is the Surreal Memory Server free?".
- `skill-packages/prometheus-skill-packages-status-and-licence.md`, section "Prometheus skill packages licences", plus the description line.
- `skill-packages/prometheus-skill-packages-faq.md`, answer "Are the Prometheus skill packages free?".

## Sentences that need the operator's approval
1. The UAR, BossFang and The Boss paragraph in `universal-agent-runtime-overview`: the statement that UAR's README and support matrix describe BossFang supervising UAR, and the ruling that BossFang's later document is the current design.
2. Resolved by D-10: the owner-stopped sentence is replaced (see above).
3. Resolved by D-10: BossFang's home is https://bossfang.know-me.tools, and the GitHub repository is listed as its source code.
4. Resolved by D-10: the maker is Prometheus AGS (see above).
5. UAR licence statements: "no commercial licence to buy", "relicensed from AGPL-3.0-only to MIT on 2026-08-07", and the design-intent statement that UAR moved to MIT to run decentralized on small machines.
6. The Compass licence ("MIT or Apache-2.0"), taken from The Boss website, not from a LICENSE file.
7. BossFang: "No tested end-user install path is established, so this knowledge base gives no install command."
8. Public statements that product documents disagree: the binary-name statement is removed and the skill counts are fixed by D-10. Still open: Mini's README links a contribution guide that is not in its repository (skill packages FAQ, contribute answer).
9. Changed to "No account is needed" (all four FAQs).

## Open questions for the operator
- Who makes these products: answered (D-10, item 1).
- What is Prometheus: answered (D-10, item 1).
- BossFang's public URL: answered (D-10, item 3).
- Pricing: should these files carry the mandated sentence "pricing has not been announced"? Still open.

## Approval
Not approved. Operator name, date and the approved file's git hash go here.
