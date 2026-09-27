---
type: SessionRecord
id: karpathy-session-a0d9c03b689bcc97
title: Karpathy session a0d9c03b689b
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-25T13:38:49.272853+00:00
created_at: 2026-09-25T13:38:49.272853+00:00
updated_at: 2026-09-25T13:38:49.272853+00:00
revision: 0
---

## Delta

Completed kbd-apply — chat-surfaces-flat2 (9/9 tasks, verified + archived)

The chat restyle is merged into `main`, making 9 of 13 rebrand changes done. The thread, composer, every content block, artifacts, code and Mermaid now follow the Flat 2.0 brand in both themes. All 19 spec scenarios have evidence under a strict "the test covers the whole requirement" rule.

**Final checks:**

| Check | Result |
|---|---|
| Build, typecheck | pass |
| Lint | 0 errors (2 old warnings) |
| Unit tests | 259/259 |
| e2e | 185/185 |
| axe, thread | 0 violations in light and dark (down from 5 page scans / 38 problems app-wide before this change) |

**How the agent team worked:**
- **Product owner:** wrote the plan and the verification record.
- **Creative director:** wrote the design spec and made the token decisions.
- **Frontend engineer:** built each piece, test first.
- **QA engineer:** extended the guards, added 29 e2e tests, and reviewed captures and axe.

I verified every hand-off myself (re-ran tests, viewed captures) before committing.

**The reviews caught real problems, all fixed here:**
- **Retry duplicated messages permanently.** "Try again" and "Regenerate" re-added the question and kept the old reply, and stored both. This was introduced on this branch.
- **Model-written HTML could reach the app's data.** The preview iframe ran in the app's own origin, so it could read every stored thread and call UAR as the app. It now runs sandboxed with scripts only.
- **Markdown rendered model HTML unsanitised.** It's now filtered through `rehype-sanitize` 6.0.0, pinned exactly.
- **Failures and errors:**
  - a request that failed before any reply showed nothing at all;
  - "Try again" was quietly disabled;
  - raw error text could appear in the thread.
- **Smaller fixes:**
  - the "Failed" tool status could never appear;
  - the Mermaid diagram rendered as source text;
  - "Response captured" appeared before any answer;
  - the light-theme user bubble was unreadable;
  - keyboard focus on the composer was nearly invisible.
- **Two bugs already on `main`, found while tracing a flaky test:** the screen-size check could miss changes, and a sheet could stay flagged open after a fast resize.

**Mistake on my side:** I committed one fix without running the unit tests, which briefly left `npm test` red. After that I gated every commit.

**Open items:**
- **Messages can vanish on a quick reload.** Local database writes aren't awaited, so reloading right after a reply can lose it or show a stale version. This predates the branch. As you chose, it's registered as `chat-persistence-durability` and is now the next change. Until then, surviving a reload is untested.
- **Weaker evidence:** two scenarios, the focused composer's fill and the code background colour, rest on weaker evidence; `verification.md` says so.
- **Follow-ups logged with owners:**
  - saving A2UI answers across reloads;
  - specific error messages instead of one generic line;
  - redacting sensitive text in failed tool results;
  - gaps in the Flat 2.0 guard;
  - thinking metadata and image actions.
- **Stale git lock:** an empty `.git/index.lock` kept reappearing, with no git process behind it, at least once as a subagent handed back. The likely source is the harness's own git refresh at hand-back. It's logged in `.prometheus/gotchas.md` with safe handling steps.

The next command is `/kbd-apply chat-persistence-durability`.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-25T13:34:22.699606Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- No changed paths detected.
