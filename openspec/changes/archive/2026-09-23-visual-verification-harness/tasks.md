## 1. Tooling

- [x] 1.1 Add dev dependencies `@playwright/test` and `@axe-core/playwright`, ensure Chromium is installed (`npx playwright install chromium`), add `playwright.config.ts` (Chromium, Vite `webServer` on a dedicated port, `reducedMotion: 'reduce'`, output dir `test-results/`), `e2e/tsconfig.json`, scripts `test:e2e`/`test:visual`/`test:a11y`, git-ignore outputs; verify `npx playwright test --list` loads the config
- [x] 1.2 Extend `npm run typecheck` to cover `e2e/` and keep vitest scoped to `src/`; verify `npm run typecheck` and `npm test` pass

## 2. UAR mock

- [x] 2.1 Write typed fixtures (`e2e/fixtures/*.ts`) for agents, providers + models, skills, sessions, user settings, namespace settings and runs, using `src/types` interfaces with fixed timestamps; verify `npm run typecheck`
- [x] 2.2 Write the scripted AG-UI SSE fixture covering text, thinking, tool call delta/complete/result, citation, skill activation, context update, memory recall, memory mutation, artifact, A2UI custom event and done, plus the JSON title-generation response; verify with a vitest unit test that parses it with the same block splitting and yields every expected event name
- [x] 2.3 Implement `installUarMock(page)` routing `**/api/**`, `**/healthz`, `**/readyz` (GET/POST/PUT/PATCH/DELETE) to fixtures, answering unknown paths with 501 and recording them; export a Playwright fixture that installs it for every test and fails the test if any unmocked path was hit; verify a smoke spec loads `/settings/providers` and sees fixture provider names

## 3. Screenshot matrix

- [x] 3.1 Implement route list + helpers (`setTheme`, `waitForReady`, screenshot naming `<route>__<width>__<theme>.png`) and a screenshot spec over every route × 320/768/1024/1440 × dark/light; verify `npm run test:visual` produces 96 screenshots for 12 routes
- [x] 3.2 Add the conversation scenario: open a new thread, send a message through the composer, wait for the fixture's final text, then capture the thread route; verify screenshots visibly include every block type (spot-check 1440 dark and 320 light)

## 4. Accessibility

- [x] 4.1 Implement the axe spec per route × theme (1440 width) writing `test-results/a11y-report.json` and attaching it; report-only by default, fail on violations when `AXE_STRICT=1`; verify `npm run test:a11y` passes and the report lists current violations, and that `AXE_STRICT=1 npm run test:a11y` fails when violations exist

## 5. Verification

- [x] 5.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`; verify all exit 0, record timings and the a11y violation summary baseline in `verification.md`
