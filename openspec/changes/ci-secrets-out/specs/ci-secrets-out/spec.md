## ADDED Requirements

### Requirement: Privileged secrets stay out of CI
The deploy workflow SHALL NOT hold or apply UAR's JWT signing secret, UAR's settings admin key or the SurrealDB root password; those Secrets SHALL be created once, out of band, by the operator.

#### Scenario: Workflow carries no privileged secret
- **GIVEN** the workflows under `.github/workflows/`
- **WHEN** they are searched for `UAR_JWT_SECRET`, `UAR_SETTINGS_ADMIN_KEY` and `SURREALDB_ROOT_PASSWORD`
- **THEN** no match is found, and a deploy run still completes against the out-of-band `uar-secrets` and `surrealdb-auth` Secrets

### Requirement: Seed authenticates with a gate token
The seed step SHALL authenticate to UAR with a gate-minted token for its seed identity and SHALL NOT mint its own JWT.

#### Scenario: Seed after JWKS verification is on
- **GIVEN** UAR configured with `jwks_url`
- **WHEN** the deploy runs the seed step
- **THEN** the seed calls succeed with the seed identity's gate token and no HS256 token is minted

### Requirement: Deploy is reviewed and scoped
The deploy job SHALL require reviewer approval through a GitHub environment, and the deployer Role SHALL reach only named Secrets.

#### Scenario: Deployer cannot read the UAR Secret
- **GIVEN** the deployer kubeconfig minted from `k8s/bootstrap/`
- **WHEN** it asks whether it may `get` `secret/uar-secrets` in `knowme`
- **THEN** the answer is `no`, and a deploy run does not start until a required reviewer approves it
