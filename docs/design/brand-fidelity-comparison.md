# Brand fidelity: reference comparison

Owner: km-creative-director. Change: `openspec/changes/brand-fidelity-audit`, task 2.1 (design.md decision 5).
Consumer: km-qa-engineer. design.md decision 5 puts this table in `docs/qa/brand-fidelity-audit.md`, which is outside km-creative-director's owned paths. km-qa-engineer copies or links this file there.

## Method

- **Captures.** `e2e/__goldens__/<route>-<width>-<theme>-darwin.png`, as committed at `66b9233`. Every route was read at 1440 and 320 in dark and light: 12 routes, 48 images. The goldens were not regenerated and Playwright was not run.
- **References.**
  - S1: `know-me-system/docs/knowme-ui-ux-standard.md`, as summarised in the `knowme-brand-standard` skill.
  - S2: `branding/knowme-brand-template.html` and the Brand Guide, reconciled row by row in `docs/design/brand-pages.md` §2.
  - S3: design.md does not define S3. This comparison uses the project's standing definition from `openspec/changes/archive/2026-09-24-knowme-brand-tokens/design.md`: `know-me-system/desktop/src/index.css`, the reference Tailwind 4 and shadcn mapping. That source covers tokens and surfaces only.
  - `docs/design/brand-pages.md`, which is authoritative for the landing, About and not-found pages.
- **Checks per row.**
  - T: tokens and surfaces (surface ladder, `band` use)
  - Y: type roles and scale
  - L: the lockup, its sizes and its clear space
  - E: one ember primary per section
  - F: Flat 2.0 (no borders, shadows, gradients or blur; no opacity colours)
  - S: spacing rhythm, including overflow at 320
  - P: dark and light parity
  - G: tagline use
- **Verdicts** (decision 5):
  - **match**
  - **accepted deviation**, with its decision id
  - **defect**, routed per decision 2. None of the defects falls inside the fix-up budget and km-creative-director's owned paths (see "Fixes" below), so each one is a follow-up.
- **Severity.**
  - **Major:** a visible break in the brand or the layout at a tested width or theme, such as overlap, clipping, a control that renders wrong, or an element that disappears in one theme.
  - **Minor:** a departure from the standard that does not break the page.

## Per-route verdict

| Route | T | Y | L | E | F | S | P | G | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| landing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **match**; accepted deviation A1 (D-007) |
| not-found | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | **match**; accepted deviation A1 (D-007) |
| threads | ✓ | ✓ | minor | ✓ | minor | ✓ | ✓ | n/a | **minor deviations**: D8, D11; accepted A3 |
| thread | ✓ | minor | ✓ | ✓ | minor | ✓ | ✓ | n/a | **minor deviations**: D8, D10; accepted A2, A3, A4 |
| agents | ✗ | ✓ | ✓ | minor | ✓ | ✓ | ✗ | n/a | **defect**: D5 (major); minor D12 |
| agent-detail | ✓ | ✓ | ✓ | ✓ | ✓ | capture | ✓ | n/a | **match**; capture note D9 |
| agent-new | ✓ | ✓ | ✓ | ✓ | minor | capture | ✓ | n/a | **minor deviation**: D8; capture note D9 |
| settings-about | ✓ | ✓ | ✓ | ✓ | ✓ | minor | ✓ | n/a | **minor deviations**: D6, D7 |
| settings-account | ✗ | ✓ | ✓ | ✓ | ✓ | minor | ✗ | n/a | **defect**: D5 (major); minor D7 |
| settings-appearance | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | n/a | **defect**: D3 (major); minor D6 |
| settings-providers | ✗ | ✓ | ✓ | ✓ | minor | ✗ | ✗ | n/a | **defect**: D1, D5 (major); minor D6, D13 |
| settings-skills | ✗ | ✓ | ✓ | minor | ✗ | ✗ | ✗ | n/a | **defect**: D2, D4, D5 (major); minor D6, D12 |

### What matched everywhere

