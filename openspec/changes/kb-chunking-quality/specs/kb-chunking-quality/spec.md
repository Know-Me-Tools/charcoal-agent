## ADDED Requirements

### Requirement: Document-level chunking for the site KB
The seed script SHALL create the `knowme-site` KB with `config.chunk_strategy: "document"`, and SHALL offer a `--recreate-kb` flag that deletes the KB, recreates it with that config and re-ingests every corpus document.

#### Scenario: KB created with document chunks
- **GIVEN** no KB named `knowme-site` exists
- **WHEN** `scripts/seed-site-agent.sh` runs
- **THEN** the KB create request carries `config.chunk_strategy: "document"`

#### Scenario: Existing KB recreated
- **GIVEN** a `knowme-site` KB created with the default recursive chunker
- **WHEN** `scripts/seed-site-agent.sh --recreate-kb` runs
- **THEN** the old KB is deleted, a new KB with the document config is created under the same name, every corpus document is ingested into it, and the agent still binds it by name

### Requirement: FR-8 chunk checks pass locally
The recreated site KB SHALL pass the FR-8 chunk checks on the local compose stack before the `site-agent-seed` gate or the text golden set runs.

#### Scenario: No chunk ends inside a version number
- **GIVEN** the corpus is ingested into the recreated KB
- **WHEN** its chunks are listed
- **THEN** every document has at least one chunk and no chunk ends inside a version number such as "v0." or "Obsidian 1."

#### Scenario: Platform fact retrieved
- **GIVEN** the recreated KB
- **WHEN** a question about The Boss's platforms is asked
- **THEN** retrieval returns the chunk from `the-boss.md` that states them

#### Scenario: Fallback recorded
- **GIVEN** document chunks fail a check
- **WHEN** the KB is recreated with a larger `chunk_size`
- **THEN** the checks are rerun and each size tried is recorded with its result
