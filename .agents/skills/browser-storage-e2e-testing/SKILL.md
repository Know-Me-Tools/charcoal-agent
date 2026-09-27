---
name: browser-storage-e2e-testing
description: Techniques for writing Playwright and vitest tests of browser storage behaviour (IndexedDB, PGlite, localStorage journals, save indicators, failure notices) that are deterministic, can actually fail, and don't flake under load. Covers injecting real IndexedDB write failures, holding writes pending, planting state before the app boots with addInitScript, mutation-proving tests in a scratch copy, triaging flakes (test-setup race versus load versus app bug), replacing fixed waits, asserting settle order, and environment traps such as Node 25+ breaking jsdom localStorage and vitest config precedence. Use this skill whenever writing or debugging e2e or unit tests around persistence, reloads, offline data or storage errors, whenever a storage, reload or timing-dependent browser test is flaky, or whenever someone needs proof that such a test would catch the bug it's named after. General flaky-test advice unrelated to storage or timing is out of scope.
license: MIT
compatibility: "Playwright 1.4x+ (Chromium), vitest 2+/3+ with jsdom"
metadata:
  origin: "KnowMe AI web client, complete-rebranding phase, 2026-09"
---

# Browser storage tests that mean something

Storage bugs hide in timing: a write that hasn't landed, a reload mid-flush, a failure nobody sees. Tests catch them only if they control timing instead of hoping for it, and only if you have seen each test fail for the right reason.

**Evidence tags** on each rule: `[verified]` = a failing-then-passing test, a reproduced error or a mutation proof in the origin project; `[docs]` = upstream documentation; `[review]` = found by independent review, fix designed but not yet proven here; `[practice]` = a working convention, not independently tested. Re-check anything version-sensitive against your own versions.

## 1. Inject real IndexedDB failures, with no app hooks `[verified]`

Patch `IDBObjectStore.prototype.put` on the page so every `put` runs for real and then aborts its own transaction. If your storage layer also uses `add`, `delete` or `clear`, patch those the same way. The browser then fires genuine `error`/`abort` events, the same shape as quota or storage-disabled failures:

```ts
await page.evaluate(() => {
  const proto = IDBObjectStore.prototype;
  const original = proto.put;
  (window as any).__origPut = original;
  Object.defineProperty(proto, "put", {
    configurable: true,
    value(this: IDBObjectStore, ...args: Parameters<typeof original>) {
      const req = original.apply(this, args);
      try { this.transaction.abort(); } catch { /* already finishing */ }
      return req;
    },
  });
});
```

- Install it **after** startup and migrations, so boot isn't what fails.
- To restore, re-define `put` from the saved original. `put` is an own property of the prototype, so `delete` removes it entirely.
- Count failures from the app's own diagnostic log (`console` events), not from `put` calls. One logical write can issue several `put` calls.

## 2. Hold writes pending from the app's point of view `[verified]`

To test a reload while the app still thinks writes are in flight, stop it from ever *observing* completion. Override the `onsuccess`/`onerror`/`oncomplete`/`onabort` setters and `addEventListener` for those four events on **both** `IDBRequest.prototype` and `IDBTransaction.prototype`, so handlers are never registered. Swallowing only the request is not enough: an idle transaction auto-commits, and the app waits on the transaction.

Be precise about what this proves. It holds the **app's** promise, not IndexedDB itself: a transaction that was already issued may still commit underneath. It worked in the origin project because the storage layer (PGlite's IDB filesystem) waits on those events before it writes the rest, so the data really was missing after reload. Don't assume that holds for your stack. Pair the test with a mutation run that disables replay, and confirm the data is then absent after reload. The injection doesn't survive navigation, so the reloaded page gets normal IndexedDB.

