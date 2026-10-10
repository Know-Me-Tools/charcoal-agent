# UAR source excerpts (verbatim, with line numbers)

Repo: Prometheus-AGS/universal-agent-runtime, read from `origin/main` commit `8f9f08630f951e5c30ddff75059f7eb91c538f20` on 2026-10-09. Reproduce: `git -C /Users/gqadonis/Projects/prometheus/universal-agent-runtime show origin/main:<path>`.

### src/uar/a2ui/protocol.rs  lines 10-17
```rust
10: use super::realtime::A2uiWireKind;
11: 
12: pub(crate) const PROFILE: &str = "uar.a2ui/1";
13: pub(crate) const VERSION: &str = "v0.9.1";
14: pub(crate) const COMPAT_VERSION: &str = "v0.9";
15: pub(crate) const CATALOG_ID: &str = "urn:uar:a2ui:catalog:1";
16: pub(crate) const BASIC_CATALOG_ID: &str =
17:     "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json";
```

### src/uar/a2ui/protocol.rs  lines 69-79
```rust
69: #[serde(tag = "component")]
70: pub(crate) enum Component {
71:     Text(TextComponent),
72:     Button(ButtonComponent),
73:     TextField(TextFieldComponent),
74:     CheckBox(CheckBoxComponent),
75:     ChoicePicker(ChoicePickerComponent),
76:     Row(ContainerComponent),
77:     Column(ContainerComponent),
78:     Card(CardComponent),
79:     Divider(DividerComponent),
```

### src/uar/a2ui/protocol.rs  lines 262-266
```rust
262:         return Err("unsupported A2UI version or profile".to_string());
263:     }
264:     if catalog.is_some_and(|value| value != CATALOG_ID && value != BASIC_CATALOG_ID) {
265:         return Err("unapproved A2UI catalog".to_string());
266:     }
```

### src/uar/a2ui/presentation_selection.rs  lines 5-35
```rust
5: 
6: use super::protocol::PROFILE;
7: 
8: /// Requested presentation behavior. Only omission selects legacy compatibility.
9: #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
10: #[serde(rename_all = "snake_case")]
11: pub enum PresentationMode {
12:     Auto,
13:     Text,
14:     A2ui,
15:     Hybrid,
16: }
17: 
18: /// Declarative renderer support; unknown profiles do not grant compatibility.
19: #[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
20: #[serde(deny_unknown_fields)]
21: pub struct ClientRenderingSupport {
22:     /// Profiles the client claims it can render, not proof of actual display.
23:     #[serde(default)]
24:     pub a2ui_profiles: Vec<String>,
25: }
26: 
27: /// Optional wire extensions shared by HTTP and host-owned execution requests.
28: #[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
29: pub struct PresentationNegotiation {
30:     #[serde(default, skip_serializing_if = "Option::is_none")]
31:     pub presentation_mode: Option<PresentationMode>,
32:     #[serde(default, skip_serializing_if = "Option::is_none")]
33:     pub client_rendering: Option<ClientRenderingSupport>,
34: }
35: 
```

### src/uar/a2ui/presentation_selection.rs  lines 62-104
```rust
62:     /// None means neither negotiation field was supplied.
63:     pub requested_mode: Option<PresentationMode>,
64:     pub effective_mode: EffectivePresentationMode,
65:     pub fallback_reason: Option<PresentationFallbackReason>,
66: }
67: 
68: impl PresentationNegotiation {
69:     /// Resolve support and eligibility already established by the trusted host.
70:     /// Client profile claims never make an inaccessible template eligible.
71:     #[must_use]
72:     pub fn resolve(&self, has_eligible_templates: bool) -> PresentationSelection {
73:         if self.presentation_mode.is_none() && self.client_rendering.is_none() {
74:             return PresentationSelection {
75:                 requested_mode: None,
76:                 effective_mode: EffectivePresentationMode::Legacy,
77:                 fallback_reason: None,
78:             };
79:         }
80:         let requested = self.presentation_mode.unwrap_or(PresentationMode::Auto);
81:         let fallback = if requested == PresentationMode::Text {
82:             None
83:         } else {
84:             match &self.client_rendering {
85:                 None => Some(PresentationFallbackReason::ClientRenderingNotDeclared),
86:                 Some(support)
87:                     if !support
88:                         .a2ui_profiles
89:                         .iter()
90:                         .any(|profile| profile == PROFILE) =>
91:                 {
92:                     Some(PresentationFallbackReason::IncompatibleProfile)
93:                 }
94:                 Some(_) if !has_eligible_templates => {
95:                     Some(PresentationFallbackReason::NoEligibleTemplates)
96:                 }
97:                 Some(_) => None,
98:             }
99:         };
100:         PresentationSelection {
101:             requested_mode: Some(requested),
102:             effective_mode: if fallback.is_some() {
103:                 EffectivePresentationMode::Text
104:             } else {
```

