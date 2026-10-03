## ADDED Requirements

### Requirement: Pinned supply chain
The repository SHALL reference every GitHub Action by full commit SHA and every third-party container image (UAR, memory-server, SurrealDB, seed job base image) by digest, and CI SHALL fail when an action or image is referenced by tag only.

#### Scenario: Unpinned reference fails CI
- **GIVEN** a workflow `uses:` line with a tag such as `@v7`, or a manifest image such as `universal-agent-runtime:main` without `@sha256:`
- **WHEN** the CI pin check runs
- **THEN** the check exits non-zero and names the file and line

#### Scenario: Pinned tree passes
- **GIVEN** every action pinned by SHA and every image by digest, apart from the `knowme-web` base entry that CI replaces with its build digest
- **WHEN** the CI pin check runs and the stack renders with `kubectl kustomize k8s/`
- **THEN** the check exits 0 and every rendered `image:` carries `@sha256:`

### Requirement: UAR digest carries the ES256 verifier
The pinned UAR image digest SHALL contain Prometheus-AGS/universal-agent-runtime#321.

#### Scenario: Pinned UAR verifies ES256
- **GIVEN** the UAR digest pinned in `k8s/base/uar-deployment.yaml`
- **WHEN** its provenance is checked
- **THEN** the build commit includes #321, recorded as evidence that closes `uar-jwks-es256`
