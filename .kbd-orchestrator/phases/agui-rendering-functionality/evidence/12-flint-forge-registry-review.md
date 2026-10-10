# flint-forge registry review (change agui-render-registry, task 1.2)

Read 2026-10-09. Checkout: `/Users/gqadonis/Projects/prometheus/flint-forge`, HEAD `ed72018` (2026-09-16), package `packages/flint-react` (`@flint/react` 1.0.0, not on npm: see `06-flint-forge-facts.md`).

Status: **design reference only.** Not a dependency, not a renderer for this repo. It speaks its own `a2ui:surface` Custom-event dialect, which UAR does not emit.

## What was read

| File | What it does |
|---|---|
| `src/registry/FlintRegistry.ts` | Module-level `Map<slug, FlintCatalogEntry>`; `registerFlintComponent(entry)` mutates it; `resolveFlintComponent(slug, overrides)` returns the override first, then the registered component, else `undefined`. Entries carry `slug`, `category`, `primitiveType`, a zod `propsSchema`, `component`, optional `description`. |
| `src/registry/baseComponents.ts` | `registerBaseComponents()` registers ~40 slugs with zod schemas at startup (side effect). |
| `src/registry/slugMap.ts` | Static `SLUG_MAP: Record<slug, Component>` for 55 catalog slugs; 27 real components, 28 `makePlaceholder(slug)` divs carrying `data-flint-placeholder`. `fromSlug(slug)` returns `undefined` for unknown slugs. |
| `src/provider/useFlintRegistry.ts` | Hook joining the runtime catalog and the static slug map (`listComponents`, `getComponent`, `search`, `fromSlug`). |
| `src/ag-ui/AgUiEventHandlers.ts` | Own event union (`RunStarted`, `ToolCallStart`, `Custom`, ...) and `isA2uiSurfaceEvent`: `type === 'Custom' && name === 'a2ui:surface'`. |
| `src/ag-ui/FlintAgUiAdapter.ts` | `handleEvent(event)` routes `a2ui:surface` events to handlers subscribed per `surfaceId`; everything else is silently ignored. |
| `src/surface/FlintSurface.tsx` | An unresolved slug renders an empty `<div role="alert" data-flint-unknown-component>`. |

## Adopted

1. **Lookup by a string key into a table of entries.** Our registry is keyed by `{kind, name}` where kind is `event` (AG-UI event name), `artifact` (artifact_type) or `activity` (AG-UI activity type). Same shape as slug → entry, one more dimension because UAR multiplexes artifact types inside one event.
2. **Explicit entry wins over a fallback.** Flint resolves overrides before the base catalog. Ours resolves an exact key before a wildcard (`runtime.*`, `agui.subagent.*`), and the later `agui-inferred-a2ui` change will add inference only for keys without an explicit entry (D-26).
3. **A separate adapter seam for A2UI carriers.** Flint keeps A2UI surface handling in `FlintAgUiAdapter`, apart from the component registry. Ours expresses this as the `adapt` disposition: the registry says *that* a carrier is adapted; the adapter (today a stub that keeps current behaviour, later PEM's processor in `app-a2ui-surface-renderer`) says *how*.
4. **Entries are documentation.** Flint entries carry `category` and `description`. Ours carry a `reason` string so the default table reads as the decision record from `03-agui-event-inventory.md`.

## Declined

1. **Module-level mutable registry with side-effect registration** (`registry` Map + `registerBaseComponents()`). Order-dependent, shared across tests, and invisible to review. Ours is an immutable value built by `createRenderRegistry(entries)`; the defaults are one literal table.
2. **Complete map with placeholders for unknown slugs** (`makePlaceholder`) and the **`role="alert"` empty div** for unresolved slugs. Both show *something* for an unknown key. The requirement here is the opposite: an unknown event or artifact type is hidden, with a development-only console warning (spec scenario "Unknown type"). Showing unknowns is how `provider_event` and `attempt_manifest` JSON cards reached the thread.
3. **Silent drop in the adapter.** `FlintAgUiAdapter.handleEvent` ignores every non-surface event with no trace. Ours hides too, but warns once per unknown key in development so a new UAR event is noticed.
4. **zod `propsSchema` per entry.** Validation of A2UI component props belongs to the A2UI renderer (PEM `a2ui-react`, change `app-a2ui-surface-renderer`), not to the event-routing registry. No zod dependency is added here.
5. **The `a2ui:surface` Custom-event dialect and the `RunStarted`/`ToolCallStart` event union.** UAR emits `agui.*` named SSE events (`src/uar/api/sse.rs`) and carries A2UI as an `a2ui` artifact and `agui.state.patch` under `/a2ui/`. Adopting flint's dialect would need a translation layer for no gain.
6. **A React hook as the registry surface** (`useFlintRegistry`). The SSE handler runs outside React render (`use-message-stream.ts` reads the store with `getState()`), so the registry is plain TypeScript usable from both the stream and the render path.
7. **Taking flint as a dependency.** Unpublished on npm (E404), own dialect, placeholder components. Decision D-31 binds the renderer to PEM `a2ui-react` on official A2UI 0.12.0.

## Uncomfortable thing

Flint's "show a placeholder for unknown" is friendlier to a developer adding a component: the gap is visible on screen. Our "hide unknown" makes a missing registration invisible to users and visible only as a console warning in a development build. A real artifact type that UAR or an agent starts emitting tomorrow (for example a `document` type) will silently not render in production until someone adds an entry. That is the accepted cost of failing closed on internal diagnostics.
