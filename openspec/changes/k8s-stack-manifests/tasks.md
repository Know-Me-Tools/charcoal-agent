## 1. Kubernetes manifests for the four-service stack

- [x] 1.1 Kustomize base in `k8s/`: `surrealdb` StatefulSet (pinned digest, 20Gi PVC `linode-block-storage-retain`, Secret `surrealdb-auth`, ClusterIP, NetworkPolicy allowing only uar and the memory server); `uar` Deployment (digest, remote SurrealDB, no PVC, `/readyz` and `/healthz` probes on 6565, `JWT_REQUIRED=true`, ConfigMap `uar-config` + Secret `uar-secrets`); `surreal-memory-server` Deployment (ClusterIP); `knowme-web` Deployment (`X-API-Key` from Secret `site-proxy`).
- [x] 1.2 HTTPRoutes on `argocd/argocd-gateway`: `know-me.tools` to web; `www` 301 to the apex; `runtime.know-me.tools` to uar with a 300s timeout; HTTP-to-HTTPS redirects for all three.
- [x] 1.3 Job `seed-site-agent` running the change-7 script; `k8s/bootstrap/` with a namespace-scoped ServiceAccount, Role, RoleBinding and a script the operator runs once to mint the deployer kubeconfig; `renovate.json` for the UAR and memory-server digests. No Secret manifests in git.
- [ ] 1.4 Gate: `kubectl kustomize k8s` renders; `kubectl --context know-me apply -k k8s --dry-run=server` succeeds; a grep finds no secret values.
