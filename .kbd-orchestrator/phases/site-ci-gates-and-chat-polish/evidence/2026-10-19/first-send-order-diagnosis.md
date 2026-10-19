# Diagnosis: first send before the thread registry is hydrated (messages_thread_id_fkey)

Diagnosis only. No change under `src/`. Worktree `diag-order`, branch `diag/first-send-order`, from origin/main 38285ac. Node 24.21.0, Chromium via the installed Chrome channel. Two diagnostic specs were added and are committed with this file so the numbers can be re-run: `e2e/first-send-order.diag.spec.ts` (dev server, route-rewrites three served modules in the browser to delay hydration and log writes; src/ untouched) and `e2e/first-send-gap.diag.spec.ts` (built app, patches the served bundle in the browser to stamp `performance.now()` when `hydrated` is set; dist/ on disk untouched). Whether to keep them is the coordinator's call.

## 1. Mechanism: the hypothesis is confirmed

Code (origin/main):
- `src/features/chat/use-chat-runtime.ts` 319-330: the effect that calls `registerThread(threadId)` for an unknown id returns early until `hydrated` is true.
- `src/hooks/use-db-hydration.ts` (mounted by `AppLayout`): `db.getThreads().then(initFromDb)` is the only thing that sets `hydrated` on a thread route.
- `src/stores/chat-message-store.ts` `persistMessages` enqueues `upsertMessage` for every complete message, independent of that effect.
- `src/lib/db/write-queue.ts` runs writes strictly in enqueue order. `upsertMessage` for a `thread_id` with no `threads` row violates the FK.
- Downstream, `afterStreamComplete` calls `markPersisted`, `touch` and `setTitle`; each one returns without writing when the thread is not in the registry, so none of them promotes the thread or sets its title during that first exchange. `titleGeneratedRef` is latched on that first call, so the title is never generated for the rest of that page session.

Observed order (dev server, hydration read delayed 3000 ms by a route rewrite, so the result does not depend on load). Enter at t=2007 ms; times are `performance.now()` in the page:
```
[diag] keydown Enter                        t=2007
[diag] enqueue upsertMessage  user-…        t=2061   (thread row not in registry)
[diag] enqueue upsertMessage  stream-run-…  t=2061
error  [write-queue] upsertMessage(… user-…) failed  insert or update on table "messages" violates foreign key constraint "messages_thread_id_fkey"
error  [write-queue] upsertMessage(… stream-run-…) failed  (same)
[diag] hydrated=true                        t=4704
[diag] enqueue upsertThread  ephemeral=true t=4710
```
The same sequence appeared in all three runs of the rewrite spec (hydrated at 5242, 4704, 4910). It matches the two load failures from the earlier 90-run batch, whose traces showed the same two FK errors 10 to 40 ms after Enter.

So the thread row is not "missing": it is written late (6 ms after `hydrated` flips) and as ephemeral, after the messages already failed.

## 2. Deterministic reproduction and what the visitor sees

Command: `DIAG_HYDRATION_DELAY_MS=3000 DIAG_OUT=… E2E_PORT=4395 playwright test e2e/first-send-order.diag.spec.ts --project=chromium --workers=1 --retries=0` (dev server, UAR mock): `2 passed (43.2s)` and a second run `2 passed (1.2m)`. Fails every time with no load, because the delay forces the send into the pre-hydration window.

Visitor-visible results (variant A: reload before the second turn; variant B: no reload):
- The reply streams and shows on screen normally.
- The save-failure toast ("Couldn't save your latest messages on this device…") is shown: 1 element 0.5 s after the reply, gone by the 3 s check (sonner default duration).
- The thread is NOT in the sidebar after hydration: "No threads yet" stays (the thread exists, ephemeral, hidden). No "Weekly plan" title.
- Variant A, reload before any second turn: the first exchange is lost for good. Reply count 0, sidebar empty. Typing a second message then works normally: the thread appears with its title "Weekly plan", survives a further reload, and only the second exchange is there (user texts on screen: first 0, second 1).
- Variant B, second turn in the same page session: the "a failed insert heals on the next turn" guarantee does work. The second send retried the first exchange's unsaved messages and promoted the thread (`upsertThread ephemeral=false`), so after the next reload both exchanges are there (reply 2, user texts 1 and 1). But the thread is in the sidebar as "New conversation" (count 1), not "Weekly plan" (count 0), because the title step was skipped on the first exchange and never re-runs.

Not shown by this spec: a first exchange where the visitor leaves the page with no second turn: that is variant A without the second turn (lost).

## 3. Reachability for a real visitor

