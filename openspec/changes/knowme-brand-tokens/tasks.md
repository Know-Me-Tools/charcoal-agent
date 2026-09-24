## 1. Tokens

- [x] 1.1 Create `src/styles/tokens.css` with the KnowMe light (`:root`) and dark (`.dark`) palettes, text-safe variants, shadcn/assistant-ui aliases, radius, motion and code-background tokens; import it from `src/index.css`, remove the RGB-triplet and stock sidebar tokens, and expose everything via `@theme inline`; verify `npm run build` and that built CSS contains `bg-canvas`, `text-faint`, `text-ember-text`, `bg-cyan`
- [x] 1.2 Add `src/styles/tokens.test.ts` asserting every text × surface pair ≥ 4.5:1 and every label × fill pair ≥ 4.5:1 in both themes; verify it passes and fails when a text token is set to the standard's failing value

## 2. Flat 2.0 base and type roles

- [ ] 2.1 Base layer: transparent default borders, `.aui-root` shadow removal, visible ember focus ring; type-role utilities (`section-label`, `ui-overline`, `mono-meta`, …) at ≥12 px; brand font weights in `index.html`; verify build and the harness screenshots render with no default borders
- [ ] 2.2 Substitute bare text uses (`text-primary|success|warning|info|destructive` → text-safe tokens) across `src/`; verify `grep` finds no bare `text-primary`/`text-success`/`text-warning`/`text-info`/`text-destructive` classes and `npm run typecheck` passes

## 3. Theme mechanics and third parties

- [ ] 3.1 Persist `theme` and `fontSize` (`knowme:ui`), apply them before first paint via an inline script, apply font size via `html[data-font-size]`; update the e2e `setTheme` helper to seed storage; add an e2e test for theme persistence across reload and for the comfortable font size
- [ ] 3.2 Mermaid reads tokens and re-renders on theme change; Shiki code blocks use the brand code backgrounds; verify a thread capture in both themes

## 4. Verification

- [ ] 4.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`; compare the axe color-contrast count with the previous baseline and record screenshots/contrast results in `verification.md`
