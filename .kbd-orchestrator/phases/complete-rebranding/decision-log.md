# Decision Log — complete-rebranding

> Per-phase record of consequential decisions. `kbd-status` prints header lines;
> `kbd-status --explain` expands the full entries.

## D-001 · legal name is "KnowMe AI, LLC"          [plan · 2026-09-23]

**TL;DR:** User-visible legal/copyright text uses "KnowMe AI, LLC", overriding the brand docs.

**Why:** Operator decision (2026-09-23). Every brand source (brand guide L968/L1570, wordmark system footer, business cards) says "KnowMe, LLC"; the operator's instruction is authoritative for this app.

**Alternatives:** "KnowMe, LLC" as in the brand docs (rejected by operator).

**Learn more:** The brand docs should be updated upstream in `/Users/gqadonis/Projects/know-me/branding/` so sources stop disagreeing — out of scope for this repo.

---

## D-002 · upgrade Tailwind 3.4 → 4                  [plan · 2026-09-23]

**TL;DR:** Move to Tailwind 4 (CSS-first `@theme`, `@tailwindcss/vite`) before any token work.

**Why:** 19 v4-only classes are currently dropped silently (chat column is unconstrained as a result), and the brand reference implementation (`know-me-system/desktop/src/index.css`) is Tailwind 4, so its tokens port almost directly. Current shadcn (4.x) targets Tailwind 4.

**Alternatives:** Stay on 3.4 and rewrite the 19 classes (rejected: ports tokens twice, blocks latest shadcn).

**Learn more:** Tailwind v4 upgrade guide (`npx @tailwindcss/upgrade`); `tailwindcss-animate` → `tw-animate-css`.

---

## D-003 · shadcn/ui on Base UI, latest; assistant-ui latest          [plan · 2026-09-23]

**TL;DR:** Re-install shadcn primitives with a `base-<style>` `components.json` style (Base UI, not Radix) at shadcn 4.21.x; upgrade `@assistant-ui/react` 0.12 → 0.15.x, `react-markdown` → 0.14.x, `react-devtools` → 1.2.x.

**Why:** Operator decision. shadcn encodes the primitive library in the style prefix (`radix-*` vs `base-*`); the assistant-ui registry is style-aware (`https://r.assistant-ui.com/styles/{style}/{name}.json`) so its components can be pulled as Base UI variants. Base UI changes call-site APIs (`asChild` → `render`, `onOpenChange(open, details)`, `data-open/closed`), so every consumer of dialog/popover/tooltip/dropdown/select/sheet must be updated.

**Alternatives:** Keep Radix (rejected by operator) · progressive per-component migration (rejected: leaves mixed primitives during a visual rebrand).

**Learn more:** shadcn skill `migrate-radix-to-base` (overlays.md mapping); `npx assistant-ui@latest upgrade` codemods.

---

## D-004 · no "Charcoal Agent"; UAR instance + KnowMe agent          [plan · 2026-09-23]

**TL;DR:** Remove every user-visible "Charcoal" reference; the product is KnowMe, the backend is a Universal Agent Runtime instance, and "KnowMe" is the agent that runs inside it.

**Why:** Operator clarification. "UAR"/"Universal Agent Runtime" stays as the correct name for the runtime (settings/about/status), but built-in skills are described as belonging to the KnowMe agent, not a "Charcoal Agent".

**Alternatives:** Hide UAR terminology entirely (rejected: the runtime is real and configurable).

**Learn more:** `src/pages/skills-page.tsx:168`, `about-page.tsx`, `uar-status.tsx`.

---

## D-005 · keep internal identifiers unchanged          [plan · 2026-09-23]

**TL;DR:** `CharcoalDb`, `idb://charcoal-db`, `charcoal:*` localStorage keys, `X-UAR-Session-ID`, `/api/uar/*` and the repo directory name are not renamed in this phase.

**Why:** Renaming storage names orphans users' local threads (IndexedDB) and settings; header/route names are the UAR contract. None are user-visible.

