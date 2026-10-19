## Why

Part of the phase `site-ci-gates-and-chat-polish` (change 5; added at execute time on the operator's instruction "Yes. Fix it."). The flake investigation in `app-reset-notice-polish` found, and `evidence/2026-10-19/first-send-order-diagnosis.md` confirmed and reproduced deterministically, a persistence bug: on a thread route whose id the registry does not know yet, the thread is registered by an effect in `src/features/chat/use-chat-runtime.ts` that returns early until the registry is `hydrated`, while `persistMessages` in `src/stores/chat-message-store.ts` enqueues `upsertMessage` for every complete message without checking the registry. The write queue is strictly ordered, so a send that lands before hydration writes the message first and violates `messages_thread_id_fkey`. The visitor sees the reply and a "couldn't save" toast; the thread stays hidden in the sidebar; a reload before a second turn loses the first exchange; and `afterStreamComplete`'s `markPersisted`, `touch` and `setTitle` do nothing, so the title "New conversation" is never replaced.

Reachability (measured): safe paths register the thread before sending (the landing composer, the sidebar "New thread", the threads page). The unsafe paths are a typed, bookmarked or shared `/threads/<id>` URL and a reload after the saved-chats-reset notice. The gap between the composer being usable and hydration finishing was 100 to 500 ms on a cold start (4x and 6x CPU throttle included). A hand-typed first message rarely lands in it; a paste then Enter, autofill, voice input or automation can, and the starter prompt chips planned for the site would.

## What Changes

- In `use-chat-runtime.ts`, a send (`onNew` and the pending-prompt path) waits for the thread registry to be hydrated, then registers the thread if it is still unknown, before the stream starts. Registration then enqueues `upsertThread` ahead of the first `upsertMessage`, and `markPersisted`, `touch` and `setTitle` find the thread, so the sidebar entry and the title also work on the first exchange.
- The hydration gate stays. Registering before hydration would enqueue an ephemeral `upsertThread` for an id that may be a stored thread and overwrite it; the guard waits, it does not remove the gate.
- A failing-first test reproduces the race deterministically (delayed hydration), a second test proves a stored thread opened by URL and sent to immediately is not overwritten, and mutation checks show both fail without the guard.
- Not changed: the write queue, the database recovery, migrations, the journal, or any other persistence path. No new visitor-facing string.
- Tasks: see `tasks.md`.

## Impact

- Deploy: a merged client change deploys `knowme-web` with no approval stop. This touches persistence code with no independent reviewer (the adversarial review is skipped on the operator's standing instruction); the evidence is a failing-first test, mutation checks, the persistence end-to-end specs and the reset-notice repeat runs.
- Risk: a send waits for hydration, at most the 100 to 500 ms gap measured. If the hydration read fails, the existing hook flips `hydrated` with an empty list (existing behaviour); a stored thread would then look unknown. This change does not alter that path and must not make it worse; the tests cover what a failed read does.
- Constraints: Node 24.21.0; the product-naming guard allows only the exact identifier `CharcoalDb`; the full CI Verify sequence is run before the pull request is opened.
