## ADDED Requirements

### Requirement: Scheduled purge past retention
An operator-scheduled purge SHALL delete every `knowme-site` session row older than the retention period from `sessions`, `checkpoints`, `cost_ledger` and `tool_admission_evidence`, and from `memory` if memory is enabled.

#### Scenario: Old session purged
- **GIVEN** a site session older than the retention period (D-5)
- **WHEN** the scheduled purge runs
- **THEN** a direct SurrealDB query finds no rows for that session in any of the stores

### Requirement: Request-based erasure
A published erasure process SHALL delete a named session's rows from every store on request.

#### Scenario: Named session erased
- **GIVEN** an erasure request for a named test session
- **WHEN** the operator runs the published process
- **THEN** a direct SurrealDB query finds no rows for that session in `sessions`, `checkpoints`, `cost_ledger` or `tool_admission_evidence`
