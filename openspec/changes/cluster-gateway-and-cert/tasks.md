## 1. Cluster: certificate and gateway listeners for the site hosts

- [x] 1.1 In `namespaces/argocd-config/manifests.yaml`, add Certificate `know-me-tools-site-tls` (namespace `argocd`) for `know-me.tools`, `www.know-me.tools`, `runtime.know-me.tools` from ClusterIssuer `letsencrypt-prod` (Cloudflare DNS-01).
- [x] 1.2 Add HTTPS (443, TLS secret `know-me-tools-site-tls`) and HTTP (80) listeners on `argocd-gateway` for each of the three hosts, `allowedRoutes.namespaces.from: All`, mirroring the `flint-rt-*` pair.
- [x] 1.3 Open the PR against `Prometheus-AGS/know-me-cluster`; the operator merges. Record the link. https://github.com/Prometheus-AGS/know-me-cluster/pull/1, merged as 4c934251.
- [x] 1.4 Verify: Argo `argocd-config` Synced/Healthy, the Certificate Ready, and all six listeners Programmed=True (`kubectl --context know-me -n argocd get gateway argocd-gateway -o json`).
