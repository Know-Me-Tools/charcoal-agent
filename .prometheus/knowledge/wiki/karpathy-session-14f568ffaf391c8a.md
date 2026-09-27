---
type: SessionRecord
id: karpathy-session-14f568ffaf391c8a
title: Karpathy session 14f568ffaf39
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-25T16:49:57.800853+00:00
created_at: 2026-09-25T16:49:57.800853+00:00
updated_at: 2026-09-25T16:49:57.800853+00:00
revision: 0
---

## Delta

Both reviews are in and point at the same core gaps. `km-frontend-engineer` is fixing them test first:
1. **Notices:** show them app-wide, and deliver failures that happen before any listener exists, such as replay at startup.
2. **Per-turn saves:** save only the messages that changed, so the journal is one turn, not the whole thread, and can't overflow `localStorage`.
3. **Per-tab journals:** coordinate them with Web Locks, so a tab only replays its own journal or a dead tab's.
4. **Pruning:** trim the journal as each save lands, so a crash can't replay stale data over newer data.
5. **Purge:** skip replay after a database purge, and show a notice.
6. **Test fix:** fix the unit test that couldn't fail.

When those land, `km-qa-engineer` adds an e2e test that holds saves pending, so it reliably fails without the journal. It also covers the remaining partial scenarios. Then the product owner recounts, the full gate and cross-model review run, and the change archives and merges.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-25T16:29:52.733406Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
