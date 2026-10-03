## ADDED Requirements

### Requirement: Multi-arch UAR image
UAR CI SHALL publish `ghcr.io/prometheus-ags/universal-agent-runtime` for linux/amd64 and linux/arm64 on every push to `main`.

#### Scenario: Multi-arch UAR image
- **GIVEN** a commit is pushed to UAR `main`
- **WHEN** the workflow completes
- **THEN** `imagetools inspect` of the `main` tag lists linux/amd64 and linux/arm64 and an anonymous pull succeeds
