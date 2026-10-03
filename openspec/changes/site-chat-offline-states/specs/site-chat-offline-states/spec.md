## ADDED Requirements

### Requirement: Agent offline state
When UAR is unreachable, the spend ceiling is exhausted, the spend meter's store is unreachable, or the kill switch is on, the client SHALL show a static notice that the agent is offline and point to the landing page content, and starter chips SHALL still navigate. No raw error text SHALL appear as assistant text.

#### Scenario: Spend ceiling exhausted
- **GIVEN** the site-server meter refuses the turn because the daily budget is spent
- **WHEN** the visitor sends a message
- **THEN** the offline notice is shown and no status line or upstream text appears in the thread

#### Scenario: Meter store unavailable
- **GIVEN** SurrealDB is stopped, so the meter fails closed
- **WHEN** the visitor sends a message
- **THEN** the offline notice is shown

#### Scenario: Kill switch on
- **GIVEN** the operator turns the kill switch on in its mounted file
- **WHEN** the visitor sends a message within 60 seconds of the change
- **THEN** the offline notice is shown

#### Scenario: UAR down
- **GIVEN** the proxy returns `upstream_unavailable` or `upstream_timeout`
- **WHEN** the response reaches the client
- **THEN** the offline notice is shown

### Requirement: Rate-limit message
On a 429 the client SHALL show a plain message with the wait time when the proxy supplies `Retry-After`, and the thread SHALL stay usable.

#### Scenario: 429 with wait time
- **GIVEN** the proxy returns 429 with `Retry-After: 30`
- **WHEN** the client handles the response
- **THEN** it shows a message naming a 30-second wait, and the visitor can send again afterwards in the same thread

### Requirement: Blocked by policy
When `agui.tool_call.denied` arrives in the stream, the client SHALL render the tool call as "Blocked by policy".

#### Scenario: Denied tool call
- **GIVEN** the `activate_skill` forced-call fixture produces `agui.tool_call.denied`
- **WHEN** the event renders
- **THEN** the block shows "Blocked by policy" and never shows as running or disappears
