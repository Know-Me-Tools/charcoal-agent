# Boundary packet: site-chat-follow-ups (2026-10-19T14:32Z)

Read-only. Contract digest 4091114d…. Expected: live CSP unchanged and strict; deployed digest is the PR #130 deploy; reconcile clean.

## 1. Live headers (`curl -sI https://know-me.tools`)
```
HTTP/1.1 200 OK
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), serial=(), usb=(), xr-spatial-tracking=()
content-security-policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-G4PYLKhJEo2KWmN299upbhMOxraLGkp1cuF7f3/duOw='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; report-uri /api/csp-report; report-to csp-endpoint
```

## 2. Deployed image
```
ghcr.io/know-me-tools/knowme-web@sha256:97e00ae33e2505c0ee119593afcc4381337b88983df1c64a51894abb0ef9ce64
ready 2/2
```
Deploy site run 39268527593 for 570b3f9 (PR #130): Verify, Build and push image, Build and push websearch image, Deploy to knowme, Smoke test: all success. The digest above equals the digest in that run's log.

## 3. Served bundle contains the new strings
Checked 2026-10-19 by fetching the entry page and all 57 JS files: 'Left out of this file', 'images from other sites' and 'could not be read, so they were deleted from this browser' each found in 1 file; the earlier draft wording 'interactive cards' found in 0.

## 4. Ledger
```
reconcile: clean — site-chat-follow-ups
```
