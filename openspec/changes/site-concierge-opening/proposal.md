## Why

Without it a visitor who opens the chat directly still sees a three-product opening.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

Replace the three-product opener and chips with chips that reflect the portfolio's families, and add eval questions that check the concierge calls proposals proposals. The agent prompt is not changed.

- Scope: content (empty state, chips) + eval
- Depends on: kb-portfolio-overview, site-home-directory
- Tasks: 3 (see tasks.md)

## Capabilities

### New Capabilities
- `site-concierge-opening`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
