## Why

Parallel with the two other page changes; separate worktrees, then rebase the manifest and eval files in merge order.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

One short OKF page per platform entry (about 14): what it is, status wording, version line from the facts file, how it relates to the others only where the portfolio states it, and sources. No infrastructure specifics (D-001).

- Scope: knowledge source (Flint, Entity Management and Sync, Parking Lot, gen_ui, DocuMind, Knowledge, demo hosting, inference forks)
- Depends on: product-facts-registry
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `kb-portfolio-coverage`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
