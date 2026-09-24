# KnowMe

**AI that understands you.**

KnowMe is the web and desktop client for the KnowMe agent. The agent runs inside the [Universal Agent Runtime](../prometheus/universal-agent-runtime) (UAR), a separate Rust service. This app streams the agent's replies, keeps your threads locally, and syncs KnowMe's built-in skills to your runtime.

© 2026 KnowMe AI, LLC.

## Stack

- React 19 and Vite, with Tailwind CSS 4 using the KnowMe brand tokens (`src/styles/tokens.css`)
- shadcn/ui on Base UI, and assistant-ui for the chat surfaces
- `@prometheus-ags/prometheus-entity-management` as the entity graph for runtime data
- PGlite in the browser for local threads and messages
- Tauri 2 for the desktop app (`src-tauri/`)

## Getting started

You need Node 22+ and a running UAR, either local or remote.

```sh
npm install
cp .env.example .env    # set LLM_API_KEY; see the file for the other options
npm run dev             # http://localhost:8080; proxies /api, /healthz and /readyz to UAR
```

To run the client and the runtime together in containers:

```sh
docker compose up       # KnowMe web on :8080 (KNOWME_PORT), UAR on :6565 (UAR_PORT)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run typecheck` | Type-checks the app and the e2e suite |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright e2e tests against an in-browser UAR mock |
| `npm run test:visual` | Visual captures at 320, 768, 1024 and 1440px in both themes |
| `npm run test:a11y` | axe accessibility report |
| `npm run brand:assets` | Regenerates the favicons, touch icon, social image and Tauri icons from the KnowMe mark |
| `npm run tauri:dev` | Desktop app in development |

## Brand

Colours, type, the Conviction mark and the Flat 2.0 surface rules come from the official KnowMe AI, LLC brand guide and UI/UX standard. Use the components in `src/components/brand/` for the mark, wordmark and lockup, and the tokens in `src/styles/tokens.css` for colour. Don't hard-code palette values.

Some internal identifiers still say "charcoal", such as the local database name and storage keys. They stay as they are so existing local data keeps loading.
