## Why

Shorter, interesting pages that give a way into the chat from anywhere.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

/products lists the portfolio and /products/<slug> shows what the product is, its status and version, three to five key facts, the questions worth asking and an inline composer. Ten products (D-005): The Boss, BossFang, Universal Agent Runtime, Surreal Memory Server, Prometheus Skill Pack, the Flint platform, Prometheus Entity Management, Parking Lot, KnowMe and Locus. An unknown slug gets the not-found page.

- Scope: ui + content (routes, page template, ten content modules)
- Depends on: site-ask-concierge, site-home-directory
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `site-product-pages`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
