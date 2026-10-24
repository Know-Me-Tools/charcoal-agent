## Why

The shared mechanism for the home directory and the product pages.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

Extract the landing page's start-a-thread logic into a hook, add a prompt chip and an inline composer that use it, and give non-thread pages a persistent 'Ask the concierge' header entry. Clicking opens a new thread with the prompt as the first message.

- Scope: ui (hook, components, header) + e2e
- Depends on: site-design-brief
- Tasks: 5 (see tasks.md)

## Capabilities

### New Capabilities
- `site-concierge-entry`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
