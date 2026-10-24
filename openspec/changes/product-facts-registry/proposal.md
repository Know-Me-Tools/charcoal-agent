## Why

Every later change reads versions from this file, so a refresh touches one place.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

Extract the 58 portfolio entries to data, establish release truth from GitHub releases, the registry and the cluster, and write docs/knowledge-source/product-facts.json with a version, a version kind (stable, pre-release, untagged, manifest), a source and a checked date per row. A checker validates the schema and, with --live, compares stable versions with GitHub.

- Scope: data + scripts (docs/knowledge-source, scripts/kb)
- Depends on: NONE
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `product-facts`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
