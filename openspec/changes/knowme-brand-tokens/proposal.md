## Why

The app borrows KnowMe's anchor colors but not its system: there is no surface ladder, no cyan AI accent, visible borders everywhere, stock shadcn sidebar colors (blue in dark mode), no persisted theme, and several text colors fail WCAG AA (white on ember 3.97:1, ember text 3.48:1, faint text 2.74:1 on muted surfaces). This change encodes the binding KnowMe UI/UX standard (`know-me-system/docs/knowme-ui-ux-standard.md`, Flat 2.0) and the Brand Guide v1.0 as design tokens, so every later restyle change consumes tokens instead of hard-coded values.

## What Changes

- New `src/styles/tokens.css`: KnowMe palette for light and dark (canvas, chrome, surface, raised, hover, muted surface; text, secondary, faint; ember, ember-soft; cyan; success/warning/danger), **text-safe variants** where the standard's values fail AA (decision D-007), code backgrounds, radius scale (4/6/10/16/24/pill), motion tokens (150/250/350 ms, brand easings), and type roles with a 12 px floor.
- shadcn/assistant-ui aliases (`--background`, `--card`, `--primary`, `--sidebar-*`, …) bound to KnowMe tokens; **Flat 2.0**: `--border` resolves to transparent and a base rule removes default borders and elevation.
- Tokens become hex values (replacing RGB channel triplets); Tailwind `@theme inline` exposes the KnowMe names (`bg-canvas`, `bg-chrome`, `bg-surface`, `bg-raised`, `bg-hover`, `text-faint`, `text-ember-text`, `bg-cyan-soft`, …).
- Text uses of status/brand colors move to the text-safe tokens (`text-primary` → `text-ember-text`, `text-success|warning|destructive|info` → their `*-text` variants).
- Theme: dark stays the default; the user's choice persists across reloads and is applied before first paint; the appearance page's font-size setting is applied.
- Third-party theming: Mermaid reads the tokens and re-renders on theme change; Shiki uses the brand code backgrounds; Sonner already uses color tokens.
- Font loading matches the brand import weights.

Out of scope: per-surface restyling and removing border/shadow utility classes from components (app-shell-flat2, chat-surfaces-flat2, app-pages-flat2-entity-views); logo and naming (knowme-brand-identity).

## Capabilities

### New Capabilities
- `brand-theme`: the KnowMe color, type, shape and motion system, theme selection and persistence, and the contrast guarantees it provides.

### Modified Capabilities
<!-- none -->

## Impact

- `src/index.css`, new `src/styles/tokens.css`, `index.html` (font weights, pre-paint theme script), `src/stores/ui-store.ts`, `src/pages/appearance-page.tsx`, `src/features/artifacts/{mermaid-block,shiki-code-block}.tsx`, className substitutions across `src/`.
- No API, data or dependency changes.
