## Why

FR-47 routes the know-me hosts through flint-gate with per-route SecurityPolicies. The public site must keep serving when gate is down, any protected route must refuse when gate is down, and an operator must be able to remove a policy in an emergency even though Argo CD's selfHeal re-creates anything deleted with `kubectl`. This closes §6.4 item 18.

## What Changes

- Per-route SecurityPolicies in know-me-cluster (`gateway.envoyproxy.io/v1alpha1`, `spec.extAuth.http` to gate's check endpoint, timeout about 200 ms), rolled out in stages.
- Phase 0: `knowme-site` and `knowme-www` anonymous-allow with `failOpen: true`; `knowme-runtime` fail-closed only if D-7 keeps the host.
- `docs/break-glass-securitypolicy.md` in know-me-cluster.
- Not in this change's gate: the later staged rollout for `forge-quarry` and `frf` (Kratos session, fail closed) and `sso-broker` per D-19.
- Lands in: Prometheus-AGS/know-me-cluster. Owner: km-devops-engineer; platform; km-security-officer reviews.
- Depends on: `gate-ext-authz-endpoint`, `gate-site-credentials`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `cluster-extauthz-policies`.
- Requirements: FR-47; closes §6.4 item 18 with `gate-ext-authz-endpoint`.
