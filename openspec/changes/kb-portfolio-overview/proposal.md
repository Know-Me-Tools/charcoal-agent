## Why

Needs the entry pages to exist so the overview links to real pages; it is also the answer to the broad home-page questions.

Phase goal context: `.kbd-orchestrator/phases/usefulness-update/goals.md`; assessment: `assessment.md`.

## What Changes

A directory page grouping products by family with status and version from the facts file, a relationships page listing only relationships the portfolio or a repo states (each edge with its source, and a line naming what is not stated), and eval questions for broad prompts.

- Scope: knowledge source + eval
- Depends on: kb-platform-pages, kb-apps-pages, kb-tools-and-partner-pages
- Tasks: 4 (see tasks.md)

## Capabilities

### New Capabilities
- `kb-portfolio-coverage`

### Modified Capabilities
None.

## Impact

Merging a change that touches `src/` or `content/site/` deploys the site immediately. Knowledge-base changes reach the concierge only after the operator runs the seed (`SEED_MODE=kb scripts/seed-site-agent.sh`). The kill switch is not touched.
