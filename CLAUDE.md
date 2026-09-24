# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KnowMe (package name `know-me`; the repo directory is still `charcoal-agent`) is a React 19 + Vite SPA chat client for the **Universal Agent Runtime (UAR)**, a separate Rust backend living at `../prometheus/universal-agent-runtime`. This repo contains no agent logic — it renders UAR's AG-UI event stream, manages threads locally, and pushes built-in skills to UAR. It can also be wrapped as a Tauri 2 desktop app (`src-tauri/`, a stock shell with only the log plugin). The product, logo and copy follow the KnowMe AI, LLC brand; the Lovable scaffolding has been removed.

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

## Chat architecture (the part that spans many files)

Data flow for one message:

1. `features/chat/use-chat-runtime.ts` adapts our state to `@assistant-ui/react` via `useExternalStoreRuntime`. It converts `RichMessage` → `ThreadMessageLike`; every converted message **must** include a `metadata` object (and user messages an `attachments: []`) or assistant-ui crashes on internal accessors.
2. `features/chat/use-message-stream.ts` POSTs to `/api/chat/completion` and parses the SSE stream of AG-UI events (`agui.message.delta`, `agui.thinking.delta`, `agui.tool_call.*`, `agui.tool_result`, `agui.citation.added`, `agui.skill.activated`, `agui.context.update`, `agui.memory.*`, `agui.artifact`, `agui.artifact_input_request`, `agui.done`, …). Event shapes mirror UAR's `src/uar/api/sse.rs` — change both sides together. Includes retry/backoff state.
3. Each event is dispatched into `stores/chat-message-store.ts` (Zustand + immer), which appends typed `ContentBlock`s (defined in `types/chat-content.ts`) to the streaming assistant message and writes through to PGlite.
4. Each block type renders via its own component in `features/chat/components/` (thinking, tool-call, citation, memory, skill-activation, context-update, artifact, a2ui-artifact). Adding a new event type means: type in `chat-content.ts` → store action → stream `case` → render component.
5. `use-thread-naming.ts` generates an LLM title after the first exchange.

## Local persistence

- `lib/db/pglite.ts` — `CharcoalDb`, a PGlite (Postgres-in-WASM on IndexedDB `/charcoal-db`) wrapper with an inline versioned `MIGRATIONS` array (tables: `threads`, `messages` with JSONB content, `user_config`). Add schema changes as a new migration entry; don't edit old ones.
- `DbProvider` initializes it and registers a module singleton; stores call `getDbInstance()` for write-through (throws if used before the provider is ready).
- `stores/thread-registry-store.ts` is the source of truth for threads. Threads start **ephemeral** (hidden from sidebar) and are promoted via `markPersisted` after the first successful send. `use-db-hydration` loads them on startup.
- Rule of thumb: UAR owns agents/providers/skills/sessions (entity graph); the browser owns thread registry and rendered message history (Zustand + PGlite).

## Skills

`lib/skills/knowme-skills.ts` defines the built-in `KNOWME_SKILLS` manifest. On app mount, `useSkillsSyncOnMount` (`hooks/use-skills-sync.ts`) diffs it against `GET /api/skills`, creates missing skills, enables disabled ones, then calls `/api/skills/refresh`. Skills are pushed with full definitions (prompt overlay, triggers, version) — no server-side files needed. `external-skill-loader.ts` handles non-built-in skills.

## UI conventions

- shadcn/ui on Base UI (`components/ui/`, config in `components.json`) + Tailwind 4, themed only through the KnowMe tokens in `src/styles/tokens.css` (Flat 2.0: no borders, shadows or gradients); brand marks come from `components/brand/`; path alias `@/` → `src/`. Recent work has been converting raw HTML elements to shadcn components — keep using them.
- `components/assistant-ui/` holds the assistant-ui thread/composer shells; `components/layout/` holds the app shell (sidebar, topbar, right context panel, mobile nav).
- Routes are defined in `src/App.tsx` (`/threads/:id`, `/agents/:id`, `/settings/*`).

## Specs

OpenSpec is initialized (`openspec/`, schema `spec-driven`). Use the `/opsx:*` commands / `openspec-*` skills for proposing and applying changes.
