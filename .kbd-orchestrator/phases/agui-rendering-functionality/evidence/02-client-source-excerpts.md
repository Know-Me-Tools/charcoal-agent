# Client (this repo) source excerpts

Repo: Know-Me-Tools/charcoal-agent, working tree at `9a6d5c7c8e0338d2121954e42cf1a4614772b3b0` (branch chore/kbd-agui-rendering-phase, 2026-10-09).

### src/features/chat/components/a2ui-artifact-block.tsx  lines 375-421
```
375: export const A2uiDisplayBlock: FC<A2uiDisplayBlockProps> = ({
376:   artifactType,
377:   title,
378:   content,
379:   language,
380: }) => {
381:   // Plain `agui.artifact` events (isInputRequest: false — e.g. the fixture's
382:   // "Week flow" diagram) render through this component, not ArtifactBlock.
383:   // Route a Mermaid artifact to the diagram renderer by default, the same as
384:   // the code path used for Mermaid in markdown, rather than showing the raw
385:   // source in the pre-wrap content box.
386:   const isMermaidArtifact = language === "mermaid";
387: 
388:   return (
389:     <div className="my-3 first:mt-0 last:mb-0 min-w-0 rounded-lg bg-surface p-4">
390:       <div className="mb-2 flex flex-wrap items-center gap-2">
391:         <PanelTopOpenIcon className="size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />
392:         <span className="font-ui text-xs font-semibold text-fg-secondary">Artifact</span>
393:         <span className="ms-auto flex shrink-0 items-center gap-1.5">
394:           <span className="inline-flex items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
395:             {artifactType}
396:           </span>
397:           {language && (
398:             <span className="inline-flex items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
399:               {language}
400:             </span>
401:           )}
402:         </span>
403:       </div>
404:       <p className="font-display text-base font-semibold text-fg wrap-anywhere">
405:         {title || "Artifact"}
406:       </p>
407:       {isMermaidArtifact ? (
408:         <div className="mt-2">
409:           <MermaidBlock source={content} />
410:         </div>
411:       ) : (
412:         <div
413:           tabIndex={0}
414:           className="mt-2 max-h-64 overflow-y-auto rounded-md bg-raised p-3 font-body text-sm leading-relaxed whitespace-pre-wrap text-fg-secondary wrap-break-word focus-cue"
415:         >
416:           {content}
417:         </div>
418:       )}
419:     </div>
420:   );
421: };
```

### src/features/chat/use-message-stream.ts  lines 231-255
```
231: // ─── A2UI envelope extractor ─────────────────────────────────────────────────
232: // Recursively unwraps agui.raw / agui.custom payloads to find a known A2UI
233: // envelope (surfaceUpdate, dataModelUpdate, beginRendering, deleteSurface).
234: 
235: function isRecord(value: unknown): value is Record<string, unknown> {
236:   return typeof value === "object" && value !== null && !Array.isArray(value);
237: }
238: 
239: function extractA2uiEnvelope(value: unknown): Record<string, unknown> | null {
240:   if (!isRecord(value)) return null;
241:   const directKeys = ["surfaceUpdate", "dataModelUpdate", "beginRendering", "deleteSurface"];
242:   if (directKeys.some((k) => k in value)) return value;
243:   if ("event" in value) {
244:     const nested = extractA2uiEnvelope(value.event);
245:     if (nested) return nested;
246:   }
247:   if ("value" in value) {
248:     const nested = extractA2uiEnvelope(value.value);
249:     if (nested) return nested;
250:   }
251:   if ("data" in value) {
252:     const nested = extractA2uiEnvelope(value.data);
253:     if (nested) return nested;
254:   }
255:   return null;
```

### src/features/chat/use-message-stream.ts  lines 694-711
```
694:                 case "agui.raw": {
695:                   // Extract any embedded A2UI envelope and surface as a display artifact
696:                   const envelope = extractA2uiEnvelope(agui);
697:                   if (envelope) {
698:                     addArtifact(threadId, {
699:                       artifactId: `agui-${event}-${Date.now()}`,
700:                       artifactType: "display",
701:                       title: event === "agui.custom" ? "Custom Event" : "Raw Event",
702:                       content: JSON.stringify(envelope, null, 2),
703:                       language: "json",
704:                       isInputRequest: false,
705:                       metadata: {},
706:                     });
707:                   }
708:                   break;
709:                 }
710: 
711:                 case "agui.done": {
```

