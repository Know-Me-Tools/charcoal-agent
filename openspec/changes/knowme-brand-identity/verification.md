# Verification notes: knowme-brand-identity

## 4.1 Gates (2026-09-24)
- `npm run build` ✓ · `npm run typecheck` 0 · `npm run lint`: 0 errors
- `npm test`: 93 tests pass (this change adds `brand.test.tsx`, 8 tests, and `brand-naming.test.ts`, 2 tests)
- `npm run test:e2e`: 141/141 pass, including the expanded `brand.spec.ts`
- `docker compose config` parses; `cargo metadata` parses `src-tauri/Cargo.toml`

## Brand components
- `KnowMeMark`: the Conviction glyph, cropped to `viewBox="27 34 132 132"` so the mark fills its box. The body is `currentColor` and the circle is `--km-ember`. Minimum size is 16px. It is decorative (`aria-hidden`) unless given a `label`.
- `KnowMeWordmark`: "Know" plus "Me" in ember text. `decorative` removes its accessible name when a parent already names it.
- `KnowMeLockup`: nav (28px), footer (24px) and hero (56px) variants. Each exposes one accessible name, "KnowMe".
- Placement: topbar (a home link), mobile drawer footer, landing header and footer, the About heading, the chat welcome, and the agent avatar (which replaced the Sparkles icon).

## Generated assets (`npm run brand:assets`)
The source is `scripts/brand/app-icon.svg`, the desktop app icon from know-me-system. The social image is rendered from `scripts/brand/og-image.html` with Playwright.

| Asset | Details |
|---|---|
| `public/favicon.svg` | Charcoal tile with the mark; reads on light and dark tabs |
| `public/favicon.ico` | 16, 32, 48 |
| `public/apple-touch-icon.png` | 180×180, full bleed |
| `public/og-image.png` | 1200×630 |
| `src-tauri/icons/*` | `cargo tauri icon` set, including the android and ios sets |

`public/placeholder.svg` is removed. `index.html` sets the title "KnowMe — AI that understands you.", the author "KnowMe AI, LLC", theme-color for both schemes, and same-origin og/twitter images. e2e checks that the social image is served as `image/png`.

## Naming (D-004, D-005)
- The product is KnowMe, the agent is the KnowMe agent, and it runs on the Universal Agent Runtime. The legal line is "© 2026 KnowMe AI, LLC" on the landing footer and About.
- Copy: built-in skills are "a built-in skill of the KnowMe agent, synced to your Universal Agent Runtime". About shows "Runtime status", "Runtime endpoint" and "Agent: KnowMe on the Universal Agent Runtime".
- Tauri: `productName` is "KnowMe", with `devUrl` `http://localhost:8080` and npm before-dev/build commands. The Cargo description, authors and license are set. The bundle identifier `tools.know-me.agent` and the crate/lib names are unchanged, because changing them orphans installs and breaks `main.rs`.
- Repo:
  - The README is rewritten and CLAUDE.md is updated.
  - `lovable-tagger` (and its Vite plugin) and `bun.lockb` are removed.
  - The compose services are now `knowme-web` and `knowme-uar` on `knowme-network`. The port is `${KNOWME_PORT:-${CHARCOAL_PORT:-8080}}`.
  - The nginx conf is now `knowme.conf`.
  - The `uar_data` volume name is unchanged, to keep existing data.
- Allow-listed identifiers, kept as they are so local data keeps loading:
  - `CharcoalDb`
  - IndexedDB `/charcoal-db` / `idb://charcoal-db`
  - storage keys `charcoal-pglite-migrated-v1`, `charcoal-thread-registry`, `charcoal-chat-messages`, `charcoal:prompt_caching_enabled`
  - the `CHARCOAL_PORT` fallback
  - `X-UAR-Session-ID`, `/api/uar/*`
  - the repo directory and `charcoal-agent.code-workspace`
  - `supabase/config.toml` `project_id`
  - the colour word "charcoal" in the asset script
- Guard: `src/test/brand-naming.test.ts` scans the tracked source, e2e, docs, container and Tauri files. It fails on any "charcoal" outside the allow-list and on any "lovable". Planting "the charcoal-agent UI" in `src/lib/utils.ts` made it fail, as intended.
- e2e (`brand.spec.ts`):
  - the lockup on four routes
  - the welcome mark, with no Sparkles icon
  - the legal line
  - head metadata
  - About names the KnowMe agent
  - the built-in skill copy
  - no "Charcoal" text on About or Skills
