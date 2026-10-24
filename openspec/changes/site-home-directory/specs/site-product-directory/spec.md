## ADDED Requirements

### Requirement: The home page shows every public product with its status and version
The home page of the public site SHALL list each public portfolio entry in a family group with its name, status as text, version line, a one-line summary and an ask-the-concierge chip. The list SHALL be generated from the facts file, and a build check SHALL fail when the generated file differs from its source.

#### Scenario: Every public row appears
- **WHEN** the home page is rendered
- **THEN** the number of cards equals the number of public rows in the facts file

#### Scenario: Drift is caught
- **WHEN** the facts file changes and the directory is not regenerated
- **THEN** the drift check exits non-zero
