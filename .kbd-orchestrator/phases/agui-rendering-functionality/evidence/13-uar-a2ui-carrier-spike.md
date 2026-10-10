# 13 — UAR A2UI carrier spike (task 1.6, change `pem-a2ui-official-0-12-0`)

Date: 2026-10-09. Local compose stack only. No commit, push, deploy or cluster access.

## Question

How does a real UAR A2UI surface arrive on the AG-UI stream, and which carrier should the client
treat as primary when it feeds PEM's `@prometheus-ags/a2ui-react` runtime?

## Answer (short)

- **Primary carrier: the `agui.artifact` event with `artifact_type: "a2ui"`.** In `agui_spec` mode
  the same event is `CUSTOM` with `name: "uar.artifact.available"`. It carries the complete, ordered,
  validated A2UI v0.9.1 message list as NDJSON in `content`. It is emitted once per tool call,
  after all patches.
- The `agui.state.patch` ops under `/a2ui/surfaces/{id}` are a secondary projection meant for
  replay. They are **lossy as JSON Patch**: `version`/`profile` are dropped, and every
  `updateDataModel` does `replace .../dataModel` with the raw message body
  (`{surfaceId, path, value}`), so each data key overwrites the previous one. Do not render from them.
- There is no `agui.custom`/activity carrier for surfaces. `agui.custom` only carries
  `uar.presentation.diagnostic` (rejections). `agui_spec` mode emits no `ACTIVITY_SNAPSHOT`.
- PEM rendered the captured surface after a thin adapter. Verified by feeding the captured
  artifact into PEM's built `dist`. The adapter must register catalogs under UAR's catalog ids,
  strip `profile`, and normalize `v0.9` to `v0.9.1`. PEM needs no new export for the primary path.

## Environment and provenance

- Running UAR container `knowme-uar`. Image `ghcr.io/prometheus-ags/universal-agent-runtime@sha256:688a97e42a0b…`
  (`docker image inspect` RepoDigests), created `2026-10-04T21:28:42Z`. **`688a97e4` is an image
  digest prefix, not a git commit.** `git cat-file` in the UAR repo reports it is not a valid object.
- I inferred the source commit as UAR `origin/main` `bb6ea8ba` (latest merge before the image
  timestamp, 2026-10-04T16:09-05:00). This is inferred, not proven by an image label. The image
  carries no `org.opencontainers.image.revision` label. `git diff bb6ea8ba origin/main` over
  `src/uar/a2ui`, `src/uar/runtime/native_skills`, `a2ui_output.rs`, `api/presentations.rs` and
  `runtime/presentations.rs` shows only `team_tools.rs` changed, so the A2UI code is current.
- Container startup logs: `Registering native skill … a2ui_render` and `… presentation_render`.
  Both tools exist in the pinned build.
- Routes probed on the running container: `GET /healthz` 200, `GET /api/agents` 200,
  `GET /api/uar/presentations` **401** without auth (it exists and requires a verified principal).
  `POST /api/agents` and `DELETE /api/agents/{id}` worked anonymously. `UAR_SECURITY__JWT_REQUIRED=false`.

## What could not be exercised: `presentation_render`

`presentation_render` needs a persisted template owned by a verified principal. That means
`POST /api/uar/presentations` with a JWT, and the chat run must carry the same owner
(`presentation_render.rs`: `snapshot.owner() == context.verified_owner`). Minting a JWT required
reading `UAR_SECURITY__JWT_SECRET` from the container. The harness permission classifier denied that
read, so **no template was created and `presentation_render` was not run live.** Its carrier shape
below comes from source, not from capture. It goes through the same `publish_tool_output` function
as `a2ui_render` (`src/uar/runtime/a2ui_output.rs`).

## Request shapes used

Endpoint `POST http://127.0.0.1:6565/api/chat/completion`, headers `Content-Type: application/json`,
`Accept: text/event-stream`, `X-UAR-Session-ID: <fresh uuid>`. Field names were verified against
`ChatCompletionRequest` in `src/server.rs` (it flattens `PresentationNegotiation` from
`src/uar/a2ui/presentation_selection.rs`).

