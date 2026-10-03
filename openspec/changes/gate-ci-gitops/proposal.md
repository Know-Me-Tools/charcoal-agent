## Why

Gate's home is the know-me cluster only, but its CI deployed to the `ssr` cluster, and flint-infra's `deploy.yaml` also applies to the namespace Argo CD manages for gate (D-20). Two writers on one namespace is a split brain: Argo CD and the workflow overwrite each other. The gate changes in this phase need one deploy path.

## What Changes

- flint-gate CI stops deploying to `ssr`. Images stay `ghcr.io/prometheus-ags/flint-gate`, built by flint-infra `images.yaml`, and digest bumps land through know-me-cluster PRs.
- State (plan A2 N8): mostly done. Know-Me-Tools/flint-gate#11 (no `ssr` deploy; dispatches flint-infra `images.yaml`; opens the know-me-cluster digest PR) and #12 (digest read from the flint-infra `digests-flint-gate` artifact) are merged. Run 36988125837 proved the pipeline by opening Prometheus-AGS/know-me-cluster#3 (2026-10-02).
- Remaining: D-20 (retire flint-infra `deploy.yaml` or scope it away from gate's namespace) and removing the hard-coded `deployment.kubernetes.io/revision` annotation in know-me-cluster `namespaces/flint-core/manifests.yaml` (U19).
- Lands in: Know-Me-Tools/flint-gate, flint-infra, Prometheus-AGS/know-me-cluster. Owner: platform; km-devops-engineer.
- Depends on: D-20. It is the deploy path for `gate-ext-authz-endpoint` and `gate-site-credentials`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `gate-ci-gitops`.
- Requirements: none directly; the deploy path for the FR-46 and FR-47 gate changes.
