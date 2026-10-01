## 1. Memory server: publish a multi-arch image to GHCR

- [x] 1.1 Add `.github/workflows/image.yml` (push to `main`, version tags, `workflow_dispatch`) with native amd64/arm64 builds and a merge job publishing `ghcr.io/prometheus-ags/surreal-memory-server` tagged SHA, `main`, and `vX.Y.Z`.
- [x] 1.2 Confirm the `mempalace-core` git dependency (`GQAdonis/mempalace-rs`) is fetchable in CI; if private, add a token secret and say so.
- [x] 1.3 Commit only the new workflow; leave that repo's pre-existing local edits (`.kbd-orchestrator/`, `.claude/`, `.prometheus/`) untouched. Open the PR and record the link.
- [ ] 1.4 After merge and the operator making the package public: verify the manifest lists both platforms and the container answers `GET :3001/health`.
