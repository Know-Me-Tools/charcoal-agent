## Context

See proposal.md. Brand sources (outside the repo): `branding/logos/conviction-*.svg` (chosen mark, Concept D), `branding/knowme-brand-guide.html` (clear space 1× icon width; min sizes 16 favicon / 24 nav / 52 hero; never recolor the ember node; no glow in UI chrome; never the all-ember mark in chrome; lockups nav 28px+18px text, footer 24+16, hero 52–72+32–36), `know-me-system/desktop/src/shared/components/KnowMeLogo.tsx` (reference React implementation) and `desktop/branding/app-icon-source.svg` (charcoal tile, off-white K, ember node).

## Goals / Non-Goals

**Goals:** one brand component set used everywhere; reproducible asset generation; no external image URLs; naming per D-001/D-004 with D-005 identifiers untouched.

**Non-Goals:** shell/landing/chat visual redesign (later changes); landing hero copy (landing-and-about-brand); renaming storage identifiers.

## Decisions

1. **Frameless mark in UI, framed tile only for app icons.** The UI mark uses the reference geometry (`viewBox 0 0 200 200`, `translate(50,38)`), body `currentColor` (so it follows `--km-fg` in both themes) and the ember node from `--km-ember`; the brand guide forbids glows in UI chrome, so the glow circle is omitted. App/favicons use the app-icon tile, which reads at 16 px.
2. **Accessible naming.** The lockup renders one accessible name ("KnowMe") via `aria-label` on the lockup root, hiding the SVG and the split wordmark spans from assistive tech to avoid "Know Me".
3. **Size contract.** `KnowMeMark` clamps to the brand minimums by context (`size` ≥ 16; nav lockup ≥ 24) and the lockup exposes `variant: "nav" | "footer" | "hero"` mapping to the lockup spec sizes, so call sites cannot drift.
4. **Generated, committed assets.** `scripts/generate-brand-assets.mjs` (run with `npm run brand:assets`) writes favicons with `rsvg-convert` + ImageMagick, renders `og-image.png` from an HTML template with Playwright (brand fonts from Google Fonts) and calls `cargo tauri icon` for the desktop icons. Outputs are committed so builds need none of these tools.
5. **Favicon theming.** `favicon.svg` embeds a `prefers-color-scheme` style so the tile inverts appropriately; `favicon.ico` is the charcoal tile (works on both).
6. **Tauri dev wiring.** `devUrl` `http://localhost:8080`, `beforeDevCommand: "npm run dev"`, `beforeBuildCommand: "npm run build"` — matching Vite and the npm lockfile.
7. **Docker naming with compatibility.** Services/containers/network become `knowme-web`/`knowme-uar`/`knowme-network`; the published port reads `${KNOWME_PORT:-${CHARCOAL_PORT:-8080}}` so existing `.env` files keep working.

## Risks / Trade-offs

- [Removing `bun.lockb` changes tooling for anyone using bun] → the project already builds with npm (Dockerfile `npm ci`, Tauri now npm); bun users regenerate from `package.json`.
- [OG image generation needs network for fonts] → only when regenerating; the committed PNG is used at runtime.
- [`cargo tauri icon` overwrites all icon files] → intended; icons were Tauri defaults.

## Migration Plan

Branch `rebrand/knowme-brand-identity`; e2e checks for lockup/metadata; rollback = revert merge.
