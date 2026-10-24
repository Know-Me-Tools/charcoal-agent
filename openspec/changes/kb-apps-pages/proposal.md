## Why

Parallel with the platform and tools changes.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

One short OKF page per application entry (about 22). Several are proposals or prototypes; each page leads with that status. Numen Enclave and Companion are described as the portfolio does, as proposed.

- Scope: knowledge source (KnowMe, Locus, dot, Synaxis, Numen, Praxis, Know Meet, Know Decision, operator service, Lampas, Concierge, Knowtes, Tune, Logos, Studio, Light, Pulse, Tranquil, Poppy, Authentic Digital Twin, Companion, Numen Enclave)
- Depends on: product-facts-registry
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `kb-portfolio-coverage`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
