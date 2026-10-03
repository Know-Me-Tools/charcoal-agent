## ADDED Requirements

### Requirement: Continuous site deploy
Every push to `main` SHALL rebuild the site image and roll it out to the `know-me` cluster, then smoke-test it.

#### Scenario: Continuous site deploy
- **GIVEN** a commit is pushed to `main`
- **WHEN** the workflow runs
- **THEN** the new web digest is running and the smoke checks pass
