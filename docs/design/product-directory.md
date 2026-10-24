# Product directory, product pages and ask entries: design brief

Owner: km-creative-director. Change: `openspec/changes/site-design-brief` (phase usefulness-update, requirement DES-1).
Built against this brief, and then checked against it: `site-ask-concierge`, `site-home-directory`, `site-product-pages`, `site-concierge-opening`, `site-seo-prerender`.
Appendix: [product-directory-status-map.md](product-directory-status-map.md), the label for all 52 public rows, generated.
Comps: [comps/](comps/) (`home-directory.html`, `product-the-boss.html`, `products.html`), with captures in `comps/shots/`.

This brief extends the established world in [brand-pages.md](brand-pages.md) (Flat 2.0, tokens, header, footer, hero, composer, focus). Everything that document fixes still holds unless a section below changes it by name. Colours are Tailwind names backed by `src/styles/tokens.css`; there is no hex, no raw palette class, no border, shadow, gradient or blur.

**The thesis.** Ember is the one send; cyan is every way in. Every page keeps the site's split of statement and conversation. A product's facts sit on the left. The questions you could ask, and the composer, sit on the right. Each question is a cyan control that opens the concierge with that question as your first message.

---

## 1. Page inventory

| URL | For | Who arrives | What they do next |
|---|---|---|---|
| `/` | Say what KnowMe AI, LLC is, and show everything there is to ask about | Visitors from a social post or article, often about one product; first-time visitors | Type in the hero composer, press a question or an Ask chip, open a product page, or go to `/products` |
| `/products` | The full directory: all 52 public entries, filterable by family | Visitors who want the whole portfolio, or to narrow it to one family | Filter, press Ask on an entry, open a product page |
| `/products/<slug>` (10) | A short page on one important product: status, version, 3 to 5 facts, questions, composer, sources | Visitors from a link about that product, or from a tile | Press a question, type their own, follow a source link |
| `/threads/:id` | The concierge conversation (exists) | Anyone who asked | Read the answer and ask again. It gets no header entry: it already is the conversation |
| `*` | Not found (exists). An unknown `/products/<slug>` renders it with a 404 status | Mistyped or stale links | Go home |

The ten slugs (decision D-005): `the-boss`, `bossfang`, `universal-agent-runtime`, `surreal-memory-server`, `prometheus-skill-pack` (Skill Pack with Skills Mini), `flint-platform` (Flint Gate, Forge and Realtime Fabric), `prometheus-entity-management`, `parking-lot`, `knowme`, `locus`.

Pending-consent and withheld rows (6) never render anywhere, including counts and filters (D-009, D-011).

---

## 2. Status vocabulary and badge

### 2.1 Six labels

