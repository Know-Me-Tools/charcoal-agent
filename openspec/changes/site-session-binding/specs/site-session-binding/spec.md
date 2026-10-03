## ADDED Requirements

### Requirement: HMAC-bound upstream session
The site server SHALL derive the upstream session id as `HMAC-SHA256(secret, cookie_id ‖ thread_id)` formatted as a UUID, from a signed, HttpOnly, Secure, SameSite=Lax first-party visitor cookie, and SHALL NOT forward the client's `X-UAR-Session-ID`. This SHALL apply to chat completion and stream resume.

#### Scenario: Cross-visitor isolation
- **GIVEN** visitor A's cookie and visitor B's thread id, with two site server replicas
- **WHEN** A sends a chat completion or a resume
- **THEN** UAR sees an upstream session id that is not B's, and no message or run of B is read, changed or resumed

#### Scenario: Same visitor across replicas
- **GIVEN** one visitor's cookie and thread id
- **WHEN** consecutive requests land on different replicas
- **THEN** both replicas derive the same upstream session id

### Requirement: Thread id validation
The site server SHALL reject a thread id that is not a UUIDv4 with 400.

#### Scenario: Malformed thread id
- **GIVEN** an `X-UAR-Session-ID` that is not a UUIDv4
- **WHEN** it reaches the site server
- **THEN** the response is 400 and no upstream call is made
