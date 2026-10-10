# AG-UI event and artifact-type inventory

Sources: UAR events = unique `"agui.*"` strings in `src/uar/api/sse.rs` at the commit in file 01. Client handlers = `case "agui.*"` in `src/features/chat/use-message-stream.ts`. The *Disposition* column is the assessment's **proposal**, not a decision.

UAR emits 32 distinct events. The client has a `case` for 21 events, of which 20 are among the 32 (the 21st, `agui.raw`, is not emitted by `sse.rs`). So **20 of UAR's 32 have a client handler and 12 do not** (the 12 rows marked `**no**` below).

| Event | UAR emits | Client case | Proposed disposition |
|---|---|---|---|
| `agui.artifact` | yes | yes | registry by artifact_type (see 2nd table) |
| `agui.artifact_input_request` | yes | yes | render (input form: A2UI candidate) |
| `agui.budget.alert` | yes | **no** | diagnostic: hide on public path |
| `agui.cancelled` | yes | **no** | render (cancelled + usage, added in UAR PR #361) |
| `agui.citation.added` | yes | yes | render (citation) |
| `agui.context.update` | yes | yes | render (context) |
| `agui.custom` | yes | yes | adapter (may carry A2UI envelope) |
| `agui.done` | yes | yes | terminal (usage, finish) |
| `agui.error` | yes | yes | render (error) |
| `agui.guardrail` | yes | **no** | diagnostic: hide on public path |
| `agui.mcp.state` | yes | **no** | diagnostic: hide on public path |
| `agui.memory.mutation` | yes | yes | render (memory change) |
| `agui.memory.recall` | yes | yes | render (memory) |
| `agui.memory.update` | yes | yes | hide (informational) |
| `agui.message.delta` | yes | yes | render (assistant text) |
| `agui.quality.sycophancy` | yes | **no** | diagnostic: hide on public path |
| `agui.quality.sycophancy_corrected` | yes | **no** | diagnostic: hide on public path |
| `agui.rag_citations` | yes | **no** | render (citations) |
| `agui.raw` | no | yes | adapter (may carry A2UI envelope) |
| `agui.reasoning.delta` | yes | yes | render (reasoning block) |
| `agui.skill.activated` | yes | yes | render (skill) |
| `agui.state.patch` | yes | yes | adapter (carries /a2ui/surfaces/* and /presentation) |
| `agui.stream.start` | yes | yes | internal (stream open) |
| `agui.subagent.error` | yes | **no** | render (subagent) |
| `agui.subagent.finished` | yes | **no** | render (subagent) |
| `agui.subagent.started` | yes | **no** | render (subagent) |
| `agui.subagent.updated` | yes | **no** | render (subagent) |
| `agui.thinking.delta` | yes | yes | render (reasoning block) |
| `agui.tool_call.approval_required` | yes | **no** | render (approval card: A2UI candidate) |
| `agui.tool_call.complete` | yes | yes | render (tool call) |
| `agui.tool_call.delta` | yes | yes | render (tool call) |
| `agui.tool_call.denied` | yes | yes | render (tool call state) |
| `agui.tool_result` | yes | yes | render (tool result) |

## `agui.artifact` artifact types (UAR `origin/main`)

| artifact_type | Source | Proposed disposition |
|---|---|---|
| `a2ui` | `runtime/a2ui_output.rs` (REPORTED line 193) | **render as A2UI surface** (language `application/a2ui+json`, newline-joined v0.9.1 messages) |
| `effective_run_policy` | `manager.rs:3609` (REPORTED) | diagnostic: hide (already dropped by the public proxy filter) |
| `turn_manifest` | `manager.rs:5349` (REPORTED) | diagnostic: hide (already dropped by the public proxy filter) |
| `attempt_manifest` | `manager.rs:6305` (VERIFIED, file 01) | diagnostic: hide (**not** filtered today) |
| `provider_event` | `manager.rs:6326` (VERIFIED, file 01) | diagnostic: hide (**not** filtered today) |
| `confirm` | `embedded.rs:1127` (REPORTED) | render (confirm: A2UI candidate) |
| `form`, `select`, `text_input`, `display` (schema ids `a2ui/*`) | artifact input-request path (REPORTED, not traced) | render (input forms: A2UI candidates) |

The public-path filter is a denylist of two types, so every type above not on that list reaches visitors. An allowlist keyed on this table would fail closed.
