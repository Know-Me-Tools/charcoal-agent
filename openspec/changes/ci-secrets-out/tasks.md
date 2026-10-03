## 1. Signing secret, admin key and database password out of CI

- [ ] 1.1 Remove `UAR_JWT_SECRET`, `UAR_SETTINGS_ADMIN_KEY` and `SURREALDB_ROOT_PASSWORD` from `.github/workflows/site.yml`: the "Mask secrets in logs" and "Apply Secrets (idempotent)" steps (lines 104-128) stop writing `uar-secrets` and `surrealdb-auth`, and the seed step (line 167) no longer receives `UAR_JWT_SECRET`.
- [ ] 1.2 Operator creates `uar-secrets` and `surrealdb-auth` in namespace `knowme` once, out of band, with operator credentials; the change records the key names (never the values) and the date.
- [ ] 1.3 Replace the seed step's HS256 JWT minting with a gate-minted token for the seed identity from `gate-site-credentials`, so the seed still authenticates after `jwks_url` is set.
- [ ] 1.4 Put the deploy job behind a GitHub environment with required reviewers.
- [ ] 1.5 Restrict the Secret rule in `k8s/bootstrap/role.yaml` (today `create`, `patch`, `get` on all Secrets) with `resourceNames` to the Secrets the deploy still touches; drop verbs it no longer needs.
- [ ] 1.6 Integration check: `grep -rnE 'UAR_JWT_SECRET|UAR_SETTINGS_ADMIN_KEY|SURREALDB_ROOT_PASSWORD' .github/workflows/` returns nothing; a deploy run from `main` waits for reviewer approval, then completes with the seed step authenticated by a gate token; `kubectl auth can-i get secret/uar-secrets -n knowme` as the deployer returns `no`. Evidence filed for §6.4 item 2.
