# runtime-data-sync Specification

## Purpose
TBD - created by archiving change entity-graph-data-layer. Update Purpose after archive.

## Requirements

### Requirement: One record per runtime resource
The app SHALL hold a single canonical copy of each Universal Agent Runtime resource (agent, provider, model, skill, session, user settings) identified by its type and id, and every view that shows that resource SHALL read that copy.

#### Scenario: Skill toggled in one view
- **WHEN** the user enables a skill on the Skills settings page
- **THEN** every other mounted view that lists that skill (for example the agent editor's skill picker) shows it as enabled without a manual reload

#### Scenario: Provider appears once
- **WHEN** the providers list and the agent editor's provider selector are both loaded
- **THEN** both show the same provider display name and enabled state for each provider id

### Requirement: Changes refresh dependent data
After a successful create, update, delete or runtime-side refresh, the app SHALL refresh the affected resource lists so the UI reflects the runtime's state.

#### Scenario: Provider created
- **WHEN** the user adds a provider and the runtime accepts it
- **THEN** the providers list is refetched and includes the new provider

#### Scenario: Built-in skills synced
- **WHEN** the startup skills sync creates or enables built-in skills
- **THEN** the skills list is refetched and shows them enabled

#### Scenario: Conversation finished
- **WHEN** a streamed reply completes in a thread
- **THEN** that thread's server-side transcript is marked stale so the next fallback read fetches the latest copy

### Requirement: Optimistic skill toggle with rollback
Toggling a skill's enabled state SHALL update the UI immediately and SHALL revert it if the runtime rejects the change.

#### Scenario: Runtime rejects toggle
- **WHEN** the user disables a skill and the runtime responds with an error
- **THEN** the skill returns to enabled and the error is available to the page

### Requirement: Failures are visible, not silent
Load and mutation failures SHALL be exposed to the page as an error state with the runtime's message, and a failed load SHALL NOT leave the page in a permanent loading state.

#### Scenario: Agents fail to load
- **WHEN** `GET /api/agents` returns HTTP 500
- **THEN** the agents query reports an error and is no longer loading

### Requirement: Runtime health polling
The app SHALL check runtime health every 30 seconds while a health indicator is mounted. A 2xx response SHALL count as healthy unless its JSON body reports `"status": "error"`; an empty or non-JSON 2xx body counts as healthy. A non-2xx response or network failure SHALL be reported as unreachable immediately, without retrying.

#### Scenario: Empty 200 health response
- **WHEN** `/healthz` returns 200 with an empty body
- **THEN** the health indicator reports the runtime as reachable

#### Scenario: Runtime reports itself unhealthy
- **WHEN** `/healthz` returns 200 with body `{"status":"error"}`
- **THEN** the health indicator reports the runtime as unhealthy

#### Scenario: Runtime unreachable
- **WHEN** `/healthz` returns 503
- **THEN** the health indicator reports the runtime as unreachable after a single request