1. As specified (negotiated). Capture: `13-uar-a2ui-carrier-capture-negotiated-fallback.sse`
   ```json
   {"stream":true,"stream_mode":"dual","agent_id":"scratch-a2ui-spike","memory_enabled":false,
    "presentation_mode":"a2ui","client_rendering":{"a2ui_profiles":["uar.a2ui/1"]},"message":"<prompt>"}
   ```
2. Legacy mode, both negotiation fields omitted. This is the **primary capture**,
   `13-uar-a2ui-carrier-capture.sse`
   ```json
   {"stream":true,"stream_mode":"dual","agent_id":"scratch-a2ui-spike","memory_enabled":false,"message":"<prompt>"}
   ```
3. Same as 2 with `"stream_mode":"agui_spec"`. Capture: `13-uar-a2ui-carrier-capture-agui-spec.sse`

`stream_mode: "dual"` matches what the client sends today (`src/features/chat/use-message-stream.ts:191`).

Scratch agent `scratch-a2ui-spike`: `policy.tools.allow = ["presentation_render","a2ui_render"]`,
`extensions["uar.run_policy"].tools = {mode:"selected", ids:[both]}`, `tool_approval:"auto"`,
model `openai/qwen3.8-max`. The prompt instructed the model to call `a2ui_render` with literal
arguments: Card > Column > [Text bound to `/message`, Button(child Text "Continue",
action `spikeContinue`)], plus `updateDataModel /message`.

### Attempts (3 runs on the `dual` path; the model called the tool every time it was offered)

| Run | Mode | Result |
|---|---|---|
| 1 | negotiated `a2ui` + `uar.a2ui/1`, anonymous | `effective_mode:"text"`, `fallback_reason:"no_eligible_templates"`. The host **removed both tools** before the model call (`manager.rs` ~L3369: `a2ui_render` is kept only if `allows_surfaces()`; `presentation_render` also needs templates). The effective policy showed `tools.mode:"none"`. No surface. The model then wrote text claiming the card "is configured", which was not true. |
| 2 | legacy, args with `profile:"uar.a2ui/1"` and `catalogId:"urn:uar:a2ui:catalog:1"` | Tool called. `agui.tool_result` `invalid_arguments`: the a2ui_render **JSON Schema rejects `profile` (`additionalProperties:false`) and pins `catalogId` to `const` basic-catalog URL**, although `protocol.rs::parse_message` accepts both. No surface. |
| 3 | legacy, args without `profile`, `catalogId` = basic-catalog URL | Tool called and surface published. **Primary capture.** |
| 3b | as run 3, `stream_mode:"agui_spec"` | Same surface, spec vocabulary. |

## Observed event sequence (primary capture, `dual`)

Counts: `agui.artifact` 7 (1 is the surface, the rest are policy/manifest/provider diagnostics),
`agui.state.patch` 7, `agui.message.delta` 8, `agui.tool_call.delta` 1, `agui.tool_call.complete` 1,
`agui.tool_result` 1, `agui.stream.start` 1, `agui.done` 1, `runtime.run` 2, `runtime.step` 3,
`runtime.tool_call` 2, plus interleaved OpenAI `chat.completion.chunk` data lines. Each SSE frame has
`id: <n>:<m>:2`.

Order, with the surface carriers marked by an arrow (→):

```
1  agui.artifact (effective_run_policy)
2  agui.state.patch  add /presentation {effective_mode:"legacy", surface_published:false, run_outcome:"running"}
3  agui.artifact (turn_manifest)
4  agui.stream.start
5  runtime.run (run_started)
6  agui.state.patch  replace /run
7  runtime.step
8-9 agui.artifact (provider_event, attempt_manifest)
10 agui.tool_call.delta
11 agui.tool_call.complete  name:"a2ui_render", arguments_json:<model args>
12 runtime.tool_call (tool_call_started)
13 → agui.state.patch  add     /a2ui/surfaces/spike-card
14   agui.state.patch  add     /presentation {surface_published:true, run_outcome:"running"}
15 → agui.state.patch  replace /a2ui/surfaces/spike-card/components
16 → agui.state.patch  replace /a2ui/surfaces/spike-card/dataModel
17 → agui.artifact  artifact_type:"a2ui"   ← PRIMARY CARRIER
18 agui.tool_result  {status:"prepared", terminal:true, instruction:…}  (a2uiMessages stripped)
19 runtime.tool_call (tool_call_finished)
20-21 runtime.step ×2
22-23 agui.artifact (provider_event, attempt_manifest)
24-31 agui.message.delta ×8 (one-sentence summary)
32 agui.state.patch  add /presentation {surface_published:true, run_outcome:"finished", client_display:"unconfirmed"}
33 agui.done  {kind:"done", request_id, usage:{…}}   ← says nothing about surfaces
34 runtime.run (run_finished)
```