**Alternatives:** Rename with a storage migration (deferred to a future phase if desired).

**Learn more:** `src/lib/db/pglite.ts`, `src/lib/db/db-provider.tsx`.

---

## D-006 · replace TanStack Query with the Prometheus entity graph          [plan · 2026-09-23]

**TL;DR:** Adopt `@prometheus-ags/prometheus-entity-management@4.0.2` (alias of `@prometheus-ags/entity-graph-react`) plus required peer `@prometheus-ags/entity-graph-core@4.0.2`; migrate all 50 TanStack Query call sites in 10 files and uninstall `@tanstack/react-query`. Also remove the unused `@tanstack/react-table@8` (the entity package brings v9).

**Why:** Operator decision. The entity graph normalizes UAR entities (agents, providers, skills, sessions) once, so list and detail views stay consistent without query keys; it also ships list/table/detail/form components (`EntityListView`, `EntityTable`, `EntityDetailSheet`, `EntityFormSheet`) for the settings list pages.

**Alternatives:** Keep TanStack Query (rejected by operator) · depend on `entity-graph-react` directly (rejected: operator named the alias package; the alias re-exports it).

**Learn more:** package README (Quick start, three-layer model); skills `entity-graph-setup`, `entity-graph-crud`. Note: the alias README pins 3.2.0 in examples, but npm latest is 4.0.2 — install the matching 4.0.2 core/React pair.

---

## D-007 · WCAG AA wins over verbatim brand table values          [plan · 2026-09-23]

**TL;DR:** Where the standard's colors fail AA as text, introduce text-safe variants instead of shipping failing pairs.

**Why:** Assessment measured failures: white on #E04E28 3.97:1, ember text on light canvas 3.71:1, faint #6B7280 on dark 3.98:1, light cyan 3.44:1, light warning 2.98:1, light success 3.08:1. Fixes: charcoal (#0B0F14) text on ember buttons in dark, ember-2 #C13E1E (5.28:1 with white) for light primary fills, darker text variants for cyan/amber/green in light mode, lighter faint text in dark mode. Each deviation is listed in the token file with its measured ratio.

**Alternatives:** Ship the table verbatim (rejected: violates phase goal 7).

**Learn more:** assessment.md → WCAG CONTRAST AUDIT.

---

## D-008 · keep the page components; do not adopt the package entity views          [spec · 2026-09-27]

**TL;DR:** The settings list pages keep their existing components. `EntityDetailSheet`, `EntityFormSheet`, `EntityTable` and `EntityListView` from `@prometheus-ags/entity-graph-react` 4.0.2 (re-exported by `@prometheus-ags/prometheus-entity-management` 4.0.2) are not adopted. This partly reverses the component half of D-006; the data-layer half of D-006 stands. Change: `app-pages-flat2-entity-views` (design.md decision 1).

**Why:** The four components hard-code classes that break Flat 2.0 or WCAG 2.2 AA, and expose no way to remove them. Evidence, `node_modules/@prometheus-ags/entity-graph-react/dist` (read 2026-09-27):
- `EntityDetailSheet` (index.d.ts:630, index.mjs:2656). Props `crud, fields, title, description, children, show*Button, deleteConfirmMessage`; no `className`. Wraps `Sheet` (index.mjs:2571): overlay `bg-black/40 backdrop-blur-sm` (2580), panel `border-l bg-background shadow-2xl` (2581), `border-b` header (2582), `border-t` footer (2590). Field labels `text-[10px]` (2680). Inputs `border bg-muted/50 … focus:outline-none focus:ring-1` (2598). Confirm dialog `bg-black/50 backdrop-blur-sm` (2689) and `border rounded-xl shadow-2xl` (2690).
- `EntityFormSheet` (index.d.ts:640, index.mjs:2721). Props `crud, fields, createTitle, editTitle`; no `className`. Same `Sheet`, error box `border border-destructive/20` (2748), `text-[10px]` dirty marker and hints (2756, 2759).
- `EntityTable` (index.d.ts:1345, index.mjs:2453). Root `className` only. Toolbar `border-b` (2486), search `border … focus:outline-none` (2495), `text-[10px]` (2500), header `bg-muted/50 border-b` (2518), rows `border-b` (2519, 2525), footer `border-t` (2552).
- `EntityListView` (index.d.ts:1833, props 1798; index.mjs:7037). Root `className` only. Delegates to `DataTable` (5130) and `ListView` (5540): cards `rounded-lg border bg-card hover:shadow-md` (5414, 5450), badges `rounded-full border … text-[10px]` (5497, 5717), meta `text-[11px]` (5507), `border-t` sections (5516, 5526), list `divide-y rounded-md border` (5554).

