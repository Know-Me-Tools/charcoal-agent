## Why

The stack runs in namespace `knowme` on the `know-me` LKE cluster behind the shared gateway, configured from Secrets, never literals.

## What Changes

- Kubernetes manifests for the four-service stack.
- Lands in: this repo. Owner: km-devops-engineer, km-security-officer (review).
- Depends on: `uar-ghcr-multiarch-publish`, `memory-server-ghcr-publish`, `cluster-gateway-and-cert`, `uar-runtime-host-lockdown`, `site-chat-proxy`, and the seed **script** from `site-agent-seed` task 1.2 (already done) — not that change's gates, which run after the first deploy. Revision 3.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `cluster-stack`.
