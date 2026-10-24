## Why

This is the headline goal: a visitor can see the whole portfolio from the home page.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

A directory section on the home page grouping every public product by family. Each card has the name, a status badge, the version line, a one-line summary and an ask chip, and links to its product page where one exists. The directory data is generated from the facts file by a script with a drift check.

- Scope: ui + content (landing page, directory data, build script)
- Depends on: product-facts-registry, site-design-brief, site-ask-concierge
- Tasks: 6 (see tasks.md)

## Capabilities

### New Capabilities
- `site-product-directory`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
