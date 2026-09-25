---
type: SessionRecord
id: karpathy-session-a26ac9897af1614f
title: Karpathy session a26ac9897af1
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-25T12:42:46.826624+00:00
created_at: 2026-09-25T12:42:46.826624+00:00
updated_at: 2026-09-25T12:42:46.826624+00:00
revision: 0
---

## Delta

The final gate on `08f024d` is fully green: 185 of 185 e2e tests, and axe finds zero violations in the thread in both themes.

Review round 3 BLOCKs on one CRITICAL: the markdown renderer inserts model-written raw HTML without sanitising it. Both independent reviewers flagged this. It predates the branch, but it's a real trust boundary on the surface this change restyled, so I'm fixing it here instead of deferring.

`km-frontend-engineer` is adding `rehype-sanitize` 6.0.0 (MIT, pinned exactly), test first. With GitHub's default schema it strips iframes, forms, styles, scripts, event handlers and `javascript:` links, and keeps math, code highlighting, Mermaid and citation markers working. After that, one more gate and review round 4, then archive and merge.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-25T12:28:56.626872Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
