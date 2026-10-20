# app-persist-loss gate evidence (2026-10-19)

## Cause

A first question asked in the front-page composer was stored but left marked ephemeral, so it was never listed after a reload. `useDbHydration` runs in `AppLayout`, which the front page does not use, so the stored-threads read starts only after the thread page mounts. The first send can finish before it returns. `initFromDb` then replaced the in-memory thread, already promoted by `markPersisted`, with the older stored ephemeral copy. The title write that followed saved that reverted copy (`is_ephemeral = true`).

## Log evidence (before the fix)

Real `e2e/home-resume-chat.spec.ts`, built site-flavour app, Chromium, 4 workers, 0 retries, with temporary console logging of the write queue and hydration (removed):

- 14 of 110 completed runs failed.
- In all 14, the stored rows were: the thread with `is_ephemeral = true` and the generated title "Weekly plan", plus both messages (user and assistant, status complete). No write failed and no console error.
- Log order in each: `enqueue upsertThread` (promotion), then `hydrate threads 1`, then `enqueue upsertThread` (title) writing the reverted copy.
- A spec that only counted rows (not `is_ephemeral`) passed 0 failures in 500 runs, so it could not see this.

## Fix

`initFromDb` in `src/stores/thread-registry-store.ts` adds only threads the registry does not already hold. Unit tests in `src/stores/thread-registry-store.test.ts` (the revert test failed before the fix).

## Numbers (after the fix, on fa0042b rebased)

- check-pins, check-manifests: pass. Lint: 0 errors, 5 existing warnings. tsc app and e2e: pass. `npm test --maxWorkers=2 --testTimeout=30000`: 120 files passed, 1 skipped; 1243 tests passed, 11 skipped. Build: pass.
- `e2e/home-resume-chat.spec.ts`, built site app, `--repeat-each=40 --workers=4 --retries=0`, Chromium: 280 of 280 passed (7 tests x 40, 20.8 min).
- Webkit: 7 of 7 passed. Firefox: 7 of 7 passed (one run each).
- Earlier, on the pre-rebase branch with instrumentation: 120 of 120 on the saved-conversation and keyboard tests.

## Unverified

- No contrast run of the unfixed code on the rebased tree (the 14 of 110 figure is from the earlier instrumented run).
- Webkit and firefox ran once, not repeated.
- Mobile Safari, real devices and multi-tab behaviour were not exercised.
