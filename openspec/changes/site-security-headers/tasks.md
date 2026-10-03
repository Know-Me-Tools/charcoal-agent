## 1. CSP, HSTS and Permissions-Policy

- [ ] 1.1 Write the CSP: script sources limited to self plus the SHA-256 hash of the inline theme script in `index.html` (computed from the built `dist/index.html`, recomputed by the build if the script changes), with the other directives the built app needs and nothing broader.
- [ ] 1.2 Check whether PGlite needs `wasm-unsafe-eval`: load the site build with the CSP and exercise thread storage; add `'wasm-unsafe-eval'` only if PGlite fails without it, and record the result.
- [ ] 1.3 Serve the CSP from the site server as `Content-Security-Policy-Report-Only` (alongside `SECURITY_HEADERS` in `server/src/interface/routes/mod.rs`), with a report destination the operator can read.
- [ ] 1.4 Add `Permissions-Policy` to the site server's headers, denying the browser features the site does not use (camera, microphone, geolocation at minimum).
- [ ] 1.5 (km-devops-engineer) Set HSTS at Envoy for the site hosts in know-me-cluster.
- [ ] 1.6 After one week of report-only with zero violations, switch the header to an enforced `Content-Security-Policy` with the same policy.
- [ ] 1.7 Done-when (deployed): `curl -I https://<site host>/` shows `Strict-Transport-Security`, `Permissions-Policy` and `Content-Security-Policy-Report-Only`; the site loads and a chat turn completes in the browser with zero CSP violations in the console at 320 and 1440 widths. After the clean week, `curl -I` shows the enforced `Content-Security-Policy`. Paste both outputs here.
