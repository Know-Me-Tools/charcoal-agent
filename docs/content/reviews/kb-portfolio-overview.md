# Review record: kb-portfolio-overview

Phase `usefulness-update`. Author: km-content-creator. This is an editorial self-review. It is not the human review. Operator approval (name, date, approved commit hash) has not been recorded. The km-chief-content-officer pre-review has not run.

## Pages
`docs/knowledge-source/portfolio/` (index, `portfolio-overview.md`, `portfolio-stated-relationships.md`, `portfolio-available-today.md`), registered at the end of `build-manifest.json`, generated to `content/knowledge/`, and linked from the root `index.md`. Three eval questions appended at the end of `eval/questions.json`, none critical.

## Sources used
- Portfolio Edition 2 (IPFS, 2026-10-24) for every status line and for the Numen, Locus, Companion, Poppy and Praxis edges.
- Versions come from `product-facts.json` through `{{v:<id>}}` placeholders. Untagged rows render "no tagged release (last commit ...)"; rows with no repository say "No repository was identified."
- Relationship edges reuse sources already cited in the entry pages and `product-relationships.md` (READMEs for The Boss, BossFang, Flint Forge, Entity Sync, Flint core infrastructure, demos, Know Meet, Phase Exit, Project Management, Know Decision, the Candle-VLLM lockfile). I did not re-read these repositories in this change.
- Availability: The Boss download page, Skill Pack and Mini READMEs, crates.io, Prometheus Entity Management README, Flint Forge release, Universal Agent Runtime releases, all as cited by the existing entry pages.

## Status wording decisions
- Each overview line keeps the portfolio's own status wording, shortened without strengthening it. The six directory labels are not used, because they are derived by a rule and would add a second vocabulary.
- Sections are grouped by family. Applications, Agents and memory and Developer tools are split in two so each section stays near the 1,000-character chunk size (Platform and the skills section run 1,039 and 1,075 including source lines).
- "Seven products record a published release or package" counts the rows whose version kind is stable or registry. Each is followed by its caveat: Universal Agent Runtime "work stopped", Flint Forge "source claim, not an audit", Entity Management "not a current release audit".
- Tag-only rows say "Git tag ..., no release"; BossFang says "build tag, no semantic version".
- Available-today lists Released rows, then "published, with a stated caveat" (Universal Agent Runtime, Flint Forge, IPFS Sync pre-release). Every other public row is listed as not available to use yet, on the basis that the portfolio records no release or install route.
- Withheld and pending-consent rows are absent from all three pages, and the pages give no count that would hint at them. Numen Enclave's sentence naming a pending-consent product was left out.

## How this relates to `prometheus/product-relationships.md`
That page covers eight products with their makers. This one covers the whole portfolio and is narrower in kind: only edges a source states. It repeats the edges that page cites (Boss bundling, BossFang to UAR, memory use, skill packages) with the same sources and does not contradict them. Two things it does not repeat because no repository source was traced here: "KnowMe is built on the Universal Agent Runtime" (this page cites only the Concierge README, which says the agent runs inside it) and "The Boss is not an edition of KnowMe". The older page remains the place for maker, licence and where-to-get answers.

## Tension to flag
The portfolio says the Universal Agent Runtime is "work stopped; current runtime qualification not established", while `product-relationships.md` and the entry pages describe it as the runtime other products are built on, with v1.2.3 released. Both are reported as sourced. The approver should decide whether the concierge needs a line that reconciles them.

## Could not verify
- The relationship edges were not re-checked against the repositories in this change; they rest on the entry pages' citations.
- Install paths in available-today are one-line summaries of the Skill Pack and Mini READMEs as cited by the existing install page, not tested commands.
- Retrieval eval not run: it needs a seeded knowledge base, which is the operator's step (`SEED_MODE=kb scripts/seed-site-agent.sh`).

## Gate
`build-kb`, `validate-kb` (0 failures, 0 warnings), `check-product-facts` (OK, 58 rows), `check-withheld-terms` (0 hits), `node --test scripts/kb/__tests__/*.test.mjs` (58 tests, 57 pass, the known `seed-modes` failure only).

## Content-officer pre-review: PASS WITH FIXES (applied in a second commit)
1. Universal Agent Runtime now has two-part wording on all three pages (portfolio says work stopped; repository lists the release and pre-release; changelog records Linux amd64 acceptance within a defined scope; repository is the newer record), with a `uar-changelog` source.
2. BossFang removed from not-available; "no separate release; it comes only with The Boss" added.
3. KnowMe Concierge: "the agent on this site. It has no download or install route."
4. "No GitHub release. Some carry a git tag, which is not a release."
5. Overview names the IPFS Sync pre-release.
6. Know Decision "planned decision layer", portfolio status cited; gen_ui "intended shared core".
7. Phase Exit and Project Management removed from the not-stated list.
8. Praxis/Locus edge marked "per the portfolio".
9. Tranquil and Studio no longer say a repository exists and was not identified.
10. "libraries with a published release".
11. Sections split (Flint platform, not-stated, overview Platform, available-today list); "It" openings replaced.
