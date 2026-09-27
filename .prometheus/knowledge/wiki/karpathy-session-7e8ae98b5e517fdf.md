---
type: SessionRecord
id: karpathy-session-7e8ae98b5e517fdf
title: Karpathy session 7e8ae98b5e51
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-25T12:01:12.666941+00:00
created_at: 2026-09-25T12:01:12.666941+00:00
updated_at: 2026-09-25T12:01:12.666941+00:00
revision: 0
---

## Delta

The shell hook fixes are committed as `3289b7f`, after 245 of 245 unit tests passed and typecheck came back clean. Both bugs were pre-existing on `main`:
- **Unstable subscription:** the media-query hook re-subscribed on every render and could drop viewport changes.
- **Stale sheet flag:** a sheet's "open" flag could survive a fast remount.

`km-qa-engineer` is adding the missing settle point to the flaky shell test and running it 30 times in a row. After that: the final gate, the review record in `verification.md`, cross-model review round 2, then archive and merge.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-25T12:00:44.054361Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
