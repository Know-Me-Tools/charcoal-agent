# Execution: uar-integration

**Backend.** `openspec`. The 12 changes live in `openspec/changes/<id>/`, and tasks are walked with `kbd-apply` (`begin-task`/`end-task`). Changes that land in other repos (1–4) are tracked here; their PR links are recorded in each change's `tasks.md`.

**Waves** (dependencies from `plan.md`):

| Wave | Changes | Executor | Where the work happens |
|---|---|---|---|
| 1 | 1 `uar-ghcr-multiarch-publish`, 2 `uar-kb-retrieval-embedding` | km-devops-engineer; km-rust-engineer | UAR worktrees from `org/main` in the scratchpad (branches `ci/ghcr-multiarch-publish`, `fix/kb-retrieval-embedding`) |
| 1 | 3 `memory-server-ghcr-publish` | km-devops-engineer | SMS worktree from `origin/main` (branch `ci/ghcr-image`); the local checkout's own edits are untouched |
| 1 | 4 `cluster-gateway-and-cert` | km-devops-engineer | clone of `know-me-cluster` in the scratchpad (branch `feat/knowme-site-hosts`) |
| 1 | 5 `site-knowledge-corpus` | km-cmo, then km-content-creator, then km-chief-content-officer | this repo |
| 2 | 6 `local-compose-stack`, then 7 `site-agent-seed`, then 8 `site-chat-proxy`, 9 `about-endpoint-truth` | km-devops-engineer, km-conversational-designer, km-frontend-engineer, km-security-officer | this repo; needs published images (1, 3), the merged fix (2) and the approved corpus (5) |
| 3 | 10 `k8s-stack-manifests`, 11 `github-deploy-workflows` | km-devops-engineer | this repo |
| 4 | 12 `apex-dns-cutover` | operator | Cloudflare |

**Rules:**
- No tests or reviews per task or per change. Each executor does only a narrow compile or lint check when blocked.
- The final integration gate runs once, on the local stack and then the cluster deploy.
- One final cumulative review. Per operator preference, the adversarial review is skipped and recorded as `pending_review`.
- No secret values in any tracked file, commit, PR or log.

**Operator gates** (waves 2–4 wait on them):
- package visibility
- PR merges (1–4)
- corpus approval (5)
- cluster bootstrap and GitHub secrets
- Token Plan terms
- DNS cutover
