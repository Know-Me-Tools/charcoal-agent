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

---

## Revision 3 dispatch (2026-10-03)

Plan: `plan.md` revision 3 (36 changes). Base commit `e7e9b9a`.

**Backend:** `openspec`, executed in **lanes**. Each lane is one executor in its own git worktree and branch from `e7e9b9a`, so lanes never edit the same files. This session alone writes KBD state (the runtime is single-writer): executors report task ids and this session transitions them. Lanes are merged into `chore/start-uar-integration` once all lanes finish.

| Lane | Executor | Changes (code/config tasks only) | Files |
|---|---|---|---|
| R1 | km-rust-engineer | `site-chat-proxy` 1.5; `site-proxy-hardening` (server tasks); `site-proxy-artifact-filter`; `site-session-binding` | `server/` |
| R2 (after R1, same branch) | km-rust-engineer | `site-security-headers` (server tasks); `site-spend-ceiling` (server tasks, kill switch, FR-38 records) | `server/` |
| F | km-frontend-engineer | `site-proxy-hardening` 1.2 (client callers); `site-citation-link-allowlist`; `site-ai-disclosure-label` and `site-chat-offline-states` (code plus **draft** copy, which stops at the copy-approval gate) | `src/`, `content/site/` drafts, `docs/content/reviews/` |
| D | km-devops-engineer | `uar-runtime-host-lockdown` (manifest and CI tasks); `k8s-stack-manifests` 1.5–1.6; `github-deploy-workflows` 1.5–1.7; `ci-supply-chain-pins`; `ci-secrets-out` (CI tasks); `kb-chunking-quality` (seed script); `site-agent-seed` 1.4 | `k8s/`, `.github/`, `scripts/`, `versions.toml` (read only; pins recorded by the operator) |
| C | km-conversational-designer | `site-agent-prompt-fixes` 1.1–1.5; `site-agent-tool-allowlist` 1.1; `site-spend-ceiling` 1.8 (`max_tokens_per_turn` in the agent JSON) | `uar/agents/knowme-site.json` |
| G | general-purpose (Rust) | `gate-ext-authz-endpoint` 1.1–1.4, as a PR to Know-Me-Tools/flint-gate | flint-gate clone in the scratchpad |
| — | this session | `gate-ci-gitops` 1.5 (U19 annotation PR to know-me-cluster) | know-me-cluster clone |

**Waits on the operator or on a deploy:**
- **Operator actions:** Secret and ConfigMap creation (meter user, kill switch, `site-proxy`); route deletion on the cluster; D-6, D-8, D-16; copy approvals.
- **Waits on the gate deploy:** `gate-site-credentials`, `cluster-extauthz-policies` (after `gate-ext-authz-endpoint` is deployed); `ci-secrets-out` 1.3.
- **Deploy and deployed checks:** the first deploy and every deployed done-when; `site-retention-and-privacy`, `site-session-erasure`, `site-agent-eval-text`, `site-redteam-prompts` (mostly deployed-stack work).

**Verification rules (unchanged):**
- Executors run no test suites, only a narrow compile or lint check when blocked.
- Every change's done-when and integration tasks, visual captures included, run **once** at the phase gate, locally on the compose stack and then on the cluster.
- One cumulative review at the end.
