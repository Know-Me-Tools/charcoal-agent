## ADDED Requirements

### Requirement: The knowledge base states only relationships its sources state
The relationships page SHALL list a relationship between two products only when the portfolio or a repository states it, SHALL give the source of each, and SHALL state that relationships the sources describe as intent are intent and not proof of integration.

#### Scenario: Every edge has a source
- **WHEN** the relationships page is validated
- **THEN** each listed relationship cites a source

#### Scenario: Unstated relationships are named
- **WHEN** a visitor asks how two products relate and no source says
- **THEN** the page supports the answer that it is not stated