- **Lockup.** The nav lockup is the 28px mark with "Know" plus ember "Me" on every app and brand route, in both themes. The landing hero lockup is 56px, within the Wordmark System's 52–72px, with clear space above the eyebrow. The footer lockup is 24px. The About lockup is decorative and its size is correct. No logo is drawn as text.
- **Surface ladder.** Chrome, canvas and band alternate as `brand-pages.md` §3 specifies on the landing, including the odd/even band rule and a chrome footer. In the app, the top bar and sidebars are `bg-chrome`, the main area is canvas, and cards are `bg-band`. No borders, shadows, gradients or blur appear in any app chrome.
- **Type roles.**
  - Space Grotesk carries the `h1`/`h2` titles.
  - Inter carries UI and controls.
  - JetBrains Mono carries eyebrows, IDs, endpoints and the legal line.
  - Roboto carries the landing prose.
  - No readable UI text falls below 12px, apart from D10.
- **Tagline.** "AI that understands you." appears once, as the landing `h1`, with the ember accent on "you." only.
- **Legal line.** "© 2026 KnowMe AI, LLC" appears on the landing, the 404 and About.
- **One ember primary per section.** Each section has at most one filled ember action:
  - landing: Send
  - 404: Back to KnowMe
  - agents: Create agent
  - agent-detail: Save agent
  - providers: Add provider
  - skills: Sync Built-ins
  - threads: New thread in the sidebar; Send is the composer's primary

## Deviations

Capture filenames drop the shared `e2e/__goldens__/` prefix and the `-darwin.png` suffix.

### Defects (major)

| Id | Deviation | Captures | Standard | Follow-up |
|---|---|---|---|---|
| D1 | **Provider rows overlap at 320.** "☆ Default" is drawn over the `openai` chip, and the `connected` badge sits on top of the `anthropic` chip. The row keeps its single-line desktop layout, and the metadata has no room. | settings-providers-320-dark, settings-providers-320-light | S1 §12 layout; brand-pages §4, no overflow at 320 | BFA-CD-01 → km-frontend-engineer (`src/pages/providers-page.tsx`): below `sm`, wrap the badges onto their own line |
| D2 | **Skills header overflows at 320.** "Rescan UAR" and "Sync Built-ins" stay beside the title, so "Sync Built-ins" is clipped at the right edge. The description is squeezed into a column about 95px wide, one or two words per line. | settings-skills-320-dark, settings-skills-320-light | no horizontal overflow at 320; S2 page-header stacks | BFA-CD-02 → km-frontend-engineer (`src/pages/skills-page.tsx`): stack the actions under the header below `sm`, the pattern the agents page already uses |
| D3 | **Appearance font-size row overflows at 320.** The "Comfortable" option runs past the 304px content edge and is clipped. | settings-appearance-320-dark, settings-appearance-320-light | no horizontal overflow at 320 | BFA-CD-03 → km-frontend-engineer (`src/pages/appearance-page.tsx`): three equal grid columns, `grid-cols-3`, instead of intrinsic widths |
| D4 | **The skill switch renders wrong.** In light, the white thumb sits outside the right end of the ember track. In dark, a checked switch shows no thumb at all. An unchecked switch in light shows only a stray thumb circle, because its track is invisible on the card. State is readable from colour alone, which S1 forbids. | settings-skills-1440-light, settings-skills-1440-dark, settings-skills-320-light, settings-skills-320-dark | S1 §3.2 status not colour-only; control geometry | BFA-CD-04 → km-frontend-engineer (switch primitive in `src/components/ui/`): fix the thumb translate for the track size, and give the unchecked track a fill that separates from `bg-band` |
| D5 | **Chips vanish on band cards in light.** `bg-muted-surface` chips and inline code sit on `bg-band` cards, and in light both tokens resolve to `#eef0f3`. The chip fill is invisible in light and visible in dark. This is the same band-in-band problem app-pages S2 fixed for the memory panel. Affected: agent skill tags, provider type chips, skill tool chips, and the account `VITE_UAR_API_KEY` code chip. | agents-1440-light, agents-320-light, settings-providers-1440-light, settings-skills-1440-light, settings-skills-320-light, settings-account-1440-light, settings-account-320-light (compare the `-dark` captures) | dark/light parity; S1 §3.2 adjacent areas differ by background token | BFA-CD-05 → km-frontend-engineer: on `bg-band`, use `bg-surface`, which app-pages decision 2 already allows. No new token is needed. A token-level fix in `tokens.css` would change every golden and is not proposed. |

### Minor

