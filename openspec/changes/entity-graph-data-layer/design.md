## Context

See proposal.md. Current data access: 10 files import TanStack Query; 50 call sites. Pages consume app hooks (`useAgents`, `useProviders`, `useSkills`, …) and read TanStack result fields: queries `data`/`isLoading`/`isError`; mutations `mutate(vars, {onSuccess,onError})`, `mutateAsync`, `isPending`, `isError`, `error`, `isSuccess`, `data`, `variables`. Several hooks have no consumers. UAR has no `GET /api/agents/:id`; providers come as `{ providers, default_id }`; health endpoints return empty 200 bodies.

Package facts (npm 4.0.2, read from the published `.d.ts`): `useEntity`, `useEntityList` (stores ids, joins rows from the graph), `useEntityMutation` (`mutate`, optional `optimistic` patch with rollback, `invalidateLists` prefixes, `invalidateEntities`), graph actions `invalidateType`, `invalidateEntity`, `invalidateLists`, `removeEntity`, `removeIdFromAllLists`; `GraphStoreProvider` + `createGraphStore` from core; `configureEngine({ maxRetries, revalidateOnFocus, defaultStaleTime })`.

## Goals / Non-Goals

**Goals:** zero TanStack Query; unchanged hook return shapes for pages; normalized records shared across views; same UAR requests as today.

**Non-Goals:** PGlite persistence adapter; entity UI components; realtime adapters; changing `api-client.ts`.

## Decisions

1. **Keep app hooks as the boundary.** Pages keep calling `useAgents()`, `useProviders()`… The hooks now wrap `useEntityList`/`useEntity` and return `{ data, isLoading, isError, error }`. Alternative (pages call package hooks directly) rejected: spreads fetch/normalize details across pages and multiplies this change's diff; the rebrand changes restyle those pages next.
2. **`useGraphMutation` adapter** (`src/lib/entity-graph/use-graph-mutation.ts`): wraps `useEntityMutation` and exposes the TanStack-compatible subset pages use (`mutate(input, callbacks?)`, `mutateAsync`, `isPending`, `isError`, `isSuccess`, `error: Error | null`, `data`, `variables`, `reset`). It is a thin surface over the package's mutation state, not a cache — alternative (rewrite every page to `mutate().then`) rejected for churn now; revisit when pages move to entity components.
3. **Entity types** (constants in `src/lib/entity-graph/entities.ts`): `Agent`, `Provider`, `ProviderModel` (id `${providerId}::${modelId}`), `ProviderRegistry` (singleton id `default`, holds `defaultId`), `Skill`, `Session`, `SessionTranscript` (id = thread id), `UserSettings` (singleton), `RuntimeHealth` (ids `healthz`, `readyz`). List query keys start with the type name so `invalidateType(type)` refreshes them.
4. **Providers' `default_id`** is written by the providers list fetch's `sideEffects` into `ProviderRegistry:default`, read with a primitive selector (stable across renders).
5. **Health polling:** `useEntity` for `RuntimeHealth` plus an interval that calls `refetch` every 30 s while mounted (the engine has no `refetchInterval`); `maxRetries` 0 for health via `enabled`/error handling, matching today's `retry: false`.
6. **Optimistic skill toggle** via `useEntityMutation.optimistic` (`{ id, patch: { enabled } }`) — rollback on error is built in.
7. **Engine defaults** set once at provider mount: `maxRetries: 1`, `revalidateOnFocus: false`, `defaultStaleTime: 0` — equivalent to the old QueryClient defaults.
8. **Store per app** created with `createGraphStore()` inside `App` module scope and passed to `GraphStoreProvider`; tests create a fresh store per test for isolation.
9. **Dead code deleted, not migrated** (listed in proposal) — verified with a repo-wide grep for consumers.

## Risks / Trade-offs

- [Package README pins 3.2.0 examples while npm latest is 4.0.2] → implement against the 4.0.2 `.d.ts`; unit tests exercise real package behavior, not mocks of it.
- [`useEntityList` for fixed singletons like providers registry] → use `useEntity` with `fetch` shared via the engine's in-flight dedupe; confirm no duplicate requests in the e2e network log.
- [Adapter hides package mutation semantics] → adapter unit tests cover pending/success/error/variables/callbacks.
- [Behavior drift in skills sync, which calls `api` imperatively] → keep its imperative calls; replace only the invalidation with `invalidateType("Skill")` on the active graph.

## Migration Plan

Branch `rebrand/entity-graph-data-layer`; e2e harness (mocked UAR) and unit tests gate the merge. Rollback: revert the merge commit (no persisted-data change — PGlite untouched).
