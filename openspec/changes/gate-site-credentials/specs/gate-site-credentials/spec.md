## ADDED Requirements

### Requirement: UAR accepts only gate-minted tokens
UAR SHALL verify tokens only through gate's JWKS, with issuer `https://gate.know-me.tools` and audience `uar`, and SHALL reject every other credential with 401.

#### Scenario: Request without a gate token
- **GIVEN** UAR configured with `UAR_SECURITY__JWKS_URL`, `UAR_SECURITY__JWT_ISSUER` and `UAR_SECURITY__JWT_AUDIENCE`
- **WHEN** a request arrives with no JWT, with an HS256 token signed with UAR's own secret, or with a JWT whose issuer or audience differs
- **THEN** UAR returns 401

### Requirement: Site chat survives a UAR restart
The site server SHALL obtain a short-lived gate-minted token for the site identity, so its chat turns authenticate as that identity regardless of UAR restarts.

#### Scenario: Chat turn after restart
- **GIVEN** the site server holding its gate credential in Secret `site-proxy`
- **WHEN** UAR restarts and the next chat turn arrives
- **THEN** the turn authenticates as the site identity, the run sees KB `knowme-site`, and it never runs as `anonymous`

### Requirement: No UAR API key is held or minted
Neither the site server's configuration nor the seed script SHALL hold or mint a UAR API key; the seed job SHALL authenticate with its seed identity's gate token.

#### Scenario: Inspecting the site server and seed script
- **GIVEN** `server/` and `scripts/seed-site-agent.sh`
- **WHEN** they are searched for `/api/uar/auth/keys` and the key-minting flags
- **THEN** nothing is found, and a seed run succeeds with a gate token

### Requirement: Gate keys are scoped to their route
A gate credential valid for one gate route SHALL NOT be accepted on another.

#### Scenario: Cross-route key reuse
- **GIVEN** a gate key issued for one route
- **WHEN** it is presented on a different gate route
- **THEN** gate refuses it
