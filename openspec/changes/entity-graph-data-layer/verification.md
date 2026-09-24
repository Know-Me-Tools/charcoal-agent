# Verification notes — entity-graph-data-layer

## 4.1 Gates (2026-09-23)
- `npm run build` ✓ · `npm run typecheck` 0 · lint 0 errors / 6 pre-existing warnings
- `npm test`: 8 files / 35 tests (adds adapter 6, agents 4, providers 5, skills 3, health 2)
- `npm run test:e2e`: 124 passed (adds 2 skill-toggle specs); 0 unmocked backend requests
- Console scan of /threads, /agents, /agents/:id, settings providers/skills/account/about under the mock: no warnings or errors (no entity-management deprecation warnings)
- `grep -rn "@tanstack/react-query" src package.json` → empty; `npm ls @tanstack/react-query` → empty; only `@tanstack/react-table@9.2.4` remains, transitively via entity-graph-react
- **Live-UAR smoke not possible:** `https://uar.know-me.tools/healthz` and `http://127.0.0.1:6565/healthz` both unreachable from this machine. Coverage is unit tests (real package, mocked `fetch`) + e2e against the in-browser UAR mock. Recommend one manual pass against a running UAR before release.

## Library findings (entity-graph 4.0.2) — worked around here, worth fixing upstream
1. `useEntityList` / `useEntityView` with an inline `fetch` are deprecated in 4.x and `console.warn` **on every render**. This change uses the supported path: `registerEntityTransport` at boot + `useEntities`.
2. `invalidateType(type)` calls `invalidateLists(type)`, which prefix-matches the bare type name against JSON-serialized list keys (`["Skill",{…}]`), so the list half never matches. Worked around with `invalidateEntityType()` using the serialized prefix `["Skill"`.
3. `useEntities` refetches only on mount or explicit `refetch()` — it does not react to its list being marked stale (unlike `useEntity`), so invalidation alone doesn't refresh a mounted list. `useRuntimeList` watches the list's `stale` flag and calls `refetch()`.
4. `useEntityMutation` clears an optimistic patch only when `normalize` is supplied, and resolves `null` (not reject) on failure with a string error; `useGraphMutation` supplies `normalize` for the toggle and captures the real `Error` via `onError`.
5. The package README still pins 3.2.0 install examples while npm latest is 4.0.2.

## Coverage gap
- The post-stream `SessionTranscript` invalidation (spec scenario "Conversation finished") is implemented in `use-chat-runtime.ts` but only exercised indirectly by the e2e thread capture; there is no dedicated unit test because `useChatRuntime` requires the assistant-ui runtime. `assistant-ui-latest` rewrites this file and should add one.
