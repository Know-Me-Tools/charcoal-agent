# Brand pages: design spec

Owner: km-creative-director. Change: `openspec/changes/landing-and-about-brand` (task 1.1).
Consumers: km-frontend-engineer (tasks 2.1, 2.2), km-qa-engineer (tasks 3.1, 4.1), km-chief-content-officer (task 1.2, for the copy constraints in §12).

Binding sources, in precedence order (design.md "Binding sources"):
1. WCAG 2.2 AA (D-007).
2. S1: `know-me-system/docs/knowme-ui-ux-standard.md` §3 (Flat 2.0), §4 (identity), §11 (accessibility), §12 (acceptance).
3. S2: `/Users/gqadonis/Projects/know-me/branding/knowme-brand-template.html` and `knowme-brand-guide.html`; the Wordmark System §08 lockup sizes.
4. The decisions in design.md, including the operator decisions of 2026-09-26: one ember CTA, in the hero; keep the prompt composer; the fixed "© 2026 KnowMe AI, LLC"; no new footer links.

This document is authoritative for how the landing, About and not-found pages look. Where it names a class, use that class. Where a page needs something this document does not cover, ask km-creative-director.

Every colour below is a Tailwind name backed by `src/styles/tokens.css`. There are no hex values, no raw palette classes and no opacity-modified colours (`text-fg/70`, `bg-primary/80`). All sizes are rem-based, and nothing is below 12px (`text-xs`).

---

## 1. Concept

### 1.1 Directions explored

| Direction | Idea | Verdict |
|---|---|---|
| A. The document header | S2 read literally: a document page header (eyebrow, title, lead), with the composer stacked underneath and everything in one column at every width. | Rejected as the whole answer. At 1024 and 1440 it leaves the right half of the hero as an empty area (S1 §3.4), and the composer reads as a form under an article. |
| B. Statement and conversation | The hero is a split. On the left sits the statement: the lockup, the eyebrow and the tagline. On the right sits the conversation, a live composer in the place a hero image would take. It stacks to one column below 1024. | **Chosen.** The product demo is the visitor typing to KnowMe, so the composer is the hero's asset, not a form. It fills the wide viewport with the one thing the page wants people to do. |
| C. Conversation first | The composer is the largest element, and the tagline shrinks to a caption. | Rejected for now. The `h1` must be the approved tagline, and a conversation-led layout belongs to the concept phase that follows this change (design.md, "Uncomfortable case 1"). |

### 1.2 Converged direction: "the statement and the conversation"

- **The statement** is quiet and typographic: the hero lockup, a 12px mono eyebrow, and "AI that understands you." in Space Grotesk, set on two lines with the ember accent on "you." It is the only large type on the page.
- **The conversation** is the only filled object in the hero: the composer on `bg-composer`, holding the page's one ember action.
- **The rest of the page** is prose on full-bleed bands that alternate two background tokens. There are no cards, rules or icons in tiles. Hierarchy comes from type size, measure and the band change.

Signature: the send control is the only ember fill on the whole landing page. Ember appears three other ways, and all of them are text or mark: the ember node of each lockup, the eyebrow and "you.". In light and dark, the eye travels from "you." to the composer.

### 1.3 Motion stance

There is no entrance animation, no scroll-driven motion and no GSAP on these pages. design.md "Uncomfortable case 1" puts this layout at risk of replacement in the concept phase, so motion effort goes there. Motion here is limited to state feedback (§11).

---

## 2. S2 → S1 reconciliation

Every S2 element from design.md decision 1 has a row, plus every other S2 template element, so nothing is left to interpretation. "Not used" is a resolution: the frontend engineer does not build it.