A visitor reads one of six labels. Each is text plus an icon (lucide, the site's library). Colour only reinforces them. The rule that assigns a label reads only the facts row: first `version.kind`, then `portfolioStatus`, first match wins. The full rule and all 52 results are in the appendix.

| Label | Means (visitor definition, NEW) | Rule (appendix steps) | Icon | Treatment | Rows |
|---|---|---|---|---|---:|
| Released | A version has been published as a release or a package. | S1: kind `stable` or `registry` | `CircleCheck` | Fill `bg-success-soft`, text `text-success-text` | 7 |
| Pre-release | A version has been published and marked as a pre-release. | S2: kind `manifest` | `Tag` | Fill `bg-warning-soft`, text `text-warning-text` | 1 |
| In development | Working source exists. No version has been released. | S4 "Existing ...", S7 default | `Hammer` | No fill, `text-fg-secondary` | 21 |
| Prototype | A prototype or demonstration, not a finished product. | S5 | `FlaskConical` | No fill, `text-fg-secondary` | 7 |
| Design only | Written designs or specifications. No implementation yet. | S6 | `PencilRuler` | No fill, `text-fg-secondary` | 13 |
| Under assessment | Its scope or status is still being confirmed. | S3 (checked before S4 so doubt always wins) | `CircleQuestionMark` | No fill, `text-fg-secondary` | 3 |

Decisions:
- **Only Released and Pre-release get a fill.** Changed after looking (section 7): the first comps gave In development an amber fill, and 21 amber pills pulled the eye to the least finished work. Visitors come asking what is available now, so green should be the thing that stands out. Red is never used, because nothing here is failing.
- **No roll-up.** A tile that covers several rows (Flint platform, Skill Pack) shows each row's own badge. It never shows one badge for the group, and never the strongest of them.
- "Proposed" from the task list is folded into Design only. A visitor cannot act on the difference between a proposal and a published specification; both mean nothing runs yet.

### 2.2 Badge anatomy

`inline-flex h-6 items-center gap-1.5 rounded-pill px-2 font-ui text-xs font-semibold whitespace-nowrap`, with the icon at `size-3` (stroke 2.25, `aria-hidden`). Neutral labels use `px-0` so their text aligns with the name beside them. Pills are allowed here: status is what pills are for (standard §4.4). The visible label is the accessible text; the badge has no `aria-label` and no tooltip.

### 2.3 Where a filled badge may sit (measured)

The soft fills vanish on some grounds, and the failing ground differs by theme. ΔL\* is the project's fill-separation metric, with a floor of 1.8 (brand-pages §3.2):

| Soft fill on | light canvas | light band | light raised/white | dark canvas | dark band/surface | dark raised |
|---|---:|---:|---:|---:|---:|---:|
| `success-soft` | 3.13 | **0.60** | 5.88 | 14.06 | 7.62 | 3.70 |
| `warning-soft` | **1.67** | **0.86** | 4.41 | 11.57 | 5.13 | **1.20** |
| `cyan-soft` | 2.18 | **0.36** | 4.92 | 11.24 | 4.80 | **0.87** |

No existing token works in both themes. `bg-raised` fails in dark; `bg-band` and `bg-surface` fail in light. Hence one new token (section 6.1): **`bg-tile`**, the chrome value in light (`#ffffff`) and the surface value in dark (`#161d29`). Every soft fill clears the floor on it (light 4.41 to 5.88, dark 4.80 to 7.62), and the tile itself separates from the canvas (light 2.74, dark 6.44).

Rule: **a filled badge only ever sits on `bg-tile`.** Cyan ask chips sit on `bg-tile` or `bg-canvas` (2.18 light, 11.24 dark). `bg-ember-soft` never sits on a tile, because it is 0.78 in dark; the selected filter sits on the canvas.

### 2.4 Version line

Version lines use `font-mono text-xs text-faint`. They are derived from `version`, never written by hand, and never show a number the facts file does not hold (D-003). Each ` · ` segment is unbreakable (`whitespace-nowrap`), so a line wraps between segments and never inside a date. This was changed after looking: "20 Oct / 2026" broke at 320.

| `version.kind` | Line |
|---|---|
| `stable` | `v2.2.41 · 23 Oct 2026`; with a `preRelease`, a second line `v1.3.0 pre-release · 24 Oct 2026` (Universal Agent Runtime, D-004) |
| `registry` | `v0.3.0 on crates.io · 24 Oct 2026` |
| `tag` with a version | `Tag v1.10.2 · no release` |
| `tag` without one (BossFang) | `Build tag, no version · 8 Oct 2026` |
| `manifest` | `v0.2.0 pre-release` |
| `untagged` | `No release · last commit 20 Oct 2026` |
| `none` | `No release recorded` |

---

## 3. The home directory

### 3.1 Families

The facts file has eight families, uneven (16, 16, 9, 6, 4, 3, 2, 2), and one of them is entirely non-public. The display uses six, and the appendix pins each row's family so the build script does not guess:

| Display family (NEW) | Line under the heading (NEW) | Rows | From facts families | Product pages |
|---|---|---:|---|---|
| Applications | Apps and clients a person uses directly. | 9 | Applications | The Boss, KnowMe, Locus |
| Agents and memory | Runtimes, agent systems and memory services. | 10 | Infrastructure (9), Tools (Prometheus Knowledge) | Universal Agent Runtime, BossFang, Surreal Memory Server |
| Platform and infrastructure | Identity, data, realtime and hosting services. | 7 | Infrastructure | Flint platform |
| Developer tools and skills | Libraries, skills and tools for building with agents. | 15 | Tools | Prometheus Skill Pack, Prometheus Entity Management, Parking Lot |
| Integrations | Work that connects to software outside the portfolio. | 4 | Integrations | none |
| Services and research | Service designs, capabilities and research directions. | 7 | Services, Capabilities, Research & concepts | none |

The family split is a grouping by kind of thing, not a claim that one product depends on another. Relationships belong to kb-portfolio-overview.

### 3.2 Order on `/`

1. Header (section 5.3).
2. **Hero, unchanged** (brand-pages §6: eyebrow, `h1`, value line, composer, AI disclosure, resume link).
3. **Directory**, a new section on `bg-canvas` that follows the hero directly (section 3.3).
4. "Your conversations are stored in this browser." on `bg-band` (existing, unchanged).
5. "The Boss is available now." on `bg-canvas` (existing, unchanged).
6. Footer (unchanged).

**PROPOSED REMOVAL, for the content officer and the operator:** the existing section 1, "Ask about the products." Its body names three products and is now stale, and the directory does its job. Its one load-bearing sentence ("The concierge answers from a curated knowledge base and cites its sources.") can move to the directory lead if the content officer wants it there. Nothing else above the hero changes.

The directory sits on the canvas, not a band, so its tiles can be `bg-tile` (section 2.3). It is set apart from the hero by its heading and the hero's own bottom padding. The directory adds only `pt-4` (320) and `pt-0` (1024 and up). The first comp had a 200 px dead gap there (section 7).

### 3.3 Anatomy

```
section.directory  (aria-labelledby, bg-canvas)
  div.head         h2 "What can I ask about?"  ·  lead  ·  "See all products →" (/products)
  section.family × 6   (id = family slug, aria-labelledby)
    div.family-head    h3 name + count (mono, faint)  ·  one line  ·  status mix (ul, label + count, no fill)
    div.family-body
      div.leads        product-page tiles (0 to 3)
      div.index        one tile holding every other row of the family, then the disclosure
```

**Lead tile** (`article`, `bg-tile rounded-lg p-5 md:p-6`, `flex flex-col gap-3`):
- `h4` `font-display text-xl font-bold tracking-[-0.02em]`. It holds a link to `/products/<slug>`, with the trailing `ArrowRight` (`aria-hidden`) kept on the last word in a `whitespace-nowrap` span. Changed after looking: the arrow was stranded on a wrapped "Prometheus Entity / Management". The tile itself is not a link, so there is no nested interactive content.
- The badge and version line, or for multi-row tiles a `ul.components` (name, badge, version per row).
- Summary `font-body text-[0.9375rem] leading-[1.6] text-fg-secondary max-w-[60ch]`.
- One ask chip with the page's lead question, its full text visible (section 5.1).

**Index row** (`li`, grid):
- `main` holds the name `font-ui text-[0.9375rem] font-semibold text-fg`, the badge, and the summary on the next line.
- `ver` holds the version line.
- `chip` holds the short Ask chip.
- Below 640 the areas are `"main main" "ver chip"`, so the chip shares the version's row. From 640 they are `"main chip" "ver chip"`, with the chip centred in its own column.
- Rows are separated by space only (`py-3.5`, `sm:py-4`): no rule and no row fill.

**Row order:** product-page tiles in the D-005 order, then rows by label rank (Released first, Under assessment last), then name. What can be used comes first.

**Disclosure:** when a family has more than 3 index rows, show 2 and put the rest behind a native `<button aria-expanded aria-controls>` reading "Show 9 more in Developer tools and skills" (`ChevronDown`, which rotates 180° when open). Open, it reads "Show fewer". The hidden rows are in the HTML (rendered, `hidden`), so crawlers and the prerender see all 52. Changed after looking: the first comps showed 3 rows, and at 320 the page was 10,622 px. Showing 2 rows and putting the chip on the version line brought it to 8,714 px. `/products` never collapses.

**Status mix** (family head): `ul` with `aria-label="Status of the 10 entries"`. Each `li` is icon, label and a mono count, `text-xs font-semibold text-fg-secondary`, with no fill. This is the scan line: it answers "is any of this usable?" before the visitor reads a tile. It wraps inline below 1024 and stacks from 1024.

### 3.4 Layout per breakpoint

| Width | Family | Leads | Index row | Header |
|---|---|---|---|---|
| 320 | Stacked: head, then body (`mt-5`) | 1 column | Name and badge wrap; chip on the version row | Ask entry icon-only (section 5.3) |
| 768 | Stacked | 2 columns; with 3 leads the first spans both | Chip in its own column | Ask entry with label |
| 1024 | Side-head: `grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-12`. The head is `sticky top-6`, so the family name stays beside its entries while they scroll | as 768 | as 768 | as 768 |
| 1440 | as 1024 (content 1056 px: head 312, body 696) | as 768 | as 768 | as 768 |

Spacing: `mt-12` between families below 1024, `mt-16` from 1024. Leads and index are `gap-3` apart.

**How it avoids a wall of cards.** There are only 10 tiles, and they are the 10 things with pages. The other 42 entries are rows inside six index tiles, with 2 per family visible on `/`. The family head carries the status mix, so a visitor can scan six lines before reading a single entry. Ember appears once on the page (Send); cyan is on every ask; green marks the 7 released things.

---

## 4. Product page and `/products`

### 4.1 Product page template

```
header
main
  section.product (bg-canvas)   grid at lg: [minmax(0,7fr) minmax(0,5fr)] gap-12
    left
      nav[aria-label=Breadcrumb] ol: "Products" (link) / "<name>" (aria-current=page)
      h1 <name>
      p.lead           one sentence, at most 25 words
      div.plate        bg-tile, w-fit: badge + version line(s); "Checked against <source> on <date>"
      section.facts    h2 "Key facts"; dl of 3 to 5 rows (bg-band rounded-lg px-4 py-3, gap-2, dt 9rem column from 640)
      ul.components    only on multi-row pages (Flint, Skill Pack): each row's name, badge, version, summary
    right (section#ask, sticky top-6 at lg)
      h2 "Questions worth asking"
      3 ask chips, full question text, stacked, items-start, gap-2
      composer (the hero composer, placeholder "Ask about <name>", ember Send)
      AI disclosure lines (approved, unchanged)
  section.sources (bg-band)    h2 "Sources"; ul of links: label (font-ui semibold) + URL (mono xs, break-all)
footer
```

- **Sizes:** `h1` is `font-display font-bold tracking-[-0.035em] leading-[1.05] text-balance`, 2.25rem at 320, 3.25rem from 768 and 4rem from 1280. The lead is `font-body text-[1.0625rem] md:text-[1.1875rem] text-fg-secondary max-w-[52ch]`.
- **Below 1024 the order is** breadcrumb, `h1`, lead, plate, then the conversation block, then key facts, then sources. The ask is never more than one screen below the name.
- **Copy limits** (km-content-creator writes, km-chief-content-officer reviews):
  - name at most 32 characters
  - lead at most 25 words
  - a fact label at most 3 words; its value at most 20 words, from the KB or the facts row, and never a restatement of the lead (changed after looking: "What it is" repeated the lead word for word)
  - questions: 2 to 4, each at most 70 characters, worded by section 5.2
  - sources: every link must resolve publicly. A repository that is private is left out, not linked
- **The plate's "Checked" wording** follows the version kind: "Checked against the release page", "the registry", "the repository" or "the portfolio", with `checked` from the facts row.
- **Unknown slug:** the not-found page with a 404 status (PROD-1).
- **Head metadata** per page (title "<name> · KnowMe AI, LLC", description = lead) is site-product-pages 1.3. No pricing, compliance or certification anywhere, including the meta description.

### 4.2 `/products`

- `h1` "Products" and its lead sit on the canvas (sizes as the product `h1`, capped at 3.5rem).
- **Filter.** A `div role="group" aria-label="Show family"` holds 7 native buttons: All, then the six families, each with a mono count.
  - Selected is `aria-pressed="true"`, `bg-ember-soft text-fg` and a leading `Check` icon. Unselected is `bg-tile text-fg-secondary`, with hover `bg-hover`. Selection is never colour alone, because of the check.
  - The state lives in the URL as `?family=<slug>`, written with `replaceState`. All 52 entries stay in the HTML; the filter hides families.
  - Below 640 the group is one row that scrolls inside itself (`overflow-x-auto`, negative gutter, the scrollbar hidden). Changed after looking: wrapped, it took about 300 px at 320 before any content. The cut-off last chip is the scroll cue. From 640 it wraps.
- **Result line.** `p role="status"` in mono reads "Showing 15 of 52" and is announced politely on change.
- **Families** render as on `/` with headings one level up (`h2`) and nothing collapsed.
- **Labels key.** A closing `bg-band` section, `id="labels"`, "What the labels mean", holds a `dl` of the six badges and their definitions. `/` links to it from the lead (`/products#labels`) once the content officer approves the line.

---

## 5. Ask-the-concierge entries

### 5.1 Three entries, one behaviour

| Entry | Where | Visible label | Accessible name | On activate |
|---|---|---|---|---|
| Question chip | Lead tiles, product pages | The full question | The same (no `aria-label`) | Opens a new thread with the question as the first message |
| Ask chip | Index rows | "Ask" | "Ask the concierge: What is Logos, and how far along is it?" (the visible "Ask" leads the name, WCAG 2.5.3) | Same, with the row's prompt |
| Header entry | Every non-thread page | "Ask the concierge" from 640; icon-only below | "Ask the concierge" | If the page has a composer (`/`, product pages), it scrolls to the composer and focuses it. Otherwise it opens a new thread with no prompt (the empty state, site-concierge-opening) |

**Chip anatomy:** a native `<button>`.
- Classes: `inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 py-2 bg-cyan-soft text-cyan-text font-ui text-sm font-semibold leading-[1.35] text-left transition-hover hover:bg-hover focus-cue active:translate-y-px`. `MessageCircle` sits at `size-4`.
- The radius is `rounded-lg`, not pill: pills are for status.
- Long questions wrap inside the chip; it never truncates.
- Measured: `cyan-text` on `cyan-soft` is 4.74 (light) and 6.98 (dark), and on `hover` 4.86 and 6.58. The ember focus outline is 3.51 and 5.28 on cyan-soft. All are in `tokens.test.ts` already.

**The send rule.** Pressing a chip sends its question at once; that press is the visitor's action. The question is shown in full on the chip, or in the Ask chip's accessible name. The thread then shows it as the visitor's first message, so nothing is sent that the visitor cannot see. The prompt names the product in full, so no hidden page context is passed and none is needed (site-ask-concierge extracts the landing's start-a-thread logic into the shared hook).

