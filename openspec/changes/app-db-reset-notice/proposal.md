## Why

Part of the phase `site-chat-follow-ups` (change 2 of 3). When PGlite throws a "bundle size" error on open, `DbProvider` deletes the whole local database and reopens (`src/lib/db/db-provider.tsx:86-91`). A visitor with saved chats loses them. The only trace is `console.warn`; the failure toast fires only if this tab had a pending journal entry (`persistence-journal.ts:634`, `if (!raw) return;`). The wipe is the right recovery, because the database is already unreadable when the error is thrown. The gap is that it is silent (assessment gap G-2).

## What Changes

- After a purge-and-reopen succeeds, the visitor sees one plain line once, saying their saved chats on this device were reset.
- No change to the recovery itself, and nothing is exported or copied before the wipe.
- New visitor-facing string: needs a content-officer pre-review and a review record in `docs/content/reviews/`; the operator approves it by merging.
- Tasks: see `tasks.md`.

## Impact

- Deploy: a merged client change deploys `knowme-web` to production with no approval stop.
- Constraints: do not edit old migrations; do not add a new retry or fallback (the retry-once path already exists); never touch the kill switch.
- Risk accepted in the plan: the notice does not bring the chats back.
- Evidence: one integration gate at the end of the change; a mutation check that the notice test fails when the notice is removed.
