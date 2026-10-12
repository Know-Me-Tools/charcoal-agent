# site-a2ui-optin Specification

## Purpose
Who decides that the public site asks UAR for A2UI (the server, always), and that UAR's A2UI message and action routes stay closed to visitors. Created by archiving change site-proxy-a2ui-optin, then corrected to the shipped behaviour: the out-of-band switch the change specified was removed.

## Requirements

### Requirement: Only the server decides A2UI opt-in
The site proxy SHALL set `presentation_mode` and `client_rendering` from its own configuration and SHALL ignore any such fields in the visitor's request.

#### Scenario: Visitor tries to opt in
- **GIVEN** a request body contains `presentation_mode: "a2ui"`
- **WHEN** the proxy builds the upstream body
- **THEN** the field comes from server configuration, not the visitor

### Requirement: A2UI is always requested
The site proxy SHALL send `presentation_mode: "a2ui"` with `client_rendering.a2ui_profiles = ["uar.a2ui/1"]` on every chat request. There is no out-of-band switch (PR #30, decision D-38, which supersedes the opt-in switch this change originally specified).

#### Scenario: Visitor sends other presentation fields
- **GIVEN** a request body carries `presentation_mode: "legacy"` and `client_rendering.a2ui_profiles = ["evil/9"]`
- **WHEN** the proxy builds the upstream body
- **THEN** the upstream body carries the fixed `a2ui` mode and profile, and nothing from the visitor's fields

### Requirement: A2UI action and message routes stay closed
No route on the public listener SHALL reach UAR's A2UI message or action endpoints.

#### Scenario: Direct call
- **GIVEN** a visitor posts to `/api/uar/runs/x/a2ui/actions`
- **WHEN** the public listener receives it
- **THEN** the generic 404 body is returned and nothing reaches UAR