### src/components/assistant-ui/enhanced-thread.tsx  lines 560-596
```
560: 	if (toolName === "__artifact__") {
561: 		const a = args as {
562: 			artifactId: string;
563: 			artifactType: string;
564: 			title: string;
565: 			content: string;
566: 			language?: string;
567: 			isInputRequest: boolean;
568: 		};
569: 		// Display-only: use A2uiDisplayBlock for proper rendering, fall back to
570: 		// ArtifactBlock for legacy persisted records that lack the new fields.
571: 		if (!a.isInputRequest) {
572: 			return (
573: 				<A2uiDisplayBlock
574: 					artifactType={a.artifactType}
575: 					title={a.title}
576: 					content={a.content}
577: 					language={a.language}
578: 				/>
579: 			);
580: 		}
581: 		return (
582: 			<ArtifactBlock
583: 				artifactId={a.artifactId}
584: 				artifactType={a.artifactType}
585: 				title={a.title}
586: 				content={a.content}
587: 				language={a.language}
588: 				isInputRequest={a.isInputRequest}
589: 			/>
590: 		);
591: 	}
592: 
593: 	return (
594: 		<ToolCallBlockWrapper
595: 			toolName={toolName}
596: 			args={args as Record<string, unknown>}
```

### server/src/domain/chat_request.rs  lines 41-70
```
41: 
42: /// Returns the serialized upstream body: `agent_id`, `message`,
43: /// `stream: true`, `stream_mode: "dual"` and `memory_enabled: false`.
44: pub fn build_site_chat_request(body: &[u8], agent_id: &str) -> Result<Vec<u8>, ChatRequestError> {
45:     let value: Value = serde_json::from_slice(body).map_err(|_| ChatRequestError::InvalidJson)?;
46:     let input = value.as_object().ok_or(ChatRequestError::NotAnObject)?;
47: 
48:     let message = input
49:         .get("message")
50:         .and_then(Value::as_str)
51:         .ok_or(ChatRequestError::InvalidMessage)?;
52:     if message.chars().count() > MAX_MESSAGE_CHARS {
53:         return Err(ChatRequestError::MessageTooLong);
54:     }
55: 
56:     let forwarded = Map::from_iter([
57:         ("agent_id".to_owned(), Value::from(agent_id)),
58:         ("message".to_owned(), Value::from(message)),
59:         ("stream".to_owned(), Value::from(true)),
60:         ("stream_mode".to_owned(), Value::from(STREAM_MODE)),
61:         ("memory_enabled".to_owned(), Value::from(false)),
62:     ]);
63:     // Serializing a map of strings and booleans cannot fail.
64:     serde_json::to_vec(&forwarded).map_err(|_| ChatRequestError::InvalidJson)
65: }
66: 
67: #[cfg(test)]
68: mod tests {
69:     use super::*;
70: 
```

### package.json: any a2ui / copilotkit dependency? (grep -n -i 'a2ui\|copilotkit' package.json; empty = none)
```
(end of matches)
```

### PEM dependency line in package.json
```
37:    "@prometheus-ags/prometheus-entity-management": "4.0.2",
```

### Public agent policy (uar/agents/knowme-site.json), keys touching tools/ui/skills
```
policy.tools.allow = []
policy.tools.deny = []
policy.tools.max_concurrent = 1
policy.tools.execution_mode = "direct"
policy.skills.prefer = []
policy.skills.max_active = 0
ui.artifacts.enabled = false
extensions.uar.run_policy.tools.mode = "selected"
extensions.uar.run_policy.tools.ids = []
extensions.uar.run_policy.tools.denied_ids = []
extensions.uar.run_policy.skills.mode = "none"
extensions.uar.run_policy.skills.ids = []
extensions.uar.run_policy.skills.denied_ids = []
extensions.uar.run_policy.tool_approval = "deny"
```

### Constraints and workspace (what the read-only rule covers)
```
  - id: reference-folders-read-only
    severity: blocking
    description: 'No writes to reference workspace folders (UAR, artifact-refiner, openfang)'
    note: 'Changes to the UAR contract are made in that repo separately; this project only consumes it'
focus /Users/gqadonis/Projects/know-me/charcoal-agent write_access= True
reference /Users/gqadonis/Projects/prometheus/universal-agent-runtime write_access= False
reference /Users/gqadonis/Projects/travisjames/skills/artifact-refiner write_access= False
reference /Users/gqadonis/Projects/references/openfang write_access= False
ignore /Users/gqadonis/Projects/cherry-studio write_access= False
(prometheus-entity-management is not a registered workspace folder)
```
