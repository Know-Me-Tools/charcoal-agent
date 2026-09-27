## Context

Sources, in order of precedence (unchanged from landing-and-about-brand):
1. WCAG 2.2 AA
2. the binding UI/UX standard S1, via the `knowme-brand-standard` skill
3. `docs/design/brand-pages.md`
4. the phase decision log (D-004 for copy)

Current state (2026-09-27, measured):
- `src/pages` has 8 raw palette class lines and 32 sub-12px arbitrary sizes (proposal.md).
- `providers-page.tsx` is the only page with a `<table>` (line 346).
- The tokens already exist:
  - `--km-band` / `bg-band` for grouping
  - `success`, `warning` and `danger`, each with `-soft` and `-text` variants that pass AA (`src/styles/tokens.css` 52–64 and 109–120)
  - `--ring` = ember
  - the `focus-cue` utility (`src/index.css` 91: `focus-visible:bg-hover outline-2 outline-offset-2 outline-ring`)
  - `StatusBadge` (`src/components/common/status-badge.tsx`)
- Existing e2e for these routes only checks that they render (`e2e/mock-smoke.spec.ts`) and that skill toggles work (`e2e/skills-toggle.spec.ts`). Nothing checks writes on providers or agents.

## Goals / Non-Goals

**Goals:** meet every requirement in `specs/app-pages/spec.md` with no new tokens, no data-layer changes and no package fork.

**Non-Goals:** everything listed under Non-goals in proposal.md.

## Decisions

### 1. Do not adopt the package's entity view components

`@prometheus-ags/prometheus-entity-management` 4.0.2 only re-exports `@prometheus-ags/entity-graph-react` 4.0.2 (`dist/index.d.ts` is `export * from '@prometheus-ags/entity-graph-react'`). The components' source is in `node_modules/@prometheus-ags/entity-graph-react/dist/index.mjs`:

| Component | Styling surface | Hard-coded Flat 2.0 / WCAG offenders |
|---|---|---|
| `EntityDetailSheet` (index.d.ts:630) | none. The props are `crud, fields, title, description, children, show*Button, deleteConfirmMessage`, with no `className`. | Wraps `Sheet` (index.mjs:2571): `border-l bg-background shadow-2xl`, `border-b`, `border-t`, and an overlay with `bg-black/40 backdrop-blur-sm`. The body has `text-[10px]`, and fields use `border bg-muted/50 … focus:outline-none focus:ring-1`. Its confirm dialog has `border rounded-xl shadow-2xl`. |
| `EntityFormSheet` (index.d.ts:640) | none (`crud, fields, createTitle, editTitle`) | the same `Sheet`, plus `text-[10px]` and `border border-destructive/20` |
| `EntityTable` (index.d.ts:1345) | a root `className` only | `bg-muted/50 border-b` header, `border-b` rows, `border-t` footer, `text-[10px]`, bordered toolbar buttons |
| `EntityListView` (index.d.ts:1833) | a root `className` only | delegates to `DataTable` (`border-t`, `text-[11px]`, `rounded-full border … text-[10px]` badges, `border bg-card hover:shadow-md` cards) and to `ListView` (`divide-y rounded-md border`) |

Tokens can recolour `border` to transparent. They cannot remove `shadow-2xl`, `backdrop-blur-sm`, `text-[10px]`/`text-[11px]` or `focus:outline-none`, and the last of these breaks decision 3. The detail and form sheets also need `CRUDState` from `useEntityCRUD`, and the table needs `UseEntityViewResult` from `useEntityView`. This repo's data layer exposes neither: pages read through `useRuntimeList` and write through `useGraphMutation` (`src/lib/entity-graph/`). Adopting them would therefore be a data-layer change on top of a fork.

**Decision:** keep the existing page components. km-product-owner records this as a decision-log entry that states the revisit condition: a package release whose four components accept class or slot overrides, or render without the listed classes. An upstream request goes to the package owner.
**Alternatives rejected:**
- A global CSS override inside a scoping wrapper (`[data-entity] * { border: 0; box-shadow: none }`). It fights the package's specificity, it cannot fix sub-12px text or `outline-none` without `!important`, and it breaks silently on package upgrades.
- Forking the package, which the plan rules out.

### 2. No new tokens; `bg-band` groups sections

The light theme's canvas (`#f7f7f8`) and surface (`#fafbfc`) are about 1.3 ΔL* apart, so a `bg-surface` group disappears in light. Settings groups, the agent-detail sections and the providers table container use `bg-band` (`#eef0f3` light, `#161d29` dark). Treatments:

