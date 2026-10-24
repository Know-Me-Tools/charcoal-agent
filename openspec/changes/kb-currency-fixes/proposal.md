## Why

Ships first among the content changes because the concierge is wrong about UAR now.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

Replace the stale UAR 1.0.0 claims (6 files) and the stale The Boss, skill-package and other versions with placeholders that build-kb resolves from product-facts.json; validate-kb fails on an unresolved placeholder. Rebuild, validate, run the retrieval eval before and after.

- Scope: knowledge source + build script
- Depends on: product-facts-registry
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `site-knowledge-base`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