Ordering guarantee from source: patches, then artifact, then `ToolEnd`. In `publish_tool_output` the
comment reads "Callers publish `ToolEnd` only after this returns."

## Exact carrier shapes

### A. `agui.artifact` (primary). Captured verbatim; `content` reflowed here, it is one string with `\n` separators

```json
{"kind":"artifact","phase":"complete","request_id":"885bc49e-9f83-4de4-8c99-4db879f8a315",
 "artifact_id":"a2ui:f94e3d72-257e-43af-b3f5-081fa48f25eb",
 "artifact_type":"a2ui",
 "title":"Interactive UI",
 "content":"{\"version\":\"v0.9.1\",\"createSurface\":{\"surfaceId\":\"spike-card\",\"catalogId\":\"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json\"}}\n{\"version\":\"v0.9.1\",\"updateComponents\":{\"surfaceId\":\"spike-card\",\"components\":[{\"id\":\"root\",\"component\":\"Card\",\"child\":\"body\"},{\"id\":\"body\",\"component\":\"Column\",\"children\":[\"heading\",\"go\"]},{\"id\":\"heading\",\"component\":\"Text\",\"text\":{\"path\":\"/message\"}},{\"id\":\"go\",\"component\":\"Button\",\"child\":\"goLabel\",\"action\":{\"event\":{\"name\":\"spikeContinue\",\"context\":{}}}},{\"id\":\"goLabel\",\"component\":\"Text\",\"text\":\"Continue\"}]}}\n{\"version\":\"v0.9.1\",\"updateDataModel\":{\"surfaceId\":\"spike-card\",\"path\":\"/message\",\"value\":\"Hello from the spike\"}}",
 "language":"application/a2ui+json",
 "metadata":{"profile":"uar.a2ui/1","surfaceIds":["spike-card"],"sourceTool":"a2ui_render",
             "presentation":null,"publication_status":"published"}}
```

Encoding of the surface messages:
- `content` is **NDJSON**: one stringified canonical A2UI message per line (`source.join("\n")`
  of `message.raw.to_string()`). It is a string, not a JSON array.
- The messages are A2UI **v0.9.1 canonical server-to-client messages** (`createSurface`,
  `updateComponents`, `updateDataModel`; `deleteSurface` is also parseable). They are passed through
  **verbatim** as the model or template produced them, after `protocol.rs::parse_message`
  validation. Accepted `version` is `v0.9.1` or `v0.9`. `profile` is optional and must equal
  `uar.a2ui/1` if present. `createSurface.catalogId` must be `urn:uar:a2ui:catalog:1` or the
  v0.9 basic-catalog URL. Components are limited to the 9 (Text, Button, TextField, CheckBox,
  ChoicePicker, Row, Column, Card, Divider) with `deny_unknown_fields`. Exactly one `root` is
  required. Strings containing `<…>`, `javascript:`, `data:text/html`, `onerror=` or `onclick=`
  are rejected.
- One artifact per tool call, and it may hold several surfaces (`metadata.surfaceIds`).
  `artifact_id` is a fresh `a2ui:<uuid>` every time, so it is not a surface id.

`presentation_render` variant (**from source, not captured**; `a2ui/presentations.rs::messages`,
`runtime/presentations.rs::prepare`): `sourceTool:"presentation_render"`,
`metadata.presentation: {"template_id": "<id>", "revision": <u64>}`, host-chosen
`surfaceId: "presentation-<uuid>"`. **Every message carries `"profile":"uar.a2ui/1"`**,
`version:"v0.9.1"` and `catalogId:"urn:uar:a2ui:catalog:1"`. The data model arrives as one
`updateDataModel` per top-level key, with path `/<escaped key>`, never `/`.

