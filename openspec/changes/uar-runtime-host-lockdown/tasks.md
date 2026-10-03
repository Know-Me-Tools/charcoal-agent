## 1. Close the runtime host

- [ ] 1.1 Delete the `knowme-runtime` and `knowme-runtime-http-redirect` HTTPRoutes (`runtime.know-me.tools`, `k8s/base/httproutes.yaml` lines ~125-185) from the manifests. If the operator records D-7 as "keep the host", stop and route it behind a fail-closed gate policy in `cluster-extauthz-policies` instead.
- [ ] 1.2 Operator: `kubectl --context know-me -n knowme get httproute knowme-runtime knowme-runtime-http-redirect`; delete any that exist with operator credentials, and record the command output in this change.
- [ ] 1.3 Rewrite the `.github/workflows/site.yml` steps that call `https://runtime.know-me.tools/readyz` and `/api/agents` (lines ~194-199) to run inside the cluster or against the proxy.
- [ ] 1.4 Settle the OPEN QUESTION of whether the seed job needs direct access to `uar:6565`, and record the answer and its reason in this change.
- [ ] 1.5 Add a NetworkPolicy in `k8s/base/` selecting the `uar` pods that admits ingress on 6565 only from `knowme-web`, flint-gate and, if 1.4 says so, the seed job.
- [ ] 1.6 Integration check: `kubectl kustomize k8s | grep -c runtime.know-me.tools` prints `0`; `curl -sS -o /dev/null -w '%{http_code}' https://runtime.know-me.tools/{readyz,metrics,admin,api/agents}` shows no UAR endpoint answering (no route or a refusal), output recorded; a pod without an admitted label times out connecting to `uar:6565` while `knowme-web` connects. Evidence filed for §6.4 item 1.
