## Why

All visitors are one UAR principal, and UAR keys conversation state on `X-UAR-Session-ID`. A visitor who sends another visitor's thread id to `POST /api/chat/completion` reads and extends that conversation; this is the real cross-visitor read vector (§8 item 3, §6.2 T5). FR-34 requires binding each upstream session to the visitor.

## What Changes

- The site server issues a signed, HttpOnly, Secure, SameSite=Lax first-party cookie holding a random visitor id.
- It never forwards the client's `X-UAR-Session-ID`. The upstream session id is `HMAC-SHA256(secret, cookie_id ‖ thread_id)`, formatted as a UUID. The derivation is stateless, so it holds across replicas.
- Applied to chat completion and stream resume. A thread id that is not a UUIDv4 gets 400.
- The HMAC secret is held in a Kubernetes Secret, with a rotation note.
- A two-visitor isolation test per route, run with two proxy replicas.
- Lands in: this repo (`server/`, `k8s/`, `docker-compose` config). Owner: km-rust-engineer; km-security-officer reviews.
- Depends on: `site-chat-proxy`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `site-session-binding`.
- Closes §6.4 item 10 with `site-proxy-hardening` (callers). FR-34.
- Rotating the secret orphans every server-side session; local thread history stays and the purge (`site-session-erasure`) deletes the orphans.
