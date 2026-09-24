# Verification notes — knowme-brand-tokens

## 4.1 Gates (2026-09-24)
- `npm run build` ✓ · `npm run typecheck` 0 · lint 0 errors / 2 pre-existing warnings
- `npm test`: 14 files / 83 tests (adds `src/styles/tokens.test.ts`: 24 contrast assertions, both themes)
- `npm run test:e2e`: 132/132 on two consecutive runs (adds `e2e/theme.spec.ts` ×3 and a Mermaid size regression in `chat-stream.spec.ts`). One earlier full run timed out on the `thread › 1440 › light` full-page capture under parallel load; visual specs now get a 90 s budget.

## Contrast
- Token test: every text token ≥ 4.5:1 on every surface token, and every label ≥ 4.5:1 on its fill, in both themes. It fails if faint text is set back to the standard's `#6B7280` (verified).
- axe color-contrast (24 scans @1440): **14 → 5** page/theme scans with violations, **74 → 38** nodes. Remaining: opacity-modified text (`text-*/70`, `/60`), hard-coded palette classes (`text-zinc-*`, `bg-zinc-800` user bubble, `text-green-400`, …) and arbitrary sub-12px sizes in component markup — all owned by the restyle changes (app-shell, chat-surfaces, app-pages).
- Other axe rules unchanged (button-name on landing, nested-interactive on skills).

## Deviations from the standard (D-007), all text-only
| Role | Standard | Shipped | Worst-case ratio |
|---|---|---|---|
| faint dark | #6B7280 | #939DAB | 4.83 |
| faint light | #6B7280 | #5F6977 | 4.87 |
| ember text light | #E04E28 | #B8391B | 5.05 |
| cyan text light | #0891B2 | #0E7490 | 4.69 |
| success text light | #16A34A | #14743A | 5.13 |
| warning text light | #D97706 | #A14A08 | 5.26 |
| danger text dark | #EF4444 | #F87171 | 4.79 |
| danger text light | #DC2626 | #B91C1C | 5.67 |
- Primary-button label is charcoal `#0B0F14` on ember in both themes (brand guide shows white; white on `#E04E28` is 3.97:1). Same choice as the KnowMe Flutter tokens.
- Derived (not in any source doc): `cyan-soft` (#E3F4F8 / #0E2A33) and `warning-soft` (#FDF1DD / #33250B) tint fills.

## Defects found and fixed
1. **Reduced motion inflated Mermaid diagrams ~5x.** A global `transition-duration: 0.01ms` override (added for `prefers-reduced-motion`) broke Mermaid's label measurement (viewBox 2074×2043 instead of 440×70). Bisected across commits and properties; the transition override now skips SVG content. Regression check in `chat-stream.spec.ts`.
2. **Mermaid and Shiki ignored theme changes** (read the DOM class once) → both subscribe to the theme store; Mermaid colors come from live tokens.
3. **Harness theme switching bypassed the store** → visual/a11y specs seed the saved preference before navigation, as a returning user's preference is applied.

## Theme mechanics
- `ui-store` persists `theme`/`fontSize` under `knowme:ui`; an inline script in `index.html` applies them before first paint (verified: the `<html>` class at `readyState=interactive` already reflects light after reload). Dark is the default.
- `html[data-font-size]`: compact 15px / default 16px / comfortable 17.5px root size.
- Note for later: the pre-paint script is inline; a future CSP needs its hash.

## Adversarial review (diff mode)
- r1: BLOCK, 1 CRITICAL — radius scale lacked a named pill token → added `--radius-pill: 9999px` (`rounded-pill`), documented as reserved for status/metadata.
