# Live public-stream capture after the allowlist deploy (change agui-public-artifact-allowlist, task 1.7)

Captured 2026-10-09 ~13:40Z from `POST https://know-me.tools/api/chat/completion` after deploy run 37923301983 succeeded (knowme-web 2/2 on the new image). Body `{"message":"Why did you stop?","stream_mode":"dual"}`. Types only; no content stored.

Note: the first two attempts used `messages` instead of `message` and got HTTP 400 `"message must be a string"` (no stream, no chat turn spent).

## Result (HTTP 200)
| SSE event | count |
|---|---|
| `agui.message.delta` | 9 |
| `agui.stream.start` | 1 |
| `agui.done` | 1 |
| `data: [DONE]` | 1 |

- `agui.artifact` events: **0** (before the fix: `provider_event` and `attempt_manifest`).
- Also gone versus the 06:47Z capture: `runtime.run`, `runtime.step`, `agui.state.patch`.
- Leak grep `provider_event|attempt_manifest|effective_run_policy|turn_manifest|runtime\.` over the whole stream: **0** matches.
- Chat still streams to completion.
- `agui.done` carries `usage` (input 1064, output 633, total 1697), which is the signal the meter settles on.

## Not verified
- The meter's usage row in the database. There is no read-only route for it, and reading it needs the database credentials, which I did not read. The meter settles on the `agui.done` usage seen above and is covered by `server` tests (`meter_and_headers`, the disconnected-turn reservation test); the live row itself is unchecked.
- `agui.artifact` of type `a2ui` through the live proxy: not exercised, because the public agent does not emit it yet (changes 7 and 8).
