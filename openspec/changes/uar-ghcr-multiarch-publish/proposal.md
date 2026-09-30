## Why

Every push to UAR `main` publishes a public, multi-architecture UAR image that all projects pull, so no consumer rebuilds UAR.

## What Changes

- UAR: publish a multi-arch image to GHCR.
- Lands in: Prometheus-AGS/universal-agent-runtime. Owner: km-devops-engineer.
- Depends on: none.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `uar-image-publishing`.
