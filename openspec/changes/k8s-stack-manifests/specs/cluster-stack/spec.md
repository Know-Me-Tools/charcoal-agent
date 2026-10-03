## ADDED Requirements

### Requirement: Declarative stack
`k8s/` SHALL declare the four services, routes and seed Job for namespace `knowme` with every credential taken from Secrets.

#### Scenario: Declarative stack
- **GIVEN** the manifests
- **WHEN** a server-side dry-run apply runs against the `know-me` context
- **THEN** it succeeds and no tracked file contains a secret value