| Id | Deviation | Captures | Standard | Follow-up |
|---|---|---|---|---|
| D6 | **Settings sub-nav selection is neutral.** The selected item uses a grey or blue-grey fill. The top nav and bottom nav use `bg-ember-soft` with stronger text. | settings-about-1440-dark/light, settings-appearance-1440-dark/light, settings-providers-1440-dark/light, settings-skills-1440-dark/light and their 320 tab strips | skill: selection = `bg-ember-soft` + `aria-current` | BFA-CD-06 → km-frontend-engineer (settings layout nav) |
| D7 | **The 320 settings tab strip hides the current page.** On About, the "About" tab is scrolled out of view, so no tab looks selected. Account has no tab at all, so settings-account shows no location. | settings-about-320-dark/light, settings-account-320-dark/light | S1 wayfinding: selection is visible | BFA-CD-07 → km-frontend-engineer: scroll the active tab into view. km-product-owner decides whether Account gets a tab. |
| D8 | **Disabled ember controls use opacity.** "Create agent" before the form is valid, and the composer Send while it is empty, render as faded ember: salmon in light, brown in dark. | agent-new-1440-light/dark, agent-new-320-light/dark, threads-1440-light/dark, threads-320-light/dark, thread-1440-light/dark | brand-pages: no opacity-modified colours; S1 §4.4 | BFA-CD-08 → km-frontend-engineer: disabled uses `bg-muted-surface` + `text-faint`, not `disabled:opacity-50`. Decide in one place, in the Button and the composer send. |
| D10 | **Mermaid diagrams.** Nodes carry 1px outline strokes, a border in Flat 2.0 terms; the connector lines are acceptable as data marks. At 320 the SVG scales down until node labels are far below 12px. | thread-1440-dark/light, thread-320-dark/light | S1 §3.3; 12px floor | BFA-CD-10 → km-frontend-engineer: filled nodes (`--km-raised`) with no stroke in the Mermaid theme variables. At narrow widths, keep the SVG at its natural size and scroll it horizontally inside the block. |
| D11 | **The threads empty-state hero sets "KnowMe" as plain text.** It uses Space Grotesk with no ember "Me" under a mark placed in a filled tile. It reads as a second, off-spec wordmark. | threads-1440-dark/light, threads-320-dark/light | skill: marks come from `components/brand`; the wordmark is Know + ember Me | BFA-CD-11 → km-frontend-engineer: use `KnowMeLockup` (stacked or horizontal hero variant), or drop the name, which the nav lockup already announces. The name must still be announced only once. |
| D12 | **Ember as decoration.** Skills cards pair nine ember toggles with ember wrench icons and ember "BUILT-IN" labels. Agent cards put ember robot icons in ember-soft tiles. Every section still has one filled primary, but ember is diluted as "the action colour". | settings-skills-1440-dark/light, agents-1440-dark/light | S1 §12 restraint; ember = brand and primary action | BFA-CD-12 → km-frontend-engineer: icons in `text-fg-secondary`; "BUILT-IN" in `text-fg-secondary` mono; keep ember for the checked switch and the CTA only |
| D13 | **Provider rows lead with a coloured dot** that repeats the status badge's meaning in colour alone. | settings-providers-1440-dark/light, settings-providers-320-dark/light | S1 status never colour-only; the badge already carries it | BFA-CD-13 → km-frontend-engineer: remove the leading dot |

### Capture note (not a UI defect)

| Id | Note | Captures | Follow-up |
|---|---|---|---|
| D9 | Full-page screenshots of scrolling 320 routes paint the fixed bottom nav mid-page, over the skills list. The goldens therefore do not show whether the last rows sit clear of the nav when scrolled to the bottom. They do show "Save agent" and "Create agent" below it, which suggests the padding is present. | agent-detail-320-dark/light, agent-new-320-dark/light, settings-skills-320-dark/light | BFA-CD-09 → km-qa-engineer: capture viewport-height frames at scroll-top and scroll-bottom for these routes, or hide `position: fixed` chrome in full-page shots. Either way the goldens are regenerated, which is km-qa-engineer's call. |

### Accepted deviations