### B. `agui.state.patch` ops (secondary, lossy). Captured verbatim

```json
{"kind":"state","phase":"patch","request_id":"…","patch":[{"op":"add","path":"/a2ui/surfaces/spike-card","value":{"surfaceId":"spike-card","catalogId":"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json"}}]}
{"kind":"state","phase":"patch","request_id":"…","patch":[{"op":"replace","path":"/a2ui/surfaces/spike-card/components","value":{"surfaceId":"spike-card","components":[…]}}]}
{"kind":"state","phase":"patch","request_id":"…","patch":[{"op":"replace","path":"/a2ui/surfaces/spike-card/dataModel","value":{"surfaceId":"spike-card","path":"/message","value":"Hello from the spike"}}]}
```

Mapping from `realtime.rs::surface_message_to_state_patch`: createSurface becomes `add
/a2ui/surfaces/{id}`, updateComponents becomes `replace …/components`, updateDataModel becomes
`replace …/dataModel`, and deleteSurface becomes `remove /a2ui/surfaces/{id}`. The surface id is
JSON-Pointer escaped. The `value` is the **inner message body**. `version` and `profile` are
dropped. Applying these as JSON Patch puts `{surfaceId,path,value}` at `dataModel`, which is not a
data model, and a later `updateDataModel` overwrites the earlier one. `/a2ui/surfaces/{id}/components`
also holds a `{surfaceId, components}` wrapper, not an array. To rebuild messages from patches you
would need to re-wrap them and re-add `version`. The artifact already provides that.

### C. Run-level presentation receipt (`/presentation` state patch, emitted at start and end)

```json
{"op":"add","path":"/presentation","value":{"version":1,"requested_mode":null,"effective_mode":"legacy",
 "admission_fallback_reason":null,"fallback_reason":null,"run_outcome":"finished",
 "eligible_templates":[],"published_templates":[],"surface_published":true,
 "generation_failed":false,"receipt_status":"available","client_display":"unconfirmed"}}
```

The negotiated fallback run (run 1) ended with `requested_mode:"a2ui", effective_mode:"text",
fallback_reason:"no_eligible_templates", surface_published:false`. **`agui.done` says nothing about
surfaces**; it carries only `usage`. The `/presentation` patch is the only end-of-run statement of
whether a surface was published and why it fell back.

### D. Rejections

`NormalizedEvent::PresentationDiagnostic` maps to
`agui.custom {"kind":"custom","name":"uar.presentation.diagnostic","value":{"code","message"}}` (`sse.rs`).
Codes in source: `a2ui_publication_rejected`, `presentation_output_ceiling`,
`reserved_presentation_provenance`, `reserved_artifact_projection`, `presentation_receipt_unavailable`.
None were captured. Run 2's schema failure surfaced only as a failed `agui.tool_result`, because the
tool returned an error before publication.

### E. `agui_spec` mode equivalents (run 3b)

- Surface: `{"type":"CUSTOM","profile":"uar.agui/1","name":"uar.artifact.available","value":{"artifactId","artifactType":"a2ui","title","content":<same NDJSON>,"language","metadata":{<same>},"sourceRunId"},"threadId","runId","eventId","sequence"}`.
  Keys are camelCase.
- Patches: `{"type":"STATE_DELTA","delta":[<same ops>],…}`.
- **No `ACTIVITY_SNAPSHOT` events.** PEM's `PrometheusA2uiRuntime.processAgUiEvent` only handles
  `ACTIVITY_SNAPSHOT` with `activityType:"a2ui-surface"` and `content.a2ui_operations`, so it never
  matches UAR output in either mode.

## PEM compatibility check (run, not inferred)

Script: feed the captured artifact `content` into `createPrometheusA2uiRuntime(...).processMessages(...)`
from `/Users/gqadonis/Projects/prometheus/pem-a2ui-0-12-0/packages/a2ui-react/dist/index.mjs`
(`@prometheus-ags/a2ui-react@4.1.1`, `@a2ui/web_core@0.12.0`) under node. Output:

