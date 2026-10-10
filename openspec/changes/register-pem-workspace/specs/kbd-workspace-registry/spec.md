## ADDED Requirements

### Requirement: PEM is a registered, writable workspace folder
`.kbd-orchestrator/project.json` SHALL list `prometheus-entity-management` in `workspace.folders` with `write_access: true`, and `.kbd-orchestrator/constraints.md` SHALL NOT forbid writes to it.

#### Scenario: A gate reads the workspace
- **GIVEN** the registry entry exists
- **WHEN** a gate evaluates which folders are writable
- **THEN** PEM is writable and UAR, artifact-refiner and openfang are not
