# app-first-send-thread-order: gate evidence (tasks 1.1 to 1.4)

Worktree `first-send`, branch `feat/first-send-thread-order`, cut from origin/main 817a8df. Node 24.21.0. Basis: `first-send-order-diagnosis.md` (same folder). Not pushed, no PR.

## What changed

- `src/features/chat/use-chat-runtime.ts`: new `HYDRATION_WAIT_CAP_MS = 2000` and `ensureThreadRegistered(threadId)`. `onNew` and the pending-prompt effect call it before `startStream`. It returns at once (no wait, no timer) when the thread is already in the registry (the landing page, "New thread" and the threads page register first) or the registry is hydrated (then it registers an unknown id). Otherwise it waits for `hydrated` or the cap, then registers the thread only if the registry did hydrate. The registration effect keeps its `if (!hydrated) return;` gate untouched. Nothing else in `src/` changed (write queue, db-provider, pglite, journal, migrations untouched).
- Tests: `src/features/chat/use-chat-runtime.first-send.test.tsx` (6 tests) and `e2e/first-send-order.spec.ts` (4 tests). `playwright.config.ts`: `first-send-order.spec.ts` added to the `webkit` and `firefox` testMatch because it was run there.

Cap choice: 2000 ms. The measured hydration gap was 100 to 500 ms at 1x, 4x and 6x CPU throttle; 2 s is four times the slowest, and short enough that a stuck read does not look like a dead send. Past the cap the send proceeds as it did before (no early registration). Residual risk: hydration slower than 2 s would still produce the old failure; not seen in any measurement.

What the unit test stubs: only the database. Stores, the write queue (its strict enqueue order) and the stream hook are real. The fake db enforces the `messages.thread_id` foreign key (an `insertMessage` for a thread with no row throws) and logs writes in execution order; stored threads are rows the fake already holds. The e2e uses real PGlite, with the hydration read held back by rewriting the served `use-db-hydration.ts` in the browser (dev server); the UAR backend is the suite's mock.

## 1.1 RED on the unfixed code (use-chat-runtime.ts at HEAD)

Unit (`vitest run src/features/chat/use-chat-runtime.first-send.test.tsx`): `Tests 3 failed | 3 passed (6)`, exit 1.
- failed: "writes the thread row ahead of the first message when the id is unknown" (`expected true to be false`: the thread stays ephemeral because `markPersisted` found no thread), "does the same for a prompt queued by another page (pending-prompt path)" (same), "starts the stream and replies when hydration never completes (bounded wait)" (the request went out at once: `expected [...] to have a length of +0 but got 2`).
- log lines: `[write-queue] upsertMessage(...) failed Error: violates foreign key constraint "messages_thread_id_fkey"`.
- passed on unfixed code (expected, they guard against a naive fix): stored thread keeps its title, failed read, already-registered thread not delayed.

E2E (dev server, hydration read held 1000 ms, Chromium, unfixed file in place): `1 failed, 3 passed`. Failing: "an unknown thread id sent to before hydration..." at `aside ... getByText('Weekly plan')` not found for 15 s (the thread never reaches the sidebar). The other three pass on unfixed code (guards).

An earlier RED run used a 3000 ms hold; it also failed, but with the fix in place it still failed because 3 s is beyond the 2 s cap (the capped path is the old behaviour). The e2e hold was therefore set to 1000 ms (under the cap, over the measured 100 to 500 ms gap); the RED was re-run with 1000 ms as recorded above.

## 1.2 GREEN with the fix

- Unit: `Tests 6 passed (6)`.
- E2E, dev server, hold 1000 ms: Chromium `4 passed (1.5m)`; WebKit `4 passed (1.0m)`; Firefox `4 passed (1.8m)`.
- The 2 `[write-queue] ... violates foreign key` lines still printed by the unit run come from the "hydration never completes" test, which deliberately sends on an unregistered thread past the cap (the old behaviour).

## 1.3 Hazard tests and mutation checks

Tests: (i) stored thread by URL sent to at once keeps title and earlier messages; (ii) unknown id: row first, both messages saved, thread in the sidebar with its generated title after the reply, both messages after a reload; (iii) read never completes, and read fails (hydrated flips with an empty list): the send still starts and gets a reply; (iv) landing path: thread already registered, not delayed (unit: request goes out with no timer advance and an unhydrated registry; e2e: landing composer with hydration held).

