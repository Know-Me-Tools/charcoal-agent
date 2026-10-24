# Review record: kb-retrieval-first-chunks

Phase: usefulness-update. Author: km-content-creator. Status: draft, AI self-review only. Human approval (name, date, file git hash) is not recorded here and is required before publication.

Input: live retrieval eval run 40112869509 (58 questions, recall@5 = 42/58 = 0.724, 2 critical failures). The live eval could not be re-run from this worktree; the changes below are untested against the live index. Gate run: build-kb, validate-kb (0 failures), check-product-facts (OK), check-withheld-terms (0 hits), node --test (58 tests, 57 pass, 1 fail: the known seed-modes "unknown SEED_MODE is rejected").

## Page edits (source pages only; content/knowledge rebuilt by build-kb)

| Page | Change | Targets |
|---|---|---|
| universal-agent-runtime/universal-agent-runtime-status-and-licence.md | New lead section "What is the latest version of the Universal Agent Runtime, and is there a pre-release?": stable {{v:uar}}, pre-release {{v:uar:pre}}, release notes mark verification as pending, MIT, Prometheus AGS. Uses only wording the page already sourced (changelog, releases, LICENSE). | Latest UAR version (critical); UAR pre-release |
| skill-packages/prometheus-skill-packages-choosing-full-or-mini.md | New lead section headed with the question; states the difference, including Node 22 or later for Mini. "Node 22" is in the page's mini-readme source, so the expectation stands. | Full vs mini (critical) |
| skill-packages/prometheus-skill-packages-status-and-licence.md | New lead "Which version is the Prometheus Skill Pack?" with {{v:skills}} and {{v:mini}} (the version sentence was in a later chunk behind the 1.12.2 manifest counts). | Skill Pack version |
| portfolio/portfolio-overview.md | Opening section "What products does KnowMe AI make?" names the six families, The Boss, Prometheus Skill Pack, Skills Mini, and that KnowMe has no recorded release. | Products KnowMe AI makes |
| portfolio/portfolio-stated-relationships.md | Opening section phrased as the question; leads with "architectural intent, not proof of completed integration", then two repository-stated links. | Products relate to each other |
| portfolio/portfolio-available-today.md | Opening section "What can I use today?" with "Use today:" and "Not available to use yet:" lines and the-boss.know-me.tools. | What can I use today |
| prometheus/prometheus-and-its-products.md | Merged the late "What is Prometheus?" section into the opening, so "server-side AI platform work" is in the first chunk. No new claims. | What is Prometheus? (expectation kept) |
| prometheus/product-relationships.md | First section renamed to the question; links kept; "Not stated:" line for IPFS Sync for Obsidian and the skill packages moved into the first chunk. No new claims. | KnowMe AI, LLC products relate; IPFS Sync / skill packages relate |
| landscape/landscape-faq.md | Moved "Why not just use ChatGPT?" to the first answer. Text unchanged. The retrieved chunks were about dots and never gave the ChatGPT answer, so the intended page was the right one. | Why not ChatGPT |

## Expectations changed (expect_file only; expect_contains and critical flags unchanged)

For each, the top-5 output shows a retrieved chunk that states the expected fact, from the product's own page:

- "Who makes the Universal Agent Runtime?": prometheus-and-its-products.md to universal-agent-runtime-status-and-licence.md (rank 1 chunk: "Prometheus AGS makes the Universal Agent Runtime").
- "Is the Surreal Memory Server MIT licensed?": to surreal-memory-server-status-and-licence.md (rank 2 chunk: heading plus "MIT licensed ... Prometheus AGS").
- "Who makes BossFang?": to bossfang-status-and-licence.md (rank 4 chunk: "Prometheus AGS makes BossFang").
- "Is BossFang open source and what licence does it use?": to bossfang-status-and-licence.md (rank 4 chunk: "BossFang is MIT licensed").
- "What does The Boss build on?": product-relationships.md to the-boss.md (rank 2 and 3 chunks: "built on the open-source Cherry Studio client").

I verified this from the eval output and the source text, not by re-running retrieval. If a rank-4 chunk drops out in production (min score 0.5), these two BossFang questions may still fail; their scores in the run were 0.67 and 0.78.

## Left out, and why

- "KnowMe's own site runs a pinned release" was requested for the UAR lead. No source in the KB states it, so it is not written. It needs a sourced statement from the product owner before it can go in.
- No question marked critical was added or unmarked. No prices, client names, withheld terms or certification claims were added.

## Claims and sources

Every new sentence repeats a statement already on the same page or in the cited portfolio, changelog, releases, LICENSE or README sources. Placeholders {{v:uar}}, {{v:uar:pre}}, {{v:skills}}, {{v:skills:date}}, {{v:mini}}, {{v:mini:date}} resolve from product-facts.json at build.
