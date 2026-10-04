## Why

The apex and `www` still point at the Lovable host. The operator retires Lovable hosting.

## What Changes

- Move know-me.tools off Lovable to the cluster gateway.
- Lands in: operator (Cloudflare). Owner: operator; km-devops-engineer verifies.
- Depends on: `github-deploy-workflows`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `apex-hosting`.
