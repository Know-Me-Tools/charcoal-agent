## Why

UAR has no anonymous access and lets requests override agent, model and run policy. Public visitors must reach only the site agent, without any credential in the browser.

## What Changes

- Site chat pinned to the site agent behind the Axum site server (`server/`; operator decision 2026-09-30 replaced nginx).
- Lands in: this repo. Owner: km-frontend-engineer, km-security-officer.
- Depends on: `local-compose-stack`, and a locally seeded agent from the `site-agent-seed` **script** (task 1.2, done) — not that change's gates, which run after the first deploy. Revision 3.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `site-chat-proxy`.
