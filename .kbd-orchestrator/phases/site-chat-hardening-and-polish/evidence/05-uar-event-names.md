# Task 4.1: UAR event names and the proposed public step whitelist

Source: read-only reading of the UAR runtime source and this repository's public filter on 2026-10-12 (model output, citations are to UAR `src/uar/api/sse.rs` = `sse.rs`, `src/uar/domain/events.rs` = `events.rs`, and this repo's `server/src/domain/agui_filter.rs` = `filter`). **All payload shapes come from source, not from a live capture; no recorded real UAR capture exists under `e2e/fixtures/` or `server/tests/fixtures/`.** A capture against a local UAR settles the unknowns at the end.

The site stream uses the legacy `agui.*` names from `to_agui_event` (`sse.rs:401-880`), not the spec projector's `TOOL_CALL_START/END`. A second family, `runtime.*` (`sse.rs:890-1075`), is emitted alongside; the filter drops it. Every `agui.*` payload also carries `kind`, `phase`, `request_id`.

## Event table
| Event | When | Fields | Leak risk | Forwarded now |
|---|---|---|---|---|
| `agui.tool_call.delta` | tool arguments streaming (`sse.rs:542-557`) | `call_index`, `id`, `delta.arguments` | tool id, argument text | no (`filter:242`, pinned `:625`) |
| `agui.tool_call.complete` | **misleading name**: maps from ToolStart, i.e. when the call is dispatched, arguments assembled (`sse.rs:558-575`) | `call_index`, `id`, `name`, `arguments_json` | id, name, full arguments | no (`:626`) |
| `agui.tool_result` | maps from ToolEnd (`sse.rs:576-594`) | `call_index`, `id`, `name`, `content`, `success` | id, name, raw output | no (`:627`) |
| `agui.tool_call.denied` | policy denial (`sse.rs:795-808`) | `call_index`, `id`, `name`, `reason` | id, name, policy reason | **yes**, rebuilt (`filter:442-450`); `reason` replaced by a fixed string; **real id and name still reach the visitor** |
| `agui.tool_call.approval_required` | approval gate (`sse.rs:771-794`) | approval ids, `arguments_json`, `risk_reason` | arguments, reasons | no |
| `runtime.tool_call` / `runtime.step` | runtime bus (`sse.rs:953-993`, `1041-1051`) | started/finished/failed, ids, results; step boundaries | ids, arguments, results | no (`filter:641-642`) |
| `agui.thinking.delta`, `agui.reasoning.delta` | provider thinking / `reasoning_content` (`sse.rs:421-438`) | `delta.text` | reasoning text | no (`:623-624`) |
| `agui.memory.recall` / `.update` / `.mutation` | memory events (`sse.rs:493-521`, `809-828`) | items, keys, values, ids | memory contents | no (`:628-630`) |
| `agui.citation.added`, `agui.rag_citations` | citations (`sse.rs:439-480`) | url/title/snippet/index; marker, document_name, snippet, chunk/doc/KB ids, score | ids, score | yes, reduced to public fields (`filter:424-441`) |
| `agui.done`, `agui.error`, `agui.cancelled`, `agui.stream.start`, `agui.message.delta` | stream lifecycle and reply | see source | model, cost, raw error text | yes, rebuilt (`filter:401-423`) |
| `agui.custom`, `agui.skill.activated` | diagnostics, skills | | internal | no |

## Proposed public tool-step event (derived, stateful, in the filter)
- New public frame `agui.step` with only `{"kind":"step","phase":"started"|"finished"|"failed"|"denied","index":<n>,"label":"<fixed>"}`. Nothing else is kept: no real id, name, `call_index`, arguments, content, `request_id` or reason.
- `started` on upstream `agui.tool_call.complete` (ToolStart, the earliest point a name is known; deltas may be anonymous so are not used); `finished`/`failed` on `agui.tool_result` with the same id, from `success`; `denied` on `agui.tool_call.denied`, reusing the index if the id was already started.
- Labels, exact-match on upstream name, default last: knowledge search -> "Searching the knowledge base"; `presentation_render` or `a2ui_render` -> "Preparing an answer card"; anything else -> "Working".
- Index pairing: per response stream, a map from upstream id to a server-minted counter index; first sight mints; a result with no mapped id is dropped (fail closed); the map is capped (for example 64 entries); a duplicate start for a known id is ignored.

## Reasoning signal
Only deltas exist on the legacy path (no start/end). A content-free signal can be derived: emit `agui.step` `{"phase":"started","label":"Thinking"}` on the first reasoning delta and `finished` on the first message delta, tool start, or terminal event. No reasoning text and no delta frequency are forwarded. If the provider emits no reasoning deltas, no signal appears; that is correct behaviour.

## Tests that currently pin the drops (must change in task 4.2)
`every_other_event_name_should_be_dropped` (`filter:620-648`, names at `:623-627` and `:642`); `should_forward_only_allowlisted_frames_in_order_rebuilt_from_public_fields` (`filter:574-603`, `dropped_internal == 6`, verify); `every_allowed_event_name_should_be_forwarded` (`filter:606-618`, iterates `ALLOWED_EVENTS`); `a_denied_tool_call_should_be_public_with_a_fixed_reason` (`filter:919-937`, pins `id` and `name` on the denied frame); integration `server/tests/site_server.rs:362-390` and fixture `server/tests/common/mod.rs:60-65`.

## Unknowns (a local live capture would settle)
1. Whether `agui.tool_call.complete` arrives only after argument streaming ends and its order relative to `tool_result` for fast tools (source says ToolStart is built after the model's call completes, `manager.rs:6896-6905`; not traced through the stream pipeline).
2. The real name of the knowledge-search tool for this agent: not found in UAR source or this repo; a capture or the agent config gives the string to match.
3. Whether the configured model emits thinking/reasoning deltas at all, and on which of the two events.
4. Whether `runtime.step` / `runtime.tool_call` frames reach the site proxy and in what order; probably not a cleaner pairing source (per iteration, not per tool).
5. Whether memory events fire for the public agent, and whether a denied call can be followed by a `complete` (the existing fixture orders delta, approval_required, denied, complete), so a denied index is not reused.
6. The existing denied frame forwards real `id` and `name` to visitors today. Whether that is acceptable is a finding for task 4.2, not assumed here.
