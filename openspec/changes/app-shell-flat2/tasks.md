## 1. Foundations

- [ ] 1.1 Add `--km-scrim` to `tokens.css` (both themes, exposed as `bg-scrim`), remove the `grid-overlay` utility and its usages, add `useMediaQuery`, add `src/components/ui/sheet.tsx` (Base UI Dialog, flat), and flatten `dialog`/`select` (no ring outlines, shadows or blur; filled select trigger); verify with a unit test for the sheet (opens, Escape closes, close button named) and the existing primitives tests
- [ ] 1.2 Add `src/test/flat-shell.test.ts` (Flat 2.0 + sub-12px + raw palette guard over layout, common and the flattened primitives); it is expected to fail until task 3.2 finishes, so mark the failing part with `it.fails` only while in progress and switch it on in 3.2

## 2. Status

- [ ] 2.1 Rework `UarStatus` (status tokens + icon + "Connected"/"Checking"/"Offline" label, compact top-bar form) and `StatusBadge` (12px pill on status tokens); verify with unit tests for each state's label and tone class

## 3. Shell surfaces

- [ ] 3.1 Top bar and navigation: chrome surface, nav links and bottom nav with ember-tinted active + `aria-current`, hover/focus fills, 12px labels, named icon buttons (theme, context, menu), runtime status in the desktop top bar, skip link and `id="main"` target in `AppLayout`; verify with e2e (active destination per route, skip link, status label)
- [ ] 3.2 Sidebar, context panel and drawers: sidebar chrome, filled search, primary "New thread", `Select` agent picker, active thread tint + `aria-current`, no borders/sub-12px text; context panel on surface inline ≥1280 and as a sheet below; phone thread drawer as a sheet; switch the flat-shell guard fully on; verify with e2e (conversation width ≥480px at 768/1024, sheet open/Escape, drawer on 320) and the guard test

## 4. Verification

- [ ] 4.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`, the visual harness for `/threads` and a thread at 320/768/1024/1440 × both themes (review the captures), and `npm run test:a11y`; record results and the axe delta in `verification.md`
