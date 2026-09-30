## Why

The stack runs in namespace `knowme` on the `know-me` LKE cluster behind the shared gateway, configured from Secrets, never literals.

## What Changes

- Kubernetes manifests for the four-service stack.
- Lands in: this repo. Owner: km-devops-engineer, km-security-officer (review).
- Depends on: `uar-ghcr-multiarch-publish`, `memory-server-ghcr-publish`, `cluster-gateway-and-cert`, `site-agent-seed`, `site-chat-proxy`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `cluster-stack`.
