## Why

The site server's allowlist still routes `GET /api/sessions/{id}/messages` and `DELETE /api/sessions/{id}`, which UAR serves as disabled (404), and `POST /api/uar/runs/{run_id}/artifact-response`, which nothing uses in Phase 0 (FR-5). Upstream non-2xx responses pass through with UAR's status and body (`server/src/infrastructure/upstream.rs:58-63`), and upstream 5xx appears only in the INFO response line (FR-42). The visitor also controls `stream` and `stream_mode`, so usage arrives in different dialects; the spend meter (`site-spend-ceiling`) needs one.

## What Changes

- Remove the two dead session routes and their client callers, and the `artifact-response` route.
- Map upstream non-2xx to a generic `AppError` body; log upstream 5xx with status and route, without session id or body.
- Map UAR's 400 `guardrail_blocked` to a generic visitor message, so turning on guardrail blocking later is safe.
- Pin the upstream request shape: the server sets `stream: true` and `stream_mode: "dual"` itself and ignores the visitor's `stream` and `stream_mode` (`server/src/domain/chat_request.rs:50-60`). One dialect, `agui.done`, then carries the usage for every run. No server-side aggregation: the client's title path already collects a streamed response (`src/features/chat/use-thread-naming.ts`, streaming fallback), and its `stream: false` is ignored.
- Forward no query string except allowlisted parameters.
- Lands in: this repo (`server/`, `src/`). Owner: km-rust-engineer; km-frontend-engineer (callers); km-security-officer reviews.
- Depends on: `site-chat-proxy`. Blocks `site-spend-ceiling`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); amendment N14 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` (table A2).

## Impact

- Capability: `site-proxy-hardening`.
- Closes §6.4 item 11 (generic upstream errors, artifact-response removed) and the callers part of item 10. FR-5, FR-42.
