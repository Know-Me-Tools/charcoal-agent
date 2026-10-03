## Why

The deploy workflow holds UAR's JWT signing secret, its settings admin key and the SurrealDB root password, and writes them into the cluster on every run. Anyone who can change or re-run the workflow can mint UAR tokens or read every store. Once `jwks_url` is set, UAR also rejects the HS256 tokens the seed step mints for itself. This closes §6.4 item 2 and lands before the first deploy.

## What Changes

- `UAR_JWT_SECRET`, `UAR_SETTINGS_ADMIN_KEY` and `SURREALDB_ROOT_PASSWORD` leave CI (`.github/workflows/site.yml` lines 104-128 and 167). The UAR Secret is created once, out of band, by the operator.
- The seed step authenticates with a gate-minted token for its seed identity instead of a self-minted HS256 JWT.
- The deploy job runs behind a GitHub environment with required reviewers; the deployer Role's Secret verbs are restricted by `resourceNames`.
- Lands in: this repo (`.github/workflows/site.yml`, `k8s/bootstrap/role.yaml`). Owner: km-devops-engineer; operator (Secret creation); km-security-officer reviews.
- Depends on: `gate-site-credentials` (seed identity). Blocks the first deploy.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `ci-secrets-out`.
- Requirements: NFR security (§8.9); closes §6.4 item 2.