**What the chat opens with:** the visitor's question as message one, then the streamed answer with its sources. The AI disclosure shows exactly as it does today; no entry may suppress it. A header entry with no prompt opens the empty state; its opener and family chips belong to site-concierge-opening.

### 5.2 Prompt wording rules

1. A prompt is a question a visitor would ask, in the visitor's voice, ending in "?".
2. It never carries a claim. "How does Surreal Memory Server store agent memory?" is allowed. "How does KnowMe keep my data private?" is not: it asserts privacy.
3. It names the product by its display name, with no pronouns and no "this".
4. It has no superlatives, no "best", "fastest" or "only", and no pricing, availability dates, compliance or certification.
5. It is at most 70 characters (chips wrap, but a question that long is two questions).
6. The index-row template is fixed: "What is {name}, and how far along is it?". Lead questions are written per product (the appendix data holds the ten drafts).

### 5.3 Header

The order is: lockup link, "Products" (from 640, `aria-current="page"` on `/products` with `bg-ember-soft`), Ask entry, history link (existing, when there are saved chats), then the theme toggle.

The Ask entry is `inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 font-ui text-sm font-semibold text-fg hover:bg-hover focus-cue`. Its `MessageCircle` icon is `text-cyan-text`.

**The 320 budget:** lockup 112, gap 8, then Ask 44 (icon-only), 4, history 44 (icon-only below 640: `History` icon with `aria-label` "Your conversations"), 4, and theme 44. That is 260 of 288 px, and about 282 of 285 px at the comfortable root size. "Products" is hidden below 640; the directory link and the breadcrumb carry it there.

