## Why

The highest wording risk in the phase, so it gets the strictest check (PRIV-1).

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

One short page per tool and client entry (about 16). For client, clinical and partner entries the page carries the product description and status only: no hardware, network, office or pilot-site specifics (D-001). PatientGPT states it is a plan, not deployed and not HIPAA-certified, in the portfolio's wording.

- Scope: knowledge source (skills and mini, native agent creator, Phase Exit, setup, Doc Forge, Artifact Refiner, IPFS Sync, ASO, PatientGPT, TribeHealth, realtor assistant, Kaia, HotSeaters, a withheld client system, ASSET InterTech)
- Depends on: product-facts-registry
- Tasks: 6 (see tasks.md)

## Capabilities

### New Capabilities
- `kb-portfolio-coverage`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
