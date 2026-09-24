# Verification notes: app-shell-flat2

## 4.1 Gates (2026-09-24)
- `npm run build` ✓ · `npm run typecheck` 0 · `npm run lint` 0 errors
- `npm test`: 147 pass. New: `flat-shell.test.ts` (35 checks: 20 rule self-tests + every shell file), `sheet.test.tsx` (3), `status.test.tsx` (6), `use-media-query.test.ts` (2), and 4 status-pill contrast pairs in `tokens.test.ts`.
- `npm run test:e2e`: 154/154, including the new `shell.spec.ts` (13).
- `npm run test:visual`: 96/96 captures. I reviewed `/threads` and the open thread at 320, 768, 1024 and 1440 in both themes:
  - top bar and sidebar on chrome, work area on canvas, context panel on surface
  - no borders or shadows
  - ember-tinted active destination and active thread
  - "Connected" status pill
  - at 768/1024 the conversation keeps its width, and context opens as a sheet

## Accessibility (axe, 24 scans @1440)
- Before the logotype filter: 13 scans / 51 contrast nodes. The difference from the 5 / 38 baseline was 13 nodes of the wordmark's ember "Me" in light theme (3.7–3.96:1). The lockup reached every page in knowme-brand-identity, whose verification didn't run the axe report.
- Logotypes have no contrast requirement (WCAG 1.4.3). The brand guide fixes ember "Me", and the wordmark is a single named image ("KnowMe"). `a11y.spec.ts` now drops colour-contrast nodes inside `[data-slot='knowme-wordmark']` only. Every other rule still checks it.
- After: color-contrast 5 scans / 38 nodes, the baseline. None of them are in the shell; all are in page content owned by chat-surfaces, landing and app-pages. button-name 2 (landing) and nested-interactive 2 (skills) are unchanged and already routed.

## Standard mapping
| Standard | Implementation |
|---|---|
| §3.1/3.3 no borders, shadows, blur, line textures | shell and the dialog/select/sheet primitives; `grid-overlay` deleted; guard test |
| §3.2 hover / selection / focus | `bg-hover`; `bg-ember-soft` + `text-fg` + ember icon + `aria-current`; `focus-cue` (hover fill + 2px ember outline) |
| §3.2 modal priority | `--km-scrim` behind sheets and dialogs, no shadow |
| §3.4 surface ladder | chrome: top bar, sidebar, bottom nav, drawer; canvas: main; surface: context panel; raised: menus, agent card |
| §4.2 12px floor | all shell text ≥ 12px (guard + e2e computed-size check) |
| §5.1 persistent status | runtime status pill in the desktop top bar on every route |
| §5.3 tablet | context panel is a sheet below 1280px (phones included); conversation ≥ 480px at 768 (508px) and 1024 (764px) |
| §11 status not colour-only, skip link, names | icon + label + tone; "Skip to content" focuses `main`; named icon buttons, search, agent picker |

## Defects found and fixed
1. **Reduced motion delayed every style change by a frame.** The override set `transition-duration: 0.01ms` on every element. `transition-property` defaults to `all`, so this enabled transitions for every property. The root font size lagged after Appearance changes (a failing theme e2e), and it was the underlying cause of the earlier Mermaid inflation. The override is now `0s`, and the SVG exclusion is no longer needed; the Mermaid size check still passes.
2. **The thread delete button was reachable by mouse only** (`hidden group-hover:flex`). It is now visible on hover, focus-within and focus-visible.
3. **The context panel's empty state was wrong for open threads** ("Select a thread…" while a thread was open). It now explains the default agent.

## Deferred (owner)
- `components/ui/button` still uses a 1px transparent border and a `ring-3` focus halo (no visible border). Left to brand-fidelity-audit with the remaining primitives.
