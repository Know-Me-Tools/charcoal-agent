## Context

See proposal.md. The binding source is `know-me-system/docs/knowme-ui-ux-standard.md`: §3 (Flat 2.0 rules, surface ladder), §4.2 (type floor 12px), §4.4 (pills only for status/metadata), §5 (shell per width), §11 (landmarks, names, status not colour-only). Tokens come from `src/styles/tokens.css` (knowme-brand-tokens).

**Goals:** a shell that passes the Flat 2.0 grep and axe at every harness width, with a readable conversation at 768/1024px. **Non-goals:** page content restyle (agents, settings, chat), a Tauri custom titlebar (desktop change, out of phase), a collapsible icon rail.

## Decisions

1. **Surface mapping.** Top bar, sidebar, bottom nav and thread drawer: `bg-chrome`. Work area: `bg-canvas`. Context panel and menus: `bg-surface` / `bg-raised`. Search and the agent picker trigger: `bg-muted-surface` (filled input, §3.2). Light theme chrome `#FFFFFF` against canvas `#F7F7F8` is the standard's own value, so it isn't adjusted.
2. **Active state = `bg-ember-soft` + `text-fg` + ember-text icon.** Hover = `bg-hover`. Focus = `focus-visible:bg-hover` plus the existing global ember focus ring. The ring is a functional focus indicator, not decoration (§3.3 bans decorative outlines only), and it keeps focus from depending on fill alone.
3. **Status label + icon + tone.** `UarStatus` gets `Connected`/`Checking`/`Offline` text, the `Wifi`/`WifiOff`/`Loader` icon and the success/warning/danger text tokens. A compact form (icon + label) goes in the top bar on desktop. The sidebar footer keeps the full form with the hostname.
4. **Breakpoints.** Phone < 768 (existing `useIsMobile`): bottom nav, thread-list sheet. 768–1279: sidebar inline (260px), context panel as a right sheet. ≥ 1280: sidebar and context panel inline. A small `useMediaQuery` hook avoids a second copy of the matchMedia logic. At 1024 the conversation gets 764px, at 768 it gets 508px.
5. **Sheet primitive.** Added by hand as `src/components/ui/sheet.tsx` on `@base-ui/react/dialog`, matching the shadcn base-nova API (`Sheet`, `SheetTrigger`, `SheetContent side`, `SheetHeader`, `SheetTitle`, `SheetClose`). The shadcn CLI isn't used, because earlier runs rewrote imports to a stray `cn` package. The scrim is a new `--km-scrim` token (dark `rgb(0 0 0 / 0.6)`, light `rgb(11 15 20 / 0.45)`), because §3.2 says modal priority comes from dimming, not shadow. Panel open state stays in `ui-store`: `rightPanelOpen` drives the inline panel, and a new transient `contextSheetOpen` drives the sheet, so a desktop preference never pops a sheet open at tablet widths.
6. **Primitive flattening, limited to what the shell uses.** `dialog` overlay → scrim token, no blur; popup `ring-1` removed. `select` trigger → filled muted surface, no border or ring-halo (focus uses the global ring); popup → `bg-raised`, no shadow or ring; separator → spacing. Everything else stays with brand-fidelity-audit.
7. **`grid-overlay` removed.** At 4% it still reads as a line grid, which §3.3 forbids. The utility and its two usages are deleted.
8. **Guard test.** `src/test/flat-shell.test.ts` scans `components/layout`, `components/common` and the three primitives for `border`/`divide-`/`shadow`/`backdrop-blur`/`ring-1`/`text-[<12px]` and raw palette classes (`zinc|gray|green|amber|red|…-NNN`), allowing only `border-0`/`border-transparent`. This turns the plan's acceptance grep into a durable test.

## Risks / Trade-offs

- A hand-written sheet can drift from shadcn upstream. It's a thin wrapper, and the upstream base-nova sheet is also a Dialog wrapper, so it's easy to replace later.
- The runtime status in the top bar adds one more health poll consumer. `useHealth` is already shared through the entity graph/hook cache, so no extra requests are made.
