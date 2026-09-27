## Why

The `complete-rebranding` phase changes every surface of the app, and its goal 7 requires brand fidelity to be verified at 320/768/1024/1440 px in both themes with WCAG contrast passing. Today there are no browser, screenshot or accessibility tests, and pages render only skeletons without a live Universal Agent Runtime (UAR), so no change in the phase can be verified repeatably.

## What Changes

- Add Playwright (Chromium) with a Vite `webServer`, so `npm run test:e2e` starts the app itself.
- Add an in-browser UAR mock (request interception) that serves fixture agents, providers, models, skills, sessions, user settings, health, and a scripted AG-UI SSE chat stream containing every rendered content-block type (text, thinking, tool call + result, citation, skill activation, context update, memory recall and mutation, artifact, A2UI envelope).
- Add a route matrix spec that captures a full-page screenshot of every route at 320, 768, 1024 and 1440 px in dark and light themes, including a thread whose conversation contains every block type.
- Add axe-core accessibility scans (WCAG 2.x A/AA rules including color-contrast) per route and theme, written to a JSON report. Report-only by default; `AXE_STRICT=1` makes violations fail (enabled by `brand-fidelity-audit`).
- Scripts: `test:e2e` (everything), `test:visual` (screenshots only), `test:a11y` (axe only). Screenshots and reports go to a git-ignored output directory; no golden snapshots are committed in this change.

## Capabilities

### New Capabilities
- `ui-verification-harness`: offline, repeatable browser verification of every route across viewports and themes, with accessibility reporting.

### Modified Capabilities
<!-- none -->

## Impact

- New: `playwright.config.ts`, `e2e/**` (fixtures, mock, specs), dev dependencies `@playwright/test`, `@axe-core/playwright`.
- `package.json` scripts, `.gitignore` (test output), ESLint/TypeScript coverage of `e2e/`.
- No application code changes; vitest continues to run only `src/**` tests.
