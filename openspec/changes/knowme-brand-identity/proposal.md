## Why

The app has no KnowMe mark anywhere: the name is plain text, the chat welcome uses a generic sparkles icon, the favicon and Tauri icons are framework defaults, the social preview image is an expiring Lovable URL, the README is Lovable boilerplate, and user-visible copy still refers to a "Charcoal Agent" that does not exist (decision D-004). The legal entity must read "KnowMe AI, LLC" (decision D-001). This change gives the product its official identity from the Brand Guide v1.0 and the "Conviction" logomark.

## What Changes

- `src/components/brand/`: `KnowMeMark` (Conviction K monogram; body in `currentColor`, ember node from the token), `KnowMeWordmark` ("Know" + ember "Me", Space Grotesk 700) and `KnowMeLockup` (mark + wordmark at the brand's nav/footer/hero sizes), with accessible names and minimum sizes enforced.
- Replace every plain-text "KnowMe" brand rendering (topbar, mobile drawer, landing header and footer, About, chat welcome — replacing the sparkles icon) with the lockup or mark.
- Brand assets generated reproducibly by `scripts/generate-brand-assets.mjs` from the Conviction SVG: `favicon.svg` (charcoal tile), `favicon.ico` (16/32/48), `apple-touch-icon.png`, `og-image.png` (1200×630, self-hosted), and `src-tauri/icons/*` via `cargo tauri icon` from the brand app-icon source.
- `index.html`: title, description, theme color, favicon links, Open Graph/Twitter tags with the approved tagline "AI that understands you." and the self-hosted image.
- Copy: remove "Charcoal Agent" (built-in skills belong to the KnowMe agent in the Universal Agent Runtime); legal line "© 2026 KnowMe AI, LLC" in the landing footer and About.
- Tauri: `productName`/window title "KnowMe", `devUrl` port 8080 and npm commands (previously port 3000 and bun), Cargo package metadata.
- Repo hygiene: README rewritten for KnowMe; `lovable-tagger` and `public/placeholder.svg` removed; docker-compose/.env/Dockerfile/CLAUDE.md product naming updated (with a backward-compatible `CHARCOAL_PORT` fallback); stale `bun.lockb` removed (the project builds with npm; the lockfile misdirected the shadcn CLI twice).

Unchanged by design (D-005): `CharcoalDb`, `charcoal-*` storage keys, `X-UAR-Session-ID`, `/api/uar/*`, the repo directory and `charcoal-agent.code-workspace`, and `supabase/config.toml` `project_id` (an infrastructure identifier). "Charcoal" as the brand color name ("deep charcoal") is not product naming.

## Capabilities

### New Capabilities
- `brand-identity`: how the KnowMe mark, wordmark and name appear in the app, browser, social previews and desktop shell.

### Modified Capabilities
<!-- none -->

## Impact

- New: `src/components/brand/*`, `scripts/generate-brand-assets.mjs`, public brand assets, regenerated `src-tauri/icons/*`.
- Edited: layout/landing/about/chat welcome components, `index.html`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `vite.config.ts`, `package.json`, `README.md`, `CLAUDE.md`, `docker-compose.yaml`, `.env.example`, `Dockerfile`, `src/pages/skills-page.tsx`.
- Removed: `lovable-tagger`, `public/placeholder.svg`, `bun.lockb`.