### 5.4 Focus order and targets

Every control is at least 44 by 44 px (`min-h-11`), except the inline text link in prose.

- `/`: skip link, lockup, Ask entry, history, theme, composer, Send, resume link, "See all products", then per family the tile title links and question chips in tile order, then the index Ask chips, then the disclosure.
- Product page: skip link, lockup, Products, Ask entry, history, theme, breadcrumb "Products", the question chips, composer, Send, source links.

DOM order equals visual order at every width. The sticky family heads contain no controls.

**Focus targets:**
- The Ask entry from the header moves focus to the textarea. It does not move it to the section.
- Expanding a disclosure keeps focus on its button.
- Filter changes keep focus on the pressed button.

### 5.5 Motion

| What | How | Timing | Reduced motion |
|---|---|---|---|
| **Signature: the question moves into the conversation.** On a chip press, the chip's label and the thread's first user message share a `view-transition-name` (`ask-prompt`). Navigation uses React Router 7's `navigate(to, { viewTransition: true })` | `::view-transition-group(ask-prompt)` | `--km-duration-page` (250 ms), `ease-brand-out`; the rest of the page cross-fades | No transition; navigation is instant (the global rule) |
| Hover and focus fills | `transition-hover` | 150 ms | 0 |
| Chip press | `active:translate-y-px` | instant | n/a |
| Disclosure chevron | `rotate(180deg)` | 150 ms | 0 |
| Disclosure rows | appear without animation | n/a | n/a |
| Filter change, page load, scroll | none | n/a | n/a |

