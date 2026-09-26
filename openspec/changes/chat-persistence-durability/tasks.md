## 1. Ordered, observable writes

- [x] 1.1 (owner: km-frontend-engineer) Add the app-wide serial write queue and route every local write through it (design decisions 1, 2, 4 and 8). Write the unit tests first and see them fail before implementing.
  - **Queue.** Add `src/lib/db/write-queue.ts` with:
    - `enqueueWrite(descriptor)`, which returns that write's promise
    - `pendingWriteCount()`
    - `flush()`, which never rejects
    - a change subscription
    - one executor that maps each descriptor kind (`upsertMessage`, `deleteMessages`, `upsertThread`, `touchThread`, `deleteThread`) to the existing `CharcoalDb` methods, whose SQL does not change
  - **Message store.** In `src/stores/chat-message-store.ts`, `finishStream` and `setStreamError` enqueue from `get()` state after `set()`, never from drafts. `deleteMessagesAfter` returns its delete's promise.
  - **Thread registry.** In `src/stores/thread-registry-store.ts`, every write enqueues from post-`set()` state.
  - **Runtime.** In `src/features/chat/use-chat-runtime.ts`, `onReload` awaits `deleteMessagesAfter` before `startStream`, and still regenerates if the delete rejects.
  - **Durability check.** Confirm the PGlite 0.3.15 durability behaviour (`relaxedDurability` default) from the docs through Context7 or the upstream README. Record the source in the task note, and add a comment at `CharcoalDb.open`.

  Verify:
  - New colocated tests pass under `npx vitest run src/lib/db src/stores src/features/chat`, with a fake `CharcoalDb` that records call order and can be told to fail. They cover:
    - a delete enqueued before an insert applies before it, even when the delete's fake call is slower
    - an `upsertThread` enqueued before an `upsertMessage` applies first
    - a rejected write does not stop later writes
    - `flush()` resolves after all prior writes settle and resolves when one failed
    - `pendingWriteCount()` goes to 0 after `flush()`
    - `finishStream` then `flush()` completes without a revoked-proxy error and hands the fake plain objects
    - `onReload` calls `startStream` only after the delete settles
  - `grep -nE "\.catch\(console\.error\)" src/stores/chat-message-store.ts src/stores/thread-registry-store.ts` returns nothing.
  - `npm run typecheck` and `npm run lint` exit 0.

- [x] 1.2 (owner: km-frontend-engineer) Add the page-exit journal, the replay on open, the save-state attribute and the failure notice (design decisions 3, 5 and 6).
  - **Journal.** On `pagehide`, and on `visibilitychange` to `hidden`, when writes are pending, synchronously write the unsettled descriptors, in order, to one versioned `localStorage` key. Clear the key when the queue drains.
  - **Replay.** Replay the key in order through the same executor inside `CharcoalDb.open`/`DbProvider`, after migrations and before `ready: true`. Skip and log a failing descriptor, discard an unknown key version, and remove the key when done.
  - **Save state.** Render `data-persistence="saving|saved|failed"` on the thread view root, derived from the queue.
  - **Notice.** On a write or replay failure, show one sonner toast with a stable id and the exact spec text: "Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload." Log the raw error to the console only.

  Verify:
  - New unit tests pass under `npx vitest run src/lib/db src/features/chat`. They cover:
    - dispatching `pagehide` with two pending writes stores both descriptors in order
    - a drained queue removes the key
    - replay applies descriptors in order and replaying an already-applied suffix leaves the fake store unchanged
    - one failing replay descriptor is skipped, the rest apply, and a single notice is raised
    - an unknown key version is discarded
    - the attribute reads `saving`, then `saved`, and reads `failed` after a failure until a later success
    - three failures in one burst produce one toast, and the toast has no raw error text
  - `npm run typecheck`, `npm run lint` and `npm test` exit 0.
  - `grep -rnE "window\.__|import\.meta\.env\.(MODE|DEV)" src/lib/db src/stores src/features/chat` shows no test-only hook added by this task.

## 2. Reload survival in the real browser

- [x] 2.1 (owner: km-qa-engineer) Restore and add reload-survival e2e coverage against the real PGlite/IndexedDB path, with no fixed waits and no retries.
  - **Restore.** In `e2e/chat-surfaces.spec.ts`, the retry/regenerate test (currently around line 788) gets its reload assertions back, and the §6.15 "no reload assertion" comment goes. After Try again, `page.reload()` runs immediately after the retried reply is visible, then the test asserts 1 user message, 1 assistant message, the retried text, and no error text. The same check runs after Regenerate, asserting the regenerated text and no replaced text. Restore the "both survive a reload" title.
  - **New test.** Add a reload-immediately-after-reply test in `e2e/chat-persistence.spec.ts` (new): send, wait for the reply text only, `page.reload()`, then assert one user message, one reply and the same text. Also assert that `[data-persistence]` reads `saved` once the thread has settled after the reload.

  Verify:
  - `npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts` passes.
  - `npx playwright test e2e/chat-surfaces.spec.ts e2e/chat-persistence.spec.ts -g "reload" --repeat-each 20 --workers=1` passes 20/20 for each test.
  - `npx playwright test e2e/chat-surfaces.spec.ts -g "retry replaces the failed turn" --repeat-each 10 --workers=1 --trace on` passes 10/10. That is the condition that failed 10/10 in `docs/qa/chat-surfaces-flat2.md` §6.15.
  - Record each command and its output in `docs/qa/chat-persistence-durability.md`. If a test passes on `main` without the fix, say so in the note.

## 3. Verification

- [x] 3.1 (owner: km-qa-engineer) Run the full gate: `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`, then `npm run test:a11y`. Also check the failure notice by hand: force one write failure in a dev session, for example with a temporary throwing executor that is reverted afterwards and recorded, and confirm the toast text, that focus stays in the composer, and that the thread stays usable. Record the commands, outputs, the axe result for the thread region and the notice check in `docs/qa/chat-persistence-durability.md`.

  Verify:
  - all commands exit 0
  - axe reports no new violations in the thread region in either theme compared with the chat-surfaces-flat2 baseline
  - any unmet criterion is recorded as unmet, not waived

- [x] 3.2 (owner: km-product-owner) Write `openspec/changes/chat-persistence-durability/verification.md` from the QA evidence. It maps every scenario in `specs/chat-persistence/spec.md` to its evidence (unit test name, e2e test name and run count, or a manual check), and lists every unmet criterion and the residual MAY-be-lost cases. Then run an independent review with the `artifact-critic` subagent or `adversarial-review --mode diff`, and record its findings in the same file.

  Verify:
  - every scenario has evidence or is marked unmet
  - the review reports no CRITICAL findings, or they are fixed and re-reviewed before archive
  - `openspec validate chat-persistence-durability --strict` passes
