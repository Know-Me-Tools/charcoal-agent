## ADDED Requirements

### Requirement: Apex on the cluster
`know-me.tools` SHALL be served by the `knowme-web` service through the shared gateway.

#### Scenario: Apex on the cluster
- **GIVEN** the cutover is done
- **WHEN** a public client requests `https://know-me.tools`
- **THEN** it receives the new site over the Let's Encrypt certificate
