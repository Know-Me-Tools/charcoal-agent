# chat-persistence-durability

Make local chat persistence durable across reloads. Operator decision, 2026-09-25: this is the change after chat-surfaces-flat2.

Known problem (found in chat-surfaces-flat2, `docs/qa/chat-surfaces-flat2.md` §6.15, pre-existing on `main`):
- `persistMessages` and `deleteMessagesAfter` in `src/stores/chat-message-store.ts` write to PGlite fire-and-forget (`.catch(console.error)`, never awaited).
- `onReload` in `src/features/chat/use-chat-runtime.ts` does not await the delete.
- The app has no `pagehide` or `beforeunload` flush.
- Result: a reload shortly after a reply, retry or regenerate can lose messages or show stale ones.

Expected scope:
- awaited or tracked writes with an observable completion;
- a flush on `pagehide`;
- restore the reload-survival assertions removed from `e2e/chat-surfaces.spec.ts` (retry/regenerate) and add a reload-immediately-after-reply e2e test;
- a store and db unit test for ordering.

Owners: km-frontend-engineer (store and runtime), km-qa-engineer (e2e), km-rust-engineer consulted on the persistence contract.
