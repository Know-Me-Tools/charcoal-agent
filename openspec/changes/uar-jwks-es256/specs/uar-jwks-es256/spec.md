## ADDED Requirements

### Requirement: UAR verifies EC-signed JWKS tokens
UAR's JWKS verifier SHALL accept tokens signed with ES256 or ES384 as well as RS256, and SHALL bind each JWKS key to exactly one algorithm.

#### Scenario: Gate-minted ES256 token
- **GIVEN** UAR configured with gate's JWKS URL
- **WHEN** a request carries a valid ES256 token minted by gate
- **THEN** UAR verifies it against the matching EC key and authenticates the request

#### Scenario: Algorithm confusion
- **GIVEN** a JWKS key published for ES256
- **WHEN** a token names a different algorithm for that key
- **THEN** UAR rejects the token with 401

### Requirement: Deployed image carries the verifier
The UAR image deployed by this repo SHALL be pinned by digest to a build that contains Prometheus-AGS/universal-agent-runtime#321.

#### Scenario: Pinned digest
- **GIVEN** the UAR image reference in the manifests after `ci-supply-chain-pins`
- **WHEN** its digest is traced to its build run and source commit
- **THEN** the source commit contains #321
