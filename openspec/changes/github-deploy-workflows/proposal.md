## Why

The site must update automatically on changes to `main` here.

## What Changes

- GitHub Actions: rebuild and redeploy the site on every push to main.
- Lands in: this repo. Owner: km-devops-engineer, km-security-officer (review).
- Depends on: `k8s-stack-manifests`, `ci-secrets-out` (before the first deploy). The first deploy also needs `site-spend-ceiling`'s meter and kill switch built (tasks 1.1–1.9), with the kill switch on. Revision 3.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `site-deploy`.
