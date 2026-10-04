## Why

The site server sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, COOP and COEP (`server/src/interface/routes/mod.rs`, `SECURITY_HEADERS`), but no Content-Security-Policy, no `Permissions-Policy` and no HSTS. The NFR security row requires CSP enforced after a week in report-only mode with zero violations, and HSTS and `Permissions-Policy` present on a live `curl -I` (§6.4 item 14).

## What Changes

- CSP in report-only mode, with the hash of the inline theme script in `index.html`; check whether PGlite needs `wasm-unsafe-eval`. Enforced after a clean week.
- HSTS at Envoy.
- `Permissions-Policy` from the site server.
- Lands in: this repo (`server/`) and know-me-cluster (Envoy). Owner: km-rust-engineer, km-devops-engineer.
- Depends on: `site-chat-proxy`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `site-security-headers`.
- Closes §6.4 item 14. NFR security.
