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
