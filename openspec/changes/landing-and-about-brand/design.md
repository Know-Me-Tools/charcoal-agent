## Context

See proposal.md for the motivation.

### Binding sources, in order of precedence

1. **WCAG 2.2 AA.** D-007: where a brand colour fails AA as text, use its text-safe token variant.
2. **S1 standard.** `/Users/gqadonis/Projects/know-me/know-me-system/docs/knowme-ui-ux-standard.md`:
   - §3.1–3.4: Flat 2.0, section separation by "spacing or alternating surface tokens", the surface ladder
   - §4.1: colour roles
   - §4.2: type roles and the 12px floor
   - §4.3: the wordmark is "Know" + ember "Me"
   - §11: accessibility
   - §12: visual acceptance
3. **S2 brand template and guide.** `/Users/gqadonis/Projects/know-me/branding/`:
   - `knowme-brand-template.html`:
     - nav (`.nav`, L137; markup L850–873)
     - page header (`.page-header` / `.eyebrow` / `.page-title` / `.page-title em` / `.page-lead`, L241–282; markup L888–897)
     - section (`.section` / `.section-label` / `.section-title`, L304–330; markup L904–1016)
     - footer (`.doc-footer`, L779; markup L1049–1064)
   - `knowme-brand-guide.html`:
     - §02 Voice & Tone (L1017–1060)
     - Logo Usage, "Minimum size: 16px for favicon, 24px for nav, 52px for hero" (L1253+)
     - §11 Approved Taglines (L1546–1575)
   - Wordmark System v1.0, §08 Lockup Specifications (in-repo copy `docs/xhtml-docs/knowme-wordmark-system.html`):
     - Hero / Landing: icon 52–72px, type 32–36px, gap 16–20px
     - Navigation: icon 28px, type 18px
     - Footer: icon 24px, type 16px
4. **Decisions** in `.kbd-orchestrator/phases/complete-rebranding/decision-log.md`:
   - D-001: "KnowMe AI, LLC" overrides S2's "KnowMe, LLC"
   - D-004: KnowMe agent on a Universal Agent Runtime instance, no "Charcoal Agent"
   - D-005: internal identifiers unchanged
   - D-007: AA wins

   Also the operator decision of 2026-09-26 in `.prometheus/decisions.md`: "restyle now, concept later".

**Path discrepancy.** The `knowme-brand-standard` skill says the Brand Guide lives in `../know-me-system/docs/`. It actually lives in `/Users/gqadonis/Projects/know-me/branding/` (plan.md "S2"). The skill file is outside this change's owned paths. This is reported to the creative director, who should correct it.

### Current state

- `landing-page.tsx` (188 lines) renders:
  - a header with the nav lockup, an unnamed-by-`aria` theme toggle (it has only a `title`) and an ember "Open app" link
  - a centred hero with an eyebrow "// An OS that learns you", an `h1` "AI that knows you.", a value line, and a bordered, shadowed prompt card whose icon-only ember send button is disabled when empty
  - a bordered band of four bordered feature cards in Title Case
  - a bordered footer with the lockup and "© 2026 KnowMe AI, LLC · v0.1.0"
- `about-page.tsx` renders four bordered rows and a hard-coded `APP_VERSION`.
- `NotFound.tsx` renders unbranded "Oops! Page not found" on `bg-muted`, with a full-reload `<a href="/">`.
- Brand components already exist:
  - `KnowMeLockup` variants `nav` (mark 28), `footer` (24) and `hero` (56, within 52–72)
  - `KnowMeMark`, `KnowMeWordmark`
- Tokens: `--km-ember`, `--km-ember-text` and `--km-on-ember` are AA-tuned in both themes (`src/styles/tokens.css`).
- The `section-label` utility is already 12px mono in `text-ember-text` (`src/index.css`).
- The visual harness already lists `landing`, `settings-about` and `not-found` in `e2e/support/routes.ts`. The landing ready text `/AI that/i` still matches the new `h1`.

### Goals
- The three pages pass the extended Flat 2.0 guard and axe with zero violations in both themes.
- The landing becomes a semantic document shaped for the future static layer.
- All copy comes from content modules, with taglines pinned to the approved list.

### Non-goals (design level)
- No prerender, SSR or route-level meta.
- No new routes.
- No change to the composer's thread/intent behaviour, beyond the empty-send focus handling in decision 5.
- No lockup geometry changes.
- No token value changes unless the gate traces a contrast failure to a token.

## Decisions

