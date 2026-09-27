## ADDED Requirements

### Requirement: Landing page document structure
The landing page SHALL be a semantic document that can later be served as static, crawlable HTML without restructuring. It SHALL have:
- exactly one `h1`
- a value-line paragraph immediately after the `h1`
- one `main` landmark
- one `section` element per content topic, each with an accessible name taken from its own `h2`

A content section SHALL be able to hold optional FAQ items. Each item SHALL render as a question heading one level below the section heading, followed by its answer text.

#### Scenario: One real h1 and a value line
- **WHEN** the landing page `/` is loaded at 1440×900
- **THEN** `document.querySelectorAll("h1").length` is 1
- **AND** the `h1` lies inside `main`
- **AND** the next element sibling of the `h1` (or of its hero heading group) is a `p` with non-empty text

#### Scenario: Topic sections are named by their headings
- **WHEN** the landing page is loaded
- **THEN** every `section` inside `main` other than the hero has `aria-labelledby` pointing at an `h2` inside that section
- **AND** Playwright `getByRole("region", { name })` resolves each of those sections by its `h2` text

#### Scenario: FAQ items render as question headings
- **WHEN** a landing content section is rendered with two FAQ items in a unit test (Testing Library, fixture content)
- **THEN** two `h3` elements carry the question texts inside that section, each followed by its answer text
- **AND** with zero FAQ items, no `h3` is rendered in that section

### Requirement: Approved taglines only
Every tagline-role text on the landing page SHALL be taken verbatim from the approved tagline list in Brand Guide v1.0 §11:
- "AI that understands you."
- "Your personal intelligence."
- "Deeply personal AI."
- "Know yourself. Grow yourself."
- "Intelligence, intimate."

Tagline-role text means the hero headline and any text styled or labelled as a tagline. The hero headline SHALL be the primary tagline, "AI that understands you.". No other slogan-style line SHALL appear.

#### Scenario: Hero headline is the primary tagline
- **WHEN** the landing page is loaded in either theme
- **THEN** the `h1` text content, with whitespace collapsed, equals "AI that understands you."

#### Scenario: Content modules use only listed taglines
- **WHEN** the brand copy unit test reads the landing content module
- **THEN** every field marked as tagline-role is a member of the approved tagline list, compared by exact string

#### Scenario: Retired slogans are gone
- **WHEN** `grep -rniE "AI that knows|OS that learns you" src content index.html` is run
- **THEN** it returns nothing

### Requirement: Brand template rhythm
The landing page SHALL follow the S2 brand-template order: nav lockup, then hero, then content sections, then footer. Where S2 conflicts with the binding UI/UX standard (S1), S1 wins, and WCAG AA wins over both (D-007). Specifically:
- The nav SHALL show the KnowMe lockup with a mark of at least 24px.
- The hero SHALL show a lockup whose mark is 52–72px, a monospace eyebrow of at least 12px, and a Space Grotesk `h1` with exactly one ember-accented text run.
- The footer SHALL show the footer lockup and "© 2026 KnowMe AI, LLC".

#### Scenario: Nav and hero lockups at brand sizes
- **WHEN** the landing page is loaded at 320, 768, 1024 and 1440 px wide
- **THEN** the nav lockup's mark `svg` has a rendered width of at least 24px
- **AND** the hero lockup's mark `svg` has a rendered width between 52px and 72px inclusive

#### Scenario: Eyebrow and display headline
- **WHEN** the landing page is loaded
- **THEN** the hero eyebrow's computed `font-family` starts with "JetBrains Mono" and its computed `font-size` is at least 12px
- **AND** the `h1` computed `font-family` starts with "Space Grotesk"

#### Scenario: Single ember accent in the headline
- **WHEN** the landing page is loaded in the light and in the dark theme
- **THEN** exactly one descendant of the `h1` has a computed `color` equal to the resolved `--km-ember-text` value for that theme, and the `h1` element itself does not

#### Scenario: Footer lockup and legal line
- **WHEN** the landing page footer is shown
- **THEN** it contains the KnowMe footer lockup and the text "© 2026 KnowMe AI, LLC"
- **AND** it contains the app version equal to the `version` field of `package.json`

### Requirement: One ember primary action per section
Each landing view SHALL have at most one ember-filled call to action. An ember-filled CTA is an `a` or `button` whose computed `background-color` equals the resolved `--km-ember` value. The rules are:
- The hero SHALL contain exactly one ember-filled CTA, and it SHALL be enabled on first load.
- Every other landing `section` SHALL contain at most one.
- The nav and footer SHALL contain none.
- The not-found page SHALL contain exactly one.

#### Scenario: Hero has exactly one enabled ember CTA
- **WHEN** the landing page is loaded in either theme, with nothing typed
- **THEN** exactly one element inside the hero matches the ember-filled CTA definition
- **AND** it has an accessible name and is not `disabled`

#### Scenario: Other regions do not compete
- **WHEN** the landing page is loaded in either theme
- **THEN** the nav and footer contain zero ember-filled CTAs, and every other `section` in `main` contains at most one

#### Scenario: Empty send does not navigate
- **WHEN** the hero CTA is activated with an empty prompt
- **THEN** the URL stays `/`, no thread is registered, and keyboard focus moves to the prompt field

#### Scenario: Prompt starts a conversation
- **WHEN** the user types a prompt in the hero prompt field and activates the hero CTA
- **THEN** the app navigates to `/threads/<uuid>` and the prompt is sent as the first message, as the landing page does today

