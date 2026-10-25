# Review record: site-seo-prerender

- **Piece:** build and server change (`scripts/site/prerender.mjs`, `check-prerender.mjs`, `vite.config.ts`, `server/src/interface/routes/static_files.rs`, `public/robots.txt`). Branch `feat/site-seo-prerender`.
- **New visitor-facing copy:** none. Titles, descriptions, headings, lists and labels come from `content/site/products.ts`, `products-copy.ts`, `directory.ts` and `directory-copy.ts`, already reviewed in `site-product-pages.md` and `site-home-directory.md`. The markup adds no words.
- **Changes the operator should look at:** `public/robots.txt` gains `Sitemap: https://know-me.tools/sitemap.xml`; a new public file `/sitemap.xml` (generated at build); unknown paths now answer 404 instead of 200.
- **Status:** awaiting operator approval; merge of the PR is read as approval, as for the earlier site PRs. Approval is recorded below by the operator (name, date, git hash).
