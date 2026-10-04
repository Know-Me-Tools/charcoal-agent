## 1. Upstream sessions bound to the visitor

- [x] 1.1 Issue the visitor cookie in the site server: if the request carries no valid signed cookie, set one holding a random visitor id, with `HttpOnly`, `Secure`, `SameSite=Lax`, first-party scope. A cookie whose signature fails is replaced, never trusted.

  Done: cookie `knowme_vid` = `<visitor hex>.<HMAC sig hex>` (`server/src/domain/session_binding.rs`, `server/src/interface/visitor_cookie.rs`), `Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`, no Domain; minted from `getrandom` in `SiteProxy::identify_visitor`; a cookie that fails verification is replaced. Issued on the chat route's response only.

- [x] 1.2 Validate the thread id: an `X-UAR-Session-ID` that is not a UUIDv4 gets 400 with a generic body, before any upstream call.

  Done: `thread_id` in `server/src/application/site_proxy.rs` (`ThreadId::parse`): a missing, repeated or non-UUIDv4 `X-UAR-Session-ID` gets 400 before any upstream call.

- [x] 1.3 Derive the upstream session id as `HMAC-SHA256(secret, cookie_id ‖ thread_id)` formatted as a UUID, and send only that upstream. The client's `X-UAR-Session-ID` is never forwarded. Apply this to chat completion and stream resume.

  Done: `SessionSecret::upstream_session_id` (HMAC-SHA256 over `visitor_hex ‖ lowercase thread_id`, first 16 bytes with v4/variant bits set); `server/src/domain/forwarding.rs` no longer copies the client header. Resume is not forwarded by the proxy yet (`site-stream-resume`); UAR resumes on this same route, so it inherits the binding when it lands.

- [ ] 1.4 Load the HMAC secret from a Kubernetes Secret (`k8s/`) and from the local compose environment; refuse to start without it. Add a rotation note: rotating orphans every server-side session, which is acceptable because local thread history stays and the purge deletes orphans.

  Server half done (R1): `SITE_SESSION_SECRET` (raw bytes, at least 32; e.g. `openssl rand -base64 48`), required at startup (`ConfigError::MissingSessionSecret`/`WeakSessionSecret`, `server/src/config.rs`), with the rotation note in that module's docs. Open for lane D: put `SITE_SESSION_SECRET` in a k8s Secret (same value on every replica) and in the compose environment. Until then the site server refuses to start in compose and k8s.

- [x] 1.5 Unit tests: the derivation is deterministic for the same cookie and thread, differs across cookies for the same thread, and is formatted as a UUID; a non-UUIDv4 thread id returns 400; a client `X-UAR-Session-ID` never appears in the upstream request.

  Written, compile-checked, not run: unit tests in `domain/session_binding.rs`, `domain/forwarding.rs`, `interface/visitor_cookie.rs`, `config.rs`; integration tests in `server/tests/site_server.rs` (cookie attributes, forged cookie replaced, client thread id never upstream, derivation per cookie and thread, non-UUIDv4 and missing header 400).

- [ ] 1.6 Write the two-visitor isolation test for chat completion and for resume: with visitor A's cookie and visitor B's thread id, UAR sees an upstream session id that is not B's, and no message or run of B is read, changed or resumed.
- [ ] 1.7 Done-when (local): run the 1.6 test against the compose stack with two site server replicas behind one entry point, with each visitor's requests spread across both replicas. A's requests never reach B's upstream session, each visitor keeps one upstream session across replicas, and a non-UUIDv4 thread id returns 400. Paste the test output here.
