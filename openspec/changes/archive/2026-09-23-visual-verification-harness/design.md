## Context

See proposal.md. The UI talks to UAR through relative `/api/*`, `/healthz`, `/readyz` paths (or an absolute `VITE_UAR_BASE_URL` when set in `.env*`), via `api-client.ts` and raw `fetch` for SSE and health. Chat history lives in PGlite (IndexedDB) in the browser; a thread's content only exists after a message is streamed. Theme is a `dark` class on `<html>` (default dark, set in `index.html`, not persisted yet).

## Goals / Non-Goals

**Goals:** deterministic offline screenshots of every route/width/theme; one realistic conversation exercising every block renderer; axe reports; fast enough to run per change (< ~3 min locally).

**Non-Goals:** committed golden snapshots and pixel-diff gating (brand-fidelity-audit, once the design settles); cross-browser matrix (Chromium only for now — Firefox/WebKit can be added as projects later); testing UAR itself.

## Decisions

1. **Mock in the browser with `page.route`, not a mock HTTP server.** Intercepting `**/api/**`, `**/healthz`, `**/readyz` works whether requests are relative (Vite proxy) or absolute (`VITE_UAR_BASE_URL` from a developer's `.env.development.local`), needs no extra process, and lets a test assert on unmocked paths. Alternative (MSW or a Node mock server behind the Vite proxy) rejected: the absolute-URL case bypasses the proxy, and MSW adds a service worker to the app bundle.
2. **SSE fixture served as a single `text/event-stream` body.** The client splits blocks on blank lines and only needs `event:` + `data:` lines; fulfilling the whole stream at once is deterministic. Event shapes are copied from `use-message-stream.ts` (which mirrors UAR `sse.rs`). The title-generation request (`stream: false`) gets a JSON `{ content }` response.
3. **Conversation created through the real UI.** The thread spec types into the composer and sends, so screenshots exercise the actual stream→store→PGlite→render path. Each test uses a fresh browser context, so IndexedDB is empty.
4. **Theme set via one helper** (`setTheme(page, theme)`) that toggles the `dark` class after load and waits a frame. When knowme-brand-tokens adds persisted themes, only the helper changes.
5. **Viewport × theme as parameterised tests, not Playwright projects,** so one route list drives screenshots and axe with readable test names (`landing › 320 › dark`). Height is fixed at 900 with `fullPage: true`.
6. **Stabilise screenshots:** `reducedMotion: 'reduce'`, animations disabled via `page.screenshot({ animations: 'disabled' })`, wait for network idle plus a route-specific ready locator, mask nothing (fixtures are static; timestamps are fixed in fixtures).
7. **axe report-only by default.** The current UI is known to fail color contrast (assessment); failing now would block every change. `AXE_STRICT=1` flips it; brand-fidelity-audit turns it on. Rules: tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.
8. **Separate `e2e/tsconfig.json`** so app type-checking (`tsconfig.app.json`) is unaffected; `npm run typecheck` also checks e2e.

## Risks / Trade-offs

- [Fixtures drift from real UAR responses] → fixtures are typed against `src/types` interfaces; UAR contract changes that break types surface at typecheck.
- [Local `.env.development.local` points at a remote UAR] → route interception catches absolute URLs; the unmocked-request guard proves nothing leaks.
- [Screenshot run time: 12 routes × 4 widths × 2 themes = 96 captures] → parallel workers; `test:visual` can be filtered with `--grep`.
- [Browser download] → uses Playwright's cached Chromium when present; `npx playwright install chromium` documented otherwise.

## Migration Plan

Additive tooling on branch `rebrand/visual-verification-harness`; no rollback concerns beyond reverting the merge.
