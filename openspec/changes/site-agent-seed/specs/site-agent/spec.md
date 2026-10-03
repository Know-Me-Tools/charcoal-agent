## ADDED Requirements

### Requirement: Seeded site agent
The seed script SHALL idempotently create the `knowme-site` agent and KB, owned by the `knowme-site` identity, and the agent SHALL answer with citations from the KB.

#### Scenario: Seeded site agent
- **GIVEN** the local stack and the approved corpus
- **WHEN** the seed script runs twice and a corpus question is asked
- **THEN** the first run creates the agent and KB, the second changes nothing, and the answer cites the corpus
