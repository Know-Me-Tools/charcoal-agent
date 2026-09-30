## ADDED Requirements

### Requirement: Multi-arch memory server image
The memory server CI SHALL publish `ghcr.io/prometheus-ags/surreal-memory-server` for amd64 and arm64 on every push to `main`.

#### Scenario: Multi-arch memory server image
- **GIVEN** a commit is pushed to the memory server `main`
- **WHEN** the workflow completes
- **THEN** the `main` tag lists both platforms and the container's `/health` returns 200
