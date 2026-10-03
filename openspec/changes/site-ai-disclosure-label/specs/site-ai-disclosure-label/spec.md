## ADDED Requirements

### Requirement: Fixed non-model AI label
Every page with a composer SHALL show a static label, not produced by the model, that identifies the agent as AI and says answers may be wrong, and the label SHALL be visible before the first token of the first reply.

#### Scenario: Label before the first token
- **GIVEN** a visitor opens a new thread on the site build
- **WHEN** the composer renders and before any stream event arrives
- **THEN** the approved AI label is visible beside the composer, and it appears on the first agent bubble when that bubble renders

### Requirement: Agent messages marked as AI-generated
Every agent message SHALL carry `data-ai-generated="true"` in the DOM.

#### Scenario: All agent messages marked
- **GIVEN** a thread with several agent replies, including a restored and a failed one
- **WHEN** the DOM is queried
- **THEN** every element with `data-role="assistant"` carries `data-ai-generated="true"` and no user message does

### Requirement: Sensitive-data hint
The composer SHALL show a hint asking the visitor not to share sensitive personal details.

#### Scenario: Hint visible
- **GIVEN** the composer renders
- **WHEN** the visitor looks at it
- **THEN** the approved sensitive-data hint is visible

### Requirement: Approved copy only
The label and hint copy SHALL be placed only after the operator approval is recorded in `docs/content/reviews/site-ai-disclosure-label.md`.

#### Scenario: Copy without approval
- **GIVEN** no approval record exists
- **WHEN** the copy would be committed under `content/**`, `src/pages/**` or `public/**`
- **THEN** the task is blocked until the approval is recorded
