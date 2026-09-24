## Why

The application shell (top bar, threads sidebar, context panel, mobile navigation and drawer) still uses the pre-rebrand treatment: 1px borders between regions, drop shadows, backdrop blur, a faint grid texture on the work area, raw palette status dots (`bg-green-400`, `bg-amber-400`), 9–11px text and an outlined primary button. The binding KnowMe UI/UX standard (§3 Flat 2.0, §4, §5, §11) forbids all of these. The harness also found that at 768px the sidebar and context panel both stay open and squeeze the conversation to ~150px.

## What Changes

- Surface ladder: canvas work area; chrome top bar, sidebar and bottom nav; surface context panel and menus; regions separate by fill only. No borders, dividers, shadows, blur or grid texture.
- Navigation states: the active destination gets an ember-tinted fill plus stronger text and icon; hover uses the hover token; keyboard focus gets a fill plus the focus ring. This applies to top-bar links, bottom-nav items and the active thread.
- Status: the runtime status uses status tokens with an icon and a text label (not colour alone), and is visible in the top bar on every desktop route (§5.1 persistent status). `StatusBadge` becomes a 12px status pill.
- Type: nothing below 12px in the shell.
- Controls: "New thread" is the primary (ember) button. Search is a filled field. The agent picker for new threads is the Base UI `Select` instead of a hand-rolled dropdown.
- Overlays: the mobile drawer and the context panel below 1280px become a `Sheet` (Base UI Dialog) with a scrim, focus trap and Escape to close. The inline context panel shows only at ≥1280px, which fixes the 768px collapse.
- Accessibility: a skip link to the main content, and names on every icon-only control.
- Primitives used by the shell (`dialog`, `select`, new `sheet`) lose their ring outlines, shadows and backdrop blur, and gain a `--km-scrim` token.

## Impact

- Code: `src/components/layout/*`, `src/components/common/*`, `src/components/ui/{dialog,select,sheet}.tsx`, `src/styles/tokens.css`, `src/index.css`.
- No data or API changes. Panel state stays per-session in `ui-store`.
- Pages inside the shell (agents, settings, threads content) are restyled by later changes.
