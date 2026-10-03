## ADDED Requirements

### Requirement: Single deploy path for flint-gate
flint-gate SHALL reach the know-me cluster only through a know-me-cluster digest PR applied by Argo CD; no workflow SHALL apply to gate's Argo-managed namespace or deploy gate to the `ssr` cluster.

#### Scenario: Gate merge to main
- **GIVEN** a merge to flint-gate main
- **WHEN** CI runs
- **THEN** flint-infra `images.yaml` builds the image, a know-me-cluster PR bumps the digest from the `digests-flint-gate` artifact, and no workflow deploys to `ssr` or applies to `flint-core`

### Requirement: Argo-managed manifests carry no controller-owned state
The gate manifests in know-me-cluster SHALL NOT hard-code the `deployment.kubernetes.io/revision` annotation.

#### Scenario: Sync after a digest bump
- **GIVEN** `namespaces/flint-core/manifests.yaml` without the revision annotation
- **WHEN** a digest PR merges and Argo CD syncs
- **THEN** the gate app reports Synced and Healthy with no drift
