## ADDED Requirements

### Requirement: Local stack runs end to end
`docker compose up` SHALL start web, UAR, SurrealDB and the memory server healthy, with UAR persisting to the shared SurrealDB and answering with `qwen3.8-max`.

#### Scenario: Local stack runs end to end
- **GIVEN** a machine with Docker and a filled `.env`
- **WHEN** `docker compose up -d` completes
- **THEN** all four services are healthy and a chat turn through the web proxy streams a Qwen reply
