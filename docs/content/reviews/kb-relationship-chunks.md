# Review record: kb-relationship-chunks

Phase: usefulness-update. Author: km-content-creator. AI self-review only; operator approval (name, date, file hash) is not recorded here. The live eval could not be run from this worktree, so the effect is untested.

Why: after the first-chunk fixes, two relationship questions still failed at the 0.5 production minimum. About 50 product pages carry a short "How X relates to other products / The sources do not state a relationship" section that scored higher than the real relationship pages.

## Changes
- New page docs/knowledge-source/portfolio/portfolio-how-products-relate.md (about 790 characters of body). Framing first (architectural intent, not proof of completed integration), then four stated relationships, each footnoted to a source already cited elsewhere: The Boss on Cherry Studio, The Boss bundling the Universal Agent Runtime and BossFang, the KnowMe client README on the agent running inside the Universal Agent Runtime, The Boss working with the Surreal Memory Server over MCP. Ends by pointing to the stated relationships page. Registered at the end of build-manifest.json and added to portfolio/index.md.
- Boilerplate reduction: in 12 product pages whose relationship section only said no relationship is stated, the heading is now "Related products" and the body "None is stated in the sources." Pages: HotSeaters, Light Creator, Kaia, Prometheus Tune, Prometheus Studio, Knowtes, ASSET InterTech modernization, KnowMe realtor assistant, native agent creator, Lampas, Synaxis, Logos. In Lampas, Synaxis and Logos the trailing sentence repeating the architectural-intent framing was dropped too, because it competed with the framing question; the portfolio-level pages still carry it. Pages with a real or qualified relationship statement (including the Operator Service, DocuMind, Flint Agent Mesh, Knowledge Gateway, Prometheus Entity Management) were not touched.

## Expectations changed (question texts unchanged)
- "How do your products relate to each other?": expect_file portfolio-stated-relationships.md to portfolio-how-products-relate.md; same two framing phrases. The new page is the short answer a visitor should be given; the long page remains for detail.
- "How do the KnowMe AI, LLC products relate to each other?": expect_file product-relationships.md to portfolio-how-products-relate.md; expect_contains "Universal Agent Runtime" unchanged. product-relationships.md keeps its own first-chunk answer from the previous change.

## Gate
build-kb ok (90 outputs); validate-kb 0 failures; check-product-facts OK; check-withheld-terms 0 hits; node --test 58 tests, 57 pass, 1 fail (known seed-modes). No prices, client names, withheld terms or certification claims added.