Tokens can recolour `border` to transparent. They cannot remove `shadow-2xl`, `backdrop-blur-sm`, `text-[10px]`/`text-[11px]` or `focus:outline-none`; the last one breaks the visible-focus requirement of this change (WCAG 2.4.7/2.4.11). Separately, the data contract does not match: the sheets need `CRUDState` from `useEntityCRUD` (index.d.ts:551, 594) and the table needs `UseEntityViewResult` from `useEntityView` (index.d.ts:459, 511). This repo reads through `useRuntimeList` and writes through `useGraphMutation` (`src/lib/entity-graph/`) and exposes neither. Adopting would be a fork plus a data-layer change.

**Alternatives:** Scoped CSS override (`[data-entity] * { border: 0; box-shadow: none }`), rejected: fights package specificity, needs `!important` for sub-12px text and `outline-none`, breaks silently on upgrade · fork the package, rejected: ruled out by the phase plan · adopt anyway and waive Flat 2.0/AA on those pages, rejected: violates phase goal 7 and D-007.

**Uncomfortable part:** The operator asked for the package's views (D-006, plan item 11) and this change ships none. The decision is evidence-based but it is still a "no", and every settings page stays hand-built until upstream changes.

**Revisit when:** a release of `@prometheus-ags/entity-graph-react` (or the alias) ships in which all four components either (a) accept class or slot overrides for overlay, panel, header, footer, rows, inputs, badges and labels, or (b) render without `shadow-*`, `backdrop-blur-*`, `border*`/`divide-y`, sub-12px text and `focus:outline-none`. Also revisit if this repo moves its pages onto `useEntityCRUD`/`useEntityView` for other reasons. Check: `grep -nE 'shadow-2xl|backdrop-blur|text-\[1[01]px\]|focus:outline-none' node_modules/@prometheus-ags/entity-graph-react/dist/index.mjs` returns nothing, or the four prop types gain `className`/`classNames`/slot props.

**Draft upstream request (operator decides whether to send):**
> Title: Make EntityDetailSheet, EntityFormSheet, EntityTable and EntityListView themeable
>
> In 4.0.2 these components hard-code visual classes that consumers cannot override: `shadow-2xl` and `backdrop-blur-sm` on `Sheet` and the delete confirm, `border`/`border-b`/`border-t`/`divide-y` on panels, rows and cards, `text-[10px]`/`text-[11px]` labels and badges, and `focus:outline-none` on inputs (index.mjs 2571–2760, 2453–2560, 5130–5720). `EntityDetailSheet` and `EntityFormSheet` take no `className` at all; `EntityTable` and `EntityListView` take a root `className` only. Apps with a borderless design system or a WCAG 2.2 visible-focus requirement cannot use them without forking.
>
> Request: (1) a `classNames` (or slots) prop on all four, covering overlay, panel, header, footer, row, input, badge and label; (2) drop `focus:outline-none` in favour of a `focus-visible` outline, or make it overridable; (3) keep all text at 12px minimum by default. Optional: accept plain list data plus mutation callbacks as an alternative to `CRUDState`/`UseEntityViewResult`, so apps on `useEntityList`/custom mutations can use the views.

**Learn more:** `openspec/changes/app-pages-flat2-entity-views/design.md` decision 1 and "Defaults accepted" 4; D-006; D-007.