1. **Reconcile S2 with S1 element by element.** The creative director's `docs/design/brand-pages.md` is authoritative and may refine the treatments. The rows are fixed as a set: each S2 element is either kept or replaced as listed.

   | S2 element (template) | S2 treatment | Treatment here | Why |
   |---|---|---|---|
   | `.nav` | sticky, `backdrop-filter: blur(16px)`, `border-bottom`, 22px mark | `bg-chrome` band, not sticky, `KnowMeLockup variant="nav"` (28px) | S1 §3.3 bans blur and rules; Wordmark System nav is 28px, and the Brand Guide minimum for nav is 24px |
   | `.mode-toggle` | text "LIGHT/DARK" button | icon button with `aria-label` "Switch to light theme" / "Switch to dark theme" | S1 §11: icon-only controls are named |
   | `.page-header` | `border-bottom` | no rule, separated by the next band's background | S1 §3.2 |
   | Hero lockup | (stacked lockup in the guide) | `KnowMeLockup variant="hero"` (56px mark) | Wordmark System §08: 52–72px |
   | `.eyebrow` | JetBrains Mono **10px**, `color: var(--ember)` | `section-label` utility: mono 12px, `text-ember-text` | S1 §4.2 12px floor; D-007 (ember on the light canvas is 3.48:1) |
   | `.page-title` + `em` | Space Grotesk 700, `clamp(32px,5vw,52px)`, −0.035em, ember `em` | `h1` in `font-display`, the approved tagline, one `<span>` in `text-ember-text` around "you." | the plan's "single ember accent"; D-007 |
   | `.page-lead` | Roboto 300, 16px, `--fg-muted`, 58ch | value line in `font-body`, 16–17px, `text-fg-secondary`, max ~58ch | S1 §4.2 body 15–17 |
   | `.meta-chip` | bordered 10px chips | not used on the landing | S1 §3.3, §4.2 |
   | `.section-label` | 10px mono, `border-bottom` | `section-label` utility, no rule | S1 §3.3, §4.2 |
   | `.section` | stacked on one canvas | full-bleed bands alternating two background tokens (the creative director picks the pair; see Risks) | S1 §3.2 "alternating surface tokens" |
   | Card grid | bordered cards | no cards; a section is prose plus optional FAQ | S1 §3.3 "no card outlines" |
   | `.btn-primary` hover | `opacity .88; translateY(-1px)` | the global `Button` default (ember fill, `on-ember` text, hover token) | Flat 2.0 motion is a background shift (S1 §4.4) |
   | `.doc-footer` | `border-top`, 10px mono text, "KnowMe, LLC" | `bg-chrome` (or the creative director's choice) band, `KnowMeLockup variant="footer"`, 12px mono "© 2026 KnowMe AI, LLC · v<version>" | S1 §3.3, §4.2; D-001 |

   **Source conflict, noted but not reopened.** The Brand Guide's Logo Rules say "Do not use the ember accent version in UI chrome (nav, footer)". S1 §4.3 defines the wordmark itself as "Know" + ember "Me", and the S2 template's own nav uses the ember node. knowme-brand-identity already shipped the ember-node lockup in the nav under S1 precedence, and this change does not revisit it.

2. **The hero `h1` is the primary tagline.** "AI that understands you." is the Brand Guide §02 "Hero copy" example and the §11 "Primary — all contexts" tagline, and `index.html` already uses it. Using it as the `h1` makes the page agree with its metadata, and it removes the need for a second, invented headline. The ember accent wraps "you.", which mirrors S2's `em` accent on the last word. The value line is non-tagline copy from the content officer.

3. **Copy lives in content modules under `content/`, owned by the content officer.**
   - `content/brand/taglines.ts` exports `APPROVED_TAGLINES`, the five §11 strings verbatim, `as const`, with the source cited in a comment.
   - `content/site/landing.ts`, `about.ts` and `not-found.ts` export typed plain data: strings and arrays, with no JSX and no class names, so Tailwind never needs to scan them.
   - The landing hero type takes its headline as `(typeof APPROVED_TAGLINES)[number]`, so an unapproved headline fails `tsc`.
   - A landing section has the shape `{ id, label, heading, body: string[], faq?: { question, answer }[] }`.

   The frontend engineer adds `"content"` to `tsconfig.app.json` `include`, and the pages import the modules by relative path.

   *Alternatives rejected:*
   - Keeping strings in the components: the content officer cannot own them there, and the future static layer or CMS would have to scrape JSX.
   - `src/content/`: outside the content officer's owned paths.
   - Markdown files: they need a loader and parser for no present benefit.

4. **Crawlable-ready structure, with no crawlability claimed.**
   - `<header>` (site nav) → `<main>` → hero `<section aria-labelledby="hero-heading">` → one `<section aria-labelledby>` per content item → `<footer>`.
   - FAQ items render as `h3` + `p` inside their section. This keeps the heading outline valid and maps directly onto a later `FAQPage` JSON-LD without restructuring.
   - No FAQ content ships now. The unit test proves the rendering with fixture data.
   - The page is still a client-rendered SPA route, so this change does not make it crawlable. See Risks.

5. **Exactly one ember CTA in the hero: the composer's send button, always enabled.**
   - The nav "Open app" link becomes a non-ember secondary control (`bg-hover` on hover, `text-fg`).
   - The send button gets a visible or accessible name ("Send" with `aria-label`, or a visible label the creative director specifies). It is **not** disabled when the field is empty. An empty submit moves focus to the prompt field and does nothing else.
   - *Why not keep `disabled`:* a disabled primary action as the hero's only ember CTA means the page loads with its one call to action dimmed and inert, and `disabled` removes it from the tab order.
   - The composer becomes a flat filled surface following chat-surfaces-flat2 decision 4:
     - `bg-composer` at rest, `focus-within:bg-raised`
     - 2px ember outline on `:focus-visible` only
     - no border, no shadow
   - The 10px/11px hint row is removed or rebuilt at 12px or larger. The "Browse threads" link is kept as a secondary 12px+ link or dropped, as the design doc decides.
   - *Interpretation of the plan's "exactly one ember-filled CTA per viewport section":* the hero has exactly one; other sections have at most one, and none by default. Nav and footer have none. A literal reading would put an ember button into every content section, which repeats the same action and works against S1 §12 ("The ember accent remains restrained"). This is operator question Q2.

6. **Shared site chrome.** `src/components/site/site-header.tsx` and `site-footer.tsx` hold the nav band (lockup linking to `/`, theme toggle, "Open app") and the footer band (footer lockup, legal line, version). Landing and 404 both use them. About keeps the app shell (`AppLayout`), which already shows the nav lockup (app-shell spec), so it adds only the page body.

7. **Version from `package.json` at build time.**
   - `vite.config.ts` reads `package.json` with Node `fs` and defines `__APP_VERSION__`, declared in `src/vite-env.d.ts`.
   - About and the site footer read it. Both hard-coded copies are removed.
   - *Alternative rejected:* `import pkg from "../package.json"` in client code, which bundles the whole manifest into the client, including dependency names.
   - Runtime version is not shown. `/healthz` returns an empty body (see `src/hooks/use-health.ts`), and inventing a source is out of scope.

8. **About layout.**
   - `h1` "About KnowMe", visually above the explanation paragraph, with the lockup decorative beside it so the name is announced once, per the brand-identity spec.
   - A 1–2 sentence explanation from content (D-004 facts).
   - Rows on `bg-surface` separated by spacing, with no borders.
   - The endpoint uses `break-all` / `wrap-anywhere`, never `truncate`.
   - The status keeps `StatusBadge`, which has a text label.
   - The existing string "KnowMe on the Universal Agent Runtime" stays, because `e2e/brand.spec.ts` asserts it.

9. **404.**
   - Site header and footer.
   - An `h1` from content (for example "Page not found"), one sentence of body copy, and one ember `Button` rendering a react-router `Link` to `/`.
   - The `console.error` call stays as is. It is existing diagnostic behaviour, it is outside the restyle, and the `console.log` constraint grep does not match it.

10. **Guard and test placement (QA).**
    - `src/test/flat-shell.test.ts` gains a `describe` for `src/pages/{landing-page,about-page,NotFound}.tsx` and `src/components/site/*.tsx`. It reuses the chat-only rule set: hex, `bg-white`/`text-white`/`bg-black`, `text-*/NN`, and additionally `gradient`.
    - `src/test/brand-copy.test.ts` checks the tagline membership and voice rules over the content modules and renders a fixture FAQ section.
    - `e2e/brand-pages.spec.ts` holds the DOM and computed-style scenarios, and resolves `--km-ember` / `--km-ember-text` from `getComputedStyle(document.documentElement)` for each theme.
    - The 24 captures come from the existing `npm run test:visual`, which already covers the three routes.

11. **Ordering.** The design doc (1.1) and the copy (1.2) run in parallel. The two frontend slices (2.1 landing and site chrome, 2.2 About and 404) follow. 2.2 depends on 2.1 for the shared chrome and the version define. Then guard and e2e (3.1), full gate (4.1), and verification with review (4.2). Frontend can build against the content officer's draft copy, but the change cannot archive until the operator has approved the copy (spec: "Copy approval is recorded").

## Risks / Trade-offs

- **Uncomfortable case 1: this polish may be thrown away.** The next phase is a chat-led marketing site with a creative concept that the creative director has not designed yet. The hero, the section bands and the composer placement built here may not survive that concept. Work spent on layout is at risk. The content modules, the tagline pinning, the semantic structure, the version define and the a11y fixes are what carry forward.
  - *Mitigation:* keep the layout thin, with no bespoke animation or illustration, and spend effort on the parts that survive.
- **Uncomfortable case 2: "crawlable-ready" is not crawlable.** The landing is still a client-rendered route. A crawler that does not run JavaScript sees an empty `#root`. Nothing in this change moves search or AI-engine visibility, and any report that implies otherwise is wrong.
  - *Mitigation:* the proposal names prerendering as a non-goal, and verification.md must not claim SEO impact.
- **Light-theme alternating bands may be invisible.** Light `canvas` #F7F7F8 against `surface` #FAFBFC is about 1.02:1, which is the same weakness chat-surfaces-flat2 hit with the light composer.
  - *Mitigation:* the creative director picks a band pair that reads as distinct (for example canvas against muted, or chrome against canvas). The spec only requires a computed difference, so the 1440 light captures are the real check, and QA records a band that does not read as distinct as unmet.
- **Always-enabled send changes behaviour slightly.** Empty submit used to be impossible and now moves focus. The e2e scenario pins this, so it cannot regress silently.
- **Moving copy to `content/` widens `tsconfig.app.json`.** `eslint.config.js` already lints `**/*.{ts,tsx}` outside `dist`, so `content/` is linted. Without the `include` change, `tsc -p tsconfig.app.json` would not type-check the modules, and the tagline type pin in decision 3 would be silently lost. Task 2.1 verifies this.
- **Contrast may trace to tokens.** If axe `color-contrast` failures on these pages trace to token values, not classes, they go back to the creative director as a token change with a `tokens.test.ts` pair. They are recorded as unmet until fixed, not waived (the same rule as chat-surfaces-flat2).

## Migration Plan

This is a UI-only change, with no data, storage or API changes. Rollback is a revert of the change's commits. The `content/` folder and the Vite define are additive.

## Open Questions

Each question below has a default that the specs and tasks already assume. If the operator answers differently, the named spec requirement changes before task 2.x starts.

- **Q1 (copy approval, gates archive).** The operator approves the final text of every item on the copy sheet in task 1.2:
  - landing: eyebrow, value line, nav "Open app" label, prompt placeholder, send-control label, each section's label, heading and body (the default is three sections)
  - About: heading, explanation paragraph, row labels
  - 404: heading, body, CTA label
- **Q2 (CTA rule).** Default: the hero has exactly one ember CTA and other sections at most one (none by default). The alternative is the literal "exactly one per section". Affects: "One ember primary action per section".
- **Q3 (hero action).** Default: keep the prompt composer, so a visitor can talk to KnowMe from the landing page. The alternative is a plain "Open KnowMe" CTA, leaving the composer to the concept phase. Affects: the hero CTA scenarios.
- **Q4 (legal year).** Default: the literal "© 2026 KnowMe AI, LLC", as the brand-identity spec asserts. The alternative is the current year computed at build time, which would need a brand-identity spec change.
- **Q5 (footer links).** Default: no new footer links. For example, no link to About, because About sits in the app shell and pings UAR. The alternative is a footer link to `/settings/about`.

## Operator decisions (2026-09-26)

The operator confirmed all four defaults:
- **Q2, ember CTAs:** exactly one ember-filled CTA, in the hero. Later sections have at most one, and none by default.
- **Q3, hero:** keep the prompt composer as the hero's one ember action. The send button gets an accessible name and stays enabled.
- **Q4, legal line:** the fixed "© 2026 KnowMe AI, LLC", as the brand-identity spec asserts.
- **Q5, footer:** no new links. The footer is the lockup and the legal line.

Q1 (copy approval) is still open. The operator approves the copy sheet written in task 1.2 before archive.
