# Local compose capture, before and after the allowlist (change agui-public-artifact-allowlist, task 1.6)

Same request both times, through the site server on :8080 (`curl -N`, `X-UAR-Session-ID` set, `stream_mode: dual`). Types only.

## Before (running image with the two-type denylist)
```
agui.artifact x2 (attempt_manifest, provider_event), agui.done 1, agui.message.delta 3,
agui.state.patch 3, agui.stream.start 1, runtime.run 2, runtime.step 1, data: [DONE] 1
```
## After (image rebuilt from this branch: `docker compose build knowme-web`)
```
agui.done 1, agui.message.delta 2, agui.stream.start 1, data: [DONE] 1
leak grep (provider_event|attempt_manifest|effective_run_policy|turn_manifest|runtime.) = 0
```
The chat turn still streams and finishes; the upstream-seeing tap is covered by `public_stream_should_drop_internal_artifacts_while_the_harness_sees_them`.

## cargo test (server/), `KNOWME_WEB_DIST_DIR=tests/fixtures/web`, --no-fail-fast
lib 77 passed, gate_credentials 4, meter_and_headers 11, site_server 22, 0 failed.
Without that env var, three tests (CSP theme hash, SPA fallback, hashed assets) fail because build.rs embeds the real `dist/` instead of the fixture; this is environmental and unrelated to the filter.
