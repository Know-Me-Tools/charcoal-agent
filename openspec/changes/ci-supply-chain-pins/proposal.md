## Why

`.github/workflows/site.yml` uses actions by mutable tag (`actions/checkout@v7`, `docker/build-push-action@v7`, `azure/setup-kubectl@v5` and others), and the UAR and memory-server images are pulled by tag (`:main` in `k8s/base/uar-deployment.yaml`, `k8s/base/memory-server-deployment.yaml` and `docker-compose.yaml`). A moved tag changes what runs in CI and in the cluster with no review. This closes §6.4 item 13 (T10).

## What Changes

- Every GitHub Action pinned by full commit SHA, and the UAR and memory-server images pinned by digest, in the workflows and manifests. A CI check fails on an unpinned action or a tag-only image.
- The pinned UAR digest must carry Prometheus-AGS/universal-agent-runtime#321, which closes `uar-jwks-es256`.
- Lands in: this repo. Owner: km-devops-engineer.
- Depends on: none.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes).

## Impact

- Capability: `ci-supply-chain-pins`.
- Files: `.github/workflows/site.yml`, `k8s/base/*.yaml`, `docker-compose.yaml`, a new pin-check script under `scripts/`, `versions.toml`.
