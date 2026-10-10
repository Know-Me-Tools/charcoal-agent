## 1. Internal artifacts dropped on the public path

- [x] 1.1 In the site server's chat completion stream path (`server/src/application/site_proxy.rs`, `server/src/infrastructure/upstream.rs`), parse the upstream SSE stream event by event and drop each `agui.artifact` event whose `artifact_type` is `effective_run_policy` or `turn_manifest`. Forward every other event byte-for-byte, in order, without buffering the stream.

  Done: `server/src/domain/agui_filter.rs` (event splitter for `\n`/`\r\n`/`\r`, classifier) and `server/src/application/public_stream.rs` (per-chunk stream adaptor), applied to `text/event-stream` responses in `SiteProxy::chat`. An `agui.artifact` whose `artifact_type` cannot be read is dropped too (fail closed) and logged at WARN as malformed, separately from internal drops.

- [x] 1.2 Add the test harness hook FR-11 uses: a seam that observes the upstream stream before the filter. It is reachable only from tests, never from a public route or a request header.

  Done: `UpstreamTap` (`application/public_stream.rs`) set only via `build_app_with_upstream_tap` in `server/src/lib.rs`, compiled only with the `test-harness` cargo feature, which only the crate's own dev-dependency enables (`server/Cargo.toml`); no route or header reaches it, and `cargo build` (Dockerfile) leaves it out.

- [x] 1.3 Unit tests for the filter: a stream containing both artifact types, another `agui.artifact` type and ordinary events yields only the latter, in order; an event split across two upstream chunks is handled; a malformed event is not dropped silently as if it were an internal artifact.

  Written, compile-checked, not run: unit tests in `domain/agui_filter.rs` and `application/public_stream.rs`; integration test `public_stream_should_drop_internal_artifacts_while_the_harness_sees_them` in `server/tests/site_server.rs`.

- [x] 1.4 Done-when (local): on the compose stack, a chat turn through the site server on :8080, captured with `curl -N`, contains no `effective_run_policy` or `turn_manifest` artifact, while the harness hook observes both from the same run. Paste the grep counts here.

  Superseded by `agui-public-artifact-allowlist` 1.6 and 1.7 (denylist replaced by an allowlist; the capture that proves the filter is taken against the allowlist, not the two-type denylist). Closed here without its own capture because the capture it asked for would have passed while `provider_event` and `attempt_manifest` still reached visitors.