The transition is skipped where `document.startViewTransition` is missing. Set the name only on the pressed chip, at press time, so that only one element carries it.

### 5.6 Visitor strings for content review

Every string the five changes add. **NEW** means it is not in an approved file. Existing approved strings (the hero, the AI disclosure, the two kept sections) are not repeated. The 52 display names and summaries are drafts in the appendix, also NEW.

| # | Where | String | Status |
|---|---|---|---|
| 1 | Header entry label and accessible name | Ask the concierge | NEW |
| 2 | Header nav link | Products | NEW |
| 3 | Header history link, icon-only below 640, accessible name | Your conversations (existing `HISTORY_LINK_CONTENT.label`, reused) | existing |
| 4 | Directory `h2` | What can I ask about? | NEW |
| 5 | Directory lead | {52} products and projects from KnowMe AI, LLC, each with the status its own source gives. Ask the concierge about any of them. | NEW |
| 6 | Directory link | See all products | NEW |
| 7 | Family names (6) | Applications · Agents and memory · Platform and infrastructure · Developer tools and skills · Integrations · Services and research | NEW |
| 8 | Family lines (6) | see section 3.1 | NEW |
| 9 | Status mix accessible name | Status of the {n} entries | NEW |
| 10 | Status labels (6) | Released · Pre-release · In development · Prototype · Design only · Under assessment | NEW |
| 11 | Label definitions (6) | see section 2.1 | NEW |
| 12 | Version line templates (7) | see section 2.4 | NEW |
| 13 | Disclosure, closed / open | Show {n} more in {family} / Show fewer | NEW |
| 14 | Index chip, visible / accessible | Ask / Ask the concierge: {prompt} | NEW |
| 15 | Index prompt template | What is {name}, and how far along is it? | NEW |
| 16 | Lead questions (10) | `PAGES[].question` in `comps/build-data.mjs` | NEW |
| 17 | Product page breadcrumb landmark | Breadcrumb | NEW |
| 18 | Product page `h2`s | Key facts · Questions worth asking · Sources | NEW |
| 19 | Product composer placeholder | Ask about {name} | NEW |
| 20 | Plate provenance | Checked against the release page on {date} (and the registry, the repository or the portfolio) | NEW |
| 21 | `/products` lead | Every product and project from KnowMe AI, LLC, with the status its own source gives. Ask the concierge about any of them. | NEW |
| 22 | Filter group name / first option | Show family / All | NEW |
| 23 | Result line | Showing {n} of {total} | NEW |
| 24 | Labels section `h2` | What the labels mean | NEW |
| 25 | Landing section 1 "Ask about the products." | removed (section 3.2) | PROPOSED REMOVAL |
| 26 | Product page `<title>` template | {name} · KnowMe AI, LLC | NEW |

