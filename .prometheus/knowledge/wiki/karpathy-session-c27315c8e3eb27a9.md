---
type: SessionRecord
id: karpathy-session-c27315c8e3eb27a9
title: Karpathy session c27315c8e3eb
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-26T19:33:49.427321+00:00
created_at: 2026-09-26T19:33:49.427321+00:00
updated_at: 2026-09-26T19:33:49.427321+00:00
revision: 0
---

## Delta

The design task (1.1) is closed and committed (`2d10073`), and the page build (tasks 2.1 and 2.2) is now running. Two of seven tasks are done.

- **Send-button hover:** fixed to meet WCAG instead of accepted. Its label reads at 5.40:1 and its fill at 3.12:1 against the composer in the light theme. A new test fails on the old colour and passes on the new one.
- **Tests:** 367/367 pass. The design doc names a colour token everywhere and contains no raw hex values.
- **Tooltip focus bug:** logged in `design.md` as a follow-up for `brand-fidelity-audit`, as I proposed. It stays out of this change.

The frontend engineer is building the landing page and the shared header and footer, then About and 404, from the design doc and your approved copy. Two things the brief calls out:
- Controls use plain elements so keyboard focus is visible.
- The page has exactly one orange button, the hero's send button.

When the build is done I'll run the gate myself. Then QA adds the guard tests, including a Tab-key check that the focus outline actually shows, and captures screenshots at every width in both themes.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-26T19:23:53.482543Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
