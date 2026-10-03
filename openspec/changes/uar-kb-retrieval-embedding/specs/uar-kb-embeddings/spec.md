## ADDED Requirements

### Requirement: Retrieval matches ingestion
UAR SHALL embed KB queries with the backend that embedded the KB's documents.

#### Scenario: Retrieval matches ingestion
- **GIVEN** a KB ingested with an OpenAI-compatible 1024-dimension embedding model
- **WHEN** a chat run retrieves from it
- **THEN** the run receives non-empty cited chunks, and a KB built with another model yields an explicit error
