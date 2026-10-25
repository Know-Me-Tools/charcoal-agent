## Why

Without it the new pages are client-rendered and a crawler sees the same empty shell as the home page. Not requested by name, so it is the first cut.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

The server already serves a prerendered page from <route>/index.html but no prerender step was found in the repository. Discover whether one exists, choose build-time prerender or another way to put each product page's title and body in the first response, add sitemap.xml and the robots line, and verify with curl that a request without JavaScript sees the page's text.

- Scope: build + public + server routing (conditional on discovery)
- Depends on: site-product-pages
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `site-discovery`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
