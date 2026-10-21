## Why

Part of the phase `site-ci-gates-and-chat-polish` (change 4 of 4, depends on `app-reset-notice-polish` because both touch `e2e/db-reset-notice.spec.ts`). The two specs added last phase (`e2e/chat-export-omission.spec.ts`, `e2e/db-reset-notice.spec.ts`) have only ever run in Chromium. `playwright.config.ts` has `chromium` and a `webkit-iphone` project limited to three specs, and no Firefox project. Neither WebKit nor Firefox is installed on this machine (the Playwright cache holds Chromium only), and CI runs no end-to-end tests. Evidence: assessment gaps G-5 and G-6.

## What Changes

- Install the Playwright WebKit and Firefox browsers locally (a download of browser binaries through `npx playwright install`) and add a desktop `webkit` project and a `firefox` project that run the two new specs. The `webkit-iphone` project is left as it is: the reset-notice spec sets a desktop viewport at file level, which does not fit an iPhone profile.
- Run the two specs in both engines, record the results, and mutation-check that each spec fails in each engine when its string is altered (so a pass means something there).
- Fix the pre-existing `tsc -p e2e/tsconfig.json` error (`e2e/chat-export-bundle-load.spec.ts(32,43)`, TS2307, present on `main` and found by both builders last phase), because e2e work cannot be type-checked clean otherwise.
- Settle the remote-image export sub-goal: search `src` for any code path that can create an image content block (including spreads, storage and JSON paths). If none exists, record it and descope the built-bundle coverage; if one exists, register a follow-up task to cover it.
- Write a short real-phone sheet for the two new strings and the export flow for the operator. It is waivable and its closure is stated at plan time (decision D-001).
- Not changed: CI does not start running Playwright; that is a separate, larger change.
- Tasks: see `tasks.md`.

## Impact

- Deploy: only `playwright.config.ts`, e2e specs and notes change; no production code is expected to change. If an engine run exposes a real product defect, it is recorded and any fix is a separate, named task, not folded in silently.
- Constraints: the full CI Verify sequence is run before the pull request is opened; Node 24.21.0 first on `PATH`; the browser download is stated in the pull request.
- Evidence: per-engine run results (counts and failures), the per-engine mutation checks, the grep record for the image block, the tsc result, and the operator's phone results or the recorded waiver.
