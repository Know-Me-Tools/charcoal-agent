## Why

Design before build so the five UI changes share one direction; docs only, so no deploy.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

Run the impeccable shape and craft guidance over the directory, the product page and the ask-the-concierge entry. Output: a brief with the page inventory and URLs, the status-badge vocabulary and tokens in the Flat 2.0 rules, layout at 320 and 1440 in both themes, the ask patterns, and static comps that are rendered and looked at.

- Scope: docs/design (no code)
- Depends on: product-facts-registry
- Tasks: 6 (see tasks.md)

## Capabilities

### New Capabilities
- `site-product-directory`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
