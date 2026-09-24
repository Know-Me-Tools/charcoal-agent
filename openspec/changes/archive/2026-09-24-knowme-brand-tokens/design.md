## Context

See proposal.md. Sources: S1 `know-me-system/docs/knowme-ui-ux-standard.md` §3–4 (binding for app UI), S2 Brand Guide v1.0 (radius, motion, type scale), S3 `know-me-system/desktop/src/index.css` (reference Tailwind 4 + shadcn mapping). Current app: tokens are RGB channel triplets in `src/index.css`, `.dark` class on `<html>` toggles themes (default dark via `index.html`), `ui-store` holds `theme`/`fontSize` in memory only, Mermaid has a hard-coded hex palette initialised once, Shiki uses `github-dark-dimmed`/`github-light`.

## Goals / Non-Goals

**Goals:** one token file that expresses S1/S2 exactly except where AA requires a documented deviation; all app color classes resolve through it; theme persistence without flash; contrast guaranteed by a test, not by review.

**Non-Goals:** removing `border-*`/`shadow-*` utility classes from component markup (the base rule neutralises default borders now; per-surface cleanup happens in the restyle changes); logo, naming, copy.

## Decisions

1. **Keep the `.dark` class mechanism.** Light values live on `:root`, dark on `.dark` (matching `@custom-variant dark`). S3 uses `body.light`; switching mechanisms would touch every `dark:` utility for no benefit.
2. **Two layers of tokens.** Brand names (`--km-canvas`, `--km-ember`, `--km-cyan-text`, …) carry the values; shadcn/assistant-ui aliases (`--background`, `--primary`, `--sidebar`, …) point at them; `@theme inline` exposes both to Tailwind (`bg-canvas`, `bg-primary`). Hex values replace RGB triplets — opacity modifiers keep working through Tailwind 4's `color-mix`.
3. **Text-safe variants (D-007)** measured against the worst surface of each theme (the muted surface):
   | Role | Standard value | Shipped text value | Worst-case ratio |
   |---|---|---|---|
   | faint, dark | `#6B7280` (2.74) | `#939DAB` | 4.83 |
   | faint, light | `#6B7280` (4.23) | `#5F6977` | 4.87 |
   | ember text, light | `#E04E28` (3.48) | `#B8391B` | 5.05 |
   | cyan text, light | `#0891B2` (3.23) | `#0E7490` | 4.69 |
   | success text, light | `#16A34A` (2.89) | `#14743A` | 5.13 |
   | warning text, light | `#D97706` (2.79) | `#A14A08` | 5.26 |
   | danger text, dark | `#EF4444` (3.52) | `#F87171` | 4.79 |
   | danger text, light | `#DC2626` (4.23) | `#B91C1C` | 5.67 |
   Fills keep the standard values. Button labels: charcoal `#0B0F14` on ember in **both** themes (6.76 dark, 4.84 light — keeps the exact brand ember fill, matching the KnowMe Flutter tokens); destructive labels charcoal on `#EF4444` (5.11) / white on `#DC2626` (4.83).
4. **Contrast is a test.** `src/styles/tokens.test.ts` parses `tokens.css` for both themes and asserts every text token × surface token pair ≥ 4.5:1 and every label × fill pair ≥ 4.5:1, so a later token edit cannot silently regress.
5. **Flat 2.0 by default.** `--border: transparent`; the base layer sets `border-color: var(--border)` for every element and removes box-shadows inside `.aui-root` (assistant-ui) as S3 does. Focus stays visible through `ring`/`outline` utilities (ember, ≥3:1 against both canvases).
6. **Text uses of semantic colors move to text-safe tokens** by a scripted substitution limited to bare `text-{primary,success,warning,info,destructive}` classes (opacity variants and fills unchanged); `info` maps to cyan (the standard has no separate info color).
7. **Theme persistence:** `ui-store` persists `theme` and `fontSize` (Zustand `persist`, key `knowme:ui`); a tiny inline script in `index.html` applies the saved class and font-size attribute before React loads; the store applies both on change. The e2e `setTheme` helper switches to seeding this storage key before navigation.
8. **Font size:** `html[data-font-size]` scales the root font size (compact 15px, default 16px, comfortable 17.5px); rem-based utilities follow.
9. **Mermaid/Shiki:** Mermaid reads computed token values at render time and re-initialises when the theme changes; Shiki keeps its themes but renders on the brand code backgrounds (`#0A1220` dark / `#F0F2F5` light).

## Risks / Trade-offs

- [Neutralising all default borders hides structure that markup still relies on] → accepted for this change; restyle changes add surface fills. Screenshots record the interim look.
- [Opacity-modified text classes (`text-primary/70`) are not substituted and may still fail contrast] → left to the restyle changes, which rewrite those surfaces; axe report tracks them.
- [Pre-paint script is inline JS] → no CSP is configured yet; when one is added (brand-fidelity-audit/security), it needs a hash for this script.

## Migration Plan

Branch `rebrand/knowme-brand-tokens`; unit + e2e gates. Rollback = revert merge; the only stored state is the `knowme:ui` preference.
