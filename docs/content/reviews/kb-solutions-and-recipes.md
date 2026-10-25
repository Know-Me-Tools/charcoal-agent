# Review record: kb-solutions-and-recipes

Phase `usefulness-update`, child `concierge-usefulness`, change C2. Author: km-content-creator (editorial self-review). The chief content officer's AI pre-review and the operator's approval are still to be recorded below. Nothing here reaches the concierge until the operator dispatches the KB seed.

## What changed
- `docs/knowledge-source/solutions/`: ten visitor-task pages (memory across tools; agents with auth and audit; local-first apps with an entity graph; adding an agent to a product; modernizing or hardening an older tool; discussing AI for a small clinic or team; an assistant to install today; a repeatable process for coding assistants; local models; coordinating agents), plus `product-combinations.md`, `business-case-and-roi-framework.md` and `code-recipes-from-readmes.md`. All thirteen are in the build manifest and generated into `content/knowledge/`.
- Edition 3: `rust-performance-skill` (public, registered, generated). `asset-tpg-stub` and `asset-rust-feasibility` are drafted and held out of the manifest, with `pending-consent` rows, like their parent entry `asset`.
- `product-facts.json`: three rows appended (58 to 61). `scripts/kb/__tests__/check-product-facts.test.mjs`: the pinned row count changed from 58 to 61 (one line; the test had to follow the data).
- `eval/questions.json`: six non-critical questions appended. `index.md` and `log.md` updated.

## Status wording decisions
- Each combined flow carries `[shipped]` or `[planned]`. Shipped needs a published release or package for every product in the flow and a source that states the link. Source without a release, prototypes, specifications and designs are `[planned]`, with the reason named ("source only", "preview", "design").
- The only combination tagged shipped is The Boss with the Universal Agent Runtime and BossFang in one installer (integration manifest). BossFang's connection to a runtime stays planned (its own document says implemented in source, not built or tested).
- UAR keeps the portfolio's caveat ("Work stopped; current runtime qualification not established") beside the repository's newer release record, both quoted, neither resolved.
- Entity Management: 4.1.1 stable; 4.2.0 is the README's expected candidate with every package `pending-publication`; the page says it does not establish that 4.2.0 is published.
- The SDK install lines for UAR are tagged planned because the README says registry publication is release-ordered.

## Claims left out, and why
- Legacy test tool page: the only portfolio rows about that work are the two ASSET papers, whose parent row is `pending-consent` and whose parent page is held out. The solution page therefore describes process tools and the public Rust skill, names no client, and says no source shows any of them used on an older tool. If the operator records consent, the two ASSET pages can be registered and the page extended.
- PatientGPT and other client-gated rows: not used. The Edition 3 PatientGPT status line (which contains words on the withheld list) was not copied; the existing status text stands. The clinic page names no client, states no compliance and says so.
- No price, tier, benefit figure or return figure anywhere. The ROI page gives formulas and says KnowMe pricing has not been announced.
- No snippet beyond what the READMEs show. UAR's run endpoints are named from the README's sequence diagram only, and the page says no request body is shown. Docker examples in the Flint Gate README were not copied because they embed a sample connection string.
- IPFS Sync for Obsidian: only the portfolio's line is used. Its README is not at a public address I could cite.

## Sources read
Read on 2026-10-25 with `gh api repos/<owner>/<name>/contents/README.md`: Prometheus-AGS/prometheus-entity-management, Prometheus-AGS/universal-agent-runtime, Prometheus-AGS/surreal-memory-server, Know-Me-Tools/flint-gate. Other claims reuse statements already cited in existing knowledge pages (product pages, `portfolio-stated-relationships.md`) and their repository sources. Edition 3 text came from the operator-supplied parse at `scratchpad/portfolio_edition3.json`.

## Could not verify
- The public address of Edition 3. The three new pages cite the Edition 2 address with an Edition 3 title and the note "address of Edition 3 not yet confirmed". Replace the resource when the operator supplies it.
- That the UAR memory system and A2UI renderers named in repository docs are in release v1.2.3 (the pages say so).
- Any README change after 2026-10-25. Retrieval quality of the new pages: the live eval was not run.

## Gate run
`node scripts/kb/build-kb.mjs` (104 outputs, `--check` clean); `validate-kb`: 0 failures, 0 warnings; `check-product-facts`: OK 61 rows; `check-withheld-terms`: 0 hits; `node --test scripts/kb/__tests__/*.test.mjs`: 58 tests, 57 pass, 1 fail (the known `seed-modes` "an unknown SEED_MODE is rejected").

## Pre-review and approval
- km-chief-content-officer AI pre-review: pending.
- Operator approval (name, date, file hash): pending.
