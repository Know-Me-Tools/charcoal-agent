## 1. Allowlist trimmed, errors generic, upstream shape pinned

- [x] 1.1 Remove `GET /api/sessions/{id}/messages` and `DELETE /api/sessions/{id}` from the site server's UAR allowlist (`server/src/interface/routes/`); both now fall through to the generic `/api` 404.

  Done: routes removed from `server/src/interface/routes/uar_proxy.rs` (and `SiteProxy` methods from `server/src/application/site_proxy.rs`); they fall through to the `/api` 404 fallback. `server/src/domain/path_id.rs` deleted (no remaining caller).

- [ ] 1.2 (km-frontend-engineer) Remove their client callers: `src/hooks/use-sessions.ts` and the persisted-thread server-transcript fallback in `src/features/chat/use-chat-messages.ts`. Update or remove the affected tests.
- [x] 1.3 Remove `POST /api/uar/runs/{run_id}/artifact-response` from the allowlist.

  Done: same files as 1.1.

- [x] 1.4 Map every upstream non-2xx to a generic `AppError` body instead of passing UAR's status and body through (`server/src/infrastructure/upstream.rs:58-63`). Log upstream 5xx at WARN or above with status and route only, without the session id or the body.

  Done: `server/src/infrastructure/upstream.rs` (`upstream_error`) returns `AppError::UpstreamStatus` (502 `upstream_error`, `server/src/error.rs`) for every non-2xx; 5xx logged at WARN with `status` and `route` (path template) only, other 4xx at INFO; the body is never read except a 400's (bounded 16 KiB) for 1.5.

- [x] 1.5 Map UAR's 400 `guardrail_blocked` to a generic visitor message (distinct from the generic error, carrying no UAR text).

  Done: a 400 whose body has `error.type == "guardrail_blocked"` (UAR `src/server.rs` shape) becomes `AppError::GuardrailBlocked` (400 `guardrail_blocked`, fixed `GUARDRAIL_MESSAGE` in `server/src/error.rs`; wording is a placeholder for km-conversational-designer).

- [ ] 1.6 Pin the upstream request shape in `server/src/domain/chat_request.rs:50-60`: always forward `stream: true` and `stream_mode: "dual"`; ignore the visitor's `stream` and `stream_mode` fields instead of validating and forwarding them. Add no server-side aggregation. Confirm the title path (`src/features/chat/use-thread-naming.ts`) still produces a title through its streaming fallback when its `stream: false` request gets a stream.

  Server side done (R1): `server/src/domain/chat_request.rs` always forwards `stream: true`, `stream_mode: "dual"` and ignores the client's fields (type errors on them are no longer 400). Confirmation FAILED by static reading: in `dual` UAR emits each text delta twice, as `agui.message.delta` and as an OpenAI `data:` chunk (UAR `src/server.rs` `emit_agui_chunks` / `emit_openai_chunks`), and the streaming fallback in `src/features/chat/use-thread-naming.ts` collects both, so titles come out doubled. Needs a lane F fix (collect one dialect) before this closes.

- [x] 1.7 Forward no client query string on any route unless the parameter is on that route's allowlist; drop everything else.

  Done: `server/src/domain/query.rs` (`allowlisted_query`); the chat route's allowlist is empty (`CHAT_QUERY_PARAMS` in `server/src/application/site_proxy.rs`), so no client parameter is forwarded.

- [x] 1.8 Unit tests in `server/`: removed routes return the generic 404; an upstream 500 and an upstream 400 yield generic bodies with no UAR text; `guardrail_blocked` maps to the visitor message (stub upstream, since the guardrail is detect-only in Phase 0); the forwarded body always carries `stream: true` and `stream_mode: "dual"` whatever the client sent; a non-allowlisted query parameter is not forwarded.

  Written, compile-checked, not run: unit tests in `domain/chat_request.rs`, `domain/query.rs`, `infrastructure/upstream.rs`; integration tests in `server/tests/site_server.rs` (`removed_routes_should_return_the_generic_404_without_an_upstream_call`, `upstream_errors_should_reach_the_visitor_as_generic_bodies`, `guardrail_block_should_map_to_the_visitor_message_without_uar_text`, `upstream_stream_shape_should_be_pinned_whatever_the_client_sent`, `non_allowlisted_query_parameters_should_not_be_forwarded`).

- [ ] 1.9 Done-when (local): on the compose stack, `curl` through :8080 shows the three removed routes returning the generic 404 body, a `stream: false` chat request returning an SSE stream that ends with `agui.done` carrying usage, and a new thread still getting a title in the browser; `cargo test` in `server/` and `npm test` pass. Paste the output here.