Mutations applied to use-chat-runtime.ts, then restored (`restored; identical: True`):

| Mutation | Unit result | E2E result (Chromium) |
| --- | --- | --- |
| M1 remove the wait (register at once, before hydration) | FAIL: 2 failed (stored thread: an ephemeral `upsertThread` for a stored id, `expected [ { ... } ] to deeply equal []`; and the bounded-wait test) | NOT caught: 4 passed |
| M2 remove the registration (wait only) | NOT caught: 6 passed | NOT caught: 4 passed |
| M3 remove the cap (wait forever) | FAIL: 3 failed (bounded wait, 5007 ms timeout; the next two fail as a cascade of that hung test) | NOT caught: 4 passed |

Honest reading:
- M1: the unit test is the detector. The e2e stored-thread test cannot see it: the early ephemeral write is overwritten again by `markPersisted`'s write of the in-memory (stored) thread after the reply, so the visible outcome heals. The e2e (i) is an outcome test, not a mutation-sensitive one.
- M2: no test catches it, and I could not build one that does. After hydration the existing registration effect (declared before the send paths) registers the thread before the continuation of the wait runs, in every timing I produced (I added an assertion that the thread is in the registry when the chat request goes out; it passes without the helper's registration). The wait is therefore the load-bearing part; the explicit registration in the helper makes the order deterministic instead of relying on effect timing, but it is not provably necessary by test.
- M3: only the unit test catches it; the e2e failed-read case flips `hydrated` so it never needs the cap.

## 1.4 CI Verify sequence (worktree root)

`npm ci --ignore-scripts` not re-run: node_modules was the clean install provided for this worktree and no dependency changed.

| Step | Result |
| --- | --- |
| `./scripts/check-pins.sh` | exit 0 |
| `./scripts/check-manifests.sh` | exit 0 (27 YAML files parse; 4 kustomizations render) |
| `npm run lint` | exit 0 (0 errors, 5 warnings in untouched files) |
| `npm test` (full) | exit 0: `Test Files 120 passed | 1 skipped (121)`, `Tests 1231 passed | 11 skipped (1242)` |
| `npm run build` | exit 0 |
| `tsc --noEmit -p tsconfig.app.json` | exit 0 |
| `tsc --noEmit -p e2e/tsconfig.json` | exit 0 (clean) |

Against the BUILT app (`vite build` of the fixed code, `vite preview` on 4398, `--retries=0`, fresh `--output` dirs outside test-results):

| Run | Result |
| --- | --- |
| chat-persistence, thread-list-reload, chat-surfaces specs, Chromium, 2 workers | 44 passed (2.2m) |
| db-reset-notice, Chromium, `--repeat-each=30 --workers=4` (90 executions, 60 reset-path) | 90 passed (19.2m), 0 failures (before the fix: 3 failed of 90, two of them this foreign-key failure) |
| db-reset-notice, WebKit, `--repeat-each=6 --workers=1` (18 executions, 12 reset-path) | 18 passed (4.7m), 0 failures (reported earlier: 3 of 12 failed before the fix) |
| db-reset-notice, Firefox, `--repeat-each=5 --workers=1` (15 executions, 10 reset-path) | 15 passed (4.0m), 0 failures |
| first-send-order (new), dev server only (it rewrites a served module), Chromium / WebKit / Firefox | 4 / 4 / 4 passed |

No foreign-key failure and no other failure in any run. 0 of 60 is a lower rate than the earlier about 5 %, but 60 clean runs do not prove the rate is zero (a 5 % rate would give none in 60 runs about 5 % of the time); the failure that was removed is the deterministic one reproduced with the delayed hydration.

## Not verified

- A real phone, and a hydration read slower than the 2 s cap (not produced).
- M2 (removing the explicit registration) is not detected by any test; M1 and M3 are detected only at unit level.
- The new e2e does not run on the built app (it rewrites a served dev module); the built-app evidence is the unchanged persistence and reset-notice specs.
- The reset-notice specs ran only in the engines listed; WebKit-iPhone and the real site were not run.
