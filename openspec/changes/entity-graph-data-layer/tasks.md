## 1. Foundation

- [x] 1.1 Install `@prometheus-ags/entity-graph-core@4.0.2` and `@prometheus-ags/prometheus-entity-management@4.0.2`; add `src/lib/entity-graph/` with entity type constants, the app graph store, engine defaults, and a `GraphProvider` component; mount it in `App.tsx` alongside the existing QueryClientProvider; verify `npm run build` and `npm run typecheck`
- [ ] 1.2 Implement `useGraphMutation` (TanStack-compatible surface over `useEntityMutation`) with unit tests for pending, success, error, `variables`, per-call callbacks, and `mutateAsync` rejection; verify `npx vitest run src/lib/entity-graph`

## 2. Migrate data hooks

- [ ] 2.1 Agents: `useAgents`/`useAgent` via `useEntityList` (`Agent`), `useCompileAgent`/`useUpdateAgentMemory`/`useDeleteAgent` via `useGraphMutation` with `Agent` invalidation; unit tests for list mapping, derived single agent, and invalidation after compile; verify tests pass
- [ ] 2.2 Providers: list + `ProviderRegistry` default id, per-provider models (`ProviderModel`), create/update/delete/set-default/test-connection; unit tests for default id, models keyed per provider, and list refresh after create/delete; verify tests pass
- [ ] 2.3 Skills: list, optimistic toggle with rollback, refresh, create/update/delete; skills-sync invalidates `Skill` on the active graph; unit tests for optimistic toggle success and rollback on 500, and sync-triggered refresh; verify tests pass
- [ ] 2.4 Health/readiness polling (`RuntimeHealth`, 30 s, empty-body 200 = ok) and chat transcript fallback (`SessionTranscript`) with post-stream `invalidateEntity`; unit tests for empty-body health and failed health → error; verify tests pass
- [ ] 2.5 Route `left-sidebar` session delete and `user-settings-page` load/save through graph hooks (`Session`, `UserSettings`); delete dead hooks (`use-runs.ts`, thread query hooks, unused provider/skill/agent mutations) after grepping for consumers; verify `npm run typecheck`

## 3. Remove TanStack Query

- [ ] 3.1 Remove `QueryClientProvider`/`QueryClient` from `App.tsx`; uninstall `@tanstack/react-query` and `@tanstack/react-table@8`; verify `grep -rn "@tanstack/react-query" src package.json` is empty and `npm ls @tanstack/react-query` reports nothing at top level
- [ ] 3.2 Add an e2e spec: toggling a skill updates the skills page immediately and a failing toggle (mock 500) reverts it; run the full e2e suite; verify `npm run test:e2e` passes with zero unmocked requests

## 4. Verification

- [ ] 4.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`; verify all exit 0 and record results (and whether a live-UAR smoke was possible) in `verification.md`
