## 1. CSP, HSTS and Permissions-Policy

- [x] 1.1 Write the CSP: script sources limited to self plus the SHA-256 hash of the inline theme script in `index.html` (computed from the built `dist/index.html`, recomputed by the build if the script changes), with the other directives the built app needs and nothing broader.

  Done (R2): `server/src/domain/csp.rs` builds the policy; `script-src 'self' 'wasm-unsafe-eval'` plus a `'sha256-…'` for every executable inline script in the served HTML, hashed at startup from the bundle actually served (embedded or `KNOWME_WEB_ROOT`; `AssetSource::html_documents` in `server/src/infrastructure/assets.rs`), so a changed theme script changes the policy with the build. Other directives and why: `style-src 'self' 'unsafe-inline'` (sonner inserts a `<style>` element at runtime), `img-src 'self' data: blob:`, `font-src 'self' data:` (Vite inlines assets under 4 KiB), `connect-src 'self'`, `object-src 'none'`, `base-uri`/`form-action`/`frame-ancestors 'self'`.

- [ ] 1.2 Check whether PGlite needs `wasm-unsafe-eval`: load the site build with the CSP and exercise thread storage; add `'wasm-unsafe-eval'` only if PGlite fails without it, and record the result.

  Code inspection only (R2): PGlite's dist calls `WebAssembly.instantiate`/`instantiateStreaming`, which CSP blocks without `'wasm-unsafe-eval'`, so the policy includes it. Still open: the browser check (load the site build with the CSP, exercise thread storage, confirm with and without).

- [x] 1.3 Serve the CSP from the site server as `Content-Security-Policy-Report-Only` (alongside `SECURITY_HEADERS` in `server/src/interface/routes/mod.rs`), with a report destination the operator can read.

  Done (R2): `Content-Security-Policy-Report-Only` and `Reporting-Endpoints: csp-endpoint="/api/csp-report"` set in `server/src/interface/routes/mod.rs`; the policy carries `report-uri /api/csp-report` and `report-to csp-endpoint`. `POST /api/csp-report` (`server/src/interface/routes/api.rs`, per-IP limited) logs one WARN `csp violation` line per report with directive, blocked origin or keyword, and disposition; no page URL, query or sample. The operator reads these log lines.

- [x] 1.4 Add `Permissions-Policy` to the site server's headers, denying the browser features the site does not use (camera, microphone, geolocation at minimum).

  Done (R2): `Permissions-Policy` in `SECURITY_HEADERS` (`server/src/interface/routes/mod.rs`): accelerometer, camera, display-capture, geolocation, gyroscope, hid, magnetometer, microphone, midi, payment, serial, usb, xr-spatial-tracking all `()`. Tests (written, not run): `server/tests/meter_and_headers.rs` (CSP header with the fixture's theme-script hash, report endpoint), `server/src/domain/csp.rs` (hash matches `openssl dgst -sha256 -binary | base64`).

- [ ] 1.5 (km-devops-engineer) Set HSTS at Envoy for the site hosts in know-me-cluster.
- [ ] 1.6 After one week of report-only with zero violations, switch the header to an enforced `Content-Security-Policy` with the same policy.
- [ ] 1.7 Done-when (deployed): `curl -I https://<site host>/` shows `Strict-Transport-Security`, `Permissions-Policy` and `Content-Security-Policy-Report-Only`; the site loads and a chat turn completes in the browser with zero CSP violations in the console at 320 and 1440 widths. After the clean week, `curl -I` shows the enforced `Content-Security-Policy`. Paste both outputs here.
