---
name: durable-browser-writes
description: Design rules for making local writes in a browser app (IndexedDB, PGlite, SQLite-WASM, Dexie and similar) survive reloads and closed tabs, as far as the browser allows, and handle failures without losing, duplicating or resurrecting data. A kill with no hide or unload signal can still lose pending writes. Covers a single serial write queue with serialisable write descriptors, a synchronous page-exit journal in localStorage (pagehide and visibilitychange), replay on startup, idempotent writes, per-tab journal keys guarded by Web Locks, the multi-tab hazards (dead-tab replay bringing back deleted rows, stale overwrites, duplicated tabs sharing sessionStorage), writes queued while the page is hidden, and showing save failures that happen before the UI has mounted. Use this skill whenever someone builds local-first or offline storage in a web app, sees data missing after a reload, duplicated messages after a retry, or a deleted item coming back, or designs save-state indicators or save-failure notices, even if they don't say "durability".
license: MIT
metadata:
  origin: "KnowMe AI web client, chat-persistence-durability change, 2026-09"
  evidence: "each rule records how it was verified in the origin project"
---

# Durable browser writes

A browser can't hold a page open while an asynchronous database write finishes. IndexedDB, and anything built on it, is asynchronous, while `pagehide` and `visibilitychange` handlers must return synchronously. Durability therefore comes from three things working together: ordered, awaited writes while the page lives; a synchronous record of what was still pending when it stopped; and a safe replay of that record on the next start.

**Evidence tags** on each rule: `[verified]` = a failing-then-passing test, a reproduced error or a mutation proof in the origin project; `[docs]` = upstream documentation; `[review]` = found by independent review, fix designed but not yet proven here; `[practice]` = a working convention, not independently tested. Re-check anything version-sensitive against your own versions.

## 1. Stop fire-and-forget writes `[verified]`

`db.upsert(x).catch(console.error)` is the root bug. Nothing awaits it, so a reload in the next few milliseconds loses the write, and a failure is only logged. In the origin app, a reload right after a streamed reply lost or reverted the reply 10 out of 10 times under trace.

## 2. One app-wide serial write queue `[verified]`

Send every local write, from every store, through one promise chain:

```ts
const noop = () => {};
let tail: Promise<void> = Promise.resolve();
export function enqueueWrite(d: WriteDescriptor): Promise<void> {
  const run = tail.then(() => applyDescriptor(db, d));
  // The tail must never reject, or every later `.then` is skipped and the queue is dead.
  // So the failure handler is itself guarded.
  tail = run.then(noop, (error) => {
    try { reportFailure(d, error); } catch (reportError) { console.error(reportError); }
  });
  return run; // the caller still sees its own rejection
}
```

**Why one queue across stores:** ordering across stores is where the bugs are. A thread row must land before its messages (foreign key). A "delete the messages after X" must land before the regenerated replacement. Removing the chaining gave a real `FOREIGN KEY` violation in the origin tests.

**Expose `flush()` that never rejects** for callers that must wait, such as tests and "retry" actions. Also expose a pending count, so the UI can show `saving`, `saved` or `failed`.

## 3. Writes are data, not closures `[verified]`

Queue a serialisable **descriptor** (`{kind: "upsertMessage", threadId, message}`), not a function. There are two reasons:
- The journal (§4) must be able to write it to storage.
- Built from committed state (`get()` after `set()`), it can't capture an immer or proxy draft that has been revoked by the time the queued write runs.

## 4. A synchronous page-exit journal `[verified]` (the test fails 10/10 without the journal and 10/10 without replay)

On `pagehide`, and on `visibilitychange` to `hidden`, the last reliable signal on mobile, write the **unsettled suffix** of the queue to `localStorage` with `setItem`. It's the only synchronous storage available. Then:

- **Keep the journal current:** on every queue change, rewrite or clear the key if one exists, so it never replays writes that have already landed.
- **Journal writes queued while hidden** `[verified]` (a unit test fails when this is reverted). If the page is already hidden, any queue change that leaves writes pending must write the journal immediately. A reply that finishes in a background tab queues its writes *after* the hide event, and a mobile OS often kills the page without firing `pagehide`.
- **Replay on start:** after migrations, *before* the app shows as ready, apply the journal's descriptors in order, then clear the key.
- **Quota:** if `setItem` throws, drop the largest upserts first and keep deletes and parent rows. Report the loss.
- **Say what you can't do:** a crash or kill with no hide or unload signal can lose pending writes. Put that in the spec rather than claiming more.

