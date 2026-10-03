## Why

The existing `wildcard-know-me-tools-tls` covers only auth/sso/gate/api/rt. The site needs `know-me.tools`, `www` and `runtime` on the shared gateway, and the gateway is Argo-managed.

## What Changes

- Cluster: certificate and gateway listeners for the site hosts.
- Lands in: Prometheus-AGS/know-me-cluster. Owner: km-devops-engineer.
- Depends on: none.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `cluster-ingress`.