---

## 6. Tokens, tests and acceptance

### 6.1 Token added (lands with site-home-directory; owner km-creative-director)

| Token | Tailwind | Light | Dark | Why |
|---|---|---|---|---|
| `--km-tile` | `bg-tile` | the `--km-chrome` value (`#ffffff`) | the `--km-surface` value (`#161d29`) | A filled container placed on the canvas that holds status and AI fills. It is the only ground where every soft fill clears 1.8 ΔL\* in both themes (section 2.3) |

Tests to add to `src/styles/tokens.test.ts`:
- `km-tile` in `SURFACES`. Every text token passes, because the values are already raised (light) and surface (dark).
- `FILL_STEPS` tile/canvas: 2.74 light and 6.44 dark.
- A new `SOFT_ON_TILE` check requires success-, warning- and cyan-soft at least 1.8 ΔL\* on the tile.
- `FOCUS_RING_ON` adds the tile: 3.97 light and 5.94 dark.

Extend `src/test/flat-shell.test.ts` to the new site components.

### 6.2 Visual acceptance (QA, against captures at 320, 768, 1024 and 1440 in both themes)

1. No border, rule, shadow, gradient or blur. Every boundary is a fill change or space.
2. All 52 public entries are on `/`, each with its name, a label in text, a version line and an ask control. None of the 6 non-public rows appears.
3. Every label matches the appendix row for row. A filled badge sits only on `bg-tile`.
4. The only ember fill on `/` and on a product page is Send. Every ask control is cyan. In light, green appears only on Released.
5. At 320: no horizontal page scroll, the header on one row, no version line broken inside a date, and no tile title arrow on a line by itself.
6. At 1024 and up, the family heads stay beside their entries while scrolling (sticky), and the product conversation column stays in view.
7. Pressing any chip opens a thread whose first message is exactly that chip's question.
8. Light and dark carry the same hierarchy.

