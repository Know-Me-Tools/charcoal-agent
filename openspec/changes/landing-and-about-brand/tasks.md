## 1. Design and copy

- [x] 1.1 (owner: km-creative-director) Write `docs/design/brand-pages.md`. It must cover:
  - the S2 → S1 reconciliation table from design.md decision 1, with every row resolved to a token and type role
  - the landing band order and the background token for each band in both themes, chosen so adjacent bands read as distinct in the light theme (see the design.md Risks)
  - hero composition at 320/768/1024/1440: lockup (56px), eyebrow, `h1` size and tracking, value-line width, composer at rest, focus and hover, and the send-control label or icon
  - the site header and footer bands
  - the About row layout
  - the 404 layout
  - focus treatment for every control

  Also report the `knowme-brand-standard` skill's wrong Brand Guide path (design.md Context) to its owner. Verify:
  - every colour in the doc names a token, with no hex
  - any new text-on-fill pair is added to `src/styles/tokens.test.ts`, and `npm test` passes
  - every S2 element in design.md decision 1 has a row
- [x] 1.2 (owner: km-chief-content-officer) Create the content modules:
  - `content/brand/taglines.ts`: `APPROVED_TAGLINES` holding the five Brand Guide v1.0 §11 strings verbatim, with the source file and line cited
  - `content/site/landing.ts`: eyebrow, the headline typed as a member of `APPROVED_TAGLINES` ("AI that understands you."), value line, nav and composer labels, and three sections `{ id, label, heading, body, faq? }` with no FAQ content
  - `content/site/about.ts`: heading, a D-004 explanation naming "KnowMe agent" and "Universal Agent Runtime", row labels, and the retained "KnowMe on the Universal Agent Runtime"
  - `content/site/not-found.ts`: heading, body, CTA label

  Write `docs/content/brand-pages-copy.md`, listing every item with its final text, the voice rule it meets, and an "Operator approval: <name>, <date>" line (design.md Q1). Verify:
  - `grep -rnE '!|revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge|[Cc]harcoal' content/` returns nothing
  - `grep -rnE "AI that knows|OS that learns" content/` returns nothing
  - the copy sheet has an approval line with a date, or the task stays open and archive is blocked

## 2. Pages

- [x] 2.1 (owner: km-frontend-engineer) Build the landing page and the shared site chrome, following `docs/design/brand-pages.md` and design.md decisions 1–7:
  - `src/components/site/{site-header,site-footer}.tsx`: nav lockup, a theme toggle with `aria-label` "Switch to {light|dark} theme", a non-ember "Open app" link, and a footer lockup with the legal line and `v{__APP_VERSION__}`
  - `src/pages/landing-page.tsx` rebuilt from `content/site/landing.ts`: hero `section` with the hero lockup, eyebrow, `h1` with one `text-ember-text` span, value line, and a flat composer whose named send button is always enabled (an empty submit focuses the field). Topic `section`s are labelled by their `h2`, alternate bands, and render FAQ as `h3` + `p`.
  - `vite.config.ts` defines `__APP_VERSION__` from `package.json`, declared in `src/vite-env.d.ts`
  - `tsconfig.app.json` includes `content`

  Verify:
  - `grep -nE "\bborder\b|border-[a-z]|shadow|gradient|backdrop-blur|ring-1|zinc-|slate-|gray-|bg-white|#[0-9a-fA-F]{6}|text-\[(9|10|11)(\.[0-9]+)?px\]|text-[a-z-]+/[0-9]+" src/pages/landing-page.tsx src/components/site/*.tsx` returns nothing, apart from `border-0`/`border-transparent`
  - `npm run typecheck` passes, and changing the headline in `content/site/landing.ts` to an unlisted string makes it fail (scratch check, then revert)
  - `npx playwright test e2e/brand.spec.ts` passes