### src/uar/runtime/manager.rs  lines 6293-6338
```rust
6293:                             } if source == "uar.request" && event_name == "attempt_manifest" => {
6294:                                 Some(NormalizedEvent::Artifact {
6295:                                     run_id: execute_run_id.clone(),
6296:                                     artifact: ArtifactPayload {
6297:                                         artifact_id: format!(
6298:                                             "attempt-manifest-{}-{}",
6299:                                             execute_run_id,
6300:                                             payload
6301:                                                 .get("destination_model")
6302:                                                 .and_then(serde_json::Value::as_str)
6303:                                                 .unwrap_or("unknown")
6304:                                         ),
6305:                                         artifact_type: "attempt_manifest".to_string(),
6306:                                         title: "Provider attempt manifest".to_string(),
6307:                                         content: payload.to_string(),
6308:                                         language: Some("json".to_string()),
6309:                                         metadata: serde_json::json!({
6310:                                             "source": source,
6311:                                             "budgeting_label": payload
6312:                                                 .pointer("/budgeting/label")
6313:                                                 .and_then(serde_json::Value::as_str),
6314:                                         }),
6315:                                     },
6316:                                 })
6317:                             }
6318:                             crate::normalized::NormalizedEvent::Custom {
6319:                                 source,
6320:                                 event_name,
6321:                                 payload,
6322:                             } => Some(NormalizedEvent::Artifact {
6323:                                 run_id: execute_run_id.clone(),
6324:                                 artifact: ArtifactPayload {
6325:                                     artifact_id: format!("{source}:{event_name}"),
6326:                                     artifact_type: "provider_event".to_string(),
6327:                                     title: event_name,
6328:                                     content: serde_json::json!({
6329:                                         "source": source,
6330:                                         "payload": payload,
6331:                                     })
6332:                                     .to_string(),
6333:                                     language: Some("json".to_string()),
6334:                                     metadata: serde_json::json!({
6335:                                         "source": "external_llm_driver",
6336:                                     }),
6337:                                 },
6338:                             }),
```

### AG-UI event names in sse.rs (grep -o, unique)
```
"agui.artifact_input_request"
"agui.artifact"
"agui.budget.alert"
"agui.cancelled"
"agui.citation.added"
"agui.context.update"
"agui.custom"
"agui.done"
"agui.error"
"agui.guardrail"
"agui.mcp.state"
"agui.memory.mutation"
"agui.memory.recall"
"agui.memory.update"
"agui.message.delta"
"agui.quality.sycophancy_corrected"
"agui.quality.sycophancy"
"agui.rag_citations"
"agui.reasoning.delta"
"agui.skill.activated"
"agui.state.patch"
"agui.stream.start"
"agui.subagent.error"
"agui.subagent.finished"
"agui.subagent.started"
"agui.subagent.updated"
"agui.thinking.delta"
"agui.tool_call.approval_required"
"agui.tool_call.complete"
"agui.tool_call.delta"
"agui.tool_call.denied"
"agui.tool_result"
```

### A search for the AG-UI A2UI carrier strings in UAR (empty = absent)
```
(end of matches)
```
