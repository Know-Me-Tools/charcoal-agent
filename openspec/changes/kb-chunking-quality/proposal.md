## Why

The site KB's `Recursive { size: 512 }` chunker splits at periods inside version numbers and produces 32- to 50-character fragments that score highest. The agent then misses facts the corpus states and answers "v0" or "Obsidian 1.x" (§4.8). FR-8 requires that no chunk ends inside a version number. Decision D-22 fixes this with configuration, not a UAR code change: the corpus is 8 files and about 3.5k tokens, so whole documents are small enough to be single chunks.

## What Changes

- The seed script creates the site KB with `config.chunk_strategy: "document"` (`KbConfigRequest`, UAR `src/uar/api/knowledge.rs:61-68`) and gains a `--recreate-kb` flag that deletes, recreates and re-ingests the site KB.
- The FR-8 chunk checks run against the recreated KB on the local compose stack. A larger `chunk_size` is the fallback if document chunks fail.
- The UAR default-chunker fix goes to the UAR roadmap; it is not part of this change.
- The deployed FR-8 check belongs to `site-agent-seed` 1.6, which runs after this change. If that check fails, `site-agent-seed` reopens this change.
- Lands in: this repo (`scripts/seed-site-agent.sh`). Owner: km-devops-engineer (seed script, local check); km-rust-engineer (UAR roadmap entry); km-chief-content-officer (corpus, if the fallback needs it).
- Depends on: none (no dependency on `site-agent-seed`). Blocks the `site-agent-seed` gate (1.3) and `site-agent-eval-text`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); amendment N9 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` (table A2); decision D-22.

## Impact

- Capability: `kb-chunking-quality`.
- Code: `scripts/seed-site-agent.sh`. No UAR code.
- Data: the site KB is deleted and recreated on each `--recreate-kb` run. The agent binds its KB by name, so recreation is safe.
