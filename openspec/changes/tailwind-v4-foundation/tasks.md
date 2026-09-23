## 1. Upgrade tooling

- [ ] 1.1 Install `tailwindcss@^4`, `@tailwindcss/vite@^4`, `tw-animate-css`, latest `@tailwindcss/typography`; uninstall `tailwindcss-animate`, `autoprefixer` (and `postcss` if no longer depended on directly); verify with `npm ls tailwindcss @tailwindcss/vite tw-animate-css`
- [ ] 1.2 Run `npx @tailwindcss/upgrade` on a clean tree and review its diff (utility renames across `src/`); verify `git diff --stat` and that no non-style logic changed

## 2. CSS-first configuration

- [ ] 2.1 Switch `vite.config.ts` to the `@tailwindcss/vite` plugin, raise build targets to `safari16.4`/`chrome111`, drop the unknown eslint-disable comment, delete `postcss.config.js` and `tailwind.config.ts`; verify `npm run build` succeeds
- [ ] 2.2 Rewrite `src/index.css` for v4: `@import "tailwindcss"`, `@import "tw-animate-css"`, `@plugin "@tailwindcss/typography"`, `@custom-variant dark`, `@theme inline` mapping of the existing tokens (colors, fonts, radius, accordion/blink/shimmer animations), preserved base border color, existing utilities converted to `@utility`; verify built CSS contains `bg-primary`, `text-muted-foreground`, `font-display`, `animate-shimmer`, `prose`
- [ ] 2.3 Point `components.json` at the CSS config (`tailwind.config: ""`) and delete unimported `src/App.css`; verify `grep -r "App.css" src` is empty and `npx shadcn@latest info` (or JSON parse) reports no config error

## 3. Tailwind 4 syntax and visual parity

- [ ] 3.1 Verify the 19 previously dropped v4 classes now compile: grep built CSS for `max-width:var(--thread-max-width)`, `overflow-wrap:break-word`, `--animation-duration`, and the `!important` utilities used in `attachment.tsx`
- [ ] 3.2 Grep `src/` for leftover v3-only utility names (`shadow-sm`, `outline-none`, `flex-grow`, `bg-opacity-`, bare `ring` without width) and fix any the codemod missed; verify grep is empty or each hit is intentional
- [ ] 3.3 Smoke-test the running app (`npm run dev`) on `/`, `/threads`, a thread, `/settings/providers` in dark and light at 1440px and 320px; verify no broken layout and that the chat column is ≤48rem and centered (chat-layout spec)

## 4. Quality baseline

- [ ] 4.1 Fix the pre-existing ESLint errors (`attachment.tsx` set-state-in-effect, `ui/sidebar.tsx` impure call in render, the `case` block declaration); verify `npm run lint` reports 0 errors
- [ ] 4.2 Fix the `ScrollArea orientation` type error in `settings-page.tsx` and add `"typecheck": "tsc --noEmit -p tsconfig.app.json"`; verify `npm run typecheck` exits 0

## 5. Verification

- [ ] 5.1 Run `npm run build && npm run typecheck && npm run lint && npm test`; verify all exit 0 and record output in the change notes