| S2 element (template) | S2 treatment | Resolution here: token and type role | Rule |
|---|---|---|---|
| `.nav` | sticky, blurred translucent `--bg`, `border-bottom`, 54px | `<header>` band `bg-chrome`, not sticky, `h-16` (64px), no blur, no rule. Separated from the hero by `bg-chrome` → `bg-canvas` (§3) | S1 §3.2, §3.3 |
| `.nav-brand` (22px mark, 15px text, `Know`+ember `Me`) | inline SVG with the node filled by a hex | `KnowMeLockup variant="nav"` (28px mark, `text-lg` wordmark) inside a `Link` to `/` | Wordmark System nav 28px; Brand Guide nav minimum 24px; S1 §4.3 |
| `.nav-meta` | 10px mono document id | Not used | S1 §4.2 12px floor; nothing to say on a landing page |
| `.mode-toggle` | pill button, text "LIGHT/DARK" plus glyph, `border`, 10px mono | Icon button, `aria-label` "Switch to light theme" / "Switch to dark theme", `rounded-lg`, `text-fg-secondary`, hover `bg-hover` (§5) | S1 §11 named icon controls; S1 §3.3; S1 §4.4 pills are for status |
| `.page-header` | `border-bottom`, bottom margin | Hero `<section>` on `bg-canvas`; separated from the first band by the `bg-canvas` → `bg-band` change | S1 §3.2 |
| Hero lockup | stacked lockup, 52px icon, 34px type (Brand Guide) | `KnowMeLockup variant="hero"` (56px mark, `text-[2.25rem]`), horizontal, unchanged geometry | Wordmark System §08: 52–72px |
| `.eyebrow` | mono **10px**, 700, 0.14em, uppercase, `--ember` | `section-label` utility: `font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ember-text` | S1 §4.2 12px floor; D-007: S2 `--ember` as text on the light canvas is 3.71:1, `ember-text` is 5.39:1 |
| `.page-title` | Space Grotesk 700, `clamp(32px, 5vw, 52px)`, −0.035em, line-height 1.0 | `h1`: `font-display font-bold tracking-[-0.035em] leading-[1.05] text-fg`, sized per breakpoint in §6.1 (2rem to 4rem). Line-height rises to 1.05 so the descender of "y" in line 2 clears | S2 tracking kept; sizes measured in §6.1 |
| `.page-title em` | ember `<em>` on the last word | One `<span className="text-ember-text">` around "you.", no `em` (no italic, no emphasis semantics) | Plan "single ember accent"; D-007 |
| `.page-lead` | Roboto 300, 16px, `--fg-muted`, line-height 1.75, 58ch | Value line `<p>`: `font-body font-normal text-base md:text-[1.0625rem] leading-[1.7] text-fg-secondary max-w-[58ch]` | S1 §4.2 body 15–17px. Weight 400, not 300: the thin cut in the secondary colour reads fainter than its measured ratio |
| `.meta-row` / `.meta-chip` | bordered 10px chips | Not used | S1 §3.3, §4.2 |
| `.section` | stacked on one canvas, `margin-bottom` gaps | Full-bleed `<section aria-labelledby>` bands, alternating `bg-band` and `bg-canvas` (§3) | S1 §3.2 "alternating surface tokens" |
| `.section-label` | 10px mono, 700, `--fg-subtle`, `border-bottom`, numbered "01 ·" | `font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary`, no rule, not numbered | S1 §4.2 floor; S2 `--fg-subtle` fails AA (2.89:1 light, 3.51:1 dark); the sections are topics, not a sequence; ember stays restrained (S1 §12) |
| `.section-title` | Space Grotesk 700, 24px, −0.02em | `h2`: `font-display text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-[1.15] text-balance text-fg` | S2 kept, stepped up at `md` |
| `.section-desc` | Roboto 300, 14px, `--fg-muted`, 60ch | Section body paragraphs: `font-body text-base leading-[1.7] text-fg max-w-[62ch]` | S1 §4.2 body 15–17px; the body is the section's content, so it takes primary text |
| `.subsection` / `.subsection-label` | nested labelled blocks | FAQ items only: `h3` + `p` (§7) | design.md decision 4 |
| `.card` grid, `.card:hover` border | bordered cards, border tint on hover | Not used. A section is prose plus optional FAQ | S1 §3.3 "no card outlines" |
| `.panel` | bordered panel with header | Not used on the landing. About rows are flat `bg-band` rows (§8) | S1 §3.3 |
| `.callout` | ember-tinted box with a left rule | Not used | S1 §3.3; no content needs it |
| `.data-table` | ruled rows | Not used. About uses a `dl` of filled rows (§8) | S1 §3.2 "row background changes, not grid lines" |
| `.stat-card` | large number, ember unit | Not used | No real figures to show (fake-precise numbers are banned) |
| `.badge-*` | bordered tinted badges | Not used, except the existing `StatusBadge` on About (fill plus text label, no border) | S1 §3.3, §3.2 status is not colour alone |
| `.code-block` | code well | Not used | No code on these pages |
| `.form-*` inputs | bordered fields, ember border on focus | The composer field: filled `bg-composer`, `focus-within:bg-raised`, ember outline on keyboard focus only (§6.3) | S1 §3.2 "distinct filled field"; chat-surfaces §4.2 |
| `.btn-primary` | ember fill, hover `opacity .88; translateY(-1px)` | The send control and the 404 CTA: `bg-ember text-primary-foreground`, hover `bg-ember-hover`, no opacity, no lift (§6.4) | S1 §4.4 motion is a background shift; opacity colours are banned |
| `.btn-secondary` | bordered, ember border and text on hover | "Open app" link: no fill at rest, `text-fg`, hover `bg-hover` (§5) | S1 §3.3; the hero keeps the only ember action (Q2) |
| `.btn-ghost` | ember-soft hover | Theme toggle hover is `bg-hover`, not `bg-ember-soft`: ember-soft means selection in S1 §3.2 | S1 §3.2 |
| `.doc-footer` | `border-top`, `KnowMe, LLC`, 10px mono | `<footer>` band `bg-chrome`, `KnowMeLockup variant="footer"` (24px), 12px mono "© 2026 KnowMe AI, LLC · v{version}" in `text-faint` (§5.2) | S1 §3.3, §4.2; D-001 |
| `.footer-text` right side ("know-me.tools · date · Conviction Logomark") | 10px mono | Not used. Q5: the footer is the lockup and the legal line | Operator decision Q5 |
| `.container` (960px) / `.container-wide` (1180px) | fixed max widths, 2rem padding | One page container for all bands: `mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 lg:px-12` (§4) | 16px gutter at 320 |
| Colour tokens: `--bg` / `--bg-raised` / `--bg-surface` / `--border` | S2 palette, `--bg-surface` for "stripes" | `bg-canvas` / `bg-chrome` for bands, `bg-raised` for focus / `bg-band` (S2's own stripe role, at the S1 muted value in light) / none | S1 §4.1; §3 below |
| `--fg-muted` / `--fg-subtle` | secondary and metadata text | `text-fg-secondary` / `text-faint` (text-safe, 4.5:1 on every surface, `tokens.test.ts`) | D-007 |
| `--ember-bright` | "gradient tip" | Not used. The dark value became the dark `--km-ember-hover`. The light value fails 3:1 against the composer (2.49:1), so light uses a closer ember (§6.4, §13) | S1 §3.3 no gradients |
| Radius scale (4/6/10/14/24, pill) | | Controls `rounded-lg` (10px), composer `rounded-xl` (16px), About rows `rounded-lg`, bands square, pills only in `StatusBadge` | Brand Guide radius; S1 §4.4 |
| `--shadow-sm` / `--shadow` | light-theme shadows | None | S1 §3.3 |
| Transitions (0.2–0.25s ease, `transform` on hover) | | `transition-hover` (colours, `--km-duration-fast`, `ease-brand-out`); no transforms except a 1px press on the two ember CTAs (§11) | S1 §4.4 |

**Source conflict, noted and not reopened (design.md decision 1).** The Brand Guide's logo rules say not to use the ember accent in UI chrome. S1 §4.3 defines the wordmark as "Know" plus ember "Me", and the shipped nav lockup already uses it. S1 wins by precedence.

---

## 3. Bands and background tokens

### 3.1 Order and tokens

Each band is full-bleed (`w-full`). Its content sits in the page container (§4).

| # | Band | Element | Token (both themes) | Resolves to (light / dark) |
|---|---|---|---|---|
| 1 | Site header | `<header>` | `bg-chrome` | chrome / chrome |
| 2 | Hero | `<section aria-labelledby="hero-heading">` inside `<main>` | `bg-canvas` | canvas / canvas |
| 3 | Section 1 | `<section aria-labelledby>` | `bg-band` | muted value / surface value |
| 4 | Section 2 | `<section aria-labelledby>` | `bg-canvas` | canvas / canvas |
| 5 | Section 3 | `<section aria-labelledby>` | `bg-band` | muted value / surface value |
| 6 | Site footer | `<footer>` | `bg-chrome` | chrome / chrome |

Rule for any number of sections: section *n* (counting from 1) is `bg-band` when *n* is odd and `bg-canvas` when *n* is even. Both `bg-band` and `bg-canvas` separate from `bg-chrome`, so the footer is distinct whether the section count is odd or even. A section never takes `bg-chrome`: chrome means navigation and persistent chrome (S1 §3.4).

`bg-band` is a new token (§13). No existing token separates from the canvas in both themes without being too heavy in one:
- `bg-surface` is 1.31 L\* from the canvas in light, which reads as the same surface. This is the same weakness chat-surfaces-flat2 hit with the light composer.
- `bg-muted-surface` is 2.53 L\* in light but 15.55 L\* in dark. A full-bleed band that heavy in dark reads as a different page, not a band.

`bg-band` takes the muted value in light and the surface value in dark, the same split as `bg-composer`.

### 3.2 Measured separation

Measured from `src/styles/tokens.css` with the formulas in `src/styles/tokens.test.ts`. ΔL\* is the CIELAB lightness step, the project's fill-separation metric. Its floor of 1.8 was calibrated on captures: 1.25 and 1.31 read as one surface, and 1.83 reads as its own. The WCAG ratio is shown for reference only. It compresses light steps, so it cannot compare fills.

| Adjacent pair | Light ΔL\* | Light ratio | Dark ΔL\* | Dark ratio | Test |
|---|---:|---:|---:|---:|---|
| header `chrome` → hero `canvas` | 2.74 | 1.071:1 | 3.02 | 1.061:1 | `FILL_STEPS` chrome/canvas |
| hero `canvas` → section 1 `band` | 2.53 | 1.066:1 | 6.44 | 1.137:1 | `FILL_STEPS` band/canvas |
| section `band` → section `canvas` | 2.53 | 1.066:1 | 6.44 | 1.137:1 | `FILL_STEPS` band/canvas |
| last section `band` → footer `chrome` | 5.28 | 1.142:1 | 3.42 | 1.071:1 | `FILL_STEPS` band/chrome |
| last section `canvas` → footer `chrome` (even count) | 2.74 | 1.071:1 | 3.02 | 1.061:1 | `FILL_STEPS` chrome/canvas |
| *Rejected:* `canvas` → `surface` | 1.31 | 1.033:1 | 6.44 | 1.137:1 | would fail the 1.8 floor in light |

The weakest step on the page is 2.53 L\* (light canvas to band). It clears the floor by 0.73. The final judge is the light 1440 capture (task 4.1). If QA reads the light bands as one surface, record it as unmet and send it back here. Do not swap tokens in the page.

### 3.3 Text on the bands

Every text token is at least 4.5:1 on `bg-band` in both themes. `tokens.test.ts` checks this because `km-band` is in `SURFACES`. The lowest values are `text-faint` on the light band at 4.87:1 and `text-ember-text` on the dark band at 5.94:1.

---

## 4. Page grid

- **Container.** Every band's content uses `mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 lg:px-12`. Content widths:
  - 320: 288px
  - 768: 704px
  - 1024: 928px
  - 1440: 1056px (the 72rem cap, minus 96px)
- **Spacing** uses the S1 §4.4 rhythm: 4, 8, 12, 16, 24, 32, 48, then 64, 80 and 96 for band padding.
- **No horizontal scroll at 320 in either theme.** Nothing has a fixed width above 288px. Long strings (the About endpoint, the 404 path) use `break-all`.
- **Page shell** for the landing and the 404: `flex min-h-dvh flex-col bg-canvas`, with `<main className="flex-1">`, so the footer sits at the bottom on short pages.

---

## 5. Site header and footer (`src/components/site/`)

### 5.1 Header (`site-header.tsx`)

| Element | Classes | Notes |
|---|---|---|
| Skip link (first focusable) | `sr-only rounded-lg px-3 py-2 font-ui text-sm font-semibold text-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-100 focus-cue` (visible only when focused, so it always shows `focus-cue`'s `bg-hover` fill) | Target `#main` on `<main id="main" tabIndex={-1} className="outline-none">`. S1 §11 requires skip navigation. The label reuses the existing "Skip to content" string from `app-layout.tsx`. |
| `<header>` | `bg-chrome` | Full-bleed, not sticky |
| Inner row | container classes + `flex h-16 items-center justify-between gap-2` | 64px at every width |
| Lockup link | `Link to="/"` with `-mx-1 rounded-lg px-1 py-1 focus-cue`, holding `KnowMeLockup variant="nav"` | Its accessible name comes from the lockup's `aria-label` ("KnowMe"). No hover fill: it is a brand mark. |
| Right group | `flex items-center gap-1` | |
| Theme toggle | native `<button type="button">` (see "Why native elements" below) with `inline-flex size-11 items-center justify-center rounded-lg text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue` | `aria-label` "Switch to light theme" in dark, "Switch to dark theme" in light. Icon `Sun` in dark and `Moon` in light, `size-[1.125rem]`, `aria-hidden`. 44px target. No `title`. |
| "Open app" | `Link to="/threads"` with `inline-flex h-11 items-center gap-1.5 rounded-lg px-3 sm:px-4 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue` | No fill at rest, and never ember (Q2). Trailing `ArrowRight` `size-4 hidden sm:block`, `aria-hidden`. Label from `content/site/landing.ts`. |

**320px budget, gaps included.** The row is lockup (about 112px: 28px mark, 10px gap, about 74px wordmark) + `gap-2` (8) + toggle (44) + `gap-1` (4) + "Open app" (about 62px text + 24px padding = 86). That totals 254px of a 288px column. At the Appearance "comfortable" root (17.5px), every rem value scales by 1.094 and the mark stays 28px: 120 + 9 + 48 + 4 + 94 = 275px of a 285px column (`px-4` is 17.5px). The arrow icon is hidden below `sm` to keep that margin. The text widths are estimates for Inter 600 and Space Grotesk 700; the 320 captures in both font-size settings are the check.

**Why native elements for the header controls and both ember CTAs.** The `Button` primitive (`src/components/ui/button.tsx`) carries an unconditional `outline-none`. In Tailwind 4 that sets `--tw-outline-style: none`, and `focus-visible:outline-2` only reads that variable, so `focus-cue` or an outline class on a `Button` paints nothing (verified by compiling both classes). Its `focus-visible:ring-*` classes also leave a composite `box-shadow` on focus, even at `ring-0`. The header controls, the send control and the 404 CTA are therefore native `button` / `Link` elements styled only with the classes here. This is a deliberate exception to "use shadcn components", recorded here so it is not reverted.

### 5.2 Footer (`site-footer.tsx`)

| Element | Classes | Notes |
|---|---|---|
| `<footer>` | `bg-chrome` | Full-bleed |
| Inner | container classes + `flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between md:py-12` | Stacked, left-aligned below 768; one row at 768+ |
| Lockup | `KnowMeLockup variant="footer"` (24px mark) | Not a link (Q5). It keeps its accessible name. |
| Legal line | `<p className="font-mono text-xs text-faint">` "© 2026 KnowMe AI, LLC · v{__APP_VERSION__}" | The legal text is fixed (Q4). One middle dot. `text-faint` on chrome is 5.56:1 light and 6.60:1 dark. |

The footer has no links and no controls (Q5).

---

## 6. Hero

### 6.1 Composition per breakpoint

The `h1` is set on two lines at every width: line 1 is "AI that" and line 2 is "understands you.". Break at the last two words of the headline string: render `AI that ` (with a trailing space), then `<span className="block">`, then `understands `, then `<span className="text-ember-text">you.</span>`, then `</span>`. The `h1` `textContent`, with whitespace collapsed, stays "AI that understands you.".

Widths are measured from Space Grotesk 700's advance widths at −0.035em tracking. The font is the v22 TTF that the Google Fonts CSS2 URL in `index.html` serves, and the widths come from summing the `hmtx` advances for each character through its `cmap`. Line 2 is the long line. If line 2 ever overflows (a narrower column, a different font cut), the `block` span wraps it to a third line. It never scrolls horizontally.

| Width | Layout | `h1` size | Line 2 width | Fits in | Lockup to eyebrow / eyebrow to `h1` / `h1` to value / value to composer | Band padding |
|---|---|---|---|---|---|---|
| 320 | One column, left-aligned | `text-[2rem]` (32px) | 257px | 288px column | `mt-8` / `mt-3` / `mt-4` / `mt-8` | `pt-10 pb-12` |
| 768 | One column, text `max-w-2xl`, composer `max-w-xl` | `md:text-[3.25rem]` (52px) | 417px | 672px (`max-w-2xl`) | `md:mt-12` / `mt-3` / `md:mt-6` / `mt-8` | `md:pt-16 md:pb-20` |
| 1024 | Two columns: `lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-12`; left is lockup, eyebrow, `h1` and value; right is the composer | `lg:text-[3.5rem]` (56px) | 449px | 513px left column | `lg:mt-12` / `mt-3` / `lg:mt-6` / composer in the right column, bottom-aligned with the value line | `lg:pt-24 lg:pb-24` |
| 1440 | As 1024 | `xl:text-[4rem]` (64px) | 513px | 588px left column | as 1024 | as 1024 |

Checks:
- At 320, "understands you." at 36px would be 289px in a 288px column. That is why the base size is 2rem, not 2.25rem.
- With the Appearance "comfortable" setting (17.5px root), line 2 is 281px at 320 against a 285px column (`px-4` becomes 17.5px), with 4px to spare. At 1024 it is 491px against a 505px column (padding and gap scale too). This is the tightest fit on the page; the fallback is the third line described above.
- At 1440×900, the hero ends at about 604px, so the first band shows in the first viewport.
- At 320×900, the send control's bottom edge sits at about 560px, above the fold.

Element classes:

| Element | Classes |
|---|---|
| Hero `<section>` | `bg-canvas`, with `aria-labelledby="hero-heading"` |
| Hero lockup | `KnowMeLockup variant="hero"` (56px mark, within the 52–72px spec). It keeps its accessible name, because no visible "KnowMe" text sits beside it. |
| Eyebrow | `<p className="section-label">` with text from content |
| `h1` | `id="hero-heading"` with `font-display text-[2rem] md:text-[3.25rem] lg:text-[3.5rem] xl:text-[4rem] font-bold leading-[1.05] tracking-[-0.035em] text-fg` |
| Value line | the next element sibling of the `h1`: `<p className="font-body font-normal text-base md:text-[1.0625rem] leading-[1.7] text-fg-secondary max-w-[58ch]">` |

### 6.2 Composer anatomy

The composer is a `<form>` with one `onSubmit` handler. The button submits it natively. The keyboard contract is:
- In the textarea's `onKeyDown`, Enter without Shift, and not during IME composition (`!e.nativeEvent.isComposing`), calls `e.preventDefault()` and then `form.requestSubmit()`.
- Shift+Enter inserts a newline.
- The submit handler trims the text. If it is empty, the handler focuses the textarea and returns; otherwise it starts the conversation.

Enter in a `<textarea>` does not submit a form by itself, which is why the handler is needed.

```
form.composer            rounded-xl bg-composer p-2 transition-hover focus-within:bg-raised
                         has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2
                         has-[textarea:focus-visible]:outline-ring
  textarea               block w-full min-h-14 lg:min-h-24 max-h-[7.5rem] resize-none bg-transparent px-3 py-2.5
                         font-body text-base leading-relaxed text-fg caret-ember outline-none placeholder:text-faint
  div (action row)       mt-1 flex items-center justify-end
    button type=submit   (native, not the Button primitive; see §5.1)
                         inline-flex h-10 items-center gap-2 rounded-lg px-4 font-ui text-sm font-semibold
                         bg-ember text-primary-foreground transition-hover hover:bg-ember-hover active:translate-y-px
                         focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2
                         focus-visible:outline-ring
      {label}            visible text from content
      ArrowRight         size-4, aria-hidden
```

`focus-visible:outline-solid` is required. Without it, nothing paints if these classes are ever merged with an `outline-none`. The textarea's own `outline-none` is intended: its indicator is on the form.

- Width: full column at 320, `max-w-xl` at 768, and the full right column (367px at 1024, 420px at 1440) from 1024 up.
- The textarea's accessible name is `aria-label` from content. The placeholder is a hint, not the label. `text-base` (16px) prevents iOS zoom on focus.
- The send control has a **visible label**, not an icon alone. It is the hero's only call to action, and an unlabelled arrow does not say what happens. The label is also its accessible name, so it has no `aria-label` (no label-in-name mismatch). The visible label must match `/send|start/i` (spec "Named icon-only controls"); see §12.
- Removed from today's composer:
  - the `border`, `shadow-lg` and inner `bg-background` field
  - the `focus:ring-1` on the textarea
  - the 10px "↵ to send" hint and the 11px "Browse threads" link. The link duplicates the nav's "Open app" intent (same destination). The hint's job moves to the keyboard contract above: Enter sends and Shift+Enter adds a line, the convention of the app's own composer.
- The primitive `Button` is gone from the composer. That also removes its `hover:bg-primary/80` opacity colour and its focus ring shadow.

### 6.3 Composer states

| State | Trigger | Container fill | Indicator | Measured |
|---|---|---|---|---|
| Rest | page load, nothing focused | `bg-composer` | none | composer on canvas: 2.53 L\* light, 6.44 dark |
| Hover | pointer over the field | unchanged | text cursor | A field is not a button: no hover fill (as chat-surfaces §4.2) |
| Focus (any input method) | Tab, click or tap into the textarea, or programmatic `.focus()` | `bg-raised` via `focus-within` | ember caret, plus a 2px ember outline at a 2px offset around the form | composer to raised: 5.28 L\* light, 3.93 dark; ember on canvas 3.71:1 light, 6.76:1 dark |
| Filled | text typed | as focus | the send control is unchanged | |
| Empty submit | Enter or send with only whitespace | unchanged | focus moves to the textarea (`textarea.focus()`), with no navigation, message or shake | spec "Empty send does not navigate" |
| Submit | text present | none (it navigates) | registers the thread, sets the pending prompt and navigates, as today | spec "Prompt starts a conversation" |

Browsers match `:focus-visible` on text fields for every input method, so there is no separate pointer-focus state. A focused textarea always shows the outline. The form outline is scoped to `textarea:focus-visible`, not `:focus-visible`. When the send button has keyboard focus it shows its own outline (§6.4), and the form must not draw a second one around it.

### 6.4 Send control states

| State | Fill | Label | Measured |
|---|---|---|---|
| Rest | `bg-ember` | `text-primary-foreground` (on-ember) | label 4.84:1 light, 6.76:1 dark; fill against the composer 3.48:1 light, 5.94:1 dark |
| Hover | `bg-ember-hover` (new, §13) | unchanged | label 5.40:1 light, 8.01:1 dark; fill against the composer 3.12:1 light, 7.05:1 dark; against raised 3.56 / 6.41; against canvas (404) 3.32 / 8.01; step from rest 3.16 / 5.31 L\* |
| Keyboard focus | `bg-ember` (unchanged) | unchanged | 2px ember outline at a 2px offset on the composer: 3.97:1 light (on raised), 5.41:1 dark |
| Pressed | `bg-ember-hover` | unchanged | `active:translate-y-px` |
| Disabled | never | | spec: enabled on first load |

The send control does not use `focus-cue`. That utility replaces the fill with `bg-hover`, which would drop the page's one ember action from ember at the moment it is focused.

**Why this hover value (D-007: WCAG wins).** The hover fill must satisfy two floors at once:
- the dark label needs at least 4.5:1, so the fill's relative luminance must be at least 0.196
- the fill needs at least 3:1 against the light composer, so its luminance must be at most 0.257

The rest ember sits at 0.214, so the whole usable range is a narrow band around it. The light hover is a slightly lighter ember at luminance 0.231, which leaves margin on both floors (5.40:1 and 3.12:1). Its step from rest is 3.16 L\*, above the 1.8 fill-step floor and larger than the 2.53 L\* band step, which reads as distinct. The rejected values:
- `--km-ember-2`: fails the label (3.64:1)
- the brand template's light `--ember-bright`: fails the composer (2.49:1)

Dark keeps the template's dark `--ember-bright`.

`tokens.test.ts` pins all of this: the label pair in `LABELS_ON_FILLS`, the step in `FILL_STEPS`, and 3:1 against composer, raised and canvas in `EMBER_HOVER_ON`.

Keyboard focus keeps the ember rest fill and adds the outline.

---

## 7. Content sections

| Element | Classes |
|---|---|
| `<section>` | `bg-band` or `bg-canvas` per §3.1, with `aria-labelledby="{id}-heading"` |
| Inner | container classes + `py-16 md:py-20 lg:py-24 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12` |
| Left wrapper | `<div>` holding the label `<p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">`, then `h2 id="{id}-heading"` with `mt-3` and the §2 `h2` classes |
| Right wrapper | `<div className="mt-6 lg:mt-0">` holding the body and the FAQ |
| Body | `<div className="space-y-4">`: each paragraph is `<p className="font-body text-base leading-[1.7] text-fg max-w-[62ch]">`. `space-y-4` is on this body-only wrapper, so it cannot add to the FAQ's top margin. |
| FAQ (optional) | `<div className="mt-10 space-y-8">`, a sibling after the body. Each item is `<div>`, holding `h3` `font-display text-lg font-semibold tracking-[-0.01em] text-fg`, then `p` `mt-2 font-body text-base leading-[1.7] text-fg-secondary max-w-[62ch]`. All answers are visible: no accordion, no fill, no divider. With no items, render nothing (no empty container). |

DOM tree: `section > div.inner > [div.left > p.label + h2] + [div.right > div.body > p… , div.faq > div.item > h3 + p]`. Exactly two grid children.

The section label is `text-fg-secondary`, not ember. The hero eyebrow is the page's only ember label (S1 §12, restraint). The section `h2` sits at 24–30px, and the hero `h1` at 32–64px keeps its lead.

Below 1024 a section stacks: label, `h2`, body, FAQ. At 1024 and up, the label and `h2` sit on the left and the body and FAQ on the right. The right column holds the section's whole content, so this is a side-head layout, not a heading with a floating blurb.

No section contains an ember-filled control by default (Q2).

---

## 8. About (`/settings/about`)

About renders inside the app shell, on `main`'s `bg-canvas` with the settings padding (`p-4 md:p-6`).

| Element | Classes | Notes |
|---|---|---|
| Wrapper | `max-w-xl` | |
| Lockup | `<span aria-hidden="true" className="block">`, holding `KnowMeLockup variant="nav"` | Decorative: the visible `h1` names KnowMe, so the name is announced once (brand-identity spec). No change to the brand components is needed. |
| `h1` | `mt-4 font-display text-2xl font-bold tracking-[-0.03em] text-fg` | Text from content ("About KnowMe") |
| Explanation | `mt-3 font-body text-[0.9375rem] leading-[1.7] text-fg-secondary max-w-[60ch]` | The D-004 paragraph from content |
| Rows | `<dl className="mt-8 space-y-2">` | The 8px gaps show canvas between rows, so each row reads as its own fill |
| Row | `<div className="grid gap-1 rounded-lg bg-band px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-4">` | `bg-band`, not `bg-surface`: surface rows on the light canvas are 1.31 L\* (§3.1). `bg-band` is 2.53 L\* light and 6.44 dark. **This supersedes the `bg-surface` in design.md decision 8 and tasks.md 2.2**, which design.md allows ("brand-pages.md is authoritative and may refine the treatments"). |
| Row label | `<dt className="font-ui text-sm text-fg-secondary">` | 6.62:1 light, 7.71:1 dark on the band |
| Row value | `<dd className="min-w-0 font-mono text-sm text-fg break-all">` | Version is `__APP_VERSION__`. Endpoint is the full URL, wrapping, never `truncate`. |
| Status value | `<dd>` holding `StatusBadge` | Tone fill, dot and text label ("connected" / "disconnected"). No change to the badge. |
| Legal line | `<p className="mt-8 font-mono text-xs text-faint">` "© 2026 KnowMe AI, LLC" | |

Row order: Version, Runtime status, Runtime endpoint, Agent ("KnowMe on the Universal Agent Runtime", kept verbatim for `e2e/brand.spec.ts`).

The label and value stack below 640px; at 640px and up they sit side by side on a 9rem label column. At 320 the endpoint wraps inside the 256px row content (288px minus `px-4`).

About has no controls of its own.

---

## 9. Not-found page (`*`)

| Band | Token | Content |
|---|---|---|
| Header | `bg-chrome` | The §5.1 site header |
| `main` | `bg-canvas` | See below |
| Footer | `bg-chrome` | The §5.2 site footer |

`main` inner: container classes + `py-20 md:py-28`, left-aligned, `max-w-2xl` for the text.

| Element | Classes | Notes |
|---|---|---|
| Requested path | `<p className="font-mono text-xs text-faint break-all">{location.pathname}</p>` | Names the exact URL that failed (Brand Guide §02: "name the exact thing"). It is data, not copy, and React escapes it. |
| `h1` | `mt-3 font-display text-[2rem] md:text-[2.75rem] font-bold leading-[1.1] tracking-[-0.03em] text-fg` | From content; contains "not found"; no "!" |
| Body | `mt-4 font-body text-base leading-[1.7] text-fg-secondary max-w-[58ch]` | One sentence from content |
| CTA | A react-router `<Link to="/">` styled directly, not the `Button` primitive (§5.1): `mt-8 inline-flex h-11 items-center gap-2 rounded-lg px-5 font-ui text-sm font-semibold bg-ember text-primary-foreground transition-hover hover:bg-ember-hover active:translate-y-px focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring` | The page's one ember CTA. It is a link, so it announces as a link and navigates client-side. Rendering it through Base UI's `Button` would either log a dev error and set `type="button"` on an `<a>`, or add `role="button"`. It has the same states as §6.4, except that its outline sits on the canvas: 3.71:1 light, 6.76:1 dark. Label from content. |

The send control and this CTA share one class string. Define it once, for example `EMBER_CTA` in `src/components/site/`, so they cannot drift.

---

## 10. Focus treatment, every control

| Control | Page | Rest | Hover | Keyboard focus | Outline sits on | Ember outline ratio (light / dark) |
|---|---|---|---|---|---|---|
| Skip link | landing, 404 | hidden (`sr-only`) | n/a | visible `bg-hover` control with `focus-cue` | chrome/canvas | 3.97 / 6.37 on chrome |
| Lockup link | landing, 404 | no fill | none | `focus-cue`: `bg-hover` plus a 2px ember outline at a 2px offset | `bg-chrome` | 3.97 / 6.37 |
| Theme toggle | landing, 404 | `text-fg-secondary` | `bg-hover`, `text-fg` | `focus-cue` | `bg-chrome` | 3.97 / 6.37 |
| "Open app" | landing, 404 | `text-fg`, no fill | `bg-hover` | `focus-cue` | `bg-chrome` | 3.97 / 6.37 |
| Prompt textarea | landing | `bg-composer` (form) | none | form `bg-raised` plus a 2px ember outline around the form (any input method, §6.3) | `bg-canvas` | 3.71 / 6.76 |
| Send control | landing | `bg-ember` | `bg-ember-hover` | fill unchanged, 2px solid ember outline (`focus-visible:outline-solid`) | `bg-raised` (form while focused) | 3.97 / 5.41 |
| Home CTA | 404 | `bg-ember` | `bg-ember-hover` | fill unchanged, 2px solid ember outline (`focus-visible:outline-solid`) | `bg-canvas` | 3.71 / 6.76 |

- `tokens.test.ts` pins the outline minimum. The ember outline is at least 3:1 on canvas, chrome, band, composer and raised in both themes (`FOCUS_RING_ON`). The lowest value is 3.48:1, on the light band and composer.
- Focus order on the landing is: skip link, lockup link, theme toggle, "Open app", textarea, send. On the 404 it is: skip link, lockup link, theme toggle, "Open app", home CTA.
- No control on these pages uses the `Button` primitive or a `ring-*` utility, so there is no box-shadow in any state, focused or not.
- `FOCUS_RING_ON` proves the colour, not that the outline paints. Only a tab-through proves the latter. Task 3.1's e2e should Tab to the send control and the 404 CTA and assert a computed `outline-style` of `solid` and `outline-width` of `2px`. Unfocused captures and axe do not cover this.

---

## 11. Motion

| What | Property | Duration and easing | Reduced motion |
|---|---|---|---|
| Hover and focus fills (toggle, "Open app", send, CTA) | `background-color`, `color` | `transition-hover`: `--km-duration-fast` (150ms), `ease-brand-out` | 0s (global rule in `src/index.css`) |
| Composer rest to focus | `background-color` | `transition-hover` | 0s |
| Send and CTA press | `transform: translateY(1px)` via `active:translate-y-px` | instant (`transition-hover` covers colours only) | n/a |
| Theme switch | none | instant | n/a |
| Page load and scroll | none | n/a | n/a |

No element animates idle (S1 §4.4). There is no GSAP, no View Transition and no scroll trigger on these pages (§1.3).

---

## 12. Copy constraints for the content officer

The layout depends on these. The words are yours (task 1.2):

- The send control label is visible, 1–2 words, and matches `/send|start/i`. It must fit the 367px composer at 1024 on one line.
- The "Open app" label fits `h-11` on one line at 320, with the header total within 288px (about 60px of text at 14px).
- The eyebrow is one line at 320: at most about 28 characters in 12px mono uppercase at 0.12em tracking.
- The value line is at most about 20 words (two to four lines at 320). It must not name the composer's position ("below", "on the right"): the composer sits below the value line under 1024 and beside it from 1024 up. The current value line, ending "Type a message to start.", meets this.
- The composer has no hint or secondary link (§6.2). `composer.hint` and `browseThreadsLabel` are already removed from `content/site/landing.ts`; do not reintroduce them.
- A section label is 1–3 words. A section `h2` is at most about 8 words.
- The 404 body is one sentence.

---

## 13. Tokens added (`src/styles/tokens.css`)

| Token | Tailwind | Light | Dark | Why |
|---|---|---|---|---|
| `--km-band` | `bg-band` | the `--km-muted` value | the `--km-surface` value | The alternate landing band and the About rows: a filled region directly on the canvas. Light surface on canvas is 1.31 L\*, below the 1.8 floor; dark muted is 15.55 L\*, too heavy for a full-bleed band (§3.1). |
| `--km-ember-hover` | `bg-ember-hover` | a slightly lighter ember (luminance 0.231, +3.16 L\*) | S2 dark `--ember-bright` | Hover for ember CTAs. The label must stay at least 4.5:1 on it, and the fill at least 3:1 on composer, raised and canvas (§6.4). |

Tests added to `src/styles/tokens.test.ts`:
- `km-band` joins `SURFACES`, so every text token is checked at 4.5:1 on it.
- `["km-on-ember", "km-ember-hover"]` joins `LABELS_ON_FILLS`.
- `FILL_STEPS` gains chrome/canvas, band/canvas, band/chrome and ember-hover/ember.
- A new `EMBER_HOVER_ON` check requires the hover fill at 3:1 on composer, raised and canvas.
- A new `FOCUS_RING_ON` check requires the ember outline at 3:1 on canvas, chrome, band, composer and raised.

---

## 14. Visual acceptance (for task 4.1 capture review)

For each of the 24 captures (`landing`, `settings-about` and `not-found` × 320/768/1024/1440 × dark/light):

1. No visible border, rule, shadow, gradient or blur.
2. On the landing, every band boundary reads as a background change. Light 1440 is the critical capture (§3.2). A boundary that does not read is recorded as unmet.
3. The `h1` is on exactly two lines, with "AI that" on line 1 and "understands you." on line 2, at every width. "you." is the only ember text in the `h1`.
4. The hero lockup's mark is visibly larger than the nav's. The eyebrow is 12px mono in ember text.
5. The only ember fill on the landing is the send control. The nav "Open app" has no fill.
6. At 1024 and 1440, the composer is in the right column, bottom-aligned with the value line. At 320 and 768 it is below the value line, full width or `max-w-xl`.
7. At 320, the header fits on one row, and nothing overflows horizontally.
8. About: the rows are filled and separated by canvas gaps, the endpoint wraps with no ellipsis at 320, and the status shows a text label.
9. 404: the path, `h1`, one sentence and one ember CTA sit between the chrome header and footer.
10. Dark and light show the same hierarchy: what stands out in one stands out in the other.

---

## 15. Risks and open items

- **The weakest band step is small.** The light canvas-to-band step is 2.53 L\*, 0.73 above the floor. It passes the test, but only the light 1440 capture can confirm that it reads. If it does not, the fix is a darker light `--km-band` value here, not a different token in the page.
- **The light hover step is modest.** Accessibility keeps the light hover inside a narrow luminance band, so the change is 3.16 L\*, not the bolder lift in the brand template. If the light 1440/1024 captures show hover as too subtle, the answer is a second cue (for example, the arrow shifting 2px on hover, with no motion under reduced motion), not a fill outside the band.
- **The whole layout may be replaced.** The concept phase may discard the split hero and the bands (design.md "Uncomfortable case 1"). What carries forward is the tokens, the focus treatment and the semantic structure.
- **The measurements are font-dependent.** The §6.1 line widths assume the Google Fonts Space Grotesk 700 cut. If the font fails to load, the fallback sans is narrower, so the two-line layout still holds, but the captures would not show the brand face.