Full mechanics: `references/journal.md`.

## 5. Replay is only safe if writes are idempotent `[verified]`

Use upserts with `ON CONFLICT (id) DO UPDATE`, and deletes by id or by a condition. Applying an already-applied suffix twice must leave the data unchanged. Test that on real storage, not a fake.

## 6. Multiple tabs: per-tab keys, locks, and the dangerous half `[verified]`

`localStorage` is shared by every same-origin tab, so a single journal key lets tabs overwrite each other's pending writes. Give each tab its own key: `journal:<tabId>`, with the tab id kept in `sessionStorage`. Hold a Web Lock named after that key for the page's lifetime (`navigator.locks.request(key, () => new Promise(() => {}))`). At startup, another tab's key whose lock is free (`{ifAvailable: true}`) belongs to a dead tab. Web Locks is available in current Chromium, Firefox and Safari. Where `navigator.locks` is missing, replay only your own key and leave other tabs' keys alone: you can't tell a live tab from a dead one.

The dangerous half. These were found by independent review. The fixes are proven by unit tests and real in-memory PGlite tests, each of which fails when its fix is reverted. There is no real multi-tab browser run yet:

- **Dead-tab replay can bring back deleted data.** If a dead tab's journal holds an upsert for a row the user deleted in another tab, replay re-inserts it. **Rule:** a delete scrubs that entity's descriptors from *every* journal key, synchronously. Replayed upserts from another tab apply only if they are not older than the stored row (`updated_at`). An upsert of a parent row that has no stored row is a creation, so apply it; the scrub is what stops deleted rows returning. A child whose parent row is missing is skipped and logged; that is not a user-facing failure. (The first implementation skipped missing-row upserts too, and silently lost a new thread that a dead tab had created. A second review round caught it.)
- **Touches need their own timestamp.** A "move to top" touch replayed from another tab must carry the time it happened. Comparing against "now" makes every stale touch win.
- **Stale overwrite.** An old title in a dead tab's journal can overwrite a newer rename. The newer-wins check above covers it.
- **Duplicated tabs copy `sessionStorage`.** "Duplicate tab" gives two live tabs the same tab id, so they share one key. **Rule:** at startup, try your own key's lock with `ifAvailable`. If another live tab holds it, mint a new tab id before replaying or clearing anything.
- **Your own key replays unconditionally.** One tab's own writes are ordered and idempotent, so replaying its latest suffix is safe.
- **Accepted residual:** a live second tab that still holds deleted data in memory can write it back with its next save. That is live multi-tab sync, which is a separate problem.

Details and test ideas: `references/multi-tab.md`.

## 7. Failures reported before the UI exists `[verified]`

Replay runs before any component has mounted, so a replay failure has no listener. **Latch it:** when a failure is reported with no subscribers, store it, and hand it once to the first subscriber. Mount the notice component once, app-wide, not inside one view, or failures on other routes go unseen. Show one polite, plain-language, non-blocking notice per burst: use a stable toast id, never raw error text, and log the error for diagnosis.

## 8. Small things that bit `[practice]`

- **Re-entrancy:** reporting a failure from inside the journal sync can re-trigger the sync. Guard it with a flag to avoid a stack overflow.
- **Retry and regenerate:** await "delete the messages after the parent", then re-stream without re-appending the user message. Otherwise you get duplicates, and they persist.
- **A "saved only changed rows" optimisation** keeps the journal small, but it removes the self-healing effect of re-saving everything each turn. Re-queue any row modified after it was saved, and record the trade-off in the design.
- **A page-lifetime Web Lock may make pages ineligible for the back/forward cache** in some browsers. Check `notRestoredReasons` if bfcache matters to you.

## Where to go next

- `references/journal.md`: journal format, sync rules, replay order, the quota shrink.
- `references/multi-tab.md`: tab identity, locks, scrub-on-delete, newer-wins, and tests that prove the harmful half.
- The `pglite-browser-persistence` skill: what "the write resolved" means on PGlite.
- The `browser-storage-e2e-testing` skill: how to hold writes pending and inject real IndexedDB failures in Playwright.
