## ADDED Requirements

### Requirement: Inference is deterministic, bounded and escaped
The client SHALL generate A2UI only from the nine components, SHALL cap depth and size, SHALL escape all agent-supplied text, and SHALL prefer an explicit registration over inference.

#### Scenario: Structured result
- **GIVEN** a tool result is a flat JSON object of strings
- **WHEN** the client infers a surface
- **THEN** a Card with one text row per field renders, identical for identical input

#### Scenario: Over the cap
- **GIVEN** a result exceeds the size cap
- **WHEN** the client tries to infer
- **THEN** it falls back to hide and logs a development warning