```
a2ui artifacts: 1
[default-catalog] FAIL STATE_ERROR Catalog not found: https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json
[uar-catalogs] OK surfaces=1 [ { id: 'spike-card', catalog: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json' } ]
[uar-catalogs] dataModel /: {"message":"Hello from the spike"}
[uar-catalogs+profile] FAIL invalid-message Input does not match the official A2UI v0.9 message schema. [{"code":"unrecognized_keys","keys":["profile"],…}]
[urn-catalog] OK surfaces=1 [ { id: 'spike-card', catalog: 'urn:uar:a2ui:catalog:1' } ]
[urn-catalog] dataModel /: {"message":"Hello from the spike"}
[v0.9] FAIL unsupported-protocol-version Expected v0.9.1; received v0.9.
```

Consequences for the adapter:
1. PEM's default catalog id is `urn:prometheus-ags:a2ui:catalog:v3`. UAR sends
   `urn:uar:a2ui:catalog:1` (templates) or the basic-catalog URL (`a2ui_render`, which is forced by
   its schema). Register both ids with `createPrometheusA2uiCatalog({ id, components: UAR_9 })`.
   All 9 UAR components exist in PEM's `DEFAULT_PROMETHEUS_A2UI_COMPONENTS`.
2. The official zod schema is strict, so **`profile` must be stripped**. Every `presentation_render`
   message carries it. Before stripping, check that it equals `uar.a2ui/1`.
3. **`version:"v0.9"` must be normalized to `v0.9.1`**. UAR accepts both, PEM's `processMessages`
   accepts only `v0.9.1`. PEM normalizes this inside `processAgUiEvent` only, which UAR never feeds.
4. The Button `action:{event:{name,context}}` and Text `text:{path}` shapes processed without error.
   I did not test action dispatch.

## Recommendation

**Primary carrier:** `agui.artifact` where `artifact_type === "a2ui"` and
`metadata.profile === "uar.a2ui/1"`. In `agui_spec` mode, `CUSTOM` `uar.artifact.available` with
`value.artifactType === "a2ui"`. Treat `agui.state.patch` `/a2ui/*` as non-rendering and keep the
current `"agui.state.patch": () => "continue"`. Read `/presentation` from the state patch for
fallback and "surface published" status, and for the text-only fallback copy.

