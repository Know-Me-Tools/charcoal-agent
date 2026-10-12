## ADDED Requirements

### Requirement: Only the server decides A2UI opt-in
The site proxy SHALL set `presentation_mode` and `client_rendering` from its own configuration and SHALL ignore any such fields in the visitor's request.

#### Scenario: Visitor tries to opt in
- **GIVEN** a request body contains `presentation_mode: "a2ui"`
- **WHEN** the proxy builds the upstream body
- **THEN** the field comes from server configuration, not the visitor

### Requirement: A2UI is off unless the operator turns it on
The site proxy SHALL send `presentation_mode: "text"` explicitly while the out-of-band switch is OFF, absent, unreadable or unrecognised (never omit the field, because UAR treats absent fields as Legacy, which allows surfaces), and SHALL send `presentation_mode: "a2ui"` with `client_rendering.a2ui_profiles = ["uar.a2ui/1"]` only while it reads ON.

#### Scenario: Switch absent
- **GIVEN** the `site-a2ui-optin` ConfigMap does not exist
- **WHEN** the proxy builds the upstream body
- **THEN** `presentation_mode` is `"text"` and UAR publishes no surface, even if the agent policy allows a render tool

#### Scenario: Operator flips it
- **GIVEN** the switch changes from OFF to ON
- **WHEN** the next chat turn is built
- **THEN** the A2UI fields are sent, without a restart or redeploy

### Requirement: A2UI action and message routes stay closed
No route on the public listener SHALL reach UAR's A2UI message or action endpoints.

#### Scenario: Direct call
- **GIVEN** a visitor posts to `/api/uar/runs/x/a2ui/actions`
- **WHEN** the public listener receives it
- **THEN** the generic 404 body is returned and nothing reaches UAR
