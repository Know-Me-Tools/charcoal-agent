## Why

UAR has no file-based agent loading; agents and KBs are created through the API, and KBs are owned by the creating user. The site agent, its KB and the site API key must share one service identity (`sub = knowme-site`).

## What Changes

- The knowme-site agent and knowledge base, seeded idempotently.
- Lands in: this repo. Owner: km-conversational-designer, km-devops-engineer.
- Depends on: `uar-kb-retrieval-embedding`, `site-knowledge-corpus`, `local-compose-stack`, `kb-chunking-quality` (1.3). Task 1.5 depends on `gate-site-credentials`; task 1.6 depends on the first deploy (`github-deploy-workflows`). Revision 3.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `site-agent`.
