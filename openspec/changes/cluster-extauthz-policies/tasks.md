## 1. Per-route ext_authz policies for the knowme routes

- [ ] 1.1 Add a SecurityPolicy (`gateway.envoyproxy.io/v1alpha1`, `spec.extAuth.http` to gate's check endpoint, timeout about 200 ms) for the `knowme-site` route: anonymous-allow, `failOpen: true`. Merge, sync, and confirm `know-me.tools` serves before the next step.
- [ ] 1.2 Add the same policy for the `knowme-www` route (anonymous-allow, `failOpen: true`); merge, sync, confirm `www.know-me.tools` redirects to the apex.
- [ ] 1.3 If D-7 keeps `runtime.know-me.tools`, add a fail-closed (`failOpen: false`) policy for `knowme-runtime`; otherwise record that the host is deleted (`uar-runtime-host-lockdown`) and no policy is needed.
- [ ] 1.4 Confirm Argo CD is not routed through the gateway or any gate policy, and that port-forward reaches it while gate is down.
- [ ] 1.5 Write `docs/break-glass-securitypolicy.md` in know-me-cluster: suspend auto-sync for the Argo CD app (or revert the policy commit and sync), then delete the policy; note that a policy deleted with `kubectl` alone is re-created by selfHeal.
- [ ] 1.6 Integration check: with gate's check endpoint unavailable (gate scaled to 0 in `flint-core`), `curl -sS -o /dev/null -w '%{http_code}' https://know-me.tools/` (or the cluster hostname per D-1) returns 200 and `www.know-me.tools` returns its redirect; a fail-closed route, if any, is refused; following the break-glass runbook removes a policy and it stays removed after the next sync interval. Gate restored and output recorded. Evidence filed for §6.4 item 18.
