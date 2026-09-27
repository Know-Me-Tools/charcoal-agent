# Verification notes — shadcn-base-ui-migration

## 4.1 Gates (2026-09-24)
- `npm run build` ✓ · `npm run typecheck` 0 (app + e2e incl. harness `.tsx`) · lint 0 errors / 3 warnings (down from 6: three `react-refresh` warnings belonged to deleted primitives)
- `npm test`: 12 files / 55 tests (adds 4 primitive component tests)
- `npm run test:e2e`: 128/128 (adds 4 primitive specs: harness dialog focus trap + Escape/focus return, harness Select keyboard, agent-editor Select labels + Tabs, thread reasoning Collapsible)
- One earlier full run reported `1 failed / 127 passed`; the failing test was not captured and four subsequent full runs were 128/128. Recorded as an unidentified flake to watch.
- a11y baseline unchanged: 24 scans, 18 violations across 3 rules (color-contrast, button-name, nested-interactive) — same as before this change.
- `grep -rn "@radix-ui\|next-themes" src package.json` → empty. Radix remains only transitively via `@assistant-ui/react(-markdown)` 0.12 (removed by `assistant-ui-latest`).

## Surface after migration
- 16 primitives on `@base-ui/react@1.8.0` (`base-nova`): alert, avatar, button, card, collapsible, dialog, input, label, scroll-area, select, separator, sonner, switch, tabs, textarea, tooltip.
- Deleted: 33 unused primitives, dead assistant-ui/chat components, `hooks/use-threads.ts`, `stores/thread-store.ts`, and 10 npm packages used only by deleted primitives.

## Issues found and fixed during migration
1. **shadcn CLI 4.21 installed an npm package literally named `cn`** (the registry lists the `cn` utility as a dependency) and emitted `import { cn } from "cn"` in 14 files instead of the `@/lib/utils` alias. Reverted the package, rewrote imports. It also ran bun because a stale `bun.lockb` exists; the change to `bun.lockb` was reverted.
2. **Missing `shadcn/tailwind.css`.** Switching the style by editing `components.json` (not `shadcn init`) skipped the base-nova CSS dependency, so custom variants like `data-horizontal:` / `data-open:` did not exist — Tabs rendered side-by-side. Added `shadcn` as an exact dev dependency and `@import 'shadcn/tailwind.css'`; removed the now-duplicate Radix-only accordion keyframes.
3. **Select shows labels only with `items`.** Base UI `Select.Value` renders the raw value otherwise; every Select root now passes `items`. `onValueChange` can pass `null` (hidden by `strictNullChecks: false`); all handlers guard it.
4. **Sonner used `var(--popover)`**, which in this project is an RGB channel triplet, not a color → switched to `--color-*` tokens and to the app theme store (next-themes was never mounted).
5. jsdom lacks `PointerEvent` (polyfilled in `src/test/setup.ts`) and layout, so focus trapping and Select navigation are verified in a real browser via `e2e/harness/primitives.html` (served by Vite in dev/e2e only; not part of `vite build`).

## Screenshot comparison vs. pre-migration baseline (96 captures)
- Unchanged (0.0%): landing, agents, not-found, threads (≤0.1%).
- Agent editor pages: within ±6 px height (control sizes); Write/Preview tabs back above the editor after fix 2.
- Settings pages at 320 px: settings tab bar now scrolls horizontally with a visible scrollbar; provider cards no longer overflow the viewport (improvement).
- Thread: ~170 px taller at 1440 — base-nova `Card` has larger default padding and `Button` sizes differ, so chat blocks are roomier. Intentionally not tuned here: `chat-surfaces-flat2` restyles every chat block.

## Adversarial review (diff mode)
- r1: BLOCK, 2 CRITICAL — both artifact/implementation mismatches in my own docs:
  - "Select keyboard component test missing" → the jsdom test was attempted and fails for lack of layout (listbox positioning); the behavior is verified in a real browser (`e2e/primitives.spec.ts` harness test). tasks.md 3.2 amended to state where each behavior is verified.
  - "Sheet deleted though the spec covers sheets" → `sheet` had zero consumers and was deleted per the proposal; the spec requirement and capability description no longer mention sheets.
- r2: **PASS**, 0 CRITICAL / 1 WARNING — attachment tile trigger semantics (the inner tooltip trigger is a plain div; the outer Base UI dialog trigger renders with `nativeButton={false}`). Carried to `assistant-ui-latest`, which re-pulls `attachment.tsx` from the assistant-ui Base UI registry.
