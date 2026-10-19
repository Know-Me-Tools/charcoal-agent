# qa-browser-matrix: gate evidence (tasks 1.1 to 1.6)

Branch `feat/qa-browser-matrix`, cut from origin/main `cc35905`. Node 24.21.0. macOS (darwin 25.6, arm64). Tasks 1.7 (phone sheet) and 1.8 (PR) are not part of this file.

Method: every engine run is `--workers=1 --retries=0`, against the BUILT app served by `vite preview` (port 4395, `E2E_BUILT=1 E2E_REUSE_SERVER=1`), traces kept (`retain-on-failure`) in a fresh `--output` directory outside `test-results`. Two builds were needed, and the reason is itself a finding (see 1.3, item 4):
- site flavour (`VITE_SITE_AGENT_ID=knowme-site VITE_SITE_WEB_SEARCH= VITE_UAR_API_KEY= VITE_UAR_BASE_URL=`, the Dockerfile env) for `chat-export-omission.spec.ts`;
- default flavour (no `VITE_SITE_*`) for `db-reset-notice.spec.ts`.

## 1.1 Browsers

- `npx playwright --version`: `Version 1.63.0` (the repo's pin, run from the worktree).
- `npx playwright install webkit firefox` downloaded:
  - WebKit 26.6 (playwright webkit v2359), 78.1 MiB download, 309 MB on disk.
  - Firefox 155.0 (playwright firefox v1543), 104.3 MiB download, 306 MB on disk.
  - Location: `~/Library/Caches/ms-playwright/webkit-2359` and `.../firefox-1543`. No system packages installed.
- Side effect to know about: before the install the cache held `chromium-1208`, `chromium_headless_shell-1208` and `ffmpeg-1011` as well as the 1248 set; afterwards `chromium-1208`, `chromium_headless_shell-1208` were gone (Playwright's install removed the browser builds the pinned version does not use). `chromium-1248`, `chromium_headless_shell-1248`, `ffmpeg-1011`, `ffmpeg-1013` remain. Any other worktree pinned to a Playwright build that wants Chromium 1208 will need `npx playwright install` again. The bundled Chromium 1248 is installed, so `e2e/support/browser-channel.ts` no longer falls back to Chrome here.

## 1.2 Config

`playwright.config.ts`: two projects added after `webkit-iphone`; `chromium` and `webkit-iphone` are untouched:
`webkit` (`devices["Desktop Safari"]`) and `firefox` (`devices["Desktop Firefox"]`), each `testMatch: ["chat-export-omission.spec.ts", "db-reset-notice.spec.ts"]`.
`e2e/support/global-setup.ts` did not need a change: it launches Chromium itself and warms the dev server, independent of which project runs. It runs (and passes) when only `--project=webkit` or `--project=firefox` is selected. Consequence: it warms only Chromium's HTTP cache path; the first load in Firefox on a built app is slow (see 1.3 note 3).

## 1.3 Results per engine

Built app, workers 1, one run unless stated. "Known flake" = the two causes recorded in `app-reset-notice-polish-gate.md` (A: `messages_thread_id_fkey` violated, sidebar stays "No threads yet"; B: stalled `pglite*.data` download).

`chat-export-omission.spec.ts` (3 tests; the stored-chat test is skipped on the built bundle):

| Engine | Built app (site build) | Dev server (site env) |
| --- | --- | --- |
| webkit | 2 passed, 1 skipped (stored) | 3 passed (20.9 s) |
| firefox | 2 passed, 1 skipped (stored) | 3 passed (15.3 s) |
| chromium (reference) | 2 passed, 1 skipped | not run |

`db-reset-notice.spec.ts` (3 tests), default build:

| Engine | First run | Repeat x3 (9 executions) | After restore, rerun |
| --- | --- | --- | --- |
| firefox | 3 passed | 9 passed | 3 passed |
| webkit | 1 passed, 2 failed (desktop-dark: flake A; phone-320-light: flake B, stalled `.data`) | 8 passed, 1 failed (phone-320-light: flake A) | 2 passed 1 failed (desktop-dark: flake A), then 3 passed on rerun |

Every failure and its class:

1. webkit, omission, first attempt (both streamed tests): `page.waitForEvent("download")` timed out at 60 s. Class (ii), engine difference in the test, fixed in the spec. Desktop Safari's `navigator.canShare({ files })` is true, so Save takes the share route (`save-flow.ts`: share first, anchor download otherwise) and opens the native share sheet; no download event exists. Not a product defect: the share route is the designed behaviour (and `chat-export.spec.ts` stubs `navigator.share` for the same reason). Fix: `saveOpenChat` now sets `navigator.canShare` to return false before clicking, so every engine takes the anchor-download route the spec reads. After it: webkit 2 passed, firefox 2 passed, chromium 2 passed.
2. All of `chat-export-omission.spec.ts` was skipped for non-Chromium: the streamed describe had `test.skip(browserName !== "chromium", "Chromium gate.")` and the stored one `browserName !== "chromium" || E2E_BUILT`. Not a failure, a gate that made the new projects run nothing. Class (ii) by construction; I removed the browser part of both skips (stored stays skipped on the built bundle). This is a spec change, and it is the reason for the extra projects having any effect.
3. firefox, omission, first attempt, streamed card test: `getByText(/Bootstrapping schema migrations|Applying migration v\d+/)` still had count 1 after 15 s. Class (iv), environment/cold start: first Firefox load of the built app (the warm-up in global-setup is Chromium-only), PGlite bootstrap took longer than the 15 s expect. Not reproduced: the same test passed in 22.8 s on the next run and the plain-chat test took 19.9 s, so Firefox on the built app sits close to the limit on the first load. Not diagnosed beyond that.
4. webkit, db-reset (first run, with the SITE build), 3 failed: `getByPlaceholder(/Ask your agent anything/i)` not found. Class (iv), environment: the site build's composer placeholder is "Ask about KnowMe, The Boss and the other products" (`content/site/empty-state.ts:30`). The spec (and `shell.spec.ts`, `chat-surfaces.spec.ts`) find the composer by the default flavour's placeholder, so `db-reset-notice.spec.ts` needs the default build. Not an engine difference and not a product defect; re-run on the default build. (The spec has no way to tell which build it is on; noted, not changed.)
5. webkit, db-reset desktop-dark, run 2 of the default build: `aside … getByText("Weekly plan")` not found at `createSavedThread` line 37; the page snapshot shows the conversation on screen and "No threads yet". Trace console: 4 occurrences of `messages_thread_id_fkey` with `[write-queue] upsertMessage(0b6c3a8e-…, user-…) failed` and the same for the stream message. Class (iii), known flake A. It also hit once in the x3 repeat (phone-320-light, repeat2: 4 fkey lines, same signature) and once after the mutation-1 restore (desktop-dark: 4 fkey lines). Flake A hit 3 times and flake B once in 12 WebKit reset-path executions on the default build (the mutated run excluded); neither hit in 10 Firefox reset-path executions. WebKit may expose the race more often (not proven; small sample; the earlier Chromium record was about 5 percent under 4-worker load). It is a product race, recorded, not fixed.
6. webkit, db-reset phone-320-light, run 2 of the default build: `getByPlaceholder` not visible after 15 s; snapshot is only "Bootstrapping schema migrations…". Trace network: `pglite-….wasm` 200 (8.86 MB), `pglite-….data` response with size -1 (started, never finished). Class (iii), known flake B (stalled `.data` download), here with workers=1 (so not only an effect of parallel load). Seen once.

No product defect was found. Product code was changed in no step (the two mutations in 1.4 were reverted; `git diff src` empty).

## 1.4 Mutation check (replaces "alter the string constant")

Mutation 1: in `src/lib/db/db-provider.tsx` line 73, `if (isRetry) announceDbReset();` commented out; rebuilt (default build, built in 12.38 s); `db-reset-notice.spec.ts`, workers 1.
- webkit: 1 passed (the normal start), 2 failed: `Expect "toHaveCount" getByText('Your saved chats could not be read, so they were deleted from this browser.') ... unexpected value "0"`, for desktop-dark and phone-320-light. (Fails after the saved thread was made, at the reset notice assertion, not at setup.)
- firefox: the same, 1 passed, 2 failed, `unexpected value "0"` for both.
Restored (`git diff --stat src` printed nothing), rebuilt (12.31 s):
- firefox: 3 passed (34.4 s).
- webkit: first rerun 2 passed, 1 failed (desktop-dark, `Weekly plan` not found, trace has 4 `messages_thread_id_fkey` lines: known flake A); second rerun 3 passed (38.9 s).

Mutation 2: in `src/features/export/okf-serialize.ts`, the `else if (artifactDroppedWhileVisible(block)) omitted.cards = true;` and the `else omitted.images = true;` lines replaced by comments (`git diff src` showed exactly those two replacements); rebuilt with the site env; `chat-export-omission.spec.ts`:
- built bundle, webkit: card test failed (`expect(received).toBe(expected) // Object.is equality`, the `endsWith(LINE_CARDS)` assertion), plain test passed, stored test skipped. firefox: the same.
- dev server (so the stored chat with the image runs): webkit: 2 failed (card test and stored test, both `Object.is equality`), 1 passed (plain). firefox: the same. This covers the image branch too.
Restored with `git checkout -- src/features/export/okf-serialize.ts` (`git diff --stat src` printed nothing, `git status` shows only the spec/config/openspec changes), rebuilt with the site env, built bundle: webkit 2 passed 1 skipped; firefox 2 passed 1 skipped.

Chromium was not re-mutated; the mutation results above are the two new engines only, as asked.

## 1.6 e2e type check

Cause: `e2e/chat-export-bundle-load.spec.ts` imported `/src/lib/db/pglite.ts` with a string-literal specifier inside `page.evaluate`. That path exists only on the Vite dev server (the browser resolves it); tsc tries to resolve a literal and finds nothing (TS2307). `chat-export-omission.spec.ts` already avoided this by holding the path in a variable and casting the result.
Change: the same pattern in the bundle-load spec (variable `dbModule`, `/* @vite-ignore */`, a cast to the two methods the spec calls). Runtime behaviour is the same string import.
- before: `tsc --noEmit -p e2e/tsconfig.json` exit 2, `e2e/chat-export-bundle-load.spec.ts(32,43): error TS2307`.
- after: exit 0, no output.
- spec run once, Chromium, dev server (port 4397, default env): 3 passed (48.8 s). Printed gate lines: size=1 prepared_ms=218 zip_bytes=1052 entries=3 max_frame_gap_ms=17 long_tasks=0; size=50 prepared_ms=850 zip_bytes=30859 entries=52 max_frame_gap_ms=17 long_tasks=0; size=300 prepared_ms=4389 zip_bytes=182733 entries=302 max_frame_gap_ms=17 long_tasks=0. I did not run it on main for a before comparison on this machine.

## CI Verify sequence (worktree root)

| Step | Result |
| --- | --- |
| `./scripts/check-pins.sh` | exit 0 |
| `./scripts/check-manifests.sh` | exit 0 (27 YAML files parse; 4 kustomizations render) |
| install | `npm ci` (not `--ignore-scripts`) run once at the start on the clean worktree from the committed lockfile; `npm ci --ignore-scripts` was not run |
| `npm run lint` | exit 0 (0 errors, 5 warnings) |
| `npm test` (full) | exit 0: 119 test files passed, 1 skipped (120); 1225 tests passed, 11 skipped (1236) |
| `npm run build` | exit 0 |
| `tsc --noEmit -p tsconfig.app.json` | exit 0 |
| `tsc --noEmit -p e2e/tsconfig.json` | exit 0 |

## Not verified

- Chromium's current state for the changed `chat-export-omission.spec.ts` was run on the built app (2 passed, 1 skipped) but not on the dev server after the change, and `db-reset-notice.spec.ts` was not re-run in Chromium. The `saveOpenChat` change adds a `canShare` override that Chromium also executes.
- The spec change for the omission spec removes a "Chromium gate"; no reason for that gate was recorded in the repo (the file header says only that it needs the dev server). I did not ask the author.
- Flake rates are from 12 WebKit and 10 Firefox reset-path executions; no statistics. WebKit showing 4 of 12 failures from the known flakes against 0 of 10 in Firefox is an observation, not a result.
- Not tested on a real phone, on Safari itself, or on the live site.
- `webkit` here is Playwright's WebKit 26.6 build, not the installed Safari.
