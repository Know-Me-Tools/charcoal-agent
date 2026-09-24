## Why

Operator decision D-003 (2026-09-23): the app's shadcn/ui primitives must be on **Base UI** at the latest shadcn (4.21.x), not Radix. shadcn encodes the primitive library in the `components.json` style (`radix-*` vs `base-*`), and the assistant-ui registry resolves Base UI component variants from that style, so this change is a prerequisite for `assistant-ui-latest` and for the token-driven rebrand, which restyles these primitives.

## What Changes

- Switch `components.json` to the `base-nova` style (Tailwind 4 layout, lucide icons) and add `@base-ui/react`.
- Re-install only the 22 primitives the app uses (`alert, avatar, button, card, collapsible, dialog, input, label, resizable, scroll-area, select, separator, sheet, skeleton, sonner, switch, tabs, textarea, toggle, tooltip`, plus supporting pieces) as Base UI variants.
- **Delete** the 26 unused primitives (accordion, alert-dialog, aspect-ratio, breadcrumb, calendar, carousel, chart, checkbox, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, sidebar, slider, table, toggle-group, and the shadcn `toast`/`toaster`/`use-toast` trio).
- **Delete** dead components with no consumers that would otherwise have to be migrated: `components/assistant-ui/{thread,markdown-text,tool-fallback,assistant-modal,assistant-sidebar,thread-list}.tsx` and `components/chat/*` (planned for `assistant-ui-latest`; moved here because they block this migration).
- Update every call site of the migrated primitives to Base UI APIs (`asChild` → `render`; `onValueChange`/`onCheckedChange`/`onOpenChange` receive an extra event-details argument; `data-state` selectors → `data-open`/`data-closed`).
- One toast system: keep Sonner, driven by the app's own theme store instead of an unmounted `next-themes` provider; remove the shadcn `Toaster`.
- **BREAKING (internal):** remove all `@radix-ui/*` direct dependencies and `next-themes`.

Out of scope: visual restyling (tokens arrive in `knowme-brand-tokens`); assistant-ui primitives (they carry their own `asChild` API until `assistant-ui-latest`).

## Capabilities

### New Capabilities
- `ui-primitives`: keyboard and pointer behavior of the app's overlay and form primitives (dialogs, sheets, selects, tooltips, switches, collapsibles, tabs).

### Modified Capabilities
<!-- none -->

## Impact

- Code: `components.json`, `src/components/ui/*`, consumers in `src/pages/*`, `src/components/{layout,common,assistant-ui}/*`, `src/features/**`, `src/App.tsx`.
- Dependencies: + `@base-ui/react`; − 26 `@radix-ui/*` packages, `next-themes`. (`@radix-ui/*` may remain transitively via assistant-ui 0.12 until the next change.)
