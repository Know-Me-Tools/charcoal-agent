---
type: SessionRecord
id: karpathy-session-d2bb280ba48c2d76
title: Karpathy session d2bb280ba48c
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-26T15:11:42.645783+00:00
created_at: 2026-09-26T15:11:42.645783+00:00
updated_at: 2026-09-26T15:11:42.645783+00:00
revision: 0
---

## Delta

I've written the six skills you asked for. The persistence change they draw on is now finished and merged into `main`. The skills themselves are not committed yet.

**The skills** are in `.agents/skills/` and symlinked into `.claude/skills`; Claude Code already lists them. They're generalized so another project can use them, and they're marked MIT.

| Skill | What it teaches |
|---|---|
| `pglite-browser-persistence` | Keeping PGlite out of Vite's pre-bundling, `idb://` database names, what a finished write guarantees, purging corrupt storage safely, migrations, and that `TIMESTAMPTZ` comes back as a `Date` |
| `durable-browser-writes` | One serial write queue, a page-exit journal with replay, idempotent writes, and the multi-tab hazards: deleted threads coming back, stale overwrites, duplicated tabs |
| `browser-storage-e2e-testing` | Injecting real IndexedDB failures, holding writes pending, proving tests can fail, flake triage, the Node 26 test trap |
| `tailwind4-shadcn-baseui-migration` | What the Tailwind 4 codemod, the shadcn CLI, Base UI and assistant-ui broke while the build stayed green |
| `chat-ui-model-output-safety` | Sandboxing generated HTML with a CSP, sanitizer order, never showing raw errors, retry without duplicate turns |
| `agent-verification-hygiene` | Running tests before every commit, honest "verified" records, review packets a reviewer can judge |

Every rule carries a tag saying how it was proven: `[verified]`, `[docs]`, `[review]` or `[practice]`.

- **Built with:** pmpo-skill-creator's Simple tier (instructional skills, no scripts or state) for structure and validation, and `skill-creator` for the descriptions.
- **Checked:** all six pass the creator's validator. A second model (gpt-5.5) blocked all six in round 1 and passed them in round 2. The real problems it caught:
  - My PGlite advice could have deleted a user's data over a build misconfiguration.
  - My write-queue snippet stopped all later writes if error reporting itself failed.
  - I overstated what "holding writes pending" proves.
- **Updated after the merge:** the multi-tab rules now read `[verified]`, and the skills include the two new lessons from the last review round.
- **Not done:** `skill-creator`'s evals and trigger tuning. I can run them next.

**The persistence change** (`e8414f9`) is change 9 of 13 in this phase:
- **Tests:** 341/341 unit tests, typecheck ok, lint 0 errors, build ok, e2e 197/197, the 20× reload matrix 80/80, and accessibility unchanged. The unit tests still pass 341/341 on `main` after the merge.
- **Fixes after your "scrub on delete, newer version wins" decision:**
  - Deleting a conversation now removes it from every tab's journal, so it can't come back.
  - Saves queued while the page is hidden are now journaled.
  - A duplicated tab gets its own journal instead of sharing the original's.
- **Review round 2 caught a bug caused by my own decision note.** The note told replay to skip threads missing from the database, which would have lost a new conversation started in a tab that then died. It's fixed, with a test that fails if the fix is removed, and `design.md` records the correction.
- **The final review verdict is still BLOCK.** It rests only on findings I disproved:
  - `.env` files: neither was ever tracked, and both are git-ignored.
  - Three test mocks said to be missing an export: those tests pass, and the code path that would read the export never runs in them.
  
  All of this is recorded in `verification.md`. `chat-surfaces-flat2` merged under the same condition.

**Decisions for you:**
1. **Where to commit the skills.** I'd put them, and the matching `.agent-team/README.md` update, on their own branch `rebrand/phase-learnings-skills` and merge from there.
2. **License.** Keep MIT for sharing, or change it?
3. **Node version.** Should I add an `.nvmrc` pinning Node 24? 19 unit tests fail under the Node 26 your shell now picks up.

Next in the phase is `landing-and-about-brand`.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-26T15:11:03.557130Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- .agent-team/README.md
- .agents/skills/agent-verification-hygiene/
- .agents/skills/browser-storage-e2e-testing/
- .agents/skills/chat-ui-model-output-safety/
- .agents/skills/durable-browser-writes/
- .agents/skills/pglite-browser-persistence/
- .agents/skills/tailwind4-shadcn-baseui-migration/
- .claude/skills/agent-verification-hygiene
- .claude/skills/browser-storage-e2e-testing
- .claude/skills/chat-ui-model-output-safety
- .claude/skills/durable-browser-writes
- .claude/skills/pglite-browser-persistence
- .claude/skills/tailwind4-shadcn-baseui-migration
- .prometheus/progress-memory-receipts/98f5713791f55066cb73b438e5e98273a68c2527500bf057d87dfc463d083bac.json
- .prometheus/progress-memory-receipts/a11141b6025c149157d361c7ec6f28bce300343f0fa64da2825eef46dfe8c748.json
- .prometheus/progress-memory-receipts/a897c29a853516fa3b8ec14c48eef4f0b47a8de4cc57ff83ec0d47594426e673.json
- .prometheus/progress-memory-receipts/ca6051927f014763dc8c3b44354c9e907e0870ed556bc4473eb5b4654a870611.json
- .prometheus/progress-memory-receipts/ce943a8d3c3420927e7b8535fe7ee1606ebc48cae0148af66bedf73c734d5ae3.json
- .prometheus/progress-memory-receipts/f10f9ed88cefdf28fc7391a87f8943a02c1ce020fdd865fab3c346c6e190a9d5.json
