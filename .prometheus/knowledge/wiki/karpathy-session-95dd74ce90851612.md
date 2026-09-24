---
type: SessionRecord
id: karpathy-session-95dd74ce90851612
title: Karpathy session 95dd74ce9085
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-24T09:49:04.756725+00:00
created_at: 2026-09-24T09:49:04.756725+00:00
updated_at: 2026-09-24T09:49:04.756725+00:00
revision: 0
---

## Delta

`assistant-ui-latest` is merged into `main`, and KBD now shows 5 of 12 changes done. The cross-model review passed on the first round with no findings. All checks pass:
- build and typecheck;
- lint: 0 errors, 2 old warnings;
- 59 unit tests;
- 129 e2e tests.

**What changed:**
- **Packages:** `@assistant-ui/react` is at 0.15.21, `react-markdown` at 0.14.16 and `react-devtools` at 1.2.20, all pinned. The official upgrade codemods changed nothing. The only break was one removed export, which was just a dead placeholder.
- **Chat thread:** it no longer uses the deprecated APIs. Messages and message parts now go through explicit render functions, and the KnowMe blocks are chosen by a plain switch.
- **Attachment and tooltip buttons:** these now come from assistant-ui's Base UI component registry. The attachment tile is now a proper button (focusable, `role="button"`), which resolves the warning carried over from the last change.

**Bugs fixed:**
1. **Dropped chat blocks:** skill activation, context updates, memory recall, tool calls, citations and artifacts were thrown away if they arrived before the first text. Now the first event of any kind creates the reply. Tests prove the order is kept, and the e2e fixture sends events in the realistic order again.
2. **Code blocks never highlighted:** the code renderer looked for the language in the wrong place, so every block showed as plain "text" and fenced mermaid never drew a diagram. TypeScript is now highlighted and mermaid renders.
3. **Registry ahead of npm:** the registry's attachment component uses a field (`message.submission`) that the latest published assistant-ui doesn't have, so I dropped that one clause.

**Now covered by tests:** a streamed reply shows every block type, including ones sent before the first text. Reloading the page restores the conversation from local storage without sending any chat request.

**Still worth knowing:**
- **Radix:** it can't be fully removed. assistant-ui 0.15 itself depends on the `radix-ui` package, so it stays as an indirect dependency. None of the app's own components use it.
- **Attachments:** they're still unreachable in the running app, because no attachment adapter is configured. If you want file uploads, that's a small follow-up.
- **Devtools:** `react-devtools` is installed but not wired in anywhere.
- **The shadcn CLI:** it caused trouble again. It installed the stray `cn` package, rewrote imports in four existing components, and tried to use bun because of the stale `bun.lockb`. I reverted all of it. I'd recommend deleting `bun.lockb`, since the project builds with npm.
- **`docs/xhtml-docs/`:** still uncommitted.

The infrastructure changes are finished. Next is the rebrand itself, starting with `knowme-brand-tokens`: the KnowMe colours, surface levels, cyan accent, type scale and motion, with the contrast-safe colour variants. Start it with `/kbd-apply knowme-brand-tokens`.

Completed kbd-apply — assistant-ui-latest (7/7 tasks, verified + archived)

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-24T09:44:39.575791Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- docs/xhtml-docs/