### Requirement: Flat 2.0 on the brand pages
The landing, About and not-found pages SHALL separate regions only by background tokens. They SHALL have no borders, divider lines, drop shadows, gradients, backdrop blur, raw palette classes, hard-coded hex colours, text below 12px or opacity-dimmed text colours. Adjacent landing regions (nav, hero, each section, footer) SHALL use different background tokens.

#### Scenario: No banned treatments in page source
- **WHEN** the Flat 2.0 guard scans `src/pages/landing-page.tsx`, `src/pages/about-page.tsx`, `src/pages/NotFound.tsx` and the shared site chrome components
- **THEN** it finds no border, divider, shadow, gradient, `backdrop-blur`, `ring-1`, raw palette class, `bg-white`, six-digit hex colour, `text-[<12px]` size or `text-*/NN` opacity colour

#### Scenario: No rendered borders, shadows or gradients
- **WHEN** each of `/`, `/settings/about` and `/does-not-exist` is loaded in both themes
- **THEN** no element inside `main`, the page nav or the page footer has a non-zero border width with a non-transparent border colour
- **AND** no such element has a `box-shadow` other than `none`, a `background-image` containing `gradient`, or a `backdrop-filter` other than `none`

#### Scenario: Adjacent landing regions differ by background
- **WHEN** the landing page is loaded in either theme
- **THEN** the computed `background-color` of each top-level region (nav, hero, each content section, footer) differs from that of the region directly before it

### Requirement: Brand voice in page copy
Copy on the landing, About and not-found pages SHALL follow the Brand Guide §02 voice rules:
- no exclamation marks
- none of the words "revolutionary", "game-changing", "cutting-edge", "unlock", "unleash" or "supercharge"
- no mention of "Charcoal"

Non-tagline copy SHALL carry operator approval before the change is archived.

#### Scenario: Content modules pass the voice check
- **WHEN** the brand copy unit test walks every string in the landing, About and not-found content modules
- **THEN** none contains "!" and none matches `/revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge|charcoal/i`

#### Scenario: Copy approval is recorded
- **WHEN** the change is verified for archive
- **THEN** `docs/content/brand-pages-copy.md` lists every copy item on the three pages with its final text and an operator approval line with a date

### Requirement: About explains the product and runtime
The About page SHALL state, in its own copy, that KnowMe is the product and that the KnowMe agent runs on a Universal Agent Runtime instance (D-004). It SHALL show:
- the app version taken from `package.json` at build time
- the runtime connection status with a text label, not colour alone
- the full runtime endpoint
- "© 2026 KnowMe AI, LLC"

#### Scenario: Product and runtime explanation
- **WHEN** `/settings/about` is loaded
- **THEN** the page text contains "KnowMe on the Universal Agent Runtime" and a paragraph that names both "KnowMe agent" and "Universal Agent Runtime"
- **AND** it contains no "Charcoal"

#### Scenario: Version comes from package.json
- **WHEN** `/settings/about` is loaded
- **THEN** the version row shows exactly the `version` field of `package.json`
- **AND** `grep -rn "\"0\.1\.0\"\|v0\.1\.0" src/pages` returns nothing

#### Scenario: Runtime status is not colour-only
- **WHEN** the runtime is reachable, and separately when it is unreachable (UAR mock returns 503 for `/healthz`)
- **THEN** the status row shows a text label that differs between the two states

#### Scenario: Endpoint is readable at 320px
- **WHEN** `/settings/about` is loaded at 320px wide
- **THEN** the full runtime endpoint text is visible with no ellipsis (`scrollWidth <= clientWidth` on its element) and the document does not scroll horizontally

### Requirement: Not-found page
The not-found page SHALL share the landing nav and footer. It SHALL show:
- a heading stating that the page was not found, with no exclamation mark
- one sentence of calm, plain copy
- exactly one ember CTA that returns to the landing page through client-side navigation

#### Scenario: Unknown route
- **WHEN** `/does-not-exist` is loaded
- **THEN** there is exactly one `h1`, whose text contains "not found" (case-insensitive) and no "!"
- **AND** the nav lockup and the footer legal line are shown

#### Scenario: Return home without a full reload
- **WHEN** the user activates the not-found page's CTA
- **THEN** the URL becomes `/` and the landing `h1` is shown without a document navigation. Playwright checks this with a `window` marker set before the click, which is still present after it.

### Requirement: Brand pages fit narrow viewports and pass accessibility checks
The landing, About and not-found pages SHALL NOT scroll horizontally at 320px in either theme. They SHALL pass automated accessibility checks in both themes. Every icon-only control SHALL have an accessible name, and the theme toggle SHALL name the action it performs.

#### Scenario: No horizontal scroll at 320px
- **WHEN** each of `/`, `/settings/about` and `/does-not-exist` is loaded at 320×900 in the light and in the dark theme
- **THEN** `document.documentElement.scrollWidth <= 320`

#### Scenario: Axe on the brand pages
- **WHEN** `npm run test:a11y` scans the `landing`, `settings-about` and `not-found` routes in both themes
- **THEN** `test-results/a11y/{landing,settings-about,not-found}__{dark,light}.json` each report zero violations, including `button-name` and `color-contrast`

#### Scenario: Named icon-only controls
- **WHEN** the landing page is loaded in the dark theme
- **THEN** `getByRole("button", { name: /switch to light theme/i })` and the hero CTA `getByRole("button", { name: /send|start/i })` each resolve to exactly one element

#### Scenario: Captures at four widths in both themes
- **WHEN** `npm run test:visual` runs
- **THEN** captures exist for `landing`, `settings-about` and `not-found` at 320, 768, 1024 and 1440 in dark and light (24 images)
- **AND** each is reviewed against `docs/design/brand-pages.md`, with notes in `docs/qa/landing-and-about-brand.md`
