## Why

The app runs Tailwind CSS 3.4, but 19 class usages in the chat UI are Tailwind 4 syntax (`max-w-(--thread-max-width)`, `wrap-break-word`, `duration-(--animation-duration)`, trailing `!` important) and are silently dropped — the chat column has no width limit and long words overflow. The KnowMe brand reference implementation and current shadcn/ui both target Tailwind 4, so every later change in the `complete-rebranding` phase depends on this upgrade. Lint (5 errors) and type checking (1 error) are already failing, which makes later quality gates meaningless until they are cleared.

## What Changes

- Upgrade `tailwindcss` 3.4 → 4.x using `@tailwindcss/vite`; move configuration from `tailwind.config.ts` into CSS (`@theme`, `@custom-variant dark`, `@plugin`), carrying the **current** token values unchanged (brand values arrive in `knowme-brand-tokens`).
- Replace `tailwindcss-animate` with `tw-animate-css`; register `@tailwindcss/typography` (already a dependency, never registered, yet `prose-*` classes are used).
- Remove `postcss.config.js`, `autoprefixer`, `tailwind.config.ts` (and its duplicated keyframe/sidebar keys), and unimported Vite boilerplate `src/App.css`.
- Fix the 5 pre-existing ESLint errors and the 1 `tsc` error; add a `typecheck` npm script.
- **BREAKING (dev tooling only):** Tailwind 3 JS config is gone; anything reading `tailwind.config.ts` (shadcn CLI) is pointed at the CSS config.

## Capabilities

### New Capabilities
- `chat-layout`: the conversation column has a bounded readable width and wraps long unbroken text instead of overflowing.

### Modified Capabilities
<!-- none: openspec/specs/ is empty -->

## Impact

- Files: `vite.config.ts`, `src/index.css`, `package.json`/lockfile, `components.json`, `eslint.config.js`, any component whose classes the Tailwind upgrade codemod rewrites, the files carrying lint/tsc errors (`attachment.tsx`, `ui/sidebar.tsx`, `settings-page.tsx`, one `case` block).
- Dependencies: + `tailwindcss@4`, `@tailwindcss/vite`, `tw-animate-css`; − `tailwindcss-animate`, `autoprefixer`, `postcss` (if nothing else needs it).
- No API, data or storage changes. Visual output should be unchanged except the chat column width limit and word wrapping.
