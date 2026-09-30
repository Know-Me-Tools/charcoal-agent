## 1. GitHub Actions: rebuild and redeploy the site on every push to main

- [x] 1.1 `.github/workflows/site.yml` on push to `main` and `workflow_dispatch`: run tests, lint and build; build and push `ghcr.io/know-me-tools/knowme-web` (SHA tag, digest).
- [x] 1.2 Deploy job: kubeconfig from `KNOWME_KUBECONFIG`; idempotent Secrets (`uar-secrets`, `surrealdb-auth`, `site-proxy`) from GitHub secrets via `kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -`; `kustomize edit set image` for the web digest; `kubectl apply -k k8s`; `rollout status` for each workload; run the seed Job when `content/knowledge/**` or `uar/agents/**` changed.
- [x] 1.3 Smoke: `https://know-me.tools/` 200 (with `--resolve know-me.tools:443:23.239.29.33` before cutover); a site chat turn through the proxy returns a Qwen answer; `runtime.know-me.tools/readyz` 200; `/api/agents` without a token 401.
- [ ] 1.4 Gate: a green `main` run end to end, then a trivial second commit redeploys automatically.
