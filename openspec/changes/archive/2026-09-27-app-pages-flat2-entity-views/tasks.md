## 1. Decision

- [x] 1.1 (owner: km-product-owner) Record the entity-component adoption decision (design.md decision 1) as a new D-entry in `.kbd-orchestrator/phases/complete-rebranding/decision-log.md`. It must name:
  - the four components and the package version (4.0.2)
  - the offending classes, with `index.mjs` and `index.d.ts` line references
  - the missing `CRUDState`/`UseEntityViewResult` data contract
  - the revisit condition
  - a draft upstream request

  Verify: the entry exists and cites every row of the design.md decision 1 table.

## 2. Build

- [x] 2.1 (owner: km-frontend-engineer) Restyle the in-scope pages and fix focus, following design.md decisions 2–3. No new tokens. Work:
  - `src/components/ui/button.tsx`: focus per decision 3
  - `src/pages/{threads,agents,agent-detail,providers,skills,appearance,user-settings,settings}-page.tsx`: `bg-band` groups, filled borderless inputs, rule-free rows, status tokens or `StatusBadge` with text cues, no sub-12px sizes, and D-004 settings copy
  - any page-local component those pages import that carries the same violations

  Keep every hook call and mutation unchanged. Before editing, record in this task note the request `/agents/new` sends today (expected `POST /api/compiler/compile`). Verify with static checks only (no test runs, per the phase rule):
  - `grep -rnE '(bg|text|ring|border)-(zinc|slate|gray|green|amber|blue|purple|red|orange)-[0-9]' src/pages` returns nothing
  - `grep -rnE 'text-\[(9|10|11)(\.[0-9]+)?px\]' src/pages` returns nothing
  - `grep -rnE 'EntityListView|EntityTable|EntityDetailSheet|EntityFormSheet' src` returns nothing
  - `grep -rni charcoal src/pages` returns only import paths or identifiers, not copy
  - `git --no-optional-locks diff --stat -- src/hooks src/lib` is empty

## 3. Tests and the final gate

- [x] 3.1 (owner: km-qa-engineer) Add the tests:
  - In `src/test/flat-shell.test.ts`, add a `describe` over the in-scope files using `RULES` plus the gradient rule.
  - Add `e2e/app-pages.spec.ts`, covering every browser scenario in `specs/app-pages/spec.md`:
    - route render
    - skill-state and save-confirmation text cues
    - computed font-size of at least 12px
    - no computed border, shadow, blur or gradient inside `main`
    - band background differs from the canvas in light theme
    - `scrollWidth <= 320`
    - a Tab-through asserting `outline-style` is not `none` and `outline-width` is at least 2px on every stop, with the stop count logged
    - the `Button` outline colour equals `--ring`
    - no "charcoal" text in settings
    - request method and path per CRUD scenario, captured with the mock's route log or `page.on("request")`

  Update `e2e/support/routes.ts` ready texts if headings changed. Record a scratch mutation for each suite in the task note, then revert it: re-add `outline-none` to `Button`, which must fail the Tab-through; add `border border-border` to one page, which must fail the guard. Verify: those two failures are observed and recorded.
- [x] 3.2 (owner: km-qa-engineer) Run the single final gate, once, after 2.1 and 3.1:
  - `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`
  - then `npm run test:visual`, reviewing the in-scope routes at 320 and 1440 in both themes
  - then `npm run test:a11y`
  - live UAR smoke only if one answers at `127.0.0.1:6565`: `INTEGRATION_UAR_URL=http://127.0.0.1:6565 npx vitest run src/test/skills-sync.integration.test.ts` plus a manual provider add/delete. If no UAR answers, record "not run: no UAR reachable".

  Record the commands, outputs, capture paths and the axe delta in `docs/qa/app-pages-flat2-entity-views.md`. Verify:
  - all commands exit 0
  - axe reports zero violations on the in-scope routes in both themes
  - any failure outside the in-scope routes caused by the `Button` change is sent back to 2.1 and not waived

## 4. Verification and review

- [x] 4.1 (owner: km-product-owner) Write `openspec/changes/app-pages-flat2-entity-views/verification.md` from the QA evidence, mapping each spec scenario to a test name, capture path, grep output or decision-log entry. List every unmet criterion, and state whether the live UAR smoke ran. Then run one independent review, with the `artifact-critic` subagent or `adversarial-review --mode diff`, and record its findings. Verify:
  - every scenario has evidence or is marked unmet
  - the review reports no CRITICAL findings, or they are fixed and re-reviewed before archive
