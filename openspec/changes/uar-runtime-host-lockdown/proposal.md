## Why

The manifests route `runtime.know-me.tools` straight to UAR. Once that route attaches, the internet reaches every UAR endpoint, including `/metrics` and `/admin`. Removing the manifest is not enough: the deploy cannot prune or delete, so a route that was ever applied stays live until someone deletes it. This lands before the first deploy.

## What Changes

- Delete the `knowme-runtime` and `knowme-runtime-http-redirect` HTTPRoutes from `k8s/base/httproutes.yaml`, and delete any applied copy explicitly with operator credentials (D-7 default: delete the host).
- Rewrite the CI steps that call `runtime.know-me.tools` to run inside the cluster or through the proxy.
- A NetworkPolicy so only `knowme-web` and flint-gate reach `uar:6565`. **OPEN QUESTION settled here:** whether the seed job also needs direct access.
- Lands in: this repo (`k8s/base/`, `.github/workflows/site.yml`); the live cluster (route deletion). Owner: km-devops-engineer; operator (route deletion); km-security-officer reviews.
- Depends on: none. Blocks the first deploy and `k8s-stack-manifests`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `uar-runtime-host-lockdown`.
- Requirements: FR-37; closes §6.4 item 1.
