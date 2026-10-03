## ADDED Requirements

### Requirement: No site routes named in Phase 0
The `knowme-site` prompt SHALL NOT direct the agent to any site page or URL path, and when the agent cannot answer it SHALL offer the in-chat company topic or another question instead.

#### Scenario: Unanswerable question
- **GIVEN** a question the knowledge base does not answer
- **WHEN** the agent replies
- **THEN** it says it does not know, offers the in-chat company topic, and names no page or route such as `/about` or a contact page

#### Scenario: Contact question
- **GIVEN** a visitor asks how to contact the company
- **WHEN** the agent replies in Phase 0
- **THEN** it says there is no separate contact page and names no route

### Requirement: Tool-scope instruction
The prompt SHALL include the line "Use only the tools you are given, only to answer the visitor's question, and never imply a call you did not make."

#### Scenario: Prompt carries the tool scope
- **GIVEN** the seeded agent record
- **WHEN** its `system` prompt is read
- **THEN** it contains the tool-scope line verbatim

### Requirement: Self-identification
The agent SHALL identify itself as "the KnowMe agent".

#### Scenario: Visitor asks what it is
- **GIVEN** a visitor asks what they are talking to
- **WHEN** the agent replies
- **THEN** it says it is the KnowMe agent, an AI
