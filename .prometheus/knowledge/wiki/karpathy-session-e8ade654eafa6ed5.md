---
type: SessionRecord
id: karpathy-session-e8ade654eafa6ed5
title: Karpathy session e8ade654eafa
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-25T10:56:36.871919+00:00
created_at: 2026-09-25T10:56:36.871919+00:00
updated_at: 2026-09-25T10:56:36.871919+00:00
revision: 0
---

## Delta

The independent review found two CRITICAL defects:
1. **Retry duplicates messages permanently.** "Try again", and "Regenerate", which our fix also switched on, re-append the user message and keep the old reply. PGlite stores the duplicates for good. This was introduced on this branch.
2. **Model-written HTML runs in the app's own origin.** It could read every stored thread and call UAR as the app. This predates the branch, but the branch copied it into the new full-screen view.

`km-frontend-engineer` is fixing both, test first:
- **Retry:** drop everything after the retried message from the store and the database, and re-stream without re-appending the user message.
- **HTML sandbox:** allow scripts only, remove "Open in new tab", and stop running the inline preview while full screen is open.

It's also fixing the invisible composer focus, the A2UI status announcements, the duplicate close button, a comment that didn't match the code, and a leaky test mock.

Logged as follow-ups rather than fixed here:
- **Unsanitised markdown (`rehypeRaw`):** a broader XSS surface that predates this branch. It should become its own change owned by the security officer.
- **A2UI responses lost after reload:** "Response captured" disappears when the card remounts, allowing a double submit.
- **Error copy:** "The reply stopped before it finished." is also shown when no reply ever started.
- **Guard gaps:** the Flat 2.0 guard misses rem-sized text, 3- and 8-digit hex, and inline styles.

When the fixes land, QA adds tests that count messages after a retry and check the iframe sandbox, then the full gate and review round 2 run.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-25T10:46:15.406548Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
