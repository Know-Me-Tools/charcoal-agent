@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KnowMe (package name `know-me`; the repo directory is still `charcoal-agent`) is a React 19 + Vite SPA chat client for the **Universal Agent Runtime (UAR)**, a separate Rust backend living at `../prometheus/universal-agent-runtime`. This repo contains no agent logic — it renders UAR's AG-UI event stream, manages threads locally, and pushes built-in skills to UAR. It can also be wrapped as a Tauri 2 desktop app (`src-tauri/`, a stock shell with only the log plugin). The product, logo and copy follow the KnowMe AI, LLC brand.

## Commands

```sh
npm run dev            # Vite on :8080, proxies /api, /healthz, /readyz to UAR
npm run build          # production build to dist/
npm run lint           # eslint
npm test               # vitest run (all tests)
npx vitest run src/test/example.test.ts   # single file
npx vitest run -t "test name"             # single test by name
npm run tauri:dev      # desktop shell (requires cargo-tauri)
./run-agent.sh         # start a local UAR release build on :6565 (needs OPENAI_API_KEY and a built ../prometheus/universal-agent-runtime)
docker compose up      # UI (nginx :8080) + UAR (:6565); requires LLM_API_KEY, see .env.example
```

Testing notes:
- `vitest.config.ts` takes precedence over the `test` block in `vite.config.ts`, so `*.integration.test.ts` files **are** included in `npm test`. `src/test/skills-sync.integration.test.ts` auto-skips when no UAR is reachable; point it at one with `INTEGRATION_UAR_URL=http://127.0.0.1:6565`.
- jsdom environment, globals enabled, setup in `src/test/setup.ts`.

Gotchas:
- `@electric-sql/pglite` must stay in `optimizeDeps.exclude`; pre-bundling breaks its wasm/data asset URLs ("Invalid FS bundle size"). `DbProvider` purges the IndexedDB and retries on that error.

## Backend connection

- `src/lib/api-client.ts` is the single HTTP entry point (`api.get/post/put/patch/delete`, plus `buildUrl`/`buildHeaders` for raw `fetch`). Paths are relative by default so traffic goes through the Vite proxy (dev) or nginx (prod), avoiding CORS. Setting `VITE_UAR_BASE_URL` in the client build makes requests hit UAR directly (the remote then needs CORS). The dev proxy target also comes from `VITE_UAR_BASE_URL`, falling back to `http://127.0.0.1:6565`.
- Every request carries `X-UAR-Session-ID` = the active thread's UUID, held in a module-level variable set via `setActiveSessionId`/`clearActiveSessionId` when a thread page mounts/unmounts. UAR keys all conversation state on it. Optional bearer via `VITE_UAR_API_KEY`.
- UAR endpoints used: `/api/chat/completion` (SSE), `/api/sessions`, `/api/agents`, `/api/compiler/compile`, `/api/providers`, `/api/skills`, `/api/uar/runs`, `/api/uar/user/settings`. Server data lives in the `@prometheus-ags/prometheus-entity-management` entity graph (`src/lib/entity-graph/`: `useRuntimeList` for lists, `useGraphMutation` for writes), wrapped by hooks in `src/hooks/`. TanStack Query is not used.

## Subsystem notes (load on demand)

Path-scoped rules in `.claude/rules/` load when you open a matching file: `chat.md` (AG-UI stream → store → block components; every converted message needs `metadata`), `persistence.md` (PGlite `CharcoalDb`, migrations, ephemeral threads) and `skills.md` (built-in skill sync to UAR). Read them before changing those areas.

## UI conventions

- shadcn/ui on Base UI (`components/ui/`, config in `components.json`) + Tailwind 4, themed only through the KnowMe tokens in `src/styles/tokens.css` (Flat 2.0: no borders, shadows or gradients); brand marks come from `components/brand/`; path alias `@/` → `src/`. Recent work has been converting raw HTML elements to shadcn components — keep using them.
- `components/assistant-ui/` holds the assistant-ui thread/composer shells; `components/layout/` holds the app shell (sidebar, topbar, right context panel, mobile nav).
- Routes are defined in `src/App.tsx` (`/threads/:id`, `/agents/:id`, `/settings/*`).

## Specs

OpenSpec is initialized (`openspec/`, schema `spec-driven`). Use the `/opsx:*` commands / `openspec-*` skills for proposing and applying changes.
