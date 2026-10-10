# Decision log: agui-rendering-functionality

Recorded in the runtime with `prometheus kbd decision record` (D-25 to D-36). Numbering continues from the project's last decision, D-24. D-35 supersedes the OFF semantics of D-33.

### D-25 · 2026-10-09 · "Complete the UAR integration" means the A2UI critical path first
The A2UI critical path (public-stream allowlist, proxy field pass-through, agent policy and presentation template, UAR validator changes) is done first. The remaining `uar-integration` changes (25 open, 1 skipped) follow afterwards and are not planned here. **Operator.**

### D-26 · 2026-10-09 · Everything renders A2UI where appropriate, registered or inferred
For the app and the public agent. **Planned trade-off:** render-only first. A2UI actions (user input going back to the agent) and interactive tool approvals are deferred, because opening them on a public surface is a separate security decision. **Operator** (scope), **planner** (the render-only cut).

### D-27 · 2026-10-09 · UAR validator may be opened, on recorded need
UAR may be changed to accept more A2UI components or a client-declared catalog, one PR per change. Planned as a conditional change that starts with a need-finding spike, so nothing is built before a component the nine cannot express is demonstrated. **Operator** (permission), **planner** (the gate).

### D-28 · 2026-10-09 · PEM is the operator's; changes and publication are authorised
PEM changes needed for official A2UI 0.12.0 are made and published under an updated version number, following `RELEASING.md` and the `npm-release-and-cleanup` skill. Known risk: three earlier releases were deprecated for `workspace:` leakage or stale builds, and publish ability from this machine is untested. See D-34 for how the publish is gated. **Operator.**

### D-29 · 2026-10-09 · The live leak is fixed first, inside this phase
`provider_event` and `attempt_manifest` reach visitors through a two-type denylist. The fix replaces it with an allowlist and ships as the first production deploy. **Operator.**

### D-30 · 2026-10-09 · PEM is a registered, writable workspace folder
Registered in `.kbd-orchestrator/project.json` and noted in `.kbd-orchestrator/constraints.md`. **Operator.**

### D-31 · 2026-10-09 · Direction: PEM `a2ui-react` on official 0.12.0, pinned, behind a client render registry
Recommended by the assessment (adversarial review PASS, 0 CRITICAL, 4 WARNING). Not answered as a separate question: the operator bound it by instructing the 0.12.0 pin, no CopilotKit, and PEM changes. **Planner**, from the operator's instructions.

### D-32 · 2026-10-09 · The public template uses only UAR's nine components
Resolves a plan-review finding about ordering. UAR's validator governs only surfaces UAR emits, so the public agent's template is limited to the nine components in this phase and does not wait on the UAR validator change. If UAR rejects the template, the public agent stays on text and `uar-a2ui-validator-parity` gains that need. **Planner.**

### D-33 · 2026-10-09 · A2UI for visitors is an out-of-band switch, default OFF
CI seeds the agent on every deploy and the seed is a full replace, so a merged agent policy takes effect at the next approved deploy of anything. The control is therefore the proxy's opt-in switch (ConfigMap `site-a2ui-optin`, absent means OFF), read like the chat kill switch and flipped only by the operator at CP3, after the local red team passes. The policy PR is merged only after that red team. **Superseded in part by D-35:** the OFF state is an explicit `presentation_mode: "text"`, not omission of the fields. **Planner**, from the plan review.

### D-34 · 2026-10-09 · The PEM publish needs an explicit go after a dry run
The operator's answer was both "I publish PEM" and "do it and publish", which is ambiguous, and an npm publish is irreversible (three earlier releases were deprecated). So: dry run and a packed-manifest report first, then an explicit approval at CP2 (the operator may publish themselves). **Planner**, from the plan review.

### D-35 · 2026-10-09 · OFF is an explicit `presentation_mode: "text"`, never omission
A round-2 reviewer showed that omitting the presentation fields does not turn A2UI off: UAR resolves absent fields to Legacy, and Legacy allows surfaces (`presentation_selection.rs` `resolve` and `allows_surfaces`, at `origin/main` and at the pinned build `bb6ea8ba`; `a2ui_render` is gated only by `allows_surfaces()`). I confirmed it in the source. So the proxy sends `"text"` while OFF, absent or unreadable, and `"a2ui"` plus `client_rendering` only while ON. **Planner**, from the plan review. Supersedes the OFF semantics of D-33.

### D-36 · 2026-10-09 · The public agent gets `presentation_render` only
UAR has two render tools at the pinned build: `a2ui_render` (the model authors arbitrary surface messages, gated only by `allows_surfaces()`) and `presentation_render` (template-bound, also needs persisted templates). Free-form authoring is exactly the deceptive-UI threat the red team tests, so the public agent may use only `presentation_render`, and `a2ui_render` stays denied. To be confirmed with the operator under D-15 (change `site-agent-a2ui-policy`, task 5). **Planner**, from the plan review.

### D-37 · 2026-10-09 · Carrier is `agui.artifact` `a2ui`; public-site A2UI is unproven until a template is eligible
From the change 3 spike (`evidence/13-uar-a2ui-carrier-spike.md`, real captures against the local UAR at the pinned build). **Carrier:** `agui.artifact` with `artifact_type: "a2ui"`; `content` is NDJSON, one v0.9.1 message per line; state patches under `/a2ui/` drop `version`, `profile` and all but the last data-model update, so they cannot render; no activity or `agui.custom` carrier exists. **Adapter (this repo, no new PEM export needed):** register both catalog ids (`urn:uar:a2ui:catalog:1` and the basic-catalog URL) with UAR's nine components, split the NDJSON, strip `profile` after checking `uar.a2ui/1`, map `v0.9` to `v0.9.1`. **Risk for D-33, D-35, D-36:** an anonymous request that negotiates A2UI got `no_eligible_templates`, and UAR then removed both `a2ui_render` and `presentation_render` before the model call; `presentation_render` never ran live (template creation needs a JWT and the agent was rightly not given the secret). `a2ui_render`'s own JSON Schema also contradicts its validator (forbids `profile`, pins the basic catalog URL). **Consequence:** changes 7 and 8 must first prove that a seeded template is eligible for the anonymous site principal; if not, the public agent stays on text and `uar-a2ui-validator-parity` (change 9) gains that finding. The app (non-public) path is unaffected. **Planner**, from the spike.
