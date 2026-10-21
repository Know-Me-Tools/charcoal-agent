## Why

Part of the phase `site-ci-gates-and-chat-polish` (change 6; added at execute time on the operator's instruction: "Be sure to add in a button that allows the user to go straight to the chat view if there is history available from the home page.").

Today a returning visitor who has saved conversations in this browser sees, on the site front page, only a small header link "Your conversations" (`content/site/history-link.ts`, shown by `useHasSavedChats` when the browser holds at least one saved conversation) that goes to the conversation **list** (`/threads`). There is nothing on the page itself that takes them back into the chat they were in. The hero's only call to action starts a new conversation.

## What Changes

- On the site build's front page, when this browser holds at least one saved (non-ephemeral) conversation, a button in the hero next to the composer takes the visitor **straight to their most recent conversation** (`/threads/<id>` of `getLatestPersisted()`), not to the list. It is absent when there is no saved conversation and while the saved conversations have not been read yet. Its appearance causes no meaningful layout shift (measured, under 0.1); a place that already has a fixed-height row, such as the composer's action row, is preferred over pushing content down.
- Interpretation recorded: "the chat view" is read as the most recent conversation. The existing header link to the list stays. If the operator meant the list, it is a one-line change.
- One new visitor-facing string (the button label), drafted in `content/site/`, with a content-officer pre-review and a review record; it is approved by the operator's merge.
- The review record that was never written for the existing "Your conversations" link (its strings file still says "DRAFT, pending operator approval"; it shipped in `f1285e1` on 2026-10-15) is written in this change, stating what is provable from history and that its approval is by merge of the pull request that introduced it.
- Not changed: the app build's landing page (it has its own "Open app" link), the header link, how saved chats are read, the thread page.
- Tasks: see `tasks.md`.

## Impact

- Deploy: a merged client change deploys `knowme-web` with no approval stop.
- Constraints: Flat 2.0 (no borders, shadows or gradients), KnowMe tokens only, 44 px minimum target, CLS under 0.1, works at 320 px and 1440 px in both themes; the product-naming guard; the full CI Verify sequence runs before the pull request is opened; no new network request and no new storage.
- Evidence: unit tests for the visibility rules; a built-app end-to-end that saves a chat, returns to `/`, sees the button, clicks it and lands in that conversation with its messages, and the no-history case; screenshots at 320 px and 1440 px in both themes read by the builder; a layout-shift measurement; a mutation check.
