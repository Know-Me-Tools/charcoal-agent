# Assessment — agui-rendering-functionality

Date: 2026-10-09. Project: KnowMe (`know-me`, repo `charcoal-agent`). Stage: Assess.

## 0. Delta from the goals, and what the operator added

Delta first, per the standing rule: the goals assume a renderer registry that a component can be "assigned" to. **None exists on either side that matters.** The client has no A2UI renderer at all, and the server (UAR) holds registries the client cannot add to. The operator's added instruction is that the UAR integration must be completed first, "since it has the A2UI registry we need to put our component definitions into". That premise is only partly true (F7), and it changes the order of work.

Operator instructions that bind this assessment and the plan after it:

1. Add AG-UI rendering first, so an A2UI component can be assigned to render an AG-UI event.
2. Leverage `prometheus-entity-management` (PEM) and the `flint-forge` libraries.
3. Support the **latest** A2UI.
4. Use adversarial review to choose the approach. **No CopilotKit** (it binds us to their services).
5. Update the PEM A2UI code to official **0.12.0** and **pin** that version in whatever we build. PEM is ours: change it freely, and release a new npm version if needed.
6. Complete the UAR integration first, because UAR holds the A2UI registry.

Standing note: earlier KBD stages skipped adversarial review at the operator's request. Instruction 4 re-enables it for this phase.

## 0.1 Evidence index

The judge and later stages cannot read other repositories, so every claim that rests on UAR, PEM, flint-forge, npm or the live site has its raw evidence saved beside this file, with commit hashes and the commands used. Paths are relative to the repo root.

| File | Holds | Supports |
|---|---|---|
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/01-uar-source-excerpts.md` | Verbatim UAR source with line numbers, pinned to a UAR `origin/main` commit | F2, F3, F4, F5 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/02-client-source-excerpts.md` | This repo's renderer, stream handler, proxy request builder, agent policy, and the constraints and workspace entries | F1, F4, F6, F14, section 3 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/03-agui-event-inventory.md` | Every UAR `agui.*` event against the client's handlers, with a proposed disposition | F15 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/04-pem-upgrade-probe.md` | PEM typecheck and test output before and after the 0.12.0 bump | F10 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/05-npm-registry-facts.md` | `npm view` output for every package named here | F8, F9, F12, F13 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/06-flint-forge-facts.md` | flint-forge package manifest, npm lookup, wire-format search | F13 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/07-public-stream-capture.md` | Event and artifact **types** from the live public stream (no content) | F2 |
| `.kbd-orchestrator/phases/agui-rendering-functionality/evidence/08-pem-release-process.md` | Verbatim `RELEASING.md` excerpt and the `npm whoami` result | F11 |

Labels: **VERIFIED** means the evidence file shows it. **REPORTED** means a subagent said it and I did not reproduce it.

## 1. Goals against current state

| Goal | State | Evidence |
|---|---|---|
| AG-UI rendering registry | Absent. Event-to-component mapping is a hard-coded `switch` and tool-name `if` chain. | F1 |
| Leverage PEM and flint-forge | PEM has a real A2UI package (`@prometheus-ags/a2ui-react`); the app does not use it. flint-forge has a different dialect. | F9, F13 |
| Latest A2UI | Official renderer is 0.12.0 (28 Sep). PEM pins 0.10.2, two minor versions behind. Upgrade breaks PEM today. | F8, F10 |
| Adversarial-reviewed approach | Pending: section 8. | — |
| No CopilotKit | Satisfiable. PEM's package has no CopilotKit dependency. | F9, F12 |

## 2. Findings

**Where the cited paths live.** Paths starting `src/uar/` or `src/uar/runtime/` belong to the **UAR repo**; `src/official/`, `src/policy/` and `RELEASING.md` belong to the **PEM repo**; `src/ag-ui/` and `packages/flint-react/` belong to **flint-forge**. None is in this repo's file tree. Each is quoted verbatim, with a commit hash, in the evidence file named on the finding, and that file is the thing to check.

