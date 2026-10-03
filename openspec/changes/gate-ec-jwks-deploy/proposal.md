## Why

The deployed gate JWKS published its ES256 key without `crv`, `x` and `y`, so no standard verifier, UAR included, could use it. Forge and FRF parse it with the `jsonwebtoken` JwkSet too, so they needed the fix as well.

## What Changes

- Deploy Know-Me-Tools/flint-gate#10, which keeps the `pem` member and adds `crv`, `x` and `y` to the EC key.
- State (plan A2 N4): done 2026-10-01. flint-infra `images.yaml` built #10 on gate main, Prometheus-AGS/know-me-cluster#2 bumped the digest, and `https://gate.know-me.tools/.well-known/jwks.json` serves `kty`, `crv`, `x` and `y`. One verification task remains so the done-when check runs during reconciliation.
- Lands in: Know-Me-Tools/flint-gate, flint-infra, Prometheus-AGS/know-me-cluster. Owner: platform (gate); km-devops-engineer verifies.
- Depends on: none. Blocks `gate-ext-authz-endpoint`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `gate-ec-jwks-deploy`.
- Requirements: FR-46; part of §6.4 item 17.
