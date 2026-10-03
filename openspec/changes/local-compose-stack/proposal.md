## Why

Local compose must mirror the cluster: published UAR and memory-server images, a shared SurrealDB v3.3.0, and the Qwen chat and embedding models. It is also the carried live UAR smoke.

## What Changes

- Local four-service stack: web, UAR, SurrealDB, memory server.
- Lands in: this repo. Owner: km-devops-engineer.
- Depends on: `uar-ghcr-multiarch-publish`, `memory-server-ghcr-publish`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `local-stack`.
