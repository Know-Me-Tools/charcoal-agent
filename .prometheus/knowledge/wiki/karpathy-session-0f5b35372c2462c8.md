---
type: SessionRecord
id: karpathy-session-0f5b35372c2462c8
title: Karpathy session 0f5b35372c24
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-26T14:33:28.683051+00:00
created_at: 2026-09-26T14:33:28.683051+00:00
updated_at: 2026-09-26T14:33:28.683051+00:00
revision: 0
---

## Delta

I've written six skills from this phase's learnings in `.agents/skills/`, and they're uncommitted. Each one passes the pmpo-skill-creator validator, and a second model (gpt-5.5) passed each of them after one round of fixes. They're symlinked into `.claude/skills`, and Claude Code already lists them. Codex, OpenCode, Kimi, Zed and MiniMax read `.agents/skills` directly.

| Skill | What it teaches |
|---|---|
| `pglite-browser-persistence` | Keeping PGlite out of Vite's pre-bundling (the "Invalid FS bundle size" error), `idb://name` creating a database called `/name`, what a finished write guarantees (from PGlite's docs), purging corrupt storage safely, migrations, testing against a real in-memory PGlite |
| `durable-browser-writes` | One serial write queue, a synchronous page-exit journal with replay on the next start, idempotent writes, the multi-tab hazards (a deleted thread coming back, stale overwrites, duplicated tabs), save failures that happen before the UI has loaded |
| `browser-storage-e2e-testing` | Injecting real IndexedDB failures, holding writes pending, setting up state before the app starts, proving tests can fail, flake triage, the Node 26 test trap |
| `tailwind4-shadcn-baseui-migration` | What the Tailwind 4 codemod, the shadcn CLI, Base UI and assistant-ui broke while the build stayed green; design-token and contrast guard tests |
| `chat-ui-model-output-safety` | Sandboxing generated HTML (including a CSP so it can't send data out), sanitizer ordering, never showing raw errors, retry and regenerate without duplicate turns |
| `agent-verification-hygiene` | Running tests before every commit, honest "verified" records, building review packets a reviewer can judge, harness side effects |

- **How they were built:**
  - The rules come from a catalog of about 40 learnings, each with its evidence, gathered from this phase's verification records, QA docs and review findings.
  - The pmpo-skill-creator's Simple tier fits knowledge skills, so there are no scripts or state files. `skill-creator` guided the descriptions.
  - All KnowMe-specific details are removed, so the skills can be used in other projects.
- **What the review caught:**
  - Round 1 blocked all six skills. It found three real problems:
    - My PGlite advice would have deleted a user's data when the real cause was a build misconfiguration.
    - My write-queue snippet stopped all later writes if error reporting itself failed.
    - I had overstated what "holding writes pending" proves.
  - All three are fixed, and every rule now carries an evidence tag: `[verified]`, `[docs]`, `[review]` or `[practice]`.
  - Round 2 passed all six, and I applied most of its warnings.
- **Still provisional:** the multi-tab rules in `durable-browser-writes` are tagged `[review]`. They describe the fix the frontend engineer is still building and testing. I'll change them to `[verified]` once that fix passes.
- **Two things for you to decide:**
  - **License:** I marked all six MIT so they can be shared. If the company wants different terms, I'll change the field.
  - **Where to commit:** they're on the persistence branch. I'd put them on a separate `rebrand/phase-learnings-skills` branch, so they don't get mixed into the persistence change. Say the word and I'll do that.
- **Not done:** `skill-creator`'s evals and its trigger-tuning loop were out of scope for this pass. I can run them next if you want the descriptions tuned against real prompts.

The persistence-durability work is still going: the frontend engineer is finishing the fixes from the review. After that come the full gate, a second review round, and then archive and merge.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-26T14:33:26.947439Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- .agent-team/README.md
- .kbd-orchestrator/current-waypoint.json
- .kbd-orchestrator/phases/complete-rebranding/progress.json
- .kbd-orchestrator/phases/complete-rebranding/tasks.md
- .kbd-orchestrator/position-reminder.txt
- .kbd-orchestrator/position.json
- .prometheus/gotchas.md
- .prometheus/session-log.md
- docs/qa/chat-persistence-durability.md
- e2e/chat-persistence.spec.ts
- openspec/changes/chat-persistence-durability/design.md
- openspec/changes/chat-persistence-durability/tasks.md
- src/features/chat/use-chat-runtime.onreload.test.tsx
- src/lib/db/db-provider.tsx
- src/lib/db/persistence-journal.test.ts
- src/lib/db/persistence-journal.ts
- src/lib/db/pglite.ts
- src/lib/db/write-queue.ts
- src/stores/chat-message-store.ts
- src/stores/chat-message-store.write-queue.test.ts
- src/stores/thread-registry-store.test.ts
- src/stores/thread-registry-store.ts
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
- .kbd-orchestrator/phases/complete-rebranding/review/chat-persistence-durability/
- .prometheus/progress-memory-receipts/a897c29a853516fa3b8ec14c48eef4f0b47a8de4cc57ff83ec0d47594426e673.json
- .prometheus/progress-memory-receipts/ca6051927f014763dc8c3b44354c9e907e0870ed556bc4473eb5b4654a870611.json
- .prometheus/progress-memory-receipts/ce943a8d3c3420927e7b8535fe7ee1606ebc48cae0148af66bedf73c734d5ae3.json
- .prometheus/progress-memory-receipts/f10f9ed88cefdf28fc7391a87f8943a02c1ce020fdd865fab3c346c6e190a9d5.json
- openspec/changes/chat-persistence-durability/verification.md
