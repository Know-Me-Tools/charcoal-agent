## Context

See proposal.md (Why) and `specs/chat-persistence/spec.md`. Current write paths, read directly:

- **Message store.** `src/stores/chat-message-store.ts`:
  - `persistMessages` is called inside the immer `set()` producer by `finishStream` and `setStreamError`. It upserts every non-in-progress message with `db.insertMessage(...).catch(console.error)`.
  - `deleteMessagesAfter` calls `db.deleteMessages(...).catch(console.error)` after `set()`.
  - Neither returns anything a caller can await.
- **Thread registry.** `src/stores/thread-registry-store.ts`: `registerThread`, `markPersisted`, `setTitle`, `touch` and `removeThread` each call `tryDb()?.<write>(...).catch(console.error)` inside the producer.
- **Retry and Regenerate.** `onReload` in `src/features/chat/use-chat-runtime.ts` calls `deleteMessagesAfter` (void), then `await startStream(..., { skipUserMessage: true })`.
- **Stream completion order.** `finishStream` (the message upserts) runs before `onComplete`, and `onComplete` then calls `markPersisted`, `touch` and `setTitle`. The thread row is first written by `registerThread` when the thread page mounts. `messages.thread_id REFERENCES threads(id)` (migration v1), so a message insert that reaches PGlite before its thread row fails the foreign key.
- **PGlite.** 0.3.15, `idb://charcoal-db`. `CharcoalDb.open` does not set `relaxedDurability`. The bundled dist wraps queries in a mutex (`runExclusive`) and calls `syncToFs` after a query. This is read from `node_modules`, not tested. The design does not depend on it. Task 1.1 confirms it against the 0.3.15 docs.
- **Hydration.** `use-chat-messages.ts` reads `db.getMessages` on thread mount. `use-db-hydration.ts` reads threads after `DbProvider` is ready. `DbProvider` renders children only once `CharcoalDb.open` resolves.
- **Evidence.** §6.15 of `docs/qa/chat-surfaces-flat2.md` shows reload outcomes of zero assistant rows or the stale pre-regenerate row. Both fit writes that had not reached IndexedDB when the page tore down. Out-of-order execution inside PGlite is not needed to explain them.

## Goals / Non-Goals

**Goals:**
- One awaitable, ordered path for every local write to threads and messages.
- A reload started by the user right after a reply, Try again or Regenerate shows the final state.
- Write failures reach the user and the save-state attribute, not only the console.

**Non-Goals:**
- Saving in-progress (streaming) messages, or making the optimistic user message durable before its reply finishes. A mid-stream reload still loses that turn locally, as today.
- Multi-tab coordination of the local database.
- Automatic retry of failed writes.
- A Tauri-side quit hook.
- Changing what is saved: the upsert-all-complete-messages behaviour and the row shapes stay the same.
- Any schema change.

## Decisions

### 1. One app-wide serial write queue in `src/lib/db/`, not per-thread queues and not await-at-call-sites

A new module (for example `src/lib/db/write-queue.ts`) owns a single promise chain. Stores call `enqueueWrite(op)` and get back a promise for that write. The module also exposes `pendingWriteCount()`, `flush()` (resolves when everything enqueued so far has settled, and never rejects) and a subscription for state changes.

- **Why one queue and not one per thread.**
  - The foreign key needs the thread row, which the registry store writes, ahead of message rows, which the message store writes. A per-thread queue inside the message store cannot order across the two stores.
  - PGlite is a single connection, so per-thread parallelism gains nothing.
  - One queue gives one `flush()` for `pagehide` and one pending count for the save state.
- **Why not await at call sites.** The writes start in `finishStream`/`setStreamError`, which are store actions called from the stream loop, and in registry actions called from effects and callbacks. Awaiting there would change store action signatures across many callers. It would still not order writes started from different callers, and it would give no single point for the journal or the pending count.
- **Failure isolation.** Each link catches its own rejection. The chain continues, the rejection goes to the enqueuer's promise, and the queue records a failure event. `flush()` never rejects.
- **Rejected: debouncing or coalescing writes.** It would widen the window that the journal must cover, and nothing measured shows write volume is a problem.

### 2. Writes are data, built from committed state, never from immer drafts

A queued write is a plain, serialisable descriptor, for example:

- `{ kind: "upsertMessage", threadId, message }`
- `{ kind: "deleteMessages", threadId, ids }`
- `{ kind: "upsertThread", thread }`
- `{ kind: "touchThread", id }`
- `{ kind: "deleteThread", id }`

One executor maps each descriptor to the existing `CharcoalDb` method. Two reasons:

- **Drafts.** Today `persistMessages` receives immer draft objects inside the producer. That only works because `insertMessage` serialises its arguments synchronously. A queued closure runs after the producer returns, when the drafts are revoked. Descriptors must be built *after* `set()` from `get()` state, which immer freezes into plain objects. The same applies to the registry store actions.
- **Journal.** The journal (decision 5) must write pending work to `localStorage`, and closures cannot be serialised.

