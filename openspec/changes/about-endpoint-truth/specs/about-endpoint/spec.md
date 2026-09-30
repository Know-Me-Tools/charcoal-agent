## ADDED Requirements

### Requirement: Truthful endpoint row
The About page SHALL show the endpoint the client actually calls.

#### Scenario: Truthful endpoint row
- **GIVEN** `VITE_UAR_BASE_URL` is unset
- **WHEN** the About page renders
- **THEN** the endpoint row shows the same-origin proxy target
