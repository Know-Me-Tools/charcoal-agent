# Public-stream allowlist audit (change agui-public-artifact-allowlist, task 1.1)

Sources: `evidence/03-agui-event-inventory.md`, `evidence/07-public-stream-capture.md` (live capture, 2026-10-09: types only), client handlers in `src/features/chat/use-message-stream.ts`, UAR `src/uar/api/sse.rs` at `origin/main`.

## Live capture, what reached visitors
12 event-less frames, 9 `agui.message.delta`, 3 `agui.state.patch`, 2 `runtime.run`, 2 `agui.artifact` (`provider_event`, `attempt_manifest`), 1 each `agui.stream.start`, `runtime.step`, `agui.done`.

## Classification
| Name | Class | Decision |
|---|---|---|
| `agui.stream.start`, `agui.message.delta`, `agui.done`, `agui.error`, `agui.cancelled` | client-needed and meter-needed (`signal()` maps the last four) | allow |
| `agui.citation.added`, `agui.rag_citations`, `agui.tool_call.denied` | client-rendered, no diagnostics | allow |
| artifact `a2ui` | the only artifact the renderer will display | allow |
| artifacts `provider_event`, `attempt_manifest`, `effective_run_policy`, `turn_manifest`, any other | internal (model names, manifest hashes, policy) | deny |
| `agui.state.patch` | UAR shape: `{"patch":[{op,path,value}]}`; the live `/presentation` observation exposes internals | allow only if every op path starts `/a2ui/`; otherwise drop the whole event |
| `runtime.run`, `runtime.step` | internal run diagnostics | deny |
| event-less `data: {"choices":...}` chunks | duplicate the deltas, carry the model name | deny |
| event-less `data: [DONE]` | client terminator | allow |
| comment-only frames (keep-alives) | no data | allow |

## Visitor-visible features that depend on a denied event (for the operator)
`use-message-stream.ts` handles these events that are now dropped on the public path:
- `agui.thinking.delta`, `agui.reasoning.delta`: the reasoning block. **Visitors stop seeing the model's reasoning text.**
- `agui.tool_call.delta`, `agui.tool_call.complete`, `agui.tool_result`: tool-call blocks. **Visitors stop seeing tool calls and results** (only `tool_call.denied` remains).
- `agui.skill.activated`, `agui.context.update`, `agui.memory.recall`, `agui.memory.mutation`, `agui.custom`, `agui.raw`, `agui.artifact_input_request`.

This follows the plan's proposed allowlist. Reasoning and tool-call output are the next most likely things to carry internals, and the public concierge's job is the answer text. If the operator wants reasoning or tool blocks back for visitors, it is a one-line addition to `ALLOWED_EVENTS` plus a test; flagged for the CP1 deploy approval.