Paths that send:
- The landing composer (`landing-page.tsx` 70-76) calls `registerThread(sessionId)` before navigating, then queues the prompt. The sidebar "New thread" button (`left-sidebar.tsx` 109) and `threads-page.tsx` 17 also register first. Those writes are enqueued in order, so they are safe.
- Only a thread route for an id the registry does not know uses the gated effect: a typed or bookmarked `/threads/<id>` URL, a stale or shared link, a reload on a thread whose stored row is gone (including right after the saved-chats-reset notice), or an e2e test that opens a fixed id. The reload of a stored thread is safe (the row exists).
- Starter prompt chips: none exist at 38285ac. `StarterPromptSlot` (`enhanced-thread.tsx` 260) is rendered empty ("Empty on purpose"), no chip content in `content/site/` (`grep -rn StarterPromptSlot src` shows only the definition and its one empty use). So chips cannot send before hydration today; if chips are added and send through the thread composer on a direct-URL thread, they would hit this unless guarded.

Gap between the composer being visible and enabled and `hydrated` becoming true, built app (`vite build`, `vite preview` on 4396), cold PGlite (new browser context per run, empty IndexedDB), thread URL, 5 runs per rate, CDP `Emulation.setCPUThrottlingRate`:
```
rate 1x : gap 99, 115, 168, 155, 318 ms           (composer visible at 1.95 to 4.7 s)
rate 4x : gap 273, 268, 473, 279, 429 ms          (composer visible at 6.8 to 12.6 s)
rate 6x : gap 470, 514, 495, 392, 511 ms          (composer visible at 8.2 to 10.4 s)
```
Command: `DIAG_OUT=… E2E_PORT=4396 E2E_REUSE_SERVER=1 playwright test e2e/first-send-gap.diag.spec.ts --project=chromium --workers=1 --retries=0` -> `15 passed (2.7m)`.

Reading: the composer is usable for roughly 0.1 to 0.3 s (desktop speed) and 0.3 to 0.5 s (4x to 6x) before hydration. A person typing a first question takes longer than that, so a hand-typed first send is unlikely to land in the window. Reachable inputs are a paste plus Enter, autofill or voice, a very fast Enter on a pre-filled composer, or automation (`fill` then `press` takes about 50 ms, well inside the window, which is why the e2e flakes). The window widens under CPU contention (the 4-worker e2e run); I did not measure that gap.

Could not measure: a real phone, a warm (non-cold) start, the gap under 4-worker contention in the earlier failing runs, and how often visitors reach an unknown thread URL.

## 4. Smallest correct fix (words only)

Guard in `use-chat-runtime.ts` (not in the stores): make the send paths, `onNew` and the pending-prompt effect, wait until the registry is hydrated and register the thread if it is still unknown before calling `startStream`. The registration then enqueues `upsertThread` ahead of the first `upsertMessage`, and `markPersisted`, `touch` and `setTitle` find the thread, so the title and the sidebar entry also work on the first exchange. In practice: a small "whenHydrated" promise from the registry store, awaited at the top of the send path, plus the existing registration call moved to run there. Cost: a send waits at most the gap measured above (about 0.1 to 0.5 s); disabling the composer until hydrated would be the visible alternative.

The hazard: registering before hydration overwrites a stored thread. An unknown-looking id on a reload can be a stored row, and `registerThread` would enqueue `upsertThread` with `isEphemeral: true`, replacing that row, so the saved chat would vanish from the sidebar. That is why the effect is gated, and why the fix must wait for hydration, not drop the gate. A second hazard is the hydration read failing: the hook already calls `initFromDb([])` on error, so the wait cannot hang, but then an existing stored row would look unknown; that case already exists today.

An alternative to the wait: make the ephemeral registration insert-only (do nothing if the row exists) so an early registration cannot overwrite a stored row. That changes the thread write semantics in `pglite.ts` and was not examined here.

## Not verified

- No fix was attempted, so nothing here proves that the guard works.
- The overwrite hazard is read from the code (`registerThread` and the comment in `use-chat-runtime.ts`), not reproduced.
- The rewrite spec runs on the Vite dev server with the hydration read delayed by a route rewrite; the only built-app measurement is the gap table above.
- Chromium only; the toast count of 1 at 0.5 s is a single observation per run.

## Corrections to the earlier report

- Earlier: "no thread row appeared afterwards". Wrong in detail: the row is written when `hydrated` flips, but as ephemeral, so it stays hidden from the sidebar and the first exchange stays unsaved.
- Earlier: "Not checked whether a real visitor can hit it." Now partly answered above: all in-app creation paths pre-register; the direct-unknown-thread-URL path is the exposed one, and the window is 0.1 to 0.5 s.
