## Discovery (task 1.1)

- No prerender step existed. `usePageHead` sets the head in the browser only; `index.html` is one shell.
- `static_files::serve` served a file, then `<path>/index.html`, then answered every extensionless path with the shell and status 200. An unknown `/products/<slug>` was a 200 soft-404.
- Server and build coupling: `server/build.rs` runs `npm run build -- --outDir <dir>`, so a second npm script would receive the flag. The prerender therefore runs as a Vite plugin (`site-prerender` in `vite.config.ts`, `closeBundle`), only when `VITE_SITE_AGENT_ID` is set (the public site build).

## Approach

- `scripts/site/prerender.mjs` writes `index.html` (home), `products/index.html` and `products/<slug>/index.html` from the shell: head (title, description, canonical, og, twitter) and `#root` text as plain semantic HTML. React replaces `#root` on mount.
- All text comes from `content/site/{products,products-copy,directory,directory-copy}.ts`, the modules the SPA renders from. No new visitor-facing string.
- The pristine shell is kept as `_shell.html`. The server serves it for client routes (`/threads`, `/threads/<id>`) and as the body of a real 404 for any other path without a file, so the client still renders the not-found page.
- `sitemap.xml` is generated into the web root; `public/robots.txt` gains a `Sitemap:` line.
- `scripts/site/check-prerender.mjs` (CI, next to check-products) checks the in-memory render; `--dist` checks a build; `--url` checks a running server over plain HTTP.

## Risks

- Between the first paint and the bundle mounting, the static text is visible unstyled by component classes (the document stylesheet is loaded). Not checked in a browser here.
- A KNOWME_WEB_ROOT that serves the app build (not the site build) would answer `/agents` and `/settings` with 404 status and the shell. The server embeds the site build.