---

## 7. Directions explored, and what looking changed

**Structures** (impeccable shape, surface scope; the visual world is fixed by brand-pages.md). I ranked seven structures. The roll (seed `3b620156`) dealt 3, 1 and 7:

| Dealt | Structure | Verdict |
|---|---|---|
| 3 (lead) | A families-by-status matrix: rows are families, columns are the six labels, names in cells | Declined on a named requirement. HOME-1 needs a version line and an ask control per row, and a 176 px cell at 1440 holds neither. Kept from it: the family head's status mix, so a visitor still reads status by family at a glance. |
| 1 | Family shelves: tiles for product pages, an index tile for the rest | **Chosen**, raised by the other two |
| 7 | The directory written as a concierge exchange | Declined: static text dressed as an AI answer blurs the AI disclosure. Kept from it: the heading is the visitor's question, "What can I ask about?" |

Unranked and not dealt: family tabs, a featured carousel plus index, a type-ahead list, and accordions. They hide most entries from a scan. The catalogue's visual-world challengers do not apply at surface scope and were not used.

**After looking at the captures** (round 1: 12 captures; round 2: 12 captures; the shots in `comps/shots/` are round 2):

| Seen in | Problem | Change |
|---|---|---|
| `home-directory-1440-light.png` | 21 amber "In development" pills outweighed the 7 green Released | In development is neutral; only Released and Pre-release are filled (section 2.1) |
| `home-directory-1440-light.png` | Arrow stranded after a wrapped "Prometheus Entity / Management" | The arrow is bound to the last word (section 3.3) |
| `home-directory-320-light.png`, `-1440-light` | "No tagged release · last commit 20 Oct / 2026" broke inside the date | The wording is shortened to "No release" and segments are unbreakable (section 2.4) |
| `home-directory-320-light.png` | 10,622 px page; the Ask chip took its own line in every row | The chip shares the version row below 640, and 2 rows show per family (8,714 px) |
| `home-directory-1440-dark.png` | About 200 px of dead canvas between the hero and the directory | The directory top padding is removed from 1024 (section 3.2) |
| `product-the-boss-1440-light.png` | "What it is" repeated the lead; the breadcrumb separator was off-centre; the full-width plate was mostly empty | Facts may not restate the lead; the separator has even margins; the plate is `w-fit` |
| `products-320-dark.png` | The filter took about 300 px before any content | The filter is a single row that scrolls inside itself below 640 |

The capture script checks for horizontal overflow and that all four fonts loaded. Both rounds reported none and all four (`node docs/design/comps/capture.mjs`).

---

## 8. Risks

- **The label rule reads the portfolio's prose.** Steps S3 to S6 match words in `portfolioStatus`. A reworded status can move a row: DocuMind's "Core/Pro boundary unresolved" first matched "Under assessment" until S3 was narrowed to "status unresolved". The drift check in site-home-directory must fail when any label differs from the appendix, and the appendix must be regenerated and reviewed with every facts update. The uncomfortable part: the visitor-facing truth of 52 labels rests on regexes over another document's sentences.
- **"Released" is evidence of a published version, not of quality.** Flint Forge is Released on the strength of a v1.0.0 tag that the facts file calls "a source claim". The Universal Agent Runtime is Released while the portfolio says work stopped (D-002). The label definition says only what it means, but a visitor may read more into green.
- **Source links may be private.** The facts file points at repositories (for example `GQAdonis/librefang` for BossFang) whose public visibility I did not check. Every source link must be checked before a page ships.
- **The summaries and names are mine, as drafts.** They are derived only from each row's own summary, but no one has reviewed them. Nothing in the appendix's "draft" columns may ship unreviewed.
- **`bg-tile` is a new token** that site-home-directory needs before it can match the comps. Without it, light badges vanish on bands and dark ones vanish on raised.
