## ADDED Requirements

### Requirement: Rendering is registry-driven
The client SHALL decide how to render each AG-UI event and artifact type by registry lookup, with dispositions render, hide and adapt, and SHALL hide any event or type that has no entry.

#### Scenario: Unknown type
- **GIVEN** UAR emits an artifact type with no registry entry
- **WHEN** the client receives it
- **THEN** nothing is shown and a development warning is logged

#### Scenario: Internal artifacts stay hidden
- **GIVEN** a persisted `provider_event` artifact exists in local storage
- **WHEN** the thread renders
- **THEN** no card is shown for it

### Requirement: Ignored events render where a block exists
`agui.cancelled`, `agui.subagent.*` and `agui.rag_citations` SHALL render through existing blocks, and `agui.tool_call.approval_required` SHALL render as a read-only indicator.

#### Scenario: Cancelled run
- **GIVEN** a run is cancelled after usage is reported
- **WHEN** the client receives `agui.cancelled`
- **THEN** the thread shows a cancelled state with the usage
