## 1. Brand components

- [x] 1.1 Add `src/components/brand/` (`KnowMeMark`, `KnowMeWordmark`, `KnowMeLockup` with nav/footer/hero variants, accessible name, minimum sizes) with component tests (accessible name "KnowMe", ember node uses the token, minimum size clamp)
- [x] 1.2 Replace plain-text brand renderings with the lockup/mark (topbar, mobile drawer, landing header and footer, About, chat welcome instead of the sparkles icon); verify with an e2e check that the top bar exposes a "KnowMe" brand link containing the mark on every app route

## 2. Assets and metadata

- [x] 2.1 Add `scripts/generate-brand-assets.mjs` + `npm run brand:assets`; generate and commit `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `og-image.png` and `src-tauri/icons/*`; verify file types/sizes (`file`, `identify`) and review the images
- [x] 2.2 Update `index.html` (title, description, theme-color, favicon/apple-touch links, OG/Twitter tags with the approved tagline and self-hosted image); remove `public/placeholder.svg`; verify with an e2e test reading the head tags (no external image hosts)

## 3. Naming and shell

- [ ] 3.1 Copy: remove "Charcoal Agent" wording, describe built-in skills as the KnowMe agent's, add "© 2026 KnowMe AI, LLC" to the landing footer and About; verify in e2e
- [ ] 3.2 Tauri: productName/title "KnowMe", devUrl 8080, npm before-commands, Cargo metadata; verify `npx tauri info` or config JSON and `cargo metadata` parse
- [ ] 3.3 Repo hygiene: README for KnowMe, remove `lovable-tagger` (and its Vite plugin), `bun.lockb`; docker-compose/.env.example/Dockerfile/CLAUDE.md naming with `CHARCOAL_PORT` fallback; verify `docker compose config` parses and the repo-wide grep finds no product-name "Charcoal"/Lovable references outside the D-005 allow-list

## 4. Verification

- [ ] 4.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`; record results, the allow-listed identifiers and the asset list in `verification.md`
