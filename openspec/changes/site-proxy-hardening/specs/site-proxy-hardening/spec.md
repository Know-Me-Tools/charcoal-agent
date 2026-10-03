## ADDED Requirements

### Requirement: Only used, live routes are proxied
The site server SHALL NOT route `GET /api/sessions/{id}/messages`, `DELETE /api/sessions/{id}` or `POST /api/uar/runs/{run_id}/artifact-response`, and the site client SHALL NOT call them.

#### Scenario: Removed route requested
- **GIVEN** a request to one of the removed routes
- **WHEN** it reaches the site server
- **THEN** the response is a generic 404 and no upstream call is made

### Requirement: Generic upstream errors
The site server SHALL relay every upstream non-2xx as a generic `AppError` body, SHALL map UAR's 400 `guardrail_blocked` to a generic visitor message, and SHALL log upstream 5xx with status and route but without session id or body.

#### Scenario: Upstream 5xx
- **GIVEN** UAR returns a 500 with an error body
- **WHEN** the site server relays it
- **THEN** the visitor gets a generic error body and the log line carries the status and route, not the session id or body

#### Scenario: Guardrail block
- **GIVEN** UAR returns 400 `guardrail_blocked`
- **WHEN** the site server relays it
- **THEN** the visitor gets the generic guardrail message and no UAR text

### Requirement: Pinned upstream stream shape
The site server SHALL forward every chat completion with `stream: true` and `stream_mode: "dual"` and SHALL ignore the visitor's `stream` and `stream_mode` fields.

#### Scenario: Non-streaming request
- **GIVEN** a chat request with `stream: false` or `stream_mode: agui_spec`
- **WHEN** it passes through the site server
- **THEN** UAR receives `stream: true` and `stream_mode: "dual"`, and the run's usage arrives in `agui.done`

### Requirement: Query string allowlist
The site server SHALL forward no query parameter that is not on the route's allowlist.

#### Scenario: Unknown parameter
- **GIVEN** a proxied request carrying a query parameter not on its route's allowlist
- **WHEN** it is forwarded
- **THEN** the upstream request does not carry that parameter
