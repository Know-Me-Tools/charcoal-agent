## 1. Site chat pinned to the site agent behind the site proxy

**Operator decision (superseding the nginx approach below):** the public site
is served by a Rust Axum server, which also proxies the UAR AG-UI endpoint —
not nginx. All nginx/njs/template/Dockerfile work for this change has been
reverted (see history for the discarded implementation and its findings,
including that `js_access`/`readRequestText()` are not present in the njs
build `nginx:1.27-alpine` ships, and the working `js_content` +
`internalRedirect` fallback that was verified end-to-end before this
decision landed). The route audit below stands as-is and is the input the
Axum server's allowlist should implement; the request/response rewrite
logic (force `agent_id`, strip `model`/`run_policy`, drop client
`Authorization`/`X-API-Key`, inject the proxy's own key, rate limit,
preserve SSE) moves to km-rust-engineer.

- [x] 1.1 ~~Check that `nginx:1.27-alpine` ships `ngx_http_js_module`.~~ Superseded — the site proxy is now an Axum server, not nginx.

- [x] 1.2 Client: when `VITE_SITE_AGENT_ID` is set, all site chat threads use it and the agent picker is hidden; the public build hides the app-only pages (settings, agents, skills).

  Implemented in `src/hooks/use-site-config.ts` (`getSiteAgentId()`/`isSiteBuild()`, reads `VITE_SITE_AGENT_ID`), wired into:
  - `src/features/chat/use-message-stream.ts` — `agentId = getSiteAgentId() ?? payload.agent_id ?? threadAgent?.agentId`, so the site agent overrides both an explicit caller-supplied `agent_id` and the thread's registered agent. Unit test in `use-message-stream.test.ts`.
  - `src/components/layout/left-sidebar.tsx` — agent-picker button/panel and the JWT-only "Account settings" link hidden when `isSiteBuild()`.
  - `src/components/layout/nav-destinations.ts` (+ `topbar.tsx`, `mobile-nav.tsx`) — Agents/Settings nav entries hidden when `isSiteBuild()`.
  - `src/App.tsx` — `/agents/*` and `/settings/*` routes excluded from the router entirely on the site build (not just hidden from nav), falling through to `NotFound`.
  - `src/hooks/use-skills-sync.ts` — `useSkillsSyncOnMount` skips the skills push to UAR entirely when `isSiteBuild()`.

  Default (unset `VITE_SITE_AGENT_ID`) behaviour is unchanged. `npx tsc --noEmit`: clean. `npx eslint` on all touched files: clean. Unit tests (`use-site-config.test.ts`, `use-message-stream.test.ts` site-pin case): passing.

- [x] 1.3 Audit the UAR routes the site chat needs — for the Axum server to allowlist (superseding "nginx: ... allowlist only those").

  **Route audit** (grepped every `api.get/post/put/patch/delete` and `buildUrl`/raw-`fetch` call site under `src/`, then traced which of those a landing → new thread → send message → view/delete thread → a2ui-input-response flow actually reaches when `VITE_SITE_AGENT_ID` is set, i.e. with the agent picker and all `/agents`, `/settings/*` routes excluded per 1.2):

  | Method | Path | Caller | Why it's needed |
  |---|---|---|---|
  | POST | `/api/chat/completion` | `src/features/chat/use-message-stream.ts`, `src/features/chat/use-thread-naming.ts` | The chat turn itself (SSE) and the non-streaming thread-title generation call — both hit the same endpoint. |
  | GET | `/api/sessions/{id}/messages` | `src/features/chat/use-chat-messages.ts` | Server-transcript fallback when a persisted thread's messages aren't in PGlite yet. |
  | DELETE | `/api/sessions/{id}` | `src/hooks/use-sessions.ts` (left sidebar delete button) | Deleting a thread. |
  | POST | `/api/uar/runs/{runId}/artifact-response` | `src/features/chat/components/a2ui-artifact-block.tsx` | Responding to an a2ui input-request block mid-conversation — a normal chat interaction, not an admin action. |
  | GET | `/healthz`, `/readyz` | `src/hooks/use-health.ts` (via `UarStatus`, About page) | Runtime connectivity indicator. Not under `/api`; always allowed. |

  Everything else any component calls (`/api/agents`, `/api/compiler/compile`, `PATCH /api/agents/{id}`, `/api/providers*`, `/api/skills*`, `/api/uar/user/settings`) belongs to `/agents`, `/settings/*`, the agent picker, or `useSkillsSyncOnMount`'s push — all excluded from the site build by 1.2, so none of those routes are reachable from the pinned client and none should be in the Axum server's allowlist. The Axum proxy should allowlist exactly the five paths above (plus `/healthz`/`/readyz`) and reject everything else under `/api/`.

  For the request-body rewrite specifically (force `agent_id=knowme-site` on `POST /api/chat/completion`, strip `model`/`run_policy`, drop any client-supplied `Authorization`/`X-API-Key`, inject the server's own UAR credential): treat this as belt-and-suspenders — `src/features/chat/use-message-stream.ts` already pins `agent_id` client-side (1.2), but the Axum server is the real trust boundary and must enforce it independent of the client.

- [ ] 1.4 Integration gate against the local stack: a request with `agent_id=other`, `model=x` still runs `knowme-site` on `qwen3.8-max`; a disallowed path returns 403 (or the Axum server's equivalent); a burst returns 429. Visual-first capture of the chat at 320 and 1440 in both themes, viewed and listed; existing tests and goldens pass or are updated with operator sign-off.

  Not run — depends on the Axum server implementation (km-rust-engineer), not yet built.

- [x] 1.5 (km-rust-engineer) Build the site server: a new Axum crate `server/` (binary `knowme-site-server`) that embeds the Vite build (a `build.rs` runs `npm ci && npm run build` with `VITE_SITE_AGENT_ID` set; `KNOWME_WEB_DIST=<path>` reuses a prebuilt `dist/`) and serves it on :8080 with an SPA fallback and the current nginx headers. It proxies exactly the audited UAR routes to `UAR_UPSTREAM`: forces `agent_id` from `SITE_AGENT_ID`, strips `model`/`run_policy`, drops client credentials, injects `X-API-Key` from `SITE_PROXY_API_KEY`, streams SSE unbuffered, limits rate per client IP and caps the body. Every other `/api` path returns 403; `/healthz` is local. The Dockerfile becomes a Rust + Node multi-stage build producing a minimal non-root runtime image. Dependency versions are verified and reported for the operator to pin in `versions.toml`.

  Done (R1, 2026-10-03): crate `server/` with `build.rs`, `src/{domain,application,infrastructure,interface}/`, `tests/site_server.rs`, and the three-stage `Dockerfile` (landed in e73bb68); pins mirrored in `versions.toml` `[pins]` `server/*`. Deviations from this text, kept deliberately: `build.rs` runs `npm run build` but never `npm ci` (the Dockerfile `web` stage installs; build scripts must not install), and non-proxied `/api` paths return the generic 404 that `site-proxy-hardening` specifies, not 403. The proxied route set is now `POST /api/chat/completion` only (`site-proxy-hardening`). `cargo check` clean; tests not run here (1.4 gate).

