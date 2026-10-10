# Public-site stream capture (types only, no content)

Captured 2026-10-09 06:47Z from `POST https://know-me.tools/api/chat/completion`, message "Why did you stop?", `stream_mode: dual`. Content of events is deliberately not stored: the diagnostic artifacts include model names and manifest hashes.

| SSE event | count |
|---|---|
| `(no event line)` | 12 |
| `agui.message.delta` | 9 |
| `agui.state.patch` | 3 |
| `runtime.run` | 2 |
| `agui.artifact` | 2 |
| `agui.stream.start` | 1 |
| `runtime.step` | 1 |
| `agui.done` | 1 |

`agui.artifact` events and their `artifact_type`:

- `provider_event`
- `attempt_manifest`

The public-path filter (`server/src/domain/agui_filter.rs`) drops only `effective_run_policy` and `turn_manifest`.