- **Rows:** table and list rows inside a band use no rule. Rows are separated by vertical padding plus `hover:bg-hover` and `focus-within:bg-hover`. If a dense table needs alternation, alternate rows use `bg-surface` on `bg-band`.
- **Inputs:** `Input`, `Select` and `Textarea` use their filled variant (`bg-composer`/`bg-raised`, as in chat-surfaces) with `border-0`. Any page-level `border` class on them is removed.
- **Status:** status uses `StatusBadge` where a status state exists. Other labels use `text-{success,warning,danger}-text` on `bg-{…}-soft`, always with a word ("Saved", "Enabled", "Disabled", "Platform", "Filesystem") and never a bare dot. Source-type labels (purple and blue today) become neutral `text-fg-secondary` text, because they are not status.
- **Type:** sub-12px sizes become `text-xs` (12px). Where a label was 9–11px to fit, the layout wraps instead.

km-creative-director is not needed, because no token is added. If the frontend engineer finds a pair that fails contrast, it goes to km-creative-director as a blocker and is not solved with a new token.

### 3. Fix focus in the `Button` primitive, once

The `Button` base class has an unconditional `outline-none`. In Tailwind 4 that sets `--tw-outline-style: none`, which `focus-visible:outline-2` then reads, so no outline paints. Landing avoided this by using native elements (`docs/design/brand-pages.md`), but the app pages hold dozens of `Button`s.

**Decision:** in `src/components/ui/button.tsx`, replace `outline-none` and the `focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring` classes with `focus-cue`, keeping only the outline and not `bg-hover` on filled variants. If `focus-cue`'s `bg-hover` clashes with an ember fill, add a `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` class for the base instead. The destructive variant's `focus-visible:ring-destructive/*` classes go too, because the outline replaces them. Native controls and package-free custom controls on the pages use `focus-cue` directly. The brand-pages native-element exception stays as it is.

**How focus must render:** a 2px solid `--ring` (ember) outline with a 2px offset on every keyboard focus stop, and no `box-shadow` ring. Ember on the light canvas and on `band` must be at least 3:1 (WCAG 1.4.11). Ember is the existing brand ring, already checked in `tokens.test.ts`.

### 4. Verification shape

The final gate runs once, at the end. Axe and static captures cannot detect a missing outline, so the spec requires a scripted Tab-through per route that asserts computed `outline-style` and `outline-width` on each stop. The CRUD scenarios assert request method and path on the mock, which is the observable contract. Screenshots of the in-scope routes at 320 and 1440 in both themes replace the plan's "adopted component" screenshot, since nothing is adopted.

## Risks / Trade-offs

- **The `Button` fix touches every screen, including chat and the shell.** This is the risk most likely to hurt the design. Any existing test that asserts ring classes or `box-shadow` on focus will fail. So will visual captures of focused states on other routes, and a `bg-hover` focus fill on ember buttons may read as a state change. Mitigation: the final gate runs the full e2e and visual suites, not only the new spec. Any failure outside the in-scope routes is fixed in the primitive, not by special-casing pages.
- **Not adopting the package components leaves plan item 11 half-met in spirit.** The operator wanted the package's views, and this change ships none. The decision is evidence-based and revisitable, but it is still a "no".
- **The mock returns canned bodies**, so the CRUD e2e proves request shape and UI response, not UAR persistence. The live UAR smoke is optional. If no UAR is reachable at `INTEGRATION_UAR_URL` / `127.0.0.1:6565`, verification.md says so and leaves live CRUD unverified.
- **Removing sub-12px sizes will make dense rows taller** (agents page cards, provider model lists). The 320px no-scroll scenario catches overflow, but not aesthetic crowding. The visual review catches that.

## Open Questions (defaults applied, not blocking)

1. **Fix focus in the primitive, or switch each page control to native elements?** Default: fix the primitive (decision 3).
2. **Should source-type labels (Platform, Filesystem) keep a hue?** Default: no. They become neutral text, because they are not status and the plan bans decorative palette.
3. **Should the providers table become a list at 320px?** Default: keep the `table`, remove `min-w-[400px]`, and let cells wrap. Switch to a stacked list only if the 320 no-scroll scenario fails.
4. **Is an upstream issue for themeable entity components filed by this change?** Default: km-product-owner drafts it in the decision-log entry, and the operator decides whether to send it.
5. **Is the live UAR smoke required?** Default: no. It runs if a UAR is reachable and is otherwise recorded as not run.

## Defaults accepted (orchestrator, 2026-09-27, operator asked to move fast)

1. Focus is fixed in the `Button` primitive, not by switching controls to native elements. This also resolves the tooltip-icon-button follow-up from landing-and-about-brand.
2. Source-type labels become neutral `text-fg-secondary`.
3. The providers table stays a table at 320px: drop `min-w-[400px]` and let the cells wrap.
4. The product owner drafts the upstream request in the decision-log entry, and the operator decides whether to send it. The product owner may write `.kbd-orchestrator/phases/complete-rebranding/decision-log.md` for task 1.1.
5. The live UAR smoke runs only if a UAR is reachable; otherwise it is recorded as "not run".