```ts
await page.evaluate(() => {
  const swallowed = new Set(["success", "error", "complete", "abort"]);
  for (const proto of [IDBRequest.prototype, IDBTransaction.prototype]) {
    for (const name of ["onsuccess", "onerror", "oncomplete", "onabort"]) {
      if (name in proto) Object.defineProperty(proto, name, { configurable: true, get: () => undefined, set() {} });
    }
    const add = proto.addEventListener;
    Object.defineProperty(proto, "addEventListener", {
      configurable: true,
      value(this: EventTarget, type: string, ...rest: any[]) {
        if (!swallowed.has(type)) return add.call(this, type, ...rest);
      },
    });
  }
});
```

## 3. Plant pre-boot state with `addInitScript`, not `page.evaluate` `[verified]`

State that must exist before the app runs, such as a journal entry or a feature flag, belongs in `page.addInitScript`, guarded by a `sessionStorage` flag so it runs once. Plant with synchronous storage (`localStorage`, `sessionStorage`) in the init script. An asynchronous IndexedDB write there can still lose the race with the app's first read. Planting from the live page races the app's own code. In the origin project the app's journal sync erased a planted entry before the reload, 3 times in 80 under `--workers=5`. That failure looked exactly like an app bug.

## 4. Prove every important test can fail `[verified]`

Break the behaviour in a **scratch copy outside the repo**, then confirm the test fails at the expected assertion every time:

```sh
npx playwright test path/spec.ts -g "journaled" --repeat-each 10 --workers=1 --retries=0
```

- Run the unmodified scratch copy as a control first. If the control fails, the environment is broken, not the proof.
- With a symlinked `node_modules`, Vite serves nothing from outside its root. Add `server.fs.allow: [".", "<real node_modules>"]` to the scratch config, or WASM-based libraries such as PGlite fail with misleading errors.
- Record the mutation, command and result in the QA notes. Keep a patch file if the proof must be re-runnable.

## 5. Triage flakes before fixing anything `[verified]`

1. Reproduce under load: `--repeat-each 40 --workers=5 --retries=0`, then add `--trace on` for the failing test.
2. Decide which of three it is: **app bug** (fix the app), **test-setup race** (fix the test), or **pure load** (reproduces on the previous commit too; lower the workers).
3. A hypothesis must predict the fix. Change one thing and re-stress. In the origin project the first theory (toast auto-dismiss) was falsified this way, and the real cause was a setup race.
4. Never "fix" a flake with retries or longer timeouts.

Details: `references/flake-triage.md`.

## 6. No fixed waits `[practice]`

Replace `waitForTimeout` and route-delay `setTimeout` with signals:
- Register `page.waitForResponse(...)` *before* the action that triggers it.
- Gate a mocked route on a promise the test resolves once its setup is in place.
- Use `expect.poll` on a real signal: a log line count, or a DOM attribute such as `data-persistence="saved"`.
- Grep the spec for `waitForTimeout|setTimeout` before calling it done.

## 7. Assert settle order when ordering is the claim `[verified]`

When writes touch different ids, the final rows can be correct even if ordering is broken. Hold the first write on a gate, confirm it is still pending, queue the second, release the gate, and assert the order in which they settled.

## 8. Environment traps, mostly vitest `[verified]`

- **Node 25+ and jsdom:** Node's own global `localStorage` shadows jsdom's, so tests fail with `Cannot read properties of undefined (reading 'clear')`. Run on Node 24 LTS and pin it (`.nvmrc`, `engines`).
- **`vitest.config.ts` wins** over the `test` block in `vite.config.ts`. Excludes written in the Vite config are dead.
- **Stale dev servers:** make `reuseExistingServer` opt-in, or a leftover server from another branch will answer your tests.
- **One Playwright run per port at a time.** Parallel agents or terminals sharing a port corrupt each other's results.
- **Typecheck the e2e project too.** Playwright doesn't type-check tests, so a type error in a spec file passes silently unless `tsc -p e2e/tsconfig.json` runs.

## 9. Test the real runtime for capability-driven UI `[verified]`

A stub that renders a control proves nothing about whether the real runtime enables it. In the origin project, a mocked "Try again" button stayed enabled while the real one was disabled because a callback was never wired. Verify enabled and disabled states against the real component.
