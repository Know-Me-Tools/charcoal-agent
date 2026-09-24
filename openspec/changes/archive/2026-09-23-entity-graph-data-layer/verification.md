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

## Coverage
- The post-stream `SessionTranscript` invalidation (spec scenario "Conversation finished") is covered by `use-chat-runtime.test.tsx`: a queued prompt streams the e2e SSE fixture and the test asserts the transcript becomes stale. Mutation-checked: removing the invalidation line makes the test fail.

## Adversarial review (diff mode)
- r1: BLOCK, 3 CRITICAL / 1 WARNING (gpt-5.5, verified-distinct).
  - CRITICAL models not one record per model → fixed: each model is a `ProviderModel` record (`provider::model`), `ProviderModelSet` keeps order; test proves a patch to one model record reaches the hook.
  - CRITICAL `useDeleteAgent` / skill create-update-delete removed rather than migrated → the proposal and design (D9) specify deleting hooks with no consumers; tasks.md wording contradicted that and was amended. Repo-wide grep confirmed zero consumers.
  - WARNING overlapping mutation calls shared one result slot → fixed: per-call tokens; concurrency test resolves two overlapping calls out of order.
- r2: BLOCK, 1 CRITICAL / 2 WARNING.
  - CRITICAL transcript load failures became an empty list → fixed: `fetchSessionMessages` now uses `api.get` (base URL, auth and `X-UAR-Session-ID` headers — the previous raw `fetch` sent none) and throws on non-2xx; `useChatMessages` exposes `transcriptError`. e2e mock gained `GET /api/sessions/:id/messages`.
  - WARNING `useActiveThread` deleted outside stated scope → it had zero consumers (repo-wide grep); proposal's deletion list updated to name it.
  - WARNING no tests for user settings → added 6 tests (load, JWT-disabled no request, load failure, save writes graph, save failure Error, session delete marks transcript stale).
- Gates after r2 fixes: unit 43/43, typecheck 0, lint 0 errors, build ✓, e2e 124/124 (3.2 min on a fresh server). A run that reused a stale dev server from earlier took 11.2 min with 5 tests not reported as passed; `reuseExistingServer` is now opt-in (`E2E_REUSE_SERVER=1`).
- r3: BLOCK, 1 CRITICAL — `useChatMessages().isLoading` stayed true after a failed fallback → fixed: `isLoading` is true only while the transcript fetch is in flight; unit test proves a 404 ends loading and sets `transcriptError`. (No current consumer reads `isLoading`, so there was no visible hang, but the contract is now correct.)
- Gates after r3 fix: unit 44/44, typecheck 0, lint 0 errors, build ✓, e2e 124/124.
- r4: BLOCK, 2 CRITICAL / 1 WARNING — all fixed:
  - Session delete now removes the `Session` record from every graph list and the entity itself (test asserts `readEntity` → null).
  - `useProviders` combines list and default-registry state: loading while either loads, error if either fails, data only once both settle (test: 500 → error, not loading).
  - Health probes never throw: a failed probe is reported immediately as `status: "error"` with one request (restores the old `retry: false`; test asserts a single `/healthz` call).
- r5: BLOCK, 1 CRITICAL — "providers exposed before the default id settles" → **false positive**: `useEntity` returns `null` (not `undefined`) for an unloaded record, and the check was `registry.data !== null`; the suggested `!== undefined` would have released data early. Hardened to `!= null` and added a test that seeds providers in the graph before the registry loads and asserts `data` stays undefined until `defaultId` arrives.
- r6: BLOCK, 1 CRITICAL / 1 WARNING.
  - CRITICAL a 2xx body `{"status":"error"}` is reported unhealthy → this is the pre-existing (and intended) behavior: the runtime is stating it is unhealthy. The spec's wording ("any 2xx is healthy") was imprecise; the Runtime health polling requirement now states the exact rule with two added scenarios, and a test covers the reported-unhealthy case.
  - WARNING `isPending` reflected only the latest call → fixed: adapter tracks in-flight calls; the concurrency test asserts pending stays true until the last overlapping call resolves.
- r7: BLOCK, 2 CRITICAL — both real races, fixed: core `fetchEntity` stores under `normalize(raw).id ?? id`, and the React hook's `normalize` reads the *latest* render's `threadId`/`providerId`, so a late response for a previous thread/provider was stored under the current one. Fetches now return records carrying the requested id and `normalize` is identity; regression test holds a slow provider's response until after switching providers and asserts the current provider's models are untouched.
- r8: BLOCK, 1 CRITICAL / 1 WARNING.
  - CRITICAL "type-wide invalidation skips singletons like ProviderRegistry" → **false positive**: core `invalidateEntity(type)` with no id marks every `type:*` record stale (probed earlier; `Agent:a1` flipped stale). Added a regression test: set-default → `defaultId` refreshes from `openai` to `anthropic`.
  - WARNING `useProviderModels(undefined)` returned `[]` rather than `undefined` → fixed to the disabled-query shape; test asserts `data` is undefined with no request.
- r9: BLOCK, 1 CRITICAL / 1 WARNING — both fixed:
  - A failed first list load returned `[]` → `toQueryResult` now yields data only after a successful load; `useRuntimeList` tracks `lastFetched` without error. Tests: failed load → `data` undefined; empty runtime → `data` `[]`.
  - Coverage gap for the post-stream transcript invalidation → closed with a focused `useChatRuntime` test (mutation-checked).
- r10: BLOCK, 1 CRITICAL — dependency ranges `^4.0.2` vs the plan's exact pin → fixed: both entity-graph packages pinned to `4.0.2` (`--save-exact`); lockfile unchanged in resolution; build and 51 unit tests pass.
- r11: **PASS**, 0 findings (gpt-5.5, verified-distinct; anti-theater score 0.0).
