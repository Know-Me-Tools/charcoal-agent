---
type: SessionRecord
id: karpathy-session-3523d0925787735a
title: Karpathy session 3523d0925787
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-23T23:37:34.210704+00:00
created_at: 2026-09-23T23:37:34.210704+00:00
updated_at: 2026-09-23T23:37:34.210704+00:00
revision: 0
---

## Delta

`visual-verification-harness` is done and merged into `main`. KBD now shows 2 of 12 complete. Build, typecheck, lint (0 errors), unit tests (15) and the new browser suite (122 tests, about 2 minutes, no backend needed) all pass, and GPT-5.5's review of the whole branch ended in a pass.

**What you can now run:**

| Command | What it does |
|---|---|
| `npm run test:e2e` | Everything below, in one run |
| `npm run test:visual` | 96 screenshots: 12 routes × 320/768/1024/1440 px × dark/light, saved to `test-results/screenshots/` |
| `npm run test:a11y` | Accessibility (WCAG AA) scans of every route in both themes, merged into `test-results/a11y-report.json`. Violations are reported but don't fail; `AXE_STRICT=1` makes them fail, which the final audit will turn on. |

- **Fake backend:** the browser gets fixture agents, providers, skills, settings and a scripted chat stream. The data is typed against the app's own types, and that already caught one bad fixture value. Any backend call without a fixture fails the test.
- **Chat capture:** the thread screenshot is built by typing into the real composer. It then waits for every block type (reasoning, skill, context, memory, tool call, citation, artifacts, A2UI input and display, maths, code) before capturing. The clock is frozen so timestamps don't change between runs.

**Existing app bugs it found.** I didn't change app code in this change; each is now listed under the later change that should fix it in `plan.md`:
- **Streamed blocks lost (correctness):** if a skill activation, context update, memory recall or tool call arrives before the first text, the chat store silently drops it. The runtime plausibly sends skill activation first. The fixture sends a thinking delta first so everything renders, and the fix is assigned to `assistant-ui-latest`.
- **Tablet layout broken (high):** at 768px both side panels stay open and the conversation shrinks to about 150px, wrapping a word or even a letter per line.
- **320px problems:**
  - the skills page overflows sideways, clipping the cards and the Sync button;
  - the context-update block overflows;
  - tool names are cut off.
- **Chat block issues:**
  - the light-theme user bubble is unreadable;
  - the A2UI input shows "Response captured" before anything is submitted;
  - mermaid diagrams show as source text.
- **Accessibility baseline:**
  - colour contrast fails on 14 of 24 scans (74 elements);
  - the landing page has one unnamed button;
  - the skills page has nested interactive controls.

**Review history:** there were three rounds. Round 1 raised three things:
- the settings fixture was untyped (fixed);
- a report of the A2UI block showing raw JSON, which turned out to be how that renderer works by design, so no change;
- old accessibility results could leak into a new report (fixed).

Round 2 found that the thread screenshot could be taken before the last blocks finished rendering. I fixed that, plus a cleanup command that wouldn't run on Windows. Round 3 passed, and I also fixed its last portability warning.

To review the same packet as before, it's now built from the whole branch, deletions included. I put that into a script so later changes reuse it.

The next change is `entity-graph-data-layer`: replacing TanStack Query with the Prometheus entity graph, in 50 places. `/kbd-apply entity-graph-data-layer` starts it.

`docs/xhtml-docs/` is still uncommitted.

Completed kbd-apply — visual-verification-harness (9/9 tasks, verified + archived)

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-23T23:37:32.863808Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- docs/xhtml-docs/
