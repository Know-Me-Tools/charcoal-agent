## Why

Part of the phase `site-chat-follow-ups` (change 1 of 3). The export drops two kinds of content the visitor saw, with no mark in the file: artifacts outside `code, html, svg, mermaid, markdown` (form, confirm and display cards) and images that are not own-host or same-origin (`src/features/export/okf-blocks.ts`, `artifactMarkdown` and `imageMarkdown` return `null`). A visitor who exports a chat gets a file that looks complete and is not.

The reasoning, evidence and ordering are in `.kbd-orchestrator/phases/site-chat-follow-ups/assessment.md` (gap G-1) and `plan.md`.

## What Changes

- The exported conversation ends with one plain line when a block the visitor saw was dropped. The line names the kinds of content left out and never quotes any of it.
- Block types that are hidden by design (reasoning, tool calls, steps, memory and context events) never trigger the line.
- New visitor-facing string: needs a content-officer pre-review and a review record in `docs/content/reviews/`; the operator approves it by merging.
- Tasks: see `tasks.md`.

## Impact

- Deploy: a merged client change deploys `knowme-web` to production with no approval stop.
- Constraints: the export stays client-side with no network request (the privacy proof must stay green); no internal id, thread id or URL token in the file; never touch the kill switch.
- Evidence: one integration gate at the end of the change (no per-edit tests); a mutation check for the detection and for the no-leak assertion.
