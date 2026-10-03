## Why

UAR keeps API keys only in memory, so a restart invalidates the site's key and the site's requests run as `anonymous` (empty KB) or get 401. FR-46 replaces that key with short-lived gate-minted tokens for a site identity and a seed identity, which UAR verifies through gate's JWKS. This closes §6.4 item 17 and, per plan A2 N6, U5 (key scoping across routes).

## What Changes

- Site and seed identities in gate, and the token path for each. **OPEN QUESTION settled here:** `/oauth/token` client credentials (enabled and guarded) or token exchange from a database-backed gate API key.
- The site credential goes in Secret `site-proxy` in place of the UAR `X-API-Key`. Tokens carry `sub` = the site identity that owns the agent and KB, `aud` = `uar`, and a short TTL.
- UAR configured with `UAR_SECURITY__JWKS_URL`, `UAR_SECURITY__JWT_ISSUER` and `UAR_SECURITY__JWT_AUDIENCE`.
- The site server uses the token path; the seed script's site-key minting and the workflow's `--mint-key-to-k8s-secret` are removed.
- Check whether a key valid for one gate route is accepted on another; close it with a Cedar authorize hook if so.
- Lands in: flint-gate configuration; this repo (`server/`, `k8s/base/`, `scripts/seed-site-agent.sh`, `.github/workflows/site.yml`). Owner: platform (gate); km-devops-engineer; km-rust-engineer (site server); km-security-officer reviews.
- Depends on: `uar-jwks-es256`, `gate-ec-jwks-deploy`, `gate-ext-authz-endpoint`, D-18. Blocks `ci-secrets-out`, `cluster-extauthz-policies`, `site-agent-seed`, `site-spend-ceiling`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `gate-site-credentials`.
- Requirements: FR-46; closes §6.4 item 17 and U5.
