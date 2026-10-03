## ADDED Requirements

### Requirement: Gate answers external-authorization checks
flint-gate SHALL expose an HTTP `POST` check endpoint that authenticates a forwarded request with its `kratos`, `jwt`, `api_key` and `anonymous` providers and answers allow or deny.

#### Scenario: Valid credential on a protected route
- **GIVEN** the deployed check endpoint and a route that requires a credential
- **WHEN** Envoy sends a check request carrying a valid credential
- **THEN** gate answers allow with an `Authorization: Bearer` header holding an ES256 JWT that verifies against gate's JWKS

#### Scenario: Missing credential on a protected route
- **GIVEN** a route that requires a credential
- **WHEN** Envoy sends a check request with no valid credential
- **THEN** gate answers deny

### Requirement: Client auth headers never reach the upstream
On allow, flint-gate SHALL replace client-supplied auth headers with its own gate-minted bearer.

#### Scenario: Client sends its own Authorization header
- **GIVEN** a check request whose client headers include `Authorization` and `X-API-Key`
- **WHEN** gate answers allow
- **THEN** the headers forwarded upstream carry only the gate-minted bearer and no client-supplied auth header
