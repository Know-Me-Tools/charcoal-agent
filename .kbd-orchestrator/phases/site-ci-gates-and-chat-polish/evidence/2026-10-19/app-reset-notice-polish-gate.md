# app-reset-notice-polish: gate evidence (tasks 1.1 to 1.5)

Branch `feat/reset-notice-polish`, cut from origin/main 38285ac. Node 24.21.0. Chromium via the installed Chrome channel (the bundled headless shell is not installed on this machine), against the BUILT app served with `vite preview` on port 4393 (`E2E_PORT=4393 E2E_REUSE_SERVER=1`). Not run in WebKit or Firefox; not run against the live site.

## 1.1 Flake reproduction (no fix made in this task)

Command: `playwright test e2e/db-reset-notice.spec.ts --project=chromium --repeat-each=30 --workers=4 --retries=0 --output=<fresh dir outside test-results>`, built app, before any change to the product or the spec.

- N = 30 repeats of a 3-test spec = 90 executions (60 are the reset-path tests, 30 are "a normal start shows no reset notice"). Workers = 4. Duration 21.8 min.
- Result: 87 passed, 3 failed (desktop-dark twice, phone-320-light once). The flake reproduces at about 5 % of reset-path runs under this load. Traces kept (`trace.zip` unzipped and read: `0-trace.trace`/`1-trace.trace` action and console events, `1-trace.network`, `error-context.md`).

Two different failures, two different causes:

A. desktop-dark, twice (repeat16 and the first repeat). Fails at `createSavedThread` line 37 (`aside … getByText("Weekly plan")` not found for 15 s), BEFORE the fault is injected, so the reset path is not involved. The sidebar stays "No threads yet" while the conversation is on screen. The console in both traces holds:
`[write-queue] upsertMessage(<thread>, user-…) failed error: insert or update on table "messages" violates foreign key constraint "messages_thread_id_fkey"` (and the same for the stream message), 10 to 40 ms after Enter. So the message write reached PGlite before a `threads` row existed for that id, the write failed, and no thread row appeared afterwards. The cause is in the product (the ordering of the thread upsert and the first message upsert on a thread id taken from the URL in a fresh database), not in the test. Per the task rules I stopped here and did not look for or change the write queue. Not diagnosed further: why the thread upsert is late or missing, and whether a real visitor can hit it.

B. phone-320-light, once (repeat10). Fails at `expect(notice).toHaveCount(1)` after the faulted reload. Trace: the app logged `[CharcoalDb] Corrupt database detected; purging and retrying… Invalid FS bundle size: 1024 !== 4939170` at +17.4 s; the good reopen's `pglite-….data` request (the second one, `route.continue()`) shows status 200 but body size -1 (never completed) at the end of the trace (+31.9 s, 14 s later); no `purge` error and no notice. So the reopen was waiting on a 4.9 MB asset response that did not finish within the 15 s expect, while 4 workers were loading about 14 MB each from the same preview server; the test also hit its 60 s timeout. Cause read from the trace: a stalled asset download under parallel load; not a defect found in the reset logic. Not proven beyond the trace (no server-side log of that request).

Candidates from the brief that the traces do NOT support: the fixed 6 s `waitForTimeout` (no failure was at that line), and the 2 s purge timer (the code has a 3 s blocked timer; no failure showed the blocked message).

## 1.2 Close control

Inspected the built app's real DOM and computed style (`[data-close-button]`, sonner 2.x, `data-styled="false"`):

Before (old class string `border-0 bg-transparent text-fg-secondary hover:text-fg`): 12 x 12 px at 1440 and at 320, `position: static`, first child of the flex row (so at the start of the toast, left of the text), and in the dark theme a black square (`background-color: rgb(0, 0, 0)`) because sonner's own unlayered rule `[data-sonner-theme='dark'] [data-close-button]` beats Tailwind's layered `bg-transparent`.

After (only the `closeButton` class string in `src/components/ui/sonner.tsx` changed): 44 x 44 px at 1440 and at 320, flex-centred 16 px icon, `order-last` (end of the row), `-my-3 -mr-3` so the row does not grow, transparent background (`rgba(0,0,0,0)`), border 0, no shadow, `text-fg-secondary` (computed rgb(167,176,188) dark, rgb(75,85,99) light), `hover:bg-hover hover:text-fg`, `focus-cue`. The `!` marks on the colour and background utilities are needed to beat sonner's unlayered dark rule. `elementFromPoint` at the centre returns the button's own icon line. Accessible name still "Close toast". No visitor-facing string changed. `src/components/ui/sonner.test.tsx` passes (in the full unit run).

## 1.3 Fix

Not made. Failure A is a product cause (rule: stop and report, not widen scope). Failure B is a stall under load with no code cause found, so no masking change (no retries, no longer timeouts) was added. No verification batch was run because nothing was changed for the flake.

## 1.4 Tests

`e2e/db-reset-notice.spec.ts`: after the "Close toast" button is visible, in both variants (1440 and 320) the spec measures `boundingBox()` and asserts width >= 44 and height >= 44 (the measured size is in the message), and asserts `document.elementFromPoint` at the box centre is the control or a descendant.

Mutation check (old class string restored from HEAD, rebuilt, spec run with `-g "cannot be opened"`):
```
Error: close control width at 1440px (12x12)   Expected: >= 44   Received: 12
Error: close control width at 320px (12x12)    Expected: >= 44   Received: 12
2 failed
```
New class string restored, rebuilt: `2 passed (1.1m)`.
The centre-not-covered assertion was not separately mutation-tested (the old string leaves the control uncovered too); only the size assertion is proven to fail on the old state.

Type checks: `tsc --noEmit -p tsconfig.app.json` exit 0. `tsc --noEmit -p e2e/tsconfig.json` exit 2 with exactly one error, the known one: `e2e/chat-export-bundle-load.spec.ts(32,43): error TS2307`. None from `db-reset-notice.spec.ts`.

## 1.5 Integration gate (worktree root)

| Step | Result |
| --- | --- |
| `./scripts/check-pins.sh` | exit 0 |
| `./scripts/check-manifests.sh` | exit 0 (27 YAML files parse; 4 kustomizations render) |
| `npm ci --ignore-scripts` | skipped: node_modules is the clean install made for this worktree from the committed lockfile, no dependency change |
| `npm run lint` | exit 0 (0 errors, 5 warnings, all react-refresh/only-export-components in files not touched) |
| `npm test` (full) | exit 0: 119 test files passed, 1 skipped (120); 1225 tests passed, 11 skipped (1236) |
| `npm run build` | exit 0 |
| Spec on the built app, both variants, 1 run | `3 passed (1.0m)` |

## Screenshots (read by the engineer)

Saved beside this file. `app-reset-notice-polish-phone-320-light.png` (320 x 640, light): the toast sits full width under the top bar, text on three lines at the left, the close "X" at the right end of the row, vertically near the first line, inside the toast with clear space around it; it does not overlap the text. It reads as a quiet grey glyph on the raised surface, like the other chrome icons. `app-reset-notice-polish-desktop-dark.png` (1440 x 900, dark): the toast is centred at the top, two lines of text at the left, the "X" at the right end, no black square, no border or shadow; the composer, sidebar and context panel are clear. The 44 px hit area has no visible box at rest (flat, hover fills with `bg-hover`), so the glyph looks small although the target is not; hover and keyboard focus states were not captured. The `before-*` images show the old 12 px control at the start of the toast (dark theme: a black square).