`CharcoalDb` methods and SQL stay unchanged. Every existing write is idempotent: upsert `ON CONFLICT`, delete by id, touch, and delete of a thread. Replay (decision 5) depends on that.

### 3. Completion is observed through the queue API and one DOM attribute, with no test-only globals

- **Code.** Code reads completion from the promise returned by `enqueueWrite`, from `flush()` and from `pendingWriteCount()`. Unit tests import these directly.
- **UI.** A small persistence-status store, or a `useSyncExternalStore` hook over the queue subscription, derives `saving | saved | failed`. The thread view root renders it as `data-persistence="saving|saved|failed"`. This is real product state, the same in production and in tests. E2e tests read it with `toHaveAttribute`. There is no `window.__...` hook and no build-mode branch.
- **Rejected: a `window` hook gated on `import.meta.env.MODE`.** The e2e server is `vite` dev, so the gate would also be live in `npm run dev`. That is a test-only global in a shipped path either way.

### 4. `onReload` awaits its delete before re-streaming

`deleteMessagesAfter` returns the promise of its enqueued delete, or a resolved promise when nothing was removed, and `onReload` awaits it before `startStream`.

- **Ordering does not need the await.** The queue already puts the delete ahead of the replacement's upserts.
- **Why await anyway.** It makes a failed delete known before the replacement is written. On failure, `onReload` still regenerates, because the user asked for it and the screen is already correct, and the failure notice shows. The stale row can then resurrect on reload, which is exactly what the notice text warns of.
- **Cost.** The added latency is one local delete.
- **Rejected: aborting the regenerate on a failed delete.** It blocks the user over a local-cache problem that the notice already discloses.

### 5. Page exit: a synchronous journal in `localStorage`, replayed before hydration

**The limit.** Neither `pagehide` nor `visibilitychange` can hold the page open for an async IndexedDB write. `beforeunload` can only raise the browser's leave-page prompt. The only synchronous durable store available at unload is `localStorage`.

**Journal.**
- On `pagehide`, and on `visibilitychange` to `hidden` (the last reliable signal on mobile browsers), if `pendingWriteCount() > 0`, the queue writes the descriptors of all unsettled writes to one key with `localStorage.setItem`, in enqueue order. The key is versioned, for example `knowme-pending-writes-v1`.
- The queue removes the key when it drains to zero pending writes. That covers a page that was hidden and then came back, including a bfcache restore.

**Replay.**
- `CharcoalDb.open`, or `DbProvider` just after it, reads the key after migrations and before `ready: true`.
- Each descriptor runs in order through the same executor, and the key is removed.
- A descriptor that fails is logged and skipped, replay continues, and the app shows the failure notice once after it becomes ready.
- An unknown key version is discarded.

**Why replay is correct.**
- The queue is serial, so the unsettled writes are always a suffix of the enqueue order.
- Replaying that suffix in order over any prefix of it that already committed produces the same final state, because every write is idempotent and PGlite applies each statement atomically.
- Replay runs before `use-db-hydration` and `use-chat-messages` read, so the first read already sees the result.

**Rejected alternatives.**
- **A `beforeunload` prompt while writes are pending.** It interrupts every quick reload for a window usually under 100 ms, and Playwright's reload handling of the prompt would make the e2e tests brittle.
- **`flush()` alone on `pagehide`.** It starts nothing new, because writes start on enqueue, and it cannot wait. On its own it would guarantee nothing, and the spec would be dishonest.
- **Persisting the in-memory store to `localStorage` on every change.** That makes it a second source of truth, with size and conflict problems.

**Honest residual.**
- No `pagehide`/`hidden` event (crash, killed process, some WebView quits) means the pending writes are lost.
- A `setItem` failure at unload, from the quota or storage being disabled, cannot be reported, because the page is going away. It is logged and lost.
- These are the MAY-be-lost cases in the spec.

### 6. Failure notice: one polite toast per burst, plus the `failed` save state

- **Channel.** The notice uses the existing `Toaster` (`src/components/ui/sonner.tsx`, mounted in `App.tsx`), whose region is announced politely and does not take focus.
- **Text.** "Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload."
- **One per burst.** A stable toast id means a burst of failures updates one notice instead of stacking.
- **Logging.** The raw error goes to `console.error` with the descriptor kind and thread id, for diagnosis.
- **State.** `data-persistence` reads `failed` until a later write succeeds.
- **No automatic retry.** Transient message-insert failures already heal on the next finished turn, because `finishStream` re-upserts every complete message in the thread. Failed deletes do not heal, and the notice covers them.
- **Copy review.** km-chief-content-officer may refine the wording in a follow-up. The spec fixes the current text.

### 7. No schema change

Nothing here needs new columns or tables. The journal lives outside PGlite. If a later change needs a schema change, it goes in a new `MIGRATIONS` entry, per `.claude/rules/persistence.md`. km-rust-engineer was consulted in the change README on the persistence contract. The contract is browser-local and UAR is not involved, so the design has no backend impact.

### 8. PGlite durability assumption is pinned, not assumed

