# QA: app-pages-flat2-entity-views

## Task 3.1: tests (km-qa-engineer)
- `src/test/flat-shell.test.ts`: a "Flat 2.0 app pages" block covering the 8 in-scope pages, plus a gradient rule.
- `e2e/app-pages.spec.ts`: 69 tests, one for each browser scenario in `specs/app-pages/spec.md`:
  - every route renders
  - Flat 2.0 surfaces, and nothing under 12px
  - `bg-band` grouping in light
  - no horizontal scroll at 320px
  - Tab-through focus outlines
  - existing operations (provider create/update/default/delete, agent create via `POST /api/compiler/compile`, agent update via `PATCH`, skill toggle and refresh)
  - no "Charcoal" on settings pages
- **Break proofs**, run in a scratch copy outside the repo:
  - putting `outline-none` back on `Button` makes the Button outline test fail with `Expected "solid", Received "none"`
  - adding `border border-border` to `providers-page.tsx` makes the flat-shell guard fail
- **Tab-through stops per route** (corrected after C1, see below): threads 2, agents 7, agent-new 16, agent-detail 18, settings-providers 8, settings-skills 24, settings-appearance 9, settings-account 4. The test now attaches the full stop sequence. On settings-account the body has no focusable controls in the mock state, because its switch and select render only after user settings load, so its 4 stops are the nav links.

## Defects found by the tests, all fixed
1. **`/agents` overflowed at 320px** (scrollWidth 358). Fixed in `agents-page.tsx`: the card header now shrinks and wraps.
2. **`SelectTrigger` had an unconditional `outline-none`,** so the Provider and Model selects showed no keyboard focus. Fixed in `select.tsx`.
3. **The settings nav wrapped a `<Button>` in a `<NavLink>`,** giving two nested focus stops. Fixed in `settings-page.tsx`: each item is now a single link.
4. **axe `nested-interactive` on settings-skills,** 9 nodes per theme: each skill card was a `role="button"` containing two buttons. Fixed in `skills-page.tsx`: the card is a mouse shortcut only, and the "View configuration" button inside it is the accessible way in.

Outside this change's scope and logged: `/agents/new` shows "Edit Agent", because the literal route has no `:id`. This predates the change.

## Task 3.2: final gate (orchestrator, 2026-09-27, Node v24.16.0)
Full gate, run once after defects 1–3 were fixed:
- `npm run build`: ok
- `npm run typecheck`: ok
- `npm run lint`: 0 errors, 2 existing warnings
- `npm test`: 399/399 (43 files)
- `npm run test:e2e`: **308 passed, 1 failed.** The failure was app-pages › Flat 2.0 surfaces › agent-new (dark), `no <main> found`: the scan ran mid-transition, while light theme and every other route passed.
- `npm run test:visual`: 96 passed
- `npm run test:a11y`: 24 passed; axe found 2 violations in 1 rule (settings-skills `nested-interactive`, one per theme). That became defect 4.

After the defect 4 fix, one targeted check:
- `npm test`: 399/399
- typecheck: ok
- lint: 0 errors
- `npm run test:a11y`: 24 passed, **axe 0 violations across 0 rules, site-wide**
- `npx playwright test e2e/app-pages.spec.ts`: **69 passed**, including agent-new (dark). That makes the earlier failure a one-off, not a product defect.

The live UAR smoke is **deferred by the operator** until after this phase, because UAR work is planned. It was not run.

## Review finding C1 (critical, fixed)
The Tab-through loop stopped when two neighbouring controls shared a tag and class string. Inactive settings nav links did, so page-body controls on the settings routes were never checked, and the test still passed with its weak `stops > 0` assertion.

- **Fix:** the loop compares element identity through a `data-e2e-tab-visited` marker, and stops only on a real revisit or at the end of the tab order.
- **Run after the fix:** `npx playwright test e2e/app-pages.spec.ts -g "Tab-through"` gave **8 passed**, with the corrected counts above and no outline violations. Every body control on the settings routes (for example "Add provider" and each provider card) is now checked.
