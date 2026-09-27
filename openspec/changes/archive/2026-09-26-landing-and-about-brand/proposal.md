## Why

The three pages people see before (or instead of) the app still carry the pre-rebrand treatment and copy that the brand does not approve:

- **Unapproved headline and slogan.** The landing hero says "AI that knows you." under the eyebrow "// An OS that learns you". Neither is in the approved tagline list (Brand Guide v1.0 §11). The approved primary tagline, "AI that understands you.", is already the page's `<title>` and social description, so the page contradicts its own metadata.
- **Flat 2.0 violations.** The landing composer, the four feature cards, the features band and the footer use `border`, `shadow-lg` and `bg-card` outlines. About uses four bordered rows. 404 uses `bg-muted` and a raw `hover:text-primary/90` opacity colour. Standard S1 §3.3 bans all of these.
- **Type below the 12px floor.** The landing composer hint is `text-[10px]` and its link is `text-[11px]` (S1 §4.2).
- **An accessibility failure that blocks the phase gate.** axe reports `button-name` (critical) on the landing page in both themes. The icon-only send button has no accessible name (`test-results/a11y/landing__{dark,light}.json`; plan.md "Findings from execution").
- **Two ember primary actions in the hero view.** The nav "Open app" link and the send button are both ember-filled, which breaks the "one ember primary CTA per view" rule in plan item 10.
- **Off-voice 404 copy.** The 404 says "Oops! Page not found". The Brand Guide §02 bans exclamation marks used for energy.
- **Version drift.** The version is hard-coded in two places (`about-page.tsx` `"0.1.0"`, landing footer `"v0.1.0"`) instead of coming from `package.json`.

The operator decided on 2026-09-26 (`.prometheus/decisions.md`, "Restyle now, concept later"): this change does the brand restyle now, and it shapes the landing copy so it can later become the crawlable static layer of the chat-led marketing site. That site is its own later phase.

## What Changes

- **Landing page, rebuilt to the S2 brand-template rhythm, reconciled with S1 Flat 2.0.** The page has these parts:
  - a nav lockup on the chrome surface, with a named theme toggle and a non-ember "Open app" link
  - a hero with a 52–72px lockup, a mono eyebrow, and a Space Grotesk `h1` set to the approved tagline "AI that understands you.", with a single ember accent on "you."
  - a value line under the `h1`
  - the existing prompt composer as a flat filled surface, whose named send button is the hero's single ember CTA
  - content sections as full-bleed bands on alternating background tokens, with no card outlines and no gradients
  - a footer lockup with "© 2026 KnowMe AI, LLC" and the app version
- **Crawlable-ready structure (no prerendering yet).** The landing has one real `h1`, a value-line paragraph, and one `<section>` per topic, each named by its `h2`. A section can optionally hold FAQ items, rendered as question headings with answers. No FAQ content ships in this change.
- **Copy moves into content modules** owned by the content officer, under `content/`:
  - the approved tagline list, verbatim with its source
  - landing, About and 404 copy

  Every tagline-role string comes from the approved list. All other copy follows the voice rules and needs operator approval before archive.
- **About page (`/settings/about`).** It gets a short explanation of the product and runtime per D-004: KnowMe is the product, and the KnowMe agent runs on a Universal Agent Runtime instance. It keeps the version, runtime status (with a text label) and runtime endpoint rows, now on flat surface rows. The version comes from `package.json` at build time, and the endpoint wraps instead of truncating.
- **404 page.** It shares the landing nav and footer. It has a calm heading and body with no exclamation mark, one ember CTA back to the landing page, and client-side navigation.
- **Accessibility.** Every icon-only control on these pages gets an accessible name, which fixes the landing `button-name` violation.
- **Guard and tests.**
  - The Flat 2.0 guard (`src/test/flat-shell.test.ts`) extends to the three pages and the shared site chrome.
  - A unit test pins the tagline and voice rules on the content modules.
  - A new e2e spec covers structure, the CTA count, 320px overflow and the About facts.

## Non-goals

These belong to the later chat-led marketing-site phase (see the `agent-led-marketing-site` skill):
- the concierge agent on UAR
- prerendering or SSR of marketing routes
- AI disclosure
- crawler policy (`robots.txt`, `llms.txt`, sitemap)
- structured data (JSON-LD)
- per-route meta tags
- rate limits and cost caps
- analytics

Also not covered here:
- writing FAQ content
- moving About out of `/settings`
- a runtime version on About (UAR `/healthz` returns an empty body, so there is no version to show)
- changes to the lockup component geometry
- token value changes, unless the QA gate traces a contrast failure to a token, in which case it goes back to the creative director

## Capabilities

### New Capabilities
- `brand-pages`: the landing page, the About page and the not-found page. Covers their brand-template structure, approved-tagline and voice rules, single ember CTA, Flat 2.0 treatment, narrow-viewport behaviour and accessibility.

### Modified Capabilities
None.
- `brand-identity` keeps its requirements. Its "Legal line" scenario ("© 2026 KnowMe AI, LLC" on the landing footer and About) and "Browser and social identity" stay as they are and are re-checked by the gate.
- `brand-theme` (tokens and contrast) and `app-shell` (the settings shell that frames About) do not change requirements.

## Impact

- **Code (km-frontend-engineer):**
  - `src/pages/landing-page.tsx`, `src/pages/about-page.tsx`, `src/pages/NotFound.tsx`
  - a new shared site nav/footer under `src/components/site/`
  - `vite.config.ts` (a build-time app version define) with its type declaration
  - `tsconfig.app.json` (include `content/`)
- **Content (km-chief-content-officer):** `content/brand/taglines.ts`, `content/site/{landing,about,not-found}.ts`, and the copy sheet `docs/content/brand-pages-copy.md`.
- **Design (km-creative-director):** `docs/design/brand-pages.md`. Token additions in `src/styles/tokens.css` only if a new text/fill pair is needed, with a `tokens.test.ts` pair.
- **Tests (km-qa-engineer):**
  - `src/test/flat-shell.test.ts`
  - a new `src/test/brand-copy.test.ts`
  - a new `e2e/brand-pages.spec.ts`
  - `e2e/support/routes.ts` ready texts if headings change
  - `docs/qa/landing-and-about-brand.md`
- **Data, APIs, storage:** no change. The landing composer keeps its current behaviour: register an ephemeral thread, set the pending prompt, navigate. D-005 identifiers are untouched.
- **Existing tests that must keep passing:** `e2e/brand.spec.ts`, which checks the legal line on the landing page and About, "KnowMe on the Universal Agent Runtime" on About, and the head metadata tagline. Also `src/test/brand-naming.test.ts`.
