## Context

See proposal.md (Why). Current setup: Tailwind 3.4.17 via PostCSS (`postcss.config.js` → `tailwindcss` + `autoprefixer`), JS config `tailwind.config.ts` with `darkMode: ["class"]`, tokens as space-separated RGB triplets consumed as `rgb(var(--x) / <alpha-value>)`, a stock-shadcn HSL `--sidebar-*` block, duplicated `accordion-*` keyframes and sidebar keys, and `tailwindcss-animate`. `vite.config.ts` already uses `@vitejs/plugin-react`; `vitest.config.ts` uses the SWC plugin.

## Goals / Non-Goals

**Goals:** Tailwind 4 build with identical visual output (except the chat width/wrap fix); CSS-first config that later changes can extend; green lint/typecheck/build/test baseline.

**Non-Goals:** changing any color, radius or font value (knowme-brand-tokens); migrating shadcn primitives (shadcn-base-ui-migration); fixing Flat 2.0 borders/shadows.

## Decisions

1. **Run the official codemod first, then hand-finish.** `npx @tailwindcss/upgrade` rewrites renamed utilities (`shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`, bare `ring`→`ring-3`, etc.) across `src/`, which is error-prone by hand. Alternative (manual rename) rejected: ~400 className sites.
2. **`@tailwindcss/vite` instead of PostCSS.** Recommended for Vite; removes `postcss.config.js` and `autoprefixer` (Lightning CSS handles prefixing). Alternative `@tailwindcss/postcss` rejected: extra config for no benefit.
3. **Keep RGB-triplet variables for now.** Map them in `@theme inline` as `--color-primary: rgb(var(--primary))` so opacity modifiers (`bg-primary/10`) keep working via `color-mix`. Converting to hex/oklch is deferred to knowme-brand-tokens, which replaces the values anyway. The sidebar HSL block is mapped with `hsl(var(--sidebar-*))` for the same reason.
4. **Dark mode via `@custom-variant dark (&:where(.dark, .dark *));`** preserving the existing `.dark` class toggle on `<html>`.
5. **Preserve v3 default border color.** Tailwind 4 changed the default border color to `currentColor`; keep the existing base rule (`* { border-color: var(--color-border) }`) so no borders change color in this change.
6. **`tw-animate-css`** replaces `tailwindcss-animate` (shadcn's current recommendation for v4); `accordion-*` keyframes move into `@theme`.
7. **Lint baseline:** remove the unknown `import/no-extraneous-dependencies` disable comment in `vite.config.ts` (the plugin is not installed); fix the React Compiler-rule errors (`set-state-in-effect`, impure call in render) in place rather than disabling rules; wrap the `case` declaration in a block. `tailwind.config.ts`'s `require()` error disappears with the file.

## Risks / Trade-offs

- [Codemod misses dynamic class strings built by concatenation] → grep for v3-only names (`shadow-sm`, `outline-none`, `ring ` without width, `flex-grow`, `bg-opacity-`) after the run.
- [Browser target change: Tailwind 4 needs Safari 16.4+/Chrome 111+] → Tauri config targets `safari13`/`chrome105` in `vite.config.ts`; raise build targets to `safari16.4`/`chrome111`. macOS WebKit in Tauri 2 on supported macOS versions meets this; noted for the operator.
- [Visual drift from utility renames] → manual smoke of landing, threads, a thread, settings pages in both themes before/after (screenshots via the browser); the Playwright harness arrives in a parallel change.

## Migration Plan

Single branch `rebrand/tailwind-v4-foundation`; merge to `main` after gates pass. Rollback = revert the merge commit (no data migration involved).