The design treats "a `CharcoalDb` write promise resolved" as "the write is in IndexedDB". That holds only while `relaxedDurability` is off. Task 1.1 confirms this against the PGlite 0.3.15 docs through Context7 or the upstream README, records the finding, and adds a code comment at `CharcoalDb.open` stating the dependency. If the docs say otherwise, the task stops and the design is revised.

## Risks / Trade-offs

- **[Large artifact content exceeds the `localStorage` quota at unload]** → the journal write fails silently at unload. Pending writes are usually one finished turn. The loss is logged, and the spec names it as a MAY-be-lost case.
- **[Head-of-line blocking: a slow write delays later ones]** → PGlite already serialises queries, so no parallelism is lost. The pending state is visible through `data-persistence`.
- **[Replay re-applies an older `upsertThread` over a newer title]** → not possible for a single tab. The journal holds only the unsettled suffix, so nothing newer from that tab exists. Several tabs are a non-goal.
- **[Replay sets `updated_at` to the replay time for `touchThread`]** → the thread sorts as recently updated. That is acceptable, because the user was just in it.
- **[Descriptors built from pre-commit state leak drafts]** → decision 2 requires building descriptors from `get()` after `set()`. A unit test enqueues from `finishStream` and awaits `flush()` with a real object graph. A revoked-proxy `TypeError` would fail it.
- **[Tests pass by timing, not by the fix]** → the e2e tests reload with no wait. QA also runs them under `--trace on --repeat-each 10`, the condition that failed 10/10 in §6.15.
- **[jsdom has no IndexedDB]** → unit tests use a fake `CharcoalDb`. The real PGlite and IndexedDB path is exercised only by the Playwright tests, and those are the completion evidence.

## Migration Plan

No data migration. The code ships in one change. Rollback is a revert. A leftover journal key from a reverted build is ignored by the old code (harmless), and a newer build discards an unknown key version.


## Operator decision (2026-09-25)

Decision 5, the `localStorage` page-exit journal with replay on open, was approved by the operator over the smaller queue-only option.

## Operator decision (2026-09-26): making dead-tab replay safe

**Found by:** the independent review of task 3.2. Replaying a journal left behind by another, dead tab can re-insert a thread the user has since deleted, because `upsertThread` is `INSERT … ON CONFLICT DO UPDATE` and `deleteThread` is a hard delete. It can also overwrite a newer title with an older one. The single-tab argument in Risks does not cover the per-tab journals added in d51be31.

**Decision: scrub on delete, and newer wins.**
- Deleting a thread (`deleteThread`, `deleteThreadMessages`) synchronously removes that thread's descriptors from every `knowme-pending-writes-v1:*` key in localStorage, this tab's and other tabs'. A key left with no descriptors is removed.
- When another tab's journal is replayed, an `upsertThread` applies only if its `updatedAt` is not older than the stored row's `updated_at`. `touchThread` follows the same rule. Descriptors for a thread that no longer exists are skipped and logged, not reported as a save failure.
- This tab's own journal still replays unconditionally, as the single-tab ordering argument covers it.

**Rejected:** replaying only this tab's own journal. It would lose saves pending when a tab closes, which the spec says apply on the next start. Also rejected: age-bounded replay, which still brings back a thread deleted inside the window.

**Accepted residual:** a live second tab that still holds a deleted thread in memory can write it back through its own next save. Live multi-tab editing is outside this change's scope, as before.

## Amendment (2026-09-26): only changed messages are re-persisted per turn

Found in review: `chat-message-store.ts`'s `persistMessages` enqueues a write only for messages not already known to be durably saved this session (`persistedMessageIds`), rather than re-upserting every complete message in the thread on every `finishStream`/`setStreamError`, as the original Non-Goals wording ("the upsert-all-complete-messages behaviour ... stay[s] the same") implied. Trade-off: a message untouched since an earlier turn is not re-upserted, which keeps the page-exit journal (decision 5) small — its pending set only ever holds what actually changed, not the whole thread history. A message mutated after it was already marked persisted (`updateToolCall`, for a tool result that arrives after `finishStream` already saved that message) is unmarked and re-enqueued at the point of that mutation, so the guard does not hide a genuine later change.

## Correction (2026-09-26) to the operator decision on dead-tab replay

The decision said "descriptors for a thread that no longer exists are skipped". Taken literally, that also skips the `upsertThread` which *creates* a new thread that a dead tab never managed to save, so the new thread and all its messages were lost. The cross-model review round 2 found this. The rule as implemented now:
- An `upsertThread` for a missing row is a creation, and applies. What stops a deleted thread coming back is the scrub on delete, not a missing-row check.
- Other descriptors for a thread that neither exists nor was created earlier in the same journal are skipped and logged.
- `touchThread` descriptors carry `at`, the time of the touch. A foreign touch applies only if `at` is not older than the stored `updated_at`. A foreign touch with no `at` is skipped, since it only reorders the list.

Tests on real PGlite: "restores a new thread, and its messages, that a dead tab created but never saved", and "does not let a dead tab's older touch move a thread saved more recently". Each fails when its fix is reverted.