- [x] 2.2 (owner: km-frontend-engineer) Restyle `src/pages/about-page.tsx` and `src/pages/NotFound.tsx`, following design.md decisions 8–9:
  - About: an `h1` from content, the explanation paragraph, flat `bg-surface` rows, the version from `__APP_VERSION__`, a wrapping endpoint, and `StatusBadge` for status
  - 404: site header and footer, an `h1` and body from content, and one ember `Button` rendering a router `Link` to `/`

  Verify:
  - the same grep over these two files returns nothing
  - `grep -rn "\"0\.1\.0\"\|v0\.1\.0" src/pages src/components/site` returns nothing
  - `npx playwright test e2e/brand.spec.ts` passes

## 3. Guard and regressions

- [x] 3.1 (owner: km-qa-engineer) Add the guard and regression tests:
  - Extend `src/test/flat-shell.test.ts` with a `describe` over `src/pages/{landing-page,about-page,NotFound}.tsx` and `src/components/site/*.tsx`, using the chat-only rules plus a `gradient` rule.
  - Add `src/test/brand-copy.test.ts`:
    - tagline-role fields are members of `APPROVED_TAGLINES`
    - there is no "!" and no banned or "charcoal" word in any content string
    - a fixture section with two FAQ items renders two `h3` elements with answers, and one with none renders no `h3`
  - Add `e2e/brand-pages.spec.ts`, covering every scenario in `specs/brand-pages/spec.md` that needs a browser:
    - a single `h1` equal to the primary tagline, and the value line
    - named regions
    - lockup mark widths
    - eyebrow and `h1` fonts
    - exactly one ember-text descendant in the `h1`
    - ember CTA counts per region against the resolved `--km-ember`, in both themes
    - empty send focuses the field
    - a prompt navigates to `/threads/<uuid>`
    - no rendered border, shadow, gradient or backdrop filter
    - adjacent band backgrounds differ
    - About version equals `package.json`, and the status label differs when `/healthz` returns 503
    - the endpoint is unclipped at 320
    - 404 has one `h1` and a client-side return home
    - `scrollWidth <= 320` for the three routes in both themes
    - named theme toggle and send control

  Update the `e2e/support/routes.ts` ready texts if headings changed. Verify:
  - `npx vitest run src/test/flat-shell.test.ts src/test/brand-copy.test.ts` and `npx playwright test e2e/brand-pages.spec.ts` pass
  - a scratch revert makes each suite fail, and each result is recorded in the task note before the revert is undone:
    - re-adding `border border-border` to one landing section fails the guard
    - an unlisted headline fails `brand-copy`
    - a second `bg-primary` link in the hero fails the CTA-count test

## 4. Verification

- [ ] 4.1 (owner: km-qa-engineer) Full gate. Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`. Then run `npm run test:visual` and review all 24 captures (`landing`, `settings-about` and `not-found` × 320/768/1024/1440 × dark/light) against `docs/design/brand-pages.md` and S1 §12 "Visual". Then run `npm run test:a11y`. Record the commands, outputs, capture paths, review notes and the axe delta against the baseline (landing `button-name` ×1 in each theme) in `docs/qa/landing-and-about-brand.md`. Verify:
  - all commands exit 0
  - `test-results/a11y/{landing,settings-about,not-found}__{dark,light}.json` report zero violations
  - light-theme captures show adjacent landing bands as distinct
  - any failure traced to a token value is filed to km-creative-director and recorded as unmet, not waived
- [ ] 4.2 (owner: km-product-owner) Write `openspec/changes/landing-and-about-brand/verification.md` from the QA evidence. It maps each spec scenario to its evidence (test name, capture path, axe file, or the dated operator approval line) and lists every unmet criterion. It must not claim any SEO or crawlability effect (design.md Risks). Then run an independent review with the `artifact-critic` subagent or `adversarial-review --mode diff`, and record its findings. Verify:
  - every scenario in `specs/brand-pages/spec.md` has evidence or is marked unmet
  - the copy approval line exists
  - the review reports no CRITICAL findings, or they are fixed and re-reviewed before archive
