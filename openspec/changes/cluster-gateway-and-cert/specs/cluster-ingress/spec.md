## ADDED Requirements

### Requirement: Site hosts on the shared gateway
The shared gateway SHALL terminate TLS for `know-me.tools`, `www.know-me.tools` and `runtime.know-me.tools` with a certificate issued by `letsencrypt-prod`.

#### Scenario: Site hosts on the shared gateway
- **GIVEN** the cluster PR is merged and Argo has synced
- **WHEN** the gateway status is read
- **THEN** six listeners are Programmed and the certificate is Ready
