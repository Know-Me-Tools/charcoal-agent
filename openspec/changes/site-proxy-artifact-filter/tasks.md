## 1. Internal artifacts dropped on the public path

- [ ] 1.1 In the site server's chat completion stream path (`server/src/application/site_proxy.rs`, `server/src/infrastructure/upstream.rs`), parse the upstream SSE stream event by event and drop each `agui.artifact` event whose `artifact_type` is `effective_run_policy` or `turn_manifest`. Forward every other event byte-for-byte, in order, without buffering the stream.
- [ ] 1.2 Add the test harness hook FR-11 uses: a seam that observes the upstream stream before the filter. It is reachable only from tests, never from a public route or a request header.
- [ ] 1.3 Unit tests for the filter: a stream containing both artifact types, another `agui.artifact` type and ordinary events yields only the latter, in order; an event split across two upstream chunks is handled; a malformed event is not dropped silently as if it were an internal artifact.
- [ ] 1.4 Done-when (local): on the compose stack, a chat turn through the site server on :8080, captured with `curl -N`, contains no `effective_run_policy` or `turn_manifest` artifact, while the harness hook observes both from the same run. Paste the grep counts here.
