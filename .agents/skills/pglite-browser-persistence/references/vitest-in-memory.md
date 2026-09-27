# Real PGlite in vitest

## Setup

1. Mock only the PGlite constructor so it ignores the `idb://` data directory (SKILL.md §6). Keep everything else real: your database wrapper, migrations and write functions.
2. Open the database through your normal code path (the same `open()` or migration runner the app uses). This is what proves the migrations and constraints are correct.
3. Share one instance per test file (`beforeAll`). A fresh instance costs about 1–6 s. Between tests, `TRUNCATE ... CASCADE` the tables or delete rows. Don't reopen.
4. When the unit under test has a module-level singleton (a write queue, a cached connection), reset it between tests or use `vi.resetModules()`, so one test's pending work can't leak into the next.

## Prove the test can fail

A test that passes proves little until you have seen it fail for the right reason. For each important test, break the behaviour it guards once and confirm it goes red at the assertion you expect:

| Behaviour | Mutation | Expected failure |
|---|---|---|
| Writes run one at a time, in order | Remove the promise chaining in the queue | A real foreign-key violation, or a wrong settle order |
| Replaying an applied write is harmless | Remove `ON CONFLICT DO UPDATE` | A duplicate-key error |
| Deleting already-removed rows is harmless | Make a zero-row delete throw | Replay reports a failure |

Make the mutation in a scratch copy outside the repo, not in the working tree, and record the command and result. Keep the scratch copy, or a patch file, if you want the proof to be re-runnable later.

## Settle order, not only the final state

When two writes touch different ids, a broken queue can still produce the correct final rows. PGlite serialises queries internally whatever order they were submitted in. To prove ordering, hold the first write on a gate you control, check that it is still pending, queue the second, release the gate, and assert the order in which they **settled**.

## What this does not cover

- IndexedDB persistence across a reload. Use a real browser test for that.
- Browser storage limits and quota errors.
- Multi-tab behaviour.
