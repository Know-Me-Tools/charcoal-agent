## ADDED Requirements

### Requirement: The validator grows only from a recorded need
UAR's A2UI validator SHALL accept a new component only when a gap table in this change names the template or inference rule that needs it, and SHALL NOT accept URL-bearing components without a recorded URL policy.

#### Scenario: Gap found
- **GIVEN** the gap table lists `List` as needed
- **WHEN** the PR is reviewed
- **THEN** `List` is accepted with tests and no URL-bearing component is added
