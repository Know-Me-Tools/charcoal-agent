---
type: SessionRecord
id: karpathy-session-209ddc86e785196b
title: Karpathy session 209ddc86e785
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-25T11:10:30.409245+00:00
created_at: 2026-09-25T11:10:30.409245+00:00
updated_at: 2026-09-25T11:10:30.409245+00:00
revision: 0
---

## Delta

Both critical findings from the independent review are fixed and committed as `3c24255`, after 242 of 242 unit tests passed and typecheck and lint came back clean.
- **Retry:** "Try again" and "Regenerate" now replace the failed or old reply, in the store and in the database, instead of duplicating messages.
- **HTML sandbox:** model-written HTML now runs sandboxed with scripts only, so it can't reach the app's stored threads or credentials. "Open in new tab" is gone.
- **Accessibility:** the composer has a visible keyboard focus outline, and A2UI status changes are announced to screen readers.

`km-qa-engineer` is adding real-browser checks:
- message counts after a retry, after a regenerate, and after a page reload;
- the iframe sandbox attribute and the single close control;
- a corrected composer-focus test, since the old one asserted the invisible-focus behaviour.

A stale git lock appeared a fourth time with no git process behind it. The naming-test fix clearly wasn't the only source. I removed it and logged it in `.prometheus/gotchas.md` with safe handling steps. After QA reports, I'll run the final gate, add the review record to `verification.md`, and run the cross-model judge, then archive and merge.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-25T11:08:43.865517Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