Confidence labels: **VERIFIED** = read or measured by me this session; **REPORTED** = a subagent's report, spot-checked only where stated; **UNVERIFIED** = not checked.

### Client (this repo)

**F1. The client cannot render A2UI. [VERIFIED]**
- `A2uiDisplayBlock` (`src/features/chat/components/a2ui-artifact-block.tsx:375`) renders Mermaid as a diagram. Everything else is a `whitespace-pre-wrap` text box.
- `extractA2uiEnvelope` (`src/features/chat/use-message-stream.ts:236`) looks for the **v0.8** keys (`surfaceUpdate`, `dataModelUpdate`, `beginRendering`, `deleteSurface`), then calls `JSON.stringify` and shows the text.
- `package.json` has no `@a2ui/*`, `a2ui-react` or CopilotKit dependency. The only A2UI imports are local.
- Event dispatch is a `switch` in `use-message-stream.ts` and a tool-name `if` chain in `enhanced-thread.tsx:~530-590`. There is no registry.

**F2. The cards in the operator's screenshot are not A2UI. They are UAR internal diagnostics. [VERIFIED]**
- `src/uar/runtime/manager.rs:6293-6338` (UAR, `origin/main`) turns the driver's `attempt_manifest` event and every other `Custom{source,event_name}` event into `agui.artifact` events of type `attempt_manifest` and `provider_event`.
- Their `content` is a JSON string, so a code block is all there is to show. Rendering them as A2UI would be wrong; they should not be user-visible.
- **The public site leaks them.** A live chat turn on `https://know-me.tools` streamed 2 `agui.artifact` events on 2026-10-09. The proxy filter (`site-proxy-artifact-filter`) is a denylist of two types (`effective_run_policy`, `turn_manifest`). The two new types pass it. Contents include the model name, a manifest hash and a budgeting warning.
- UAR has no flag to suppress them (REPORTED, one grep). The filter must be on the client or the proxy, as an **allowlist**.

### UAR (server)

