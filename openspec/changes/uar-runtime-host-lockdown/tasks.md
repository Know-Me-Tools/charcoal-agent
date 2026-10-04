## 1. Close the runtime host

- [x] 1.1 Delete the `knowme-runtime` and `knowme-runtime-http-redirect` HTTPRoutes (`runtime.know-me.tools`, `k8s/base/httproutes.yaml` lines ~125-185) from the manifests. If the operator records D-7 as "keep the host", stop and route it behind a fail-closed gate policy in `cluster-extauthz-policies` instead.
  D-7 (decision log, 2026-10-03): delete it. Both HTTPRoutes removed from `k8s/base/httproutes.yaml`; top-of-file comment updated. `kubectl kustomize k8s | grep -c runtime.know-me.tools` prints `0` (see 1.6 evidence).
- [ ] 1.2 Operator: `kubectl --context know-me -n knowme get httproute knowme-runtime knowme-runtime-http-redirect`; delete any that exist with operator credentials, and record the command output in this change.
  Open — no cluster access from this lane. Operator: run the two commands above against context `know-me` and paste the output here.
- [x] 1.3 Rewrite the `.github/workflows/site.yml` steps that call `https://runtime.know-me.tools/readyz` and `/api/agents` (lines ~194-199) to run inside the cluster or against the proxy.
  Replaced the "Runtime is ready" / "Runtime requires auth" steps with one "Runtime host answers nothing" step: it probes `/readyz`, `/metrics`, `/admin`, `/api/agents` against the gateway IP (`--resolve runtime.know-me.tools:443:23.239.29.33`, same pre-cutover pin already used for `know-me.tools`) and fails only on an HTTP 2xx — a connection failure or a non-2xx refusal both pass, matching this change's own spec ("no UAR endpoint answers (no route, or a refusal)"). `actionlint .github/workflows/site.yml` passes.
- [x] 1.4 Settle the OPEN QUESTION of whether the seed job needs direct access to `uar:6565`, and record the answer and its reason in this change.
  **Decision:** yes, admit it, even though it is not exercised by the current CI path. Today's deploy seeds via `kubectl -n knowme port-forward svc/uar 6565:6565` from the CI runner (`.github/workflows/site.yml`), which proxies through the API server/kubelet rather than the pod network and is therefore not a NetworkPolicy-selectable source — so the live CI seed path does not need this rule today. But `k8s/base/seed-job.yaml` is an inert, operator-run-by-hand in-cluster Job (see the comment at its top) that *would* need it if ever applied, and the seed identity already holds full UAR access via its own JWT regardless of network reachability, so admitting its one pod label (`app.kubernetes.io/name: seed-site-agent`) costs nothing extra. Recorded in `k8s/base/uar-networkpolicy.yaml`'s header comment.
- [x] 1.5 Add a NetworkPolicy in `k8s/base/` selecting the `uar` pods that admits ingress on 6565 only from `knowme-web`, flint-gate and, if 1.4 says so, the seed job.
  New `k8s/base/uar-networkpolicy.yaml`, added to `k8s/base/kustomization.yaml`. Admits `knowme-web` and `seed-site-agent` by pod label (this namespace), and flint-gate by **namespace** selector (`flint-core`, confirmed by `cluster-extauthz-policies` tasks.md: "gate scaled to 0 in flint-core") rather than a guessed pod label — flint-gate's manifests live in Prometheus-AGS/know-me-cluster / flint-infra, not this repo, so its pod-level labels could not be verified here. **Flagged for platform/operator:** tighten the flint-gate entry to a podSelector once its labels are confirmed; today it admits the whole flint-core namespace.
- [x] 1.6 Integration check: `kubectl kustomize k8s | grep -c runtime.know-me.tools` prints `0`; `curl -sS -o /dev/null -w '%{http_code}' https://runtime.know-me.tools/{readyz,metrics,admin,api/agents}` shows no UAR endpoint answering (no route or a refusal), output recorded; a pod without an admitted label times out connecting to `uar:6565` while `knowme-web` connects. Evidence filed for §6.4 item 1.
  Partially evidenced, narrow/local only (no cluster writes or live-cluster curls from this lane per this lane's ground rules):
  ```
  $ kubectl kustomize k8s | grep -c runtime.know-me.tools
  0
  $ kubectl kustomize k8s | grep "kind: NetworkPolicy" -c
  2
  ```
  The live `curl` against `runtime.know-me.tools` and the pod-connectivity test need a deployed cluster and stay open for the operator/QA at the deployed gate.
