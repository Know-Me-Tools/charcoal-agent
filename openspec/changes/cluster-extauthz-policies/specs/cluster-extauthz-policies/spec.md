## ADDED Requirements

### Requirement: Site routes check gate and fail open
The `knowme-site` and `knowme-www` routes SHALL each have a SecurityPolicy that sends an `extAuth.http` check to flint-gate with a timeout of about 200 ms, anonymous-allow and `failOpen: true`.

#### Scenario: Gate down
- **GIVEN** the knowme route policies applied and gate's check endpoint unavailable
- **WHEN** a visitor requests `know-me.tools` or `www.know-me.tools`
- **THEN** the site still serves

### Requirement: Protected routes fail closed
Any knowme route protected by gate SHALL have a policy with `failOpen: false`.

#### Scenario: Protected route without gate
- **GIVEN** a protected route (`runtime.know-me.tools` only if D-7 keeps it)
- **WHEN** gate is down or the request carries no valid credential
- **THEN** Envoy refuses the request

### Requirement: Break-glass removal survives Argo CD
know-me-cluster SHALL document a break-glass procedure in `docs/break-glass-securitypolicy.md` that removes a SecurityPolicy so that it stays removed.

#### Scenario: Emergency policy removal
- **GIVEN** a SecurityPolicy that must come off
- **WHEN** the operator suspends auto-sync for the Argo CD app (or reverts the policy commit and syncs) and then deletes the policy
- **THEN** the policy stays deleted and the route serves

### Requirement: Argo CD stays reachable
Argo CD SHALL NOT be routed through the gateway or a gate policy.

#### Scenario: Gate down, operator needs Argo CD
- **GIVEN** gate is down
- **WHEN** the operator port-forwards to Argo CD
- **THEN** Argo CD answers