**F3. UAR implements A2UI v0.9.1, with a closed validator. [VERIFIED, UAR repo, evidence 01]**
- `src/uar/a2ui/protocol.rs:12-17`: profile `uar.a2ui/1`, `VERSION = "v0.9.1"`, `CATALOG_ID = "urn:uar:a2ui:catalog:1"`, and the A2UI basic catalog URL.
- Line 264-265 rejects any other catalog id ("unapproved A2UI catalog").
- The component validator is a Rust enum with `deny_unknown_fields`: **`Text`, `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `Row`, `Column`, `Card`, `Divider`** (nine). Any other component type is rejected at parse time.

**F4. A2UI is opt-in per request, and our client never opts in. [VERIFIED, UAR repo + this repo, evidence 01 and 02]**
- UAR reads `presentation_mode` (`auto|text|a2ui|hybrid`) and `client_rendering.a2ui_profiles` from the chat request (`src/uar/a2ui/presentation_selection.rs:22-33`). With neither present the effective mode is `legacy`. The stream captured on 2026-10-09 showed `requested_mode: null, effective_mode: "legacy"`.
- The site proxy rebuilds the upstream body from an allowlist and forwards only `message` (`server/src/domain/chat_request.rs`, header comment and `build_site_chat_request`). **A2UI request fields cannot reach UAR through the public path today.** This is deliberate hardening, so changing it is a security decision, and the proxy must set the fields itself, never copy them from the client.
- With the fields present, UAR still falls back to text unless the client declares the profile `uar.a2ui/1` **and** the owner has eligible persisted presentation templates (`no_eligible_templates`). REPORTED.

**F5. UAR's A2UI carrier differs from AG-UI's published one. [VERIFIED absence; REPORTED shape]**
- Per the survey, UAR publishes surfaces as (a) `agui.state.patch` ops under `/a2ui/surfaces/{id}` and (b) one `agui.artifact` of type `a2ui`, language `application/a2ui+json`, content = newline-joined A2UI messages.
- AG-UI's A2UI middleware carries A2UI as `ACTIVITY_SNAPSHOT` with `activityType: "a2ui-surface"` (REPORTED from the middleware source). A search of UAR `origin/main` finds neither string. PEM's `a2ui-react/ag-ui` subpath targets the AG-UI activity events. **A client adapter is needed whichever way we go.**

**F6. The public agent cannot emit A2UI, by design. [VERIFIED]**
`uar/agents/knowme-site.json`: `policy.tools.allow = []`, `tool_approval = "deny"`, `ui.artifacts.enabled = false`, skills `none`. Enabling A2UI on the public site means changing this policy on purpose.

**F7. "UAR has the registry we put our components in" is half true. [REPORTED, partly UNVERIFIED]**
- UAR has an in-memory schema registry with 5 built-in schemas (`a2ui/form`, `confirm`, `select`, `text_input`, `display`) and a durable component library with REST under `/api/uar/a2ui` (Postgres and SurrealDB).
- Neither is a client-side registry. No catalog negotiation, no capability exchange, no client component registration was found. Registered definitions outside the nine validator components would still be rejected (F3).
- Not checked: whether custom schemas reload into the in-memory registry at startup.
- Consequence: the "component definitions" we want can be a **client rendering skin over the nine types**, or UAR must be changed to open the validator. Both are real work. Neither is "put definitions into the existing registry".

### A2UI ecosystem

**F8. Spec and official renderers. [REPORTED; versions VERIFIED against npm]**
- Repo `a2ui-project/a2ui`; docs at `a2ui.org`. v0.8 legacy; **v0.9.1 "current production", spec closed; v1.0 release candidate.**
- npm: `@a2ui/react` **0.12.0**, `@a2ui/web_core` **0.12.0** (Apache-2.0, published 2026-09-28), `@a2ui/markdown-it` 0.2.0.
- `@a2ui/react` exports `v0_8` and `v0_9` only (VERIFIED). `@a2ui/web_core` 0.12.0 exports `v0_8`, `v0_9` **and `v1_0`** (VERIFIED from the installed package). React has no v1.0 renderer yet.
- v1.0 changes (REPORTED): mixed catalogs per surface, whole surface in one `createSurface`, `@path` and `@call` binding syntax, theme removed, renderer function-call RPC.
- The spec has no URL allowlist for `Image`, `Video` or `openUrl`. We must add our own policy (REPORTED).

**F9. PEM `@prometheus-ags/a2ui-react` is the strongest local asset. [VERIFIED registry and manifest; REPORTED internals]**
- 4.1.1, MIT, React 19 only, ESM only, `exports: ".", "./ag-ui"`. Wraps the official renderer via `@a2ui/react/v0_9` and `@a2ui/web_core/v0_9`; decomposes a v1.0-RC envelope into the v0.9 processor.
- Catalog with explicit component and function allowlists; default-deny actions with tenant, entity, action and field allowlists and destructive-action approval. No CopilotKit. Tests exist.
- It pins the official packages **exactly** at 0.10.2 / 0.10.5 / 0.1.0.
- The app pins PEM `prometheus-entity-management` at 4.0.2 and does not depend on `a2ui-react`.

**F10. Upgrading PEM to 0.12.0 is a real but bounded change. [MEASURED, PEM repo, evidence 04]**
In a scratch worktree of PEM `origin/main` (4.1.1), changing only the three dependency versions:

| | typecheck | tests |
|---|---|---|
| as published (0.10.2 / 0.10.5 / 0.1.0) | passes | 30 of 30 pass |
| 0.12.0 / 0.12.0 / 0.2.0 | 5 errors | 14 of 30 fail |

All failures are in `src/official/catalog.ts` (the `Catalog` constructor signature changed) and `src/official/runtime.ts` (`version` became `versions`; capability and message-processor types changed), plus a runtime error `Official A2UI function is unavailable: add` on every failing test. The scratch tree is removed; nothing in PEM changed. I did not investigate the root cause of the `add` error. I did not test the `v1-compat` bridge separately.

**F11. PEM's release process is the risky part. [VERIFIED, evidence 08]**
Manual `pnpm publish` of **thirteen** `@prometheus-ags/*` packages with a granular npm token. `3.0.0` and `4.0.1` shipped with unresolved `workspace:` protocols and were deprecated; `3.0.4` shipped stale build artifacts. The file forbids publishing a single workspace package or moving `latest` on local builds alone, and points to the `npm-release-and-cleanup` skill. From `/tmp` this machine is logged in to npm as `babyice1906`, the sole maintainer of the PEM packages checked (evidence 08). `npm whoami` fails only inside the PEM checkout (`EBADDEVENGINES`). Whether that login **can publish** (token type, 2FA) is **untested**; earlier releases used a granular token at operator direction.

**F12. CopilotKit exclusion is sound. [VERIFIED registry]** `@copilotkit/react-core` 1.77.2 depends on `@scarf/scarf` (a telemetry package). `a2ui-react` has no CopilotKit dependency (REPORTED by grep; no telemetry grep on it was run).

**F13. flint-forge's `@flint/react` is not an official A2UI renderer and is not published. [VERIFIED, evidence 06]**
- `npm view @flint/react` returns **404**: the package is not on npm.
- The package uses its own `a2ui:surface` AG-UI custom event (`src/ag-ui/AgUiEventHandlers.ts:19`), not the official A2UI messages, and (per the survey, REPORTED) needs the Flint gateway and a JWT.
- A subagent reported that "27 of 55 slugs are real components". **I could not find that statement in the source** (evidence 06) so it is withdrawn.
- The goal says to leverage flint-forge. What can honestly be said: it is a **design reference** for component coverage and the slug-to-component registry pattern, not a drop-in renderer. Whether to adopt anything else from it is **unresolved** and belongs to Analyze.

**F15. AG-UI event inventory: UAR can emit 32 events; the client has no handler for 12 of them. [VERIFIED, evidence 03]**
- The client has a `case` for 21 events, 20 of which are among UAR's 32 (the 21st, `agui.raw`, is not emitted by UAR's `sse.rs`).
- UAR emits with **no client handler**: `agui.budget.alert`, `agui.cancelled`, `agui.guardrail`, `agui.mcp.state`, `agui.quality.sycophancy`, `agui.quality.sycophancy_corrected`, `agui.rag_citations`, `agui.subagent.started|updated|finished|error`, `agui.tool_call.approval_required`.
- Of those, three matter for A2UI work: `agui.tool_call.approval_required` (an approval card is a natural A2UI component), the `agui.subagent.*` family, and `agui.cancelled` (extended with usage in UAR PR #361; the client ignores it, so a cancelled run shows nothing).
- Five are diagnostics that should stay hidden from visitors: `agui.budget.alert`, `agui.guardrail`, `agui.mcp.state` and the two `agui.quality.*` events.
- The artifact types (`a2ui`, `effective_run_policy`, `turn_manifest`, `attempt_manifest`, `provider_event`, `confirm`, form schemas) and a proposed disposition for each are in the evidence file. This is the input the registry design needs: each event or type is **render**, **hide**, or **adapt**.

### Scope

**F14. The `uar-integration` ledger is 10 of 36 changes done; 25 are open, 1 skipped. [VERIFIED]** The ledger lags reality: chat works in production, yet `site-agent-seed`, `gate-site-credentials` and others still read open. **No change in the phase mentions A2UI.** The changes that sit on the A2UI critical path are `site-proxy-artifact-filter` (open task 1.4, which is the leak in F2), `site-proxy-hardening` (the request-field allowlist), `site-agent-tool-allowlist` (the agent's tool policy), and the AG-UI event handling behind `site-chat-offline-states`. Most of the other open changes (spend ceiling, retention, session erasure, red-team prompts) do not block A2UI.

## 3. What "completing the UAR integration" can mean

| Reading | Size | Blocks A2UI? |
|---|---|---|
| (a) Close the whole 36-change phase with evidence | 25 open changes | No, mostly independent |
| (b) The A2UI critical path only: public-stream allowlist, proxy field pass-through, agent policy and presentation template, a UAR change to open the validator if we need components beyond the nine | 4 changes plus UAR PRs | Yes |

The ambiguity is real and the plan should resolve it with the operator. My reading of the instruction is (b) first, then (a).

## 4. Options

| Option | Fit | What would make it wrong |
|---|---|---|
| **A. Upgrade PEM `a2ui-react` to 0.12.0 (pinned), consume it in the app, add an AG-UI render registry in the app** | Reuses our own tested code; official renderer; policy gates already exist; meets "no CopilotKit" | The 0.12.0 Basic Catalog renders as W3C custom elements from `web_core` (Lit), not React, so it will not be shadcn-native and adds bundle weight (UNVERIFIED); the upgrade proves harder than F10 suggests |
| B. Own thin renderer over v0.9.1, shadcn-native | Full control, native styling, small footprint | We own conformance and security fixes forever; duplicates PEM |
| C. Community React renderer | Quick demo | Mostly stale or v0.8 only (REPORTED); weak maintenance |
| D. CopilotKit renderer | Works now | Violates the operator's constraint |
| E. `@flint/react` | Large component set | Own dialect, needs the Flint gateway (F13) |

**Direction for the Plan stage: A**, in this order: (1) upgrade PEM `a2ui-react` to 0.12.0, pinned exactly, with a decision on a PEM release; (2) an AG-UI render registry in the app, keyed by event name and artifact type, where unknown internal types are hidden by allowlist; (3) an adapter from UAR's carrier (F5) into the PEM processor; (4) the UAR integration critical path (section 3b).

## 5. Uncomfortable things

- **Your registry premise.** UAR's registries are server-side, and its validator is a closed list of nine components. Our "component definitions" cannot live there as things stand. Either we skin the nine, or UAR changes.
- **A2UI on the public site is a security change, not a rendering change.** The public agent has tools off, artifacts off and the proxy strips every request field. Turning A2UI on opens the surface the hardening phase closed.
- **Version churn.** v1.0 will become stable; the official React renderer has no v1.0 support yet. Pinning 0.12.0 is right for repeatability and still leaves a migration ahead.
- **PEM release risk.** Thirteen packages, a manual token, three bad releases. A bump that touches one package still goes through the whole procedure.
- **The leak (F2) is a live defect independent of this phase.** It is still open.

## 5.1 Constraint check: the read-only rule

`.kbd-orchestrator/constraints.md` carries a **blocking** rule `reference-folders-read-only` ("No writes to reference workspace folders (UAR, artifact-refiner, openfang)"; note: "Changes to the UAR contract are made in that repo separately; this project only consumes it"). `.kbd-orchestrator/project.json` registers the focus repo (writable), UAR, artifact-refiner and openfang (all `write_access: false`). Evidence 02 shows the exact entries.

- **UAR:** the rule's own note says UAR changes are made in that repo separately. Every UAR change in this work so far was a separate worktree and PR in the UAR repo, and none edited the reference checkout. Plan items that change UAR stay inside that pattern.
- **PEM:** `prometheus-entity-management` is **not** a registered workspace folder, so the rule does not name it. The operator has also directed PEM changes explicitly. The gap is that PEM has no registered entry saying it is writable, so a later gate cannot tell. **Proposed amendment, needing the operator:** register PEM in `.kbd-orchestrator/project.json` (`workspace.folders`) with `write_access: true` and `role: dependency-we-own`, and note it in `.kbd-orchestrator/constraints.md`.
- This assessment changes no constraint. It records the conflict for the plan.

## 6. Open questions for the operator

1. Reading (a) or (b) of "complete the UAR integration"?
2. Should the public `knowme-site` agent render A2UI at all, or only the local and authenticated app?
3. May I change UAR to open its validator (more components, or a client-declared catalog)? That is a UAR PR per change.
4. Who publishes PEM? This machine is logged in to npm as the packages' sole maintainer, but I have not tested that it can publish. Do you want me to run the release procedure (including a dry run), or will you publish?
5. The leak fix (F2): do it ahead of this phase, or inside it?
6. Register PEM as a writable workspace folder in `.kbd-orchestrator/project.json` and `.kbd-orchestrator/constraints.md` (section 5.1)?

## 7. Unverified, and why

- Bundle size of `@a2ui/react` 0.12.0 with the Lit-backed custom elements. Not measured.
- Whether the `add` function error (F10) has a one-line cause. Not investigated.
- Whether UAR reloads custom schemas into its registry at startup. Not traced.
- UAR's exact A2UI event shapes (F5) beyond the constants and the survey. Not read in full.
- Whether the npm login on this machine can actually publish `@prometheus-ags/*` (F11). It is logged in as the sole maintainer; a `pnpm publish --dry-run` under the release procedure would show. Not run.
- v1.0 support in the AG-UI middleware. Reported as unverified by the research.

## 8. Lessons applied

- "Include plan amendments in reviewer and judge packets": the operator's instruction 6 and the PEM-0.12.0 pin are in this file so a judge sees them.
- "Operator controls PR merges and requires end-of-turn KBD status": every PR in this phase is the operator's to merge.
- "Clear stale lock files before verify and archive gates": the stale OpenSpec lock was checked (PID gone) before removal.
- Skipped, with reason: "do not push commits to a PR branch after review starts" does not apply yet.

Knowledge gaps recorded in `prior-context.md`: none. No `/learn-goal` offers.

## 9. Adversarial review

**Judge:** `gpt-6.1-sol` through the local gateway, fresh context, packet only. **Producer:** `claude-sonnet-5-5`. The tooling reported `cross_model_check: unverified-producer-unknown` and "independence is degraded" even though the producer was exported, so this is a different-model review that the tool **cannot certify** as cross-model. Say so downstream.

**Round 0: BLOCK (2 CRITICAL, 3 WARNING).** The judge sees only the packet, so claims resting on other repositories showed as `MISSING`.
- CRITICAL 1 (UAR source paths unsupported): valid as a verifiability gap. The facts were read by me; the judge could not see them.
- CRITICAL 2 (PEM writes vs the read-only rule): partly a misreading, and it exposed a real gap. PEM is not in the rule; UAR changes follow the rule's own note. Section 5.1 now records both, and the question of registering PEM is open question 6.
- WARNING 3 (flint-forge unverified): valid. Checked: `@flint/react` is not on npm (404), and an unsupported "27 of 55" claim was withdrawn (F13).
- WARNING 4 (no event inventory): valid and useful. Added F15 and evidence 03.
- WARNING 5 (live and measured claims not attached): valid. Evidence 01-08 added.

**Revision.** Evidence files created beside the assessment. The packet builder has **no attach option**, so I added the eight evidence files to the packet as `attached_evidence` after the tool built it, with a note in the packet. That is my assembly, not the tool's.

**Round 1 re-vet: PASS (0 CRITICAL, 4 WARNING).** Anti-theater gate: PASS (score 0.0, strict).
- WARNING 1: the assessment said `npm whoami` failed while evidence 08 showed a username. **A real error of mine**: I wrote the evidence narrative before seeing the output. Corrected in F11, section 7, question 4 and evidence 08: logged in as `babyice1906` (sole maintainer of the packages checked); ability to publish is still untested.
- WARNING 2: event count wording. The judge's arithmetic was off by one, but my wording was imprecise: 20 of UAR's 32 events have a handler and 12 do not; the client's 21st case (`agui.raw`) is not a UAR event. Corrected in F15 and evidence 03.
- WARNING 3: wrong or ambiguous file names. Now `.kbd-orchestrator/constraints.md` and `.kbd-orchestrator/project.json` throughout.
- WARNING 4: external paths presented as local. Section 2 now says which repo each path belongs to, and findings cite their evidence file.

**Not re-vetted:** the corrections above were applied after the PASS and were the judge's own requests. No third round was run. The packet's attached copies of evidence 03 and 08 are the pre-correction versions.

**Unresolved review findings:** none at CRITICAL. The independence caveat in the first paragraph stands.