| Id | Deviation | Captures | Decision |
|---|---|---|---|
| A1 | Ember fills carry dark text (`text-primary-foreground`) rather than S2 `.btn-primary`'s white text | landing-1440-light, not-found-1440-light (all themes) | **D-007**: white on ember fails 4.5:1; AA wins over verbatim brand values |
| A2 | The HTML artifact preview renders white with browser-default serif in dark theme; code blocks use the Shiki palette | thread-1440-dark, thread-320-dark | **D-007 scope / content boundary**: sandboxed user content and syntax colours are content, not UI chrome. The Flat 2.0 guard excludes them. |
| A3 | The composer shows a 2px ember outline at rest | threads-1440-dark/light, threads-320-dark/light, thread-1440-dark/light | Not a deviation: the capture is taken with the composer autofocused. This is the documented keyboard/programmatic focus state (chat-surfaces; brand-pages §6.3, "Focus (any input method)"). |
| A4 | The "Rebrand palette swatch" image renders as alt text on an empty strip | thread-1440-dark/light, thread-320-dark/light | Fixture asset, not brand UI. The alt-text fallback is correct. km-qa-engineer may point the fixture at a real asset (BFA-CD-14). |

### Copy observations (routed to km-chief-content-officer; not a visual verdict)

- **Title case** against the sentence-case voice: "Create Agent", "Per-user Settings", "System Prompt", "Font Size", "Sync Built-ins".
- **Implementation terms in user-facing UI:**
  - "JWT required" and `VITE_UAR_API_KEY` (settings-account)
  - "Rescan UAR" (settings-skills)
  - the RUNTIME/runtime label repeated on agent cards
- **Em-dashes** in skill descriptions (settings-skills) and in the thread fixture's assistant text.

Follow-up BFA-CD-15 → km-chief-content-officer.

## Fixes

None. Every defect is in files outside km-creative-director's owned paths:
- `src/pages/*`
- `src/components/ui/*`
- the settings layout
- the thread components

The one fix inside those paths would be a token change in `src/styles/tokens.css`, for D5 (for example, separating `--km-band` from `--km-muted` in light). It would:
- change the resolved background of every band, card and landing section
- alter the goldens on every route
- need a new `FILL_STEPS` calibration

That breaks the fix-up budget rule "no change to goldens on other routes". The page-level fix in BFA-CD-05 needs no new token and touches only the affected routes.

**Goldens.** BFA-CD-01 through BFA-CD-08 and BFA-CD-10 through BFA-CD-13 all change pixels on the routes they touch. BFA-CD-09 changes the capture method itself. Each of them requires regenerating the goldens for its routes: task 2.1's `--update-snapshots` run, owned by km-qa-engineer. None were regenerated here.

## Follow-up index

| Id | Severity | Owner | Routes |
|---|---|---|---|
| BFA-CD-01 | major | km-frontend-engineer | settings-providers |
| BFA-CD-02 | major | km-frontend-engineer | settings-skills |
| BFA-CD-03 | major | km-frontend-engineer | settings-appearance |
| BFA-CD-04 | major | km-frontend-engineer | settings-skills (and any Switch use) |
| BFA-CD-05 | major | km-frontend-engineer | agents, settings-providers, settings-skills, settings-account |
| BFA-CD-06 | minor | km-frontend-engineer | settings-* |
| BFA-CD-07 | minor | km-frontend-engineer, km-product-owner | settings-about, settings-account |
| BFA-CD-08 | minor | km-frontend-engineer | agent-new, threads, thread |
| BFA-CD-09 | capture | km-qa-engineer | agent-detail, agent-new, settings-skills |
| BFA-CD-10 | minor | km-frontend-engineer | thread |
| BFA-CD-11 | minor | km-frontend-engineer | threads |
| BFA-CD-12 | minor | km-frontend-engineer | settings-skills, agents |
| BFA-CD-13 | minor | km-frontend-engineer | settings-providers |
| BFA-CD-14 | fixture | km-qa-engineer | thread |
| BFA-CD-15 | copy | km-chief-content-officer | agent-new, settings-account, settings-appearance, settings-skills, agents |

## Unverified

- **768 and 1024.** These captures were not read. The brief's minimum was 1440 and 320.
- **Appearance "comfortable" setting.** Not captured. brand-pages §4 names it as the tightest fit on the landing.
- **D-007 contrast figures.** Taken from `brand-pages.md` and `tokens.test.ts` as recorded. They were not re-measured.
- **S3 comparison.** `know-me-system/desktop/src/index.css` was not re-read in this pass. The token and surface match rests on `tokens.css` and the tests that already guard it.
