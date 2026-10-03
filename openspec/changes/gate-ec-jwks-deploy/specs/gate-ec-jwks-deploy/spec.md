## ADDED Requirements

### Requirement: Gate JWKS publishes a usable EC key
The deployed flint-gate JWKS SHALL publish its ES256 signing key with `kty`, `crv`, `x` and `y`, and SHALL keep the `pem` member for existing consumers.

#### Scenario: Standard verifier reads the JWKS
- **GIVEN** the deployed gate at `https://gate.know-me.tools`
- **WHEN** a client fetches `/.well-known/jwks.json`
- **THEN** at least one key has `kty` `EC` with `crv`, `x` and `y` present

#### Scenario: Gate token verifies against the JWKS
- **GIVEN** an ES256 token minted by the deployed gate
- **WHEN** a standard JWKS verifier checks it against the published key set
- **THEN** the signature verifies
