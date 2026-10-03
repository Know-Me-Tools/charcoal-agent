## Why

FR-47 puts every guarded know-me route behind an Envoy `extAuth.http` check to flint-gate, but gate has no external-authorization endpoint. Without it no SecurityPolicy can reference gate, and UAR cannot receive gate-minted tokens on routed traffic.

## What Changes

- An HTTP `POST` check endpoint in flint-gate (about 200 lines) that reuses gate's `kratos`, `jwt`, `api_key` and `anonymous` providers and its JWT minting.
- Allow or deny. On allow, gate injects `Authorization: Bearer <gate-minted ES256 JWT>` for the upstream and strips client-supplied auth headers.
- Integration tests with Envoy-shaped check requests. Deployed before any SecurityPolicy references it.
- Lands in: Know-Me-Tools/flint-gate; deployed through the `gate-ci-gitops` path (flint-infra `images.yaml`, know-me-cluster digest PR). Owner: platform; km-security-officer reviews.
- Depends on: `gate-ec-jwks-deploy`. Blocks `gate-site-credentials` and `cluster-extauthz-policies`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `gate-ext-authz-endpoint`.
- Requirements: FR-47; part of §6.4 item 18.
