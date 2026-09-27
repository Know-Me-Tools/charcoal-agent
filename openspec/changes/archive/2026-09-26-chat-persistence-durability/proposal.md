## Why

A reload shortly after a reply, a Try again or a Regenerate can lose messages or bring back the replaced ones. The defect is already on `main`. Every local save to PGlite is fire-and-forget: `.catch(console.error)`, and no caller awaits it. The affected paths are `persistMessages` and `deleteMessagesAfter` in `src/stores/chat-message-store.ts`, and every write in `src/stores/thread-registry-store.ts`. `onReload` in `src/features/chat/use-chat-runtime.ts` does not wait for its delete, and nothing flushes writes when the page is left.

`docs/qa/chat-surfaces-flat2.md` §6.15 traced both failure modes: zero assistant messages after a reload, and the pre-regenerate reply coming back. To keep the suite green, the reload-survival assertions in `e2e/chat-surfaces.spec.ts` were removed. No test currently covers this, and users have no way to know a save failed.

## What Changes

- **Ordered, observable saves.** Every local save for threads and messages goes through one ordered write path that callers can wait for. Saves apply in the order they were made, and a failed save does not stop the saves after it.
- **Retry and Regenerate wait for their delete.** The superseded turn is removed from local storage before the replacement is written, and a failed delete is known before the replacement stream starts.
- **Saves pending at page exit are kept.** When the page is hidden or unloaded while saves are still pending, those saves are recorded synchronously and applied on the next start, before any conversation is shown. The browser cannot hold the page open for IndexedDB, so this is the only guarantee available. What it cannot cover is stated in the spec.
- **Save failures are visible.** A failed save shows a quiet, non-blocking notice in plain language. The conversation also exposes a machine-readable save state (saving, saved, failed) that tests and assistive UI can read, with no test-only globals.
- **Tests.** The retry/regenerate reload assertions come back. A new reload-immediately-after-reply e2e test is added, both are shown stable over repeated runs, and unit tests cover ordering, failure isolation and replay.
- No schema change and no new migration.

## Capabilities

### New Capabilities
- `chat-persistence`: durability, ordering, failure reporting and page-exit behaviour of locally saved conversations (the thread records and the rendered message history in the browser).

### Modified Capabilities
None. `chat-stream-rendering` keeps its "finished conversation reloads from local storage" behaviour. This change makes it hold immediately after the reply rather than only after incidental delay. `chat-surfaces` keeps its retry/regenerate replacement requirement, and this change adds the reload guarantee as a `chat-persistence` requirement.

## Impact

- **Code:**
  - `src/stores/chat-message-store.ts` and `src/stores/thread-registry-store.ts`: every save goes through the ordered write path.
  - `src/lib/db/`: a new write-queue and pending-save journal module; the journal is replayed when the database opens (`pglite.ts` / `db-provider.tsx`).
  - `src/features/chat/use-chat-runtime.ts`: `onReload` awaits its delete.
  - The thread view gets a save-state attribute and a failure notice through the existing `Toaster`.
- **Tests:** new colocated unit tests; `e2e/chat-surfaces.spec.ts` (restored reload assertions); a new reload-after-reply test in `e2e/`.
- **Data:** no schema change. One `localStorage` key holds saves that were still pending when the page closed, and it is cleared when they apply.
- **APIs and UAR:** untouched.
- **Not covered here:**
  - Saving a reply while it is still streaming. A reload mid-stream still drops that turn locally, including the user's message, and relies on the UAR transcript fallback. This is existing behaviour and stays out of scope.
  - Several tabs writing the same local database.
  - A save to the Tauri shell on app quit, which may not fire `pagehide`.
