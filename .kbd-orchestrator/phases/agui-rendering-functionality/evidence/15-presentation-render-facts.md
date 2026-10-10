# 15 - presentation_render facts (UAR, pinned build)

Read-only investigation. Source: `/Users/gqadonis/Projects/prometheus/universal-agent-runtime`, read with `git show <sha>:path`. Paths below are relative to that repo. Line numbers are at `bb6ea8ba` unless noted.

## 0. Pinned digest to source commit

| Item | Finding |
|---|---|
| Pinned digest | `sha256:688a97e4...77888` (docker-compose.yaml:58, k8s/base/uar-deployment.yaml) |
| Image labels | Only `org.opencontainers.image.version=24.04` (the base OS). **No OCI revision label.** |
| Image created | 2026-10-04T21:28:42Z (= 16:28 CDT) via `docker image inspect 33bc70b8...` |
| Local `knowme-uar` | Image ID `sha256:33bc70b8...`, RepoDigest equals the pinned digest. **It is the pinned build.** Container created 2026-10-04T22:12Z, started 2026-10-09T07:29Z. |
| Source mapping | **Not provable from labels.** Inference by timestamp: the last `main` first-parent merge before the image build is `bb6ea8ba` (#344, 2026-10-04 16:09 CDT); the one before is `000e2c31` (#353, 15:57 CDT). Image was built 19 min after #344. Treat commit as `bb6ea8ba` (or `000e2c31`). `git diff 000e2c31 bb6ea8ba` touches only `team_execution/*`, `workflow_execution.rs`, and unrelated files, so every file cited here is identical at both. |

## 1. Tools and gates

### `presentation_render` (src/uar/runtime/native_skills/presentation_render.rs)
- Name `presentation_render` (:6). Effect ReadOnly, source BuiltIn.
- Args (:26-34, `deny_unknown_fields` on the Rust struct :11-16):
  `{ "template_id": string (minLength 1, required), "data": object (optional, additionalProperties true) }`, `additionalProperties:false`.
- `template_id` is the **host-generated UUID** of a stored template (`persistence/presentations.rs::new_record` uses `Uuid::new_v4()`), not a name.
- Execute (:68-95): needs a bound run snapshot whose owner equals `context.verified_owner`, else error. Returns `{status:"prepared", terminal:true, presentation:{template_id,revision}, a2uiMessages:[...]}`; the host then publishes (a2ui_output.rs `publish_tool_output`).

### `a2ui_render` (native_skills/a2ui_render.rs:13-150)
- Args: `{ "messages": [ canonical A2UI v0.9 messages ] }` (minItems 1). JSON Schema pins `catalogId` to the basic-catalog URL and **rejects `profile`** (matches spike run 2).

### Gates (manager.rs:3365-3382 and :3773)
| Gate | Effect |
|---|---|
| `presentation_mode` / `client_rendering.a2ui_profiles` | `PresentationNegotiation::resolve` (a2ui/presentation_selection.rs:57-96). Both fields omitted = `legacy` (surfaces allowed, no templates needed). If either present and mode != `text`: needs profile `uar.a2ui/1` AND `has_eligible_templates`, else `effective_mode:"text"` with `ClientRenderingNotDeclared` / `IncompatibleProfile` / `NoEligibleTemplates`. |
| `allows_surfaces()` | `effective_mode != text` (:120). Both tools are stripped from `effective_policy.tools.ids` when false. `presentation_render` is additionally stripped when the snapshot has zero templates (manager.rs:3371-3373). |
| `policy.presentations.ids` | Not an agent-JSON field. It is `RunPolicy.presentations` (domain/policy.rs:180), set via `extensions["uar.run_policy"].presentations` (policy.rs:311). Default Inherit gives all of the owner's enabled templates. `RunPresentationSnapshot::capture` then does `templates.retain(id in policy.presentations.ids)` (runtime/presentations.rs). |
| `ui.artifacts` | **Not a runtime gate.** Only referenced by the compiler (compiler/stages/s02_a2ui.rs:38, to_artifact.rs:180). `ui.artifacts.enabled:false` in knowme-site.json is irrelevant to this path. |
| `tool_approval` | **Blocking for the current agent.** `ToolApprovalPolicy::Deny` rejects every tool call (manager.rs:5494-5507). knowme-site.json has `extensions["uar.run_policy"].tool_approval:"deny"`. |

## 2. Presentation templates

- **Format** (a2ui/presentations.rs:19-31, 84-90): `PresentationDraft {title (non-blank), description, enabled: bool, template}` with `template = {version:"v0.9.1", catalog_id:"urn:uar:a2ui:catalog:1", components:[...1..500], default_data:{...}}`. All `deny_unknown_fields`. `version` and `catalog_id` must equal those exact constants (validate :38-40).
- **Components**: the nine only (protocol.rs:70-80, `deny_unknown_fields`): Text{id,text,variant?}, Button{id,child,variant?,action}, TextField{id,label,value,variant?,placeholder?}, CheckBox{id,label,value}, ChoicePicker{id,label,value,variant,options}, Row/Column{id,children,justify?,align?}, Card{id,child}, Divider{id,axis?}. Text variants h1,h2,h3,body,caption. Column rejects `justify`. IDs match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`.
- **Data binding**: `{"path":"/key"}` JSON pointer in `text` or `value`. At instantiate, `default_data` is overlaid by the call's `data` (top-level keys replace), emitted as one `updateDataModel` per top-level key (path `/<key>`), every message carries `profile:"uar.a2ui/1"`.
- **Rejected content** (validate_data :150-200): strings containing both `<` and `>`, `javascript:`, `data:text/html`, `onxxx=`; keys `__proto__`/`prototype`/`constructor`; keys over 512 chars. A model answer containing `<...>` makes the whole render fail (`a2ui_publication_rejected`).
- **Persistence/scope**: `PersistenceLayer::{create,list,get,update,delete}_presentation(owner_key, ...)`; tables in `migrations/20260904000000_presentations.sql` and `migrations/surrealdb/presentations.surql`; `tests/presentation_persistence.rs`. Owner key = `ActorOwner::presentation_owner_key()` = `v1:s:<len>:<sub>` or `v1:t:<len>:<tenant>:s:<len>:<sub>` (runtime/actor/messages.rs:71-83).
- **Creation**: `POST /api/uar/presentations` (api/presentations.rs:37-38, mounted server.rs:1774) body = PresentationDraft, returns 201 + Presentation (with `id`, `revision`). Also `GET /`, `GET|PUT|DELETE /{id}` (PUT body `{expected_revision, content}`). No CLI or seed script exists in this repo; `scripts/seed-site-agent.sh` does not create templates. Live check: `GET /api/uar/presentations` on 127.0.0.1:6565 returns 401 for no credentials (route exists).
- **Eligibility** (persistence/presentations.rs:14-62): owner is `Some`, store reachable, record owner key matches, `enabled:true`, revision != 0, `content.validate()` passes.
- **Why anonymous negotiated requests fell back (spike 13)**: `ActorOwner::from_verified_context` returns Err for `user_id == "anonymous"` (messages.rs:21-30). `RunExecutionRequest::with_user_context` then sets `verified_owner = None` (turn/request.rs:269-280). `eligible_presentation_records(owner=None)` returns an empty set, so `has_eligible_templates=false`, so `NoEligibleTemplates`, `effective_mode:text`, both tools removed (manager.rs:3370). The catalog API also returns 401 for anonymous.

Key correction: the production site proxy is **not anonymous**. It sends its own credential (`X-API-Key` or flint-gate bearer, server/src/domain/forwarding.rs:4-15), identity `sub=knowme-site` (seed script header). API-key path: `user_id = claims.sub`, `tenant_id = None` (security/middleware.rs:176-186). That is a verified owner `v1:s:12:knowme-site`. So templates created by `sub=knowme-site` ARE eligible for the site proxy's runs. The proxy already sends `presentation_mode:"a2ui"` + `client_rendering` (server/src/domain/chat_request.rs:53-85). Only the spike was anonymous (no auth header).

## 3. Agent JSON requirements

Current live agent (`GET /api/agents/knowme-site`): `policy.tools.allow=[]`, `extensions["uar.run_policy"].tools={mode:"selected",ids:[]}`, `tool_approval:"deny"`, skills/mcp `none`.

Needed (all three, or the tool never reaches the model):
1. `policy.tools.allow: ["presentation_render"]` (policy.rs:240-262: non-empty allow means Selected with those ids, deny list preserved).
2. `extensions["uar.run_policy"].tools = {"mode":"selected","ids":["presentation_render"],"denied_ids":[]}`. The extension replaces the base selection when non-Inherit (policy.rs:296-312, `merge_resource_selection`); leaving `ids:[]` intersects to empty.
3. `extensions["uar.run_policy"].tool_approval` must change from `"deny"` to `"auto"` (as the spike agent used). Rank rule: any scope with `deny` wins (policy.rs resolve loop).
4. Optional: `extensions["uar.run_policy"].presentations = {"mode":"selected","ids":["<uuid>"]}` to pin; omit (Inherit) to allow all of the owner's enabled templates. Ids are host-generated, so pinning needs a create-then-patch step. A malformed extension forces presentations to None (policy.rs:325-330).
5. Tool must exist in the universe: registered in native_skills/mod.rs:47.

If `tools.allow = ["presentation_render"]` only (extension left at `selected, ids:[]`): the extension wins, eligible set empty, `tools.mode=None`, no tool offered. If extension is also fixed but `tool_approval` stays `deny`, the model sees the tool but each call is rejected with `ToolCallDenied`. The prompt also lists the catalog only if the tool survives (manager.rs:3773-3781). Memory/KB retrieval is not a tool, so KB answers are unaffected.

## 4. Validation and a minimal answer card

`validate()` (presentations.rs:37-120): exact version/catalog, 1..500 components, each message through `parse_message` (nine-component serde enum, `deny_unknown_fields`), `validate_component`, every referenced child must exist, each non-root has exactly one parent, `root` is never a child, no cycles, no component unreachable from `root`, default_data safe.

Minimal template (every field verified against the structs above; Text requires `text`; Card has only `child`; Column has `children`; Divider optional `axis`):

```json
{
  "title": "Answer card",
  "description": "A short sourced answer. Use for every factual reply. Supply data.title, data.answer, data.source.",
  "enabled": true,
  "template": {
    "version": "v0.9.1",
    "catalog_id": "urn:uar:a2ui:catalog:1",
    "components": [
      {"id": "root",   "component": "Card",    "child": "body"},
      {"id": "body",   "component": "Column",  "children": ["title", "rule", "answer", "source"]},
      {"id": "title",  "component": "Text",    "variant": "h3",      "text": {"path": "/title"}},
      {"id": "rule",   "component": "Divider"},
      {"id": "answer", "component": "Text",    "variant": "body",    "text": {"path": "/answer"}},
      {"id": "source", "component": "Text",    "variant": "caption", "text": {"path": "/source"}}
    ],
    "default_data": {"title": "Answer", "answer": "", "source": ""}
  }
}
```

Tool call: `presentation_render {"template_id":"<uuid>","data":{"title":"...","answer":"...","source":"..."}}`. Answer text must not contain `<` and `>` together.

## 5. Missing from the pinned build

| Item | In pinned build? | Evidence |
|---|---|---|
| UAR #358 non-streaming usage (2cbe5b42, merge b988c2aa, 2026-10-05 10:03 CDT) | **No** | `git merge-base --is-ancestor 2cbe5b42 bb6ea8ba` false; merged ~18 h after the image's creation time (2026-10-04 16:28 CDT). |
| #361 cancelled-run usage (87e9db80, merge af32e1e8, 2026-10-05 13:14 CDT) | **No** | same check false; after image build. |
| #360 input screening (a523b2ab, merge 87291b7e, 2026-10-06 07:01 CDT) | **No** | same check false; after image build. |
| #353 KB retrieval config | Yes | 000e2c31 is #353 and precedes the image. |

The local `knowme-uar` is the pinned digest, not a different build.

## 6. Live local call: safe or not

Read-only GETs run: `/healthz` ok, `/readyz` ready, `/api/agents/knowme-site` 200, `/api/uar/presentations` 401.

Creating a template and triggering a render mutates the local SurrealDB, needs a `sub=knowme-site` credential, and (for the real agent) a PUT. Not executed. Safest sequence, using a scratch agent so `knowme-site` is not edited (the same owner identity still applies):

1. Mint JWT `sub=knowme-site` as `scripts/seed-site-agent.sh` does (needs UAR_JWT_SECRET; do not print it).
2. `POST http://127.0.0.1:6565/api/uar/presentations` with the section 4 draft, `Authorization: Bearer <jwt>`. Record `id`.
3. `POST /api/agents` (scratch id, e.g. `scratch-answer-card`): copy of knowme-site.json with `policy.tools.allow:["presentation_render"]`, extension `tools:{mode:"selected",ids:["presentation_render"]}`, `tool_approval:"auto"`. (Or `PUT /api/agents/knowme-site` to test the real agent: mutates it.)
4. `POST /api/chat/completion` with the same Bearer, `{"stream":true,"stream_mode":"dual","agent_id":"<scratch>","memory_enabled":false,"presentation_mode":"a2ui","client_rendering":{"a2ui_profiles":["uar.a2ui/1"]},"message":"Answer in a card: what is 2+2?"}`.
5. Expect: `/presentation` state patch `effective_mode:"a2ui"`, `eligible_templates:[{presentation_id,revision}]`; tool call `presentation_render`; `agui.artifact` `artifact_type:"a2ui"`, `metadata.sourceTool:"presentation_render"`, `metadata.presentation:{template_id,revision}`; surface id `presentation-<uuid>`.
6. Cleanup: `DELETE /api/uar/presentations/{id}` (body `{expected_revision}`) and delete the scratch agent.

## Uncertain

- Digest-to-commit is inferred from timestamps, not a label.
- Owner key tenancy: API key path gives `tenant_id=None`. The flint-gate bearer used in cluster may carry a tenant claim, which would change the owner key (`v1:t:...`). Templates must be created with the same credential type the proxy uses. I did not read the JWT-to-UserContext resolver to confirm tenant handling.
- With `presentations` Inherit, "all owner templates" relies on `resolve_resources` default mode Auto with an open set (policy.rs:766-840); I did not run it.
- Whether the model reliably calls `presentation_render` with good `data` was not tested.
