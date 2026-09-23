# Verification notes — tailwind-v4-foundation

## 3.3 Smoke test (2026-09-23, Chrome, `npm run dev` on :8080, no UAR backend)
- `/` dark 1440: renders unchanged (hero, composer, feature cards).
- `/threads/<uuid>` dark 1440: conversation column `max-width: 768px` (48rem), width 768px, centered; no horizontal scroll.
- `/settings/providers` dark and light 1440: layout intact, skeleton loaders render (no backend).
- `/threads/<uuid>` light at 320px (measured inside a 320px iframe because the browser window cannot shrink to 320): column 288px (fills available width minus padding), `scrollWidth == 320`, no horizontal scroll.
- No console errors.
- Not exercised: the long-unbroken-URL wrap scenario needs a rendered message (requires UAR or the mock from visual-verification-harness); `overflow-wrap:break-word` confirmed present in built CSS (task 3.1). Re-check in brand-fidelity-audit.

## 5.1 Gates (2026-09-23)
- `npm run build`: ✓ built (exit 0)
- `npm run typecheck`: exit 0 (was 1 error)
- `npm run lint`: 0 errors, 6 warnings (was 5 errors / 6 warnings; warnings are react-refresh/only-export-components, unchanged)
- `npm test`: 2 files / 12 tests passed (integration suite self-skips without UAR)

## Notes
- The upgrade codemod mis-renamed a Button *variant prop* `"outline"` → `"outline-solid"` in `ui/pagination.tsx`; reverted by hand.
- Remaining `rounded-sm`/`shadow-sm` are the v4 names for v3 `rounded`/`shadow` (intentional renames).
- `--radix-accordion-content-height` keyframes remain until shadcn-base-ui-migration.
- Build targets raised to `chrome111` / `safari16.4` (Tailwind 4 minimum).

## Adversarial review (diff mode)
- Round 1 packet covered only the QA-log commit (packet builder diffs `HEAD`); discarded.
- Round 2 (cumulative branch vs `main`, lockfile excluded for size, built in a temp worktree): BLOCK, 4 CRITICAL / 2 WARNING, judge gpt-5.5 verified-distinct.
  - CRITICAL lockfile not updated; postcss.config.js / tailwind.config.ts / src/App.css not deleted → **false positives from packet construction** (`git checkout <branch> -- .` does not apply deletions; lockfile excluded deliberately). Verified on the real branch: `git diff --name-status main` shows `D postcss.config.js`, `D src/App.css`, `D tailwind.config.ts`, `M package-lock.json` with `@tailwindcss/vite` and `tw-animate-css` entries; `npm ci --dry-run` exit 0.
  - WARNING `useFileSrc` created object URLs during render → fixed: URL created and revoked inside the same effect; returns undefined until committed for the current file.
  - WARNING lint warnings remain → accepted exception: 6 pre-existing `react-refresh/only-export-components` warnings in shadcn `ui/*` files, unchanged by this change; those files are regenerated in shadcn-base-ui-migration.
