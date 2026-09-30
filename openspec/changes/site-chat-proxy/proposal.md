## Why

UAR has no anonymous access and lets requests override agent, model and run policy. Public visitors must reach only the site agent, without any credential in the browser.

## What Changes

- Site chat pinned to the site agent behind the nginx site proxy.
- Lands in: this repo. Owner: km-frontend-engineer, km-security-officer.
- Depends on: `local-compose-stack`, `site-agent-seed`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `site-chat-proxy`.