Adapter signature (client-owned, in front of PEM's public API):

```ts
import {
  createPrometheusA2uiCatalog,
  createPrometheusA2uiRuntime,
  type CreatePrometheusA2uiRuntimeOptions,
  type PrometheusA2uiRuntime,
} from "@prometheus-ags/a2ui-react";

export const UAR_A2UI_PROFILE = "uar.a2ui/1";
export const UAR_A2UI_CATALOG_IDS = [
  "urn:uar:a2ui:catalog:1",
  "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",
] as const;
export const UAR_A2UI_COMPONENTS = [
  "Text", "Button", "TextField", "CheckBox", "ChoicePicker", "Row", "Column", "Card", "Divider",
] as const;

/** Normalized from `agui.artifact` (snake_case) or agui_spec CUSTOM `uar.artifact.available` (camelCase). */
export interface UarA2uiArtifact {
  artifactId: string;
  content: string; // NDJSON, one canonical A2UI message per line
  metadata: {
    profile: typeof UAR_A2UI_PROFILE;
    surfaceIds: string[];
    sourceTool: "a2ui_render" | "presentation_render";
    presentation: { template_id: string; revision: number } | null;
    publication_status: "published";
  };
}

export function readUarA2uiArtifact(event: string, payload: unknown): UarA2uiArtifact | null;

/** Split NDJSON, JSON.parse, drop `profile` (after asserting it equals uar.a2ui/1),
 *  map version "v0.9" -> "v0.9.1". Throws on any malformed line; never partially applies. */
export function toPemA2uiMessages(artifact: UarA2uiArtifact): unknown[];

export function createUarA2uiRuntime(
  options?: Omit<CreatePrometheusA2uiRuntimeOptions, "catalogs">,
): PrometheusA2uiRuntime; // catalogs: UAR_A2UI_CATALOG_IDS.map(id => createPrometheusA2uiCatalog({ id, components: UAR_A2UI_COMPONENTS }))

// usage: runtime.processMessages(toPemA2uiMessages(artifact)); render <PrometheusA2uiSurface/> per metadata.surfaceIds
```

**PEM exports:** none are missing for the primary path. `createPrometheusA2uiRuntime`,
`createPrometheusA2uiCatalog`, `PrometheusA2uiRuntime.processMessages`, `PrometheusA2uiProvider`,
`PrometheusA2uiSurface(s)`, `usePrometheusA2uiSurfaces` and the `A2uiMessage` type are all exported
from `src/index.ts`. Optional upstream improvements, none of them required:
(a) a public message normalizer that strips extension keys such as `profile` and upgrades `v0.9`.
Today that logic exists privately inside `processAgUiEvent`.
(b) `processAgUiEvent` support for UAR's `CUSTOM uar.artifact.available`, which would make the
`/ag-ui` subpath useful against UAR.

## Gaps in the pinned UAR build (`688a97e4…` image, source `bb6ea8ba`; unchanged on current `origin/main`)

1. **`a2ui_render` schema contradicts its own validator.** The JSON Schema forbids `profile` and
   pins `catalogId` to the basic-catalog URL. `protocol.rs` and the tool's own unit test use
   `profile:"uar.a2ui/1"` with `urn:uar:a2ui:catalog:1`. Observed live: run 2 failed with
   `invalid_arguments`. Result: model-authored surfaces always use the basic-catalog id, and template
   surfaces always use the urn. The client must accept both.
2. **The state-patch projection is lossy** (section B). This only matters if someone renders from patches.
3. **A negotiated request with no eligible templates removes `a2ui_render` as well.** Any request
   that sends `presentation_mode`/`client_rendering` gets **no surfaces at all** unless the verified
   owner has at least one enabled template. Anonymous callers can never have one, because the
   template CRUD returns 401. Only legacy mode (both fields omitted) lets `a2ui_render` publish.
4. No surface signal in `agui.done`. Use the `/presentation` patch instead.
5. No `ACTIVITY_SNAPSHOT` A2UI carrier in `agui_spec` mode.

## The uncomfortable part

The KnowMe site runs the client anonymously and the agent is public. Under the pinned UAR, a
client that "correctly" negotiates `presentation_mode` + `client_rendering: ["uar.a2ui/1"]` gets
**fewer** surfaces than one that sends nothing. Run 1 shows this: both tools were stripped, and the
model then wrote prose implying the card existed. Adding negotiation to the client without a
template-owning principal turns A2UI off. Separately, the `presentation_render` carrier claims in
this document are source-derived, because the live run was blocked at the credential step.

## Unverified

- `presentation_render` live capture: template, `metadata.presentation`, `profile` on every line,
  urn catalog, per-key `updateDataModel`. All source-derived. Blocked because JWT minting needed the
  container's JWT secret and that read was denied by the harness permission classifier.
- The image-to-commit mapping (`bb6ea8ba`) is inferred from the build timestamp.
- Diagnostic (`agui.custom` `uar.presentation.diagnostic`) payloads were read from source, not captured.
- PEM action dispatch (Button click) and React rendering were not exercised. Only
  `processMessages` and the data model were checked.
- Only `openai/qwen3.8-max` was tried. The model called the tool on every run where it was offered (2/2).

## Cleanup

- Scratch agent `scratch-a2ui-spike`: `DELETE /api/agents/scratch-a2ui-spike` returned 204, and a
  later `GET` returned 404.
- No presentation template was created, so there was nothing to delete.
- Scratch chat sessions (`6684d5c1…`, `a132df58…`, `5e54b909…`, `2ba5e422…`):
  `DELETE /api/sessions/{id}` returned 404 for each. They may remain in UAR's local SurrealDB as
  run/session history. This is local only.

## Files

- `13-uar-a2ui-carrier-capture.sse`: primary capture, legacy mode, `dual`, surface published.
- `13-uar-a2ui-carrier-capture-negotiated-fallback.sse`: the specified negotiated request, which
  fell back to text with no surface.
- `13-uar-a2ui-carrier-capture-agui-spec.sse`: the same surface in `agui_spec` vocabulary.
