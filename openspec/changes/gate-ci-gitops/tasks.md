## 1. One GitOps deploy path for flint-gate

- [x] 1.1 flint-gate CI stops deploying to `ssr`, dispatches flint-infra `images.yaml`, and opens a know-me-cluster digest PR. Evidence: Know-Me-Tools/flint-gate#11 merged.
- [x] 1.2 Read the image digest from the flint-infra `digests-flint-gate` artifact. Evidence: Know-Me-Tools/flint-gate#12 merged.
- [x] 1.3 Prove the pipeline end to end. Evidence: Know-Me-Tools/flint-gate run 36988125837 opened Prometheus-AGS/know-me-cluster#3 (2026-10-02).
- [ ] 1.4 D-20: with the operator's decision recorded, retire flint-infra `deploy.yaml` or scope it away from the namespace Argo CD manages for gate (`flint-core`).
- [ ] 1.5 Remove the hard-coded `deployment.kubernetes.io/revision` annotation from know-me-cluster `namespaces/flint-core/manifests.yaml` (U19).
- [ ] 1.6 Integration check: in know-me-cluster, `grep -n 'deployment.kubernetes.io/revision' namespaces/flint-core/manifests.yaml` finds nothing; flint-infra `deploy.yaml` no longer targets `flint-core`; the next gate merge to main produces exactly one deploy, a know-me-cluster digest PR, and after it merges the Argo CD app for gate reports Synced and Healthy with no drift. Output recorded.
