## 1. UAR: publish a multi-arch image to GHCR

- [x] 1.1 Add native amd64 (ubuntu-24.04) and arm64 (ubuntu-24.04-arm) build jobs to `.github/workflows/deploy.yml` in the UAR repo, each pushing by digest to `ghcr.io/prometheus-ags/universal-agent-runtime`, with a free-disk step, per-arch GHA cache scope, `packages: write`, and the existing `SUBMODULES_TOKEN`/`github_token` build secret. Leave the ACR and AKS jobs unchanged.
- [x] 1.2 Add a merge job that creates one manifest list tagged with the commit SHA and `main`, plus `vX.Y.Z` on version tags.
- [x] 1.3 Open the PR against `Prometheus-AGS/universal-agent-runtime` and record its link here. #315 (merged); the build fix it exposed is #318 (merged). If the arm64 build fails, stop and ask; do not fall back to QEMU.
- [x] 1.4 After merge and the operator making the package public: verify with `docker buildx imagetools inspect ghcr.io/prometheus-ags/universal-agent-runtime:main` (both platforms) and an anonymous `docker pull`.
