# chat-stream-rendering Specification

## Purpose
TBD - created by archiving change assistant-ui-latest. Update Purpose after archive.

## Requirements

### Requirement: Every streamed block is shown
A streamed assistant reply SHALL display every block the runtime sends — text, thinking/reasoning, tool call and result, citation, skill activation, context update, memory recall, memory mutation, artifact, artifact input request and A2UI display — in the order received, including blocks that arrive before the first text or thinking token.

#### Scenario: Skill activation before any text
- **WHEN** the runtime streams a skill activation, a context update, a memory recall and a tool call before its first text token
- **THEN** the assistant reply shows all four blocks, in that order, above the text that follows

#### Scenario: Reply with every block type
- **WHEN** a reply streams one event of every supported block type
- **THEN** each block is visible in the conversation once the stream completes

### Requirement: Stored conversations reload
A conversation completed in a thread SHALL be shown again, with its blocks, after the page is reloaded.

#### Scenario: Reload after a completed reply
- **WHEN** a reply has finished streaming and the user reloads the thread page
- **THEN** the user message and the assistant reply with its blocks are displayed from local storage without contacting the runtime
