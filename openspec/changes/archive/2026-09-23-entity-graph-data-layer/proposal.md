## Why

The operator decided (decision D-006, 2026-09-23) to replace TanStack Query with the Prometheus entity graph (`@prometheus-ags/prometheus-entity-management`). Today every UAR resource — agents, providers, models, skills, sessions — lives in its own query-key cache, so the same skill or provider can be stale in one view and fresh in another, and consistency depends on remembering every key to invalidate. The entity graph stores each record once by `(type, id)`, so every view reads the same data. It is also the foundation the later `app-pages-flat2-entity-views` change needs for the package's list/detail components.

## What Changes

- Add `@prometheus-ags/entity-graph-core@4.0.2` (required peer, app-owned singleton) and `@prometheus-ags/prometheus-entity-management@4.0.2` (compatibility alias of `@prometheus-ags/entity-graph-react`); mount one `GraphStoreProvider` for the app with engine defaults matching today's behavior (1 retry, no refetch on window focus).
- Migrate every live TanStack Query consumer to entity-graph hooks while keeping the app hooks' public return shapes, so pages change minimally: agents (list, compile, memory update, delete), providers (list + default id, per-provider models, create/update/delete/set-default/test connection), skills (list, toggle with optimistic update, refresh, create/update/delete), built-in skills sync, runtime health/readiness polling, chat server-transcript fallback and its post-stream invalidation.
- Route the remaining direct UAR calls in `left-sidebar.tsx` (session delete) and `user-settings-page.tsx` (user settings load/save) through the graph.
- Delete dead TanStack-based hooks with no consumers (`use-runs.ts`; `useThreads`/`useThreadDetail`/`useCreateThread`/`useDeleteThread`/`useActiveThread` in `use-threads.ts`; unused provider/skill/agent mutations) instead of migrating them.
- **BREAKING (internal):** remove `QueryClientProvider`, uninstall `@tanstack/react-query`, and uninstall the unused `@tanstack/react-table@8` (the entity package brings v9 for its table components).

Out of scope: moving PGlite thread/message storage onto the graph's persistence adapter; adopting the package's UI components (change `app-pages-flat2-entity-views`).

## Capabilities

### New Capabilities
- `runtime-data-sync`: how UAR-backed resources are loaded, shared across views, refreshed after changes, and how failures surface.

### Modified Capabilities
<!-- none -->

## Impact

- Code: `src/App.tsx`, `src/hooks/use-{agents,providers,skills,skills-sync,health,threads}.ts` (and `use-runs.ts` deleted), `src/features/chat/use-chat-{messages,runtime}.ts`, `src/components/layout/left-sidebar.tsx`, `src/pages/user-settings-page.tsx`, pages that read mutation state; new `src/lib/entity-graph/`.
- Dependencies: + `@prometheus-ags/entity-graph-core`, `@prometheus-ags/prometheus-entity-management` (+ its deps zustand/immer/clsx/lucide-react/tailwind-merge/@tanstack/react-table@9/@tanstack/react-virtual); − `@tanstack/react-query`, `@tanstack/react-table@8`.
- UAR API contract unchanged (same paths, headers, payloads).
