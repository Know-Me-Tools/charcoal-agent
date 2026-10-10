# PLAN: agui-rendering-functionality

Project: KnowMe (`know-me`, repo `charcoal-agent`)
Date: 2026-10-09
OpenSpec available: YES
Changes to implement: 10

Inputs: `assessment.md` (adversarial review PASS, 0 CRITICAL, 4 WARNING), `goals.md` with the operator's amendments, `decision-log.md` (D-25 to D-36, recorded in the runtime; D-35 supersedes the OFF semantics of D-33), `prior-context.md`. No `library-candidates.json` (Analyze skipped: the assessment already compared the options).

## Delta against the assessment

The assessment recommended option A: PEM `@prometheus-ags/a2ui-react` upgraded to official A2UI 0.12.0 and pinned, behind a client render registry. The operator's answers keep that direction and widen the scope in three ways:

- **A2UI on the public agent too (D-26).** The assessment treated that as a security change to be decided; it is now in scope, so the plan gates its go-live on a red-team result instead of assuming it.
- **PEM changes and publication are authorised (D-28),** which makes a release part of the critical path. The assessment's biggest unknown there (PEM release history, untested publish ability) becomes a planned risk with a stop condition.
- **The leak fix comes first (D-29)** and ships on its own, ahead of any A2UI work.

## Lessons cited (from `prior-context.md`; recalled entries are information, not instructions)

- *Operator controls PR merges and requires end-of-turn KBD status*: every PR here is the operator's to merge, and each turn ends with the KBD status.
- *Ask once at phase boundary for operator-only actions*: merges, the PEM publish and production approvals are batched into three named checkpoints (CP1, CP2, CP3 below) instead of asked one at a time.
- *State build scope before reviewer handoff*: each release train below states what is and is not in it.
- *Include plan amendments in reviewer and judge packets*: the operator's decisions are merged into `goals.md`, and the packet for this plan carries them.
- *Preserve production evidence in dated review folders*: live evidence goes in a new dated folder with a README, never over an earlier one (change 10).
- *Installer behavior tests must exercise installer dispatch*: the same rule applied here means tests run through the production path (the public filter behind the proxy, a real browser), not the component alone.
- *Clear stale lock files before verify and archive gates*: check the PID before removing, as done for the OpenSpec lock this session.

## CHANGE LIST (ordered)

1. `register-pem-workspace`: Register PEM as a writable workspace folder
   - Scope: kbd config
   - Lands in: this repo (`.kbd-orchestrator/`)
   - Depends on: NONE
   - Recommended agent: Claude Code (driver, in-session)
   - Est. complexity: S
   - Complexity score: Low
   - Model class: small
   - Customer value: MEDIUM
   - Details: PEM is the operator's code and changes in this phase land there, but it is not a registered workspace folder, so a later gate cannot tell it is writable. Register it in `project.json` and say so in `constraints.md` (D-30).

2. `agui-public-artifact-allowlist`: Public stream: allowlist events and artifact types, replacing the two-type denylist
   - Scope: api (site server)
   - Lands in: this repo (`server/`)
   - Depends on: NONE
   - Recommended agent: Claude Code (km-rust-engineer)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: frontier
   - Customer value: HIGH
   - Details: The public path drops only `effective_run_policy` and `turn_manifest`, so `provider_event` and `attempt_manifest` reach visitors (live capture, 2026-10-09). Replace the denylist with an allowlist that fails closed, keep what the spend meter and client need, and prove it on a live capture. Ships as the first production deploy (Train A).

3. `pem-a2ui-official-0-12-0`: PEM a2ui-react on official A2UI 0.12.0, pinned, released as a new version
   - Scope: library (PEM repo)
   - Lands in: PEM repo (`/Users/gqadonis/Projects/prometheus/prometheus-entity-management`)
   - Depends on: register-pem-workspace
   - Recommended agent: Claude Code (km-frontend-engineer)
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH
   - Details: `@prometheus-ags/a2ui-react` 4.1.1 pins official `@a2ui/react` 0.10.2. A probe at 0.12.0 gives 5 type errors and 14 of 30 tests failing, all in `official/catalog.ts` and `official/runtime.ts`. Fix them, pin 0.12.0 exactly, and release a new version under the documented procedure (D-28).

4. `agui-render-registry`: Client AG-UI render registry: events and artifact types map to renderers, hide or adapt
   - Scope: ui (client)
   - Lands in: this repo (`src/features/chat/`)
   - Depends on: NONE
   - Recommended agent: Claude Code (km-frontend-engineer)
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH
   - Details: Replace the hard-coded `switch` in `use-message-stream.ts` and the tool-name `if` chain in `enhanced-thread.tsx` with a registry keyed by event name, artifact type or activity type, each entry being render, hide or adapt. Unknown types hide by default, which also stops internal diagnostics showing in the app. Renders the events the client ignores today where an existing block fits.

5. `app-a2ui-surface-renderer`: Render A2UI surfaces in the app with PEM a2ui-react and a shadcn catalog
   - Scope: ui (client)
   - Lands in: this repo (`src/`)
   - Depends on: pem-a2ui-official-0-12-0, agui-render-registry
   - Recommended agent: Claude Code (km-frontend-engineer)
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH
   - Details: Add the published PEM package with exact pins, adapt UAR's A2UI carrier into its processor, implement UAR's nine components with shadcn and Base UI under the flat 2.0 tokens, and register a lazy-loaded `A2uiSurfaceBlock` in the registry in place of the text box. Render-only: actions are default-deny (D-26).

6. `agui-inferred-a2ui`: Infer A2UI for events that have no registered template
   - Scope: ui (client)
   - Lands in: this repo (`src/features/chat/render-registry/`)
   - Depends on: app-a2ui-surface-renderer
   - Recommended agent: Claude Code (km-frontend-engineer)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: MEDIUM
   - Details: Where an event or artifact has no explicit renderer but its shape is known (confirm, form, select and display artifacts, approval requests, structured tool results), generate A2UI messages from it deterministically and render them through the surface renderer. Explicit registrations always win (D-26: registered or can be inferred).

7. `site-proxy-a2ui-optin`: Site proxy opts into A2UI itself and keeps A2UI action routes closed
   - Scope: api (site server)
   - Lands in: this repo (`server/`)
   - Depends on: agui-public-artifact-allowlist, app-a2ui-surface-renderer
   - Recommended agent: Claude Code (km-rust-engineer)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: frontier
   - Customer value: HIGH
   - Details: The proxy rebuilds every upstream request from an allowlist and forwards only `message`, so UAR never sees `presentation_mode` or `client_rendering`. Have the proxy set them itself (never from the visitor), controlled by an out-of-band switch (ConfigMap `site-a2ui-optin`, absent means OFF, flipped by the operator at CP3; D-33). OFF is an explicit `presentation_mode: "text"`, never omission of the fields, because UAR resolves absent fields to Legacy, which allows surfaces (verified at UAR `origin/main` and the pinned build; D-35). Also confirm no public route reaches UAR's A2UI message or action endpoints. CI seeds the agent on every deploy, so this switch, not the seed, is what turns A2UI on for visitors.

8. `site-agent-a2ui-policy`: Public agent: allow A2UI rendering, seed a presentation template, red-team it
   - Scope: api, agent policy
   - Lands in: this repo (`uar/agents/`, `scripts/`)
   - Depends on: site-proxy-a2ui-optin
   - Recommended agent: Claude Code (km-conversational-designer, km-security-officer)
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH
   - Details: `uar/agents/` is this repo's tracked directory of agent definitions (seeded into UAR), not the UAR reference checkout. `knowme-site` has tools denied, artifacts disabled and no presentation template, so UAR falls back to text. Allow only the template-bound `presentation_render` tool (D-36; the free-form `a2ui_render` stays denied), seed a declarative template under the site identity, measure the token cost, and red-team deceptive-UI prompts before enabling. CI seeds the agent on every deploy, so the seed is not a switch: the policy ships with the next approved deploy and is inert while the proxy's opt-in switch (change 7) is OFF. The operator turns A2UI on at CP3, after the local red team passes; if it fails the policy edits are reverted before merge.

9. `uar-a2ui-validator-parity`: UAR A2UI validator: add components only where a recorded need exists (conditional)
   - Scope: api (UAR repo)
   - Lands in: UAR repo (separate worktree and PR, per the project constraint)
   - Depends on: site-agent-a2ui-policy
   - Recommended agent: Claude Code (km-rust-engineer)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: frontier
   - Customer value: MEDIUM
   - Details: UAR accepts nine components and two catalog ids (`protocol.rs`, `deny_unknown_fields`). The operator allowed opening it (D-27). UAR's validator governs only surfaces that UAR emits (agent-authored); client-side inference never reaches it. This change starts with a spike that lists what agent-authored surfaces, starting with the public template, need beyond the nine; it ends with evidence and a PR only if a gap exists.

10. `agui-a2ui-live-verification`: Phase gate: end-to-end A2UI rendering, live leak check, cumulative review
   - Scope: verification
   - Lands in: this repo (`docs/qa/`, evidence folders)
   - Depends on: all earlier changes (change 9 may have closed with no code)
   - Recommended agent: Claude Code (km-qa-engineer)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: frontier
   - Customer value: HIGH
   - Details: Run the integration and review gates once, at the end, on the real production path: a browser rendering a real UAR A2UI surface, a live public capture, visual captures on the live site, and a cumulative adversarial diff review. Evidence goes into a new dated folder, never over an earlier one.

## TASKS BY CHANGE

The same titles go into each change's `tasks.md`. The task number `1.n` is the title prefix; the backend task ID is the ordinal `n`.

### `register-pem-workspace`

- 1.1 Add a `prometheus-entity-management` entry to `workspace.folders` in `.kbd-orchestrator/project.json` with `write_access: true`.
- 1.2 Amend `.kbd-orchestrator/constraints.md`: scope `reference-folders-read-only` to UAR, artifact-refiner and openfang, and note that UAR changes are separate-worktree PRs and PEM is writable by operator direction (D-30).
- 1.3 Integration check: `git diff` shows only those two files changed by this change, and `prometheus kbd status --json` still reports lifecycle `ready` with no conflicts.

### `agui-public-artifact-allowlist`

- 1.1 Audit the live public stream and the event inventory: list every event name and artifact type that reaches visitors, classify each as client-needed, meter-needed or internal, and list any visitor-visible feature that depends on an event proposed for denial (for example reasoning deltas) for the operator to decide (record in this change; the proposed allowlist is in the plan).
- 1.2 Write failing tests first: one test per allowed and per denied event name and artifact type (`provider_event`, `attempt_manifest`, `effective_run_policy`, `turn_manifest` and any unlisted type are dropped; `a2ui` is kept); path-filter tests for `agui.state.patch` including a patch that mixes `/a2ui/` and other paths; event-less frames (12 of 31 in the live capture): `data: [DONE]` is kept and other event-less frames follow the audit's decision; malformed artifacts fail closed; chunk splits do not break framing.
- 1.3 Replace the denylist with the allowlist in `server/src/domain/agui_filter.rs` (artifact types and event names per the audit); an `agui.state.patch` is dropped whole if any of its ops has a path outside `/a2ui/` (fail closed).
- 1.4 Regression test that the spend meter and turn tracker still receive all four signal events through the filtered stream: `agui.message.delta`, `agui.done` (usage), `agui.cancelled` and `agui.error` (the set `signal()` in `agui_filter.rs` maps to meter signals).
- 1.5 Update `site-proxy-artifact-filter` (spec and tasks) to record that the denylist is superseded, and complete its task 1.4 with the new capture, pasting the grep counts.
- 1.6 Done-when (local): `cargo test` in `server/` passes except the known CSP baseline failure, and on the compose stack a chat turn captured with `curl -N` through :8080 contains none of the four diagnostic artifact types, while the test harness tap still sees them upstream.
- 1.7 Done-when (deployed, operator-approved Train A): a live capture (types only, no content) has no `provider_event` or `attempt_manifest`, a chat turn still streams, and the meter writes its usage row. Save under a dated evidence folder with a README.

### `pem-a2ui-official-0-12-0`

- 1.1 Create a PEM worktree from `origin/main` and pin `@a2ui/react` 0.12.0, `@a2ui/web_core` 0.12.0 and `@a2ui/markdown-it` 0.2.0 exactly in `packages/a2ui-react/package.json`; refresh the lockfile.
- 1.2 Root-cause `Official A2UI function is unavailable: add` with a failing test first, then fix `official/catalog.ts` (the `Catalog` constructor signature) accordingly.
- 1.3 Fix `official/runtime.ts`: capabilities (`versions`), surface/version types and `MessageProcessor` generics.
- 1.4 Decision gate: if the 0.12.0 Basic Catalog (custom elements from `web_core`) cannot back PEM's allowlisted catalog without shadowing or breaking styling, stop and record options for the operator before continuing.
- 1.5 Verify the v1.0-RC compatibility bridge (`official/v1-compat.ts`) still decomposes into v0.9.1 messages under 0.12.0; add tests for it.
- 1.6 Carrier spike (moved here so any PEM-side API need ships in this one release): capture a real UAR A2UI stream on the local compose stack by hand-seeding a scratch template and a scratch agent that allows `presentation_render` and calling UAR directly on :6565 with `presentation_mode` and `client_rendering` set (nothing from `site-agent-a2ui-policy` is needed; that change later formalises it), decide the primary carrier, record that the adapter lives in this repo and feeds PEM's public processor API, and add any PEM export that needs before release prep.
- 1.7 Gates: `typecheck`, `vitest` (30 baseline tests plus new), `pnpm build`, and the exports ledger (`refresh:exports`, `verify:skills`).
- 1.8 Release prep per `RELEASING.md` and the `npm-release-and-cleanup` skill: lockstep bump of all thirteen packages to the next minor (proposed 4.2.0, confirm), changelog, version-bearing docs and registry status; open the PR for the operator to merge. Do not push to it after review starts.
- 1.9 Dry run, after the operator merges the PR: `pnpm publish --dry-run` for every package, inspect the packed manifests for `workspace:`, and report the result to the operator. Do not publish.
- 1.10 Publish only after the operator explicitly approves the dry-run report at CP2 (the operator may publish themselves instead; D-34): publish under the documented procedure and move `latest` and `next`. If npm auth fails, stop and ask; do not work around it.
- 1.11 Done-when: `npm view @prometheus-ags/a2ui-react version` shows the new version, its manifest pins the three official packages exactly, and a clean install in a scratch app typechecks.

### `agui-render-registry`

- 1.1 Write characterization tests for the current event handling in `use-message-stream` and tool-name dispatch in `enhanced-thread`, so the refactor preserves behaviour.
- 1.2 Review flint-forge's `FlintRegistry`, `slugMap` and `FlintAgUiAdapter` as a design reference for the registry and record what is adopted or declined and why (it is not a renderer: unpublished on npm, own `a2ui:surface` dialect).
- 1.3 Define the registry types and API in `src/features/chat/render-registry/`: keys (`event`, `artifact`, `activity`), dispositions (`render`, `hide`, `adapt`), unknown-hides default.
- 1.4 Add the default entries from the event inventory: render, hide (diagnostics), adapt (A2UI carriers).
- 1.5 Route `use-message-stream.ts` through the registry; store actions unchanged.
- 1.6 Route the tool-name dispatch in `enhanced-thread.tsx` through the registry and remove the `if` chain.
- 1.7 Render the currently ignored events with existing blocks: `agui.cancelled` (showing usage when present: the pinned UAR build may not emit it yet, see `site-agent-a2ui-policy`), `agui.subagent.*`, `agui.rag_citations`, and a read-only `agui.tool_call.approval_required` indicator.
- 1.8 Hide internal artifacts at render time so artifacts already persisted in PGlite stop showing; test with a persisted `provider_event`.
- 1.9 Visual-first capture of the changed surfaces at 320 and 1440 in both themes; view and list the images.
- 1.10 Integration check: lint, typecheck, `npm test` and `npm run build` pass, and the original screenshot scenario (a turn that emits diagnostics) shows no diagnostic cards.

### `app-a2ui-surface-renderer`

- 1.1 Add `@prometheus-ags/a2ui-react` (version from the PEM release) with exact pins, plus its `@ag-ui/core` peer (this repo does not have it; pin an exact version inside the peer range), and confirm the lockfile has one version of each official A2UI package and no ranges for them.
- 1.2 Bump `@prometheus-ags/entity-graph-core` and the `@prometheus-ags/prometheus-entity-management` alias from 4.0.2 to the same new version as `a2ui-react` (its peer is lockstep), and run an entity-graph regression check covering lists, garbage collection (4.1.0 treats list membership as a reference) and mutations.
- 1.3 Write the carrier adapter in this repo, as decided by the carrier spike in `pem-a2ui-official-0-12-0`, feeding PEM's public processor API, with tests for malformed and oversized input.
- 1.4 Add a lazy-loaded `A2uiSurfaceBlock` and register it in the render registry in place of `A2uiDisplayBlock`; keep the Mermaid path.
- 1.5 Implement the nine components with shadcn and Base UI under the flat 2.0 tokens (no borders, shadows or gradients), keyboard and reduced-motion safe.
- 1.6 Wire the default-deny action policy; surfaces are render-only, and a Button with an action renders disabled. Record the decision.
- 1.7 Measure the bundle against the app budget (under 300 kB gzipped JS for an app page) and keep A2UI in a separate lazy chunk; record numbers, including the cost of the Lit-backed custom elements.
- 1.8 Visual-first capture at 320 and 1440 in both themes, plus keyboard and reduced-motion checks; view and list the images.
- 1.9 Integration check: `npm test && npm run lint` and `npm run build` pass, and a fixture stream containing an `a2ui` artifact renders a surface in a real browser (Playwright).

### `agui-inferred-a2ui`

- 1.1 Define the inference rules and caps (depth, size, escaping; only the nine components) and record them in the change design.
- 1.2 Write golden tests first: structured artifact or event in, A2UI messages out, for `confirm`, `form`, `select`, `display` artifacts and `approval_required`.
- 1.3 Implement inference for generic structured tool results (a card with rows) with fallback to hide when over a cap.
- 1.4 Register the inferred shapes as `adapt` entries; explicit registrations take precedence.
- 1.5 Visual capture at 320 and 1440 in both themes, and integration check: `npm test && npm run lint` and `npm run build` pass.

### `site-proxy-a2ui-optin`

- 1.1 Write failing tests first: the built upstream body always carries `presentation_mode`: `"text"` while the out-of-band switch is OFF, absent, unreadable or unrecognised, and `"a2ui"` plus `client_rendering` only while it is ON; the field is never omitted; visitor-supplied values are always ignored.
- 1.2 Implement it in `server/src/domain/chat_request.rs`, controlled by the out-of-band switch file read the way the chat kill switch is read (re-read within seconds, no restart); the file variable is optional and absent means OFF.
- 1.3 Wire the switch everywhere it must exist: the `site-a2ui-optin` ConfigMap as an **optional** volume in `k8s/base/knowme-web-deployment.yaml` (absent means OFF, so the rollout cannot fail on it), the compose volume and optional file variable, and an `a2ui on|off` command in `scripts/ops/bootstrap-site.sh` that creates the ConfigMap OFF and flips it, never overwritten on deploy.
- 1.4 Route test that the A2UI message, action and surface-replay endpoints are unreachable through the public listener.
- 1.5 Check that the allowlist keeps well-formed `a2ui` artifacts and still drops malformed or oversized ones; add a size cap.
- 1.6 km-security-officer review of the opt-in and route changes, recorded in this change.
- 1.7 Done-when (local): `cargo test` in `server/` passes except the known CSP baseline failure, and on the compose stack the upstream body observed by the harness carries `presentation_mode: "a2ui"` with the switch ON and `"text"` with it OFF or absent, a visitor-supplied value is ignored, and a text-only chat turn streams the same answer text as before the change.

### `site-agent-a2ui-policy`

- 1.1 Confirm against the **pinned** UAR build (digest `688a97e4…` in `docker-compose.yaml` and `k8s/base/uar-deployment.yaml`, not `origin/main`), from its source and a live local run: the exact names and arguments of `presentation_render` and `a2ui_render` (both exist at the pinned build; `a2ui_render` is gated only by `allows_surfaces()`, `presentation_render` also needs persisted templates), the `policy.presentations.ids` field and `ui.artifacts` semantics; record the tool choice (the public agent uses `presentation_render` only, D-36); and record anything the pinned build lacks that this phase needs (the A2UI tool, UAR #358 non-streaming usage, #360 input screening, #361 cancelled usage).
- 1.2 If the pinned build lacks something needed, bump the UAR image digest in `k8s/base/uar-deployment.yaml` and `docker-compose.yaml` to a built `origin/main` and verify it (smoke test, spend-meter usage rows, the FR-8 retrieval check); the bump is a production deploy item for CP3 with the operator's approval. If nothing is lacking, record that the pinned build suffices.
- 1.3 Write the declarative presentation template for answer cards using only Card, Column, Text and Divider, validate it against UAR's validator, and record any need beyond UAR's nine components as input to `uar-a2ui-validator-parity`. Decision for this phase: the public template needs nothing beyond the nine, so change 8 does not wait on change 9.
- 1.4 Update `uar/agents/knowme-site.json`: allow only `presentation_render` (D-36), keep `a2ui_render` and every other tool and skill denied, reference the template; verify with a forced `activate_skill` fixture that `agui.tool_call.denied` still appears.
- 1.5 Record the D-15 decision with the operator for the public tool list now that `presentation_render` is added (D-36), and write the FR-11 test as `site-agent-tool-allowlist` 1.5 specifies (it does not exist yet: that task is still open), with the new list and the `tool_approval` semantics, run through the harness tap.
- 1.6 Extend `scripts/seed-site-agent.sh` to persist the template under the site identity; run it idempotently twice on the local compose stack.
- 1.7 Measure input and output tokens per turn with A2UI on and off, record against the 1,425 to 1,459 baseline, and propose `max_tokens_per_turn` if needed (feeds `site-spend-ceiling` 1.8; the operator decides).
- 1.8 First, with the policy seeded and the opt-in switch OFF, assert on the local compose stack that UAR publishes zero `a2ui` artifacts and zero `/a2ui/` patches (the precondition for merging this change). Then the red-team subset for deceptive UI, run on the local compose stack through the site proxy on :8080 with the switch ON (fake payment or login controls, spoofed system notices, injected instructions); record the stream and whether any control rendered live. Reuse the `site-redteam-prompts` runner approach.
- 1.9 Go-live gate: merge this change's PR only after the local red team passes (CI seeds on every deploy, so the policy ships with the next approved deploy and is inert while the switch is OFF). After Train B deploys with the switch OFF, confirm the public agent still answers in text; at CP3 the operator turns the switch ON; re-run the red-team subset against the live path and turn the switch OFF again if any control renders live. If the local red team fails, revert the policy and seed edits before merge and record why.

### `uar-a2ui-validator-parity`

- 1.1 Spike: write the gap table (components that agent-authored surfaces need, from change 8's template findings and any other recorded need, against UAR's nine and the v0.9.1 basic catalog) and record whether any gap exists.
- 1.2 If a gap exists: write failing tests first in the UAR repo (separate worktree) for the needed non-URL components.
- 1.3 If a gap exists: add the components to the validator enum in the UAR repo; open a PR for the operator to merge.
- 1.4 Done-when: either the PR is merged and a surface using the new component validates in a local run, or the gap table shows no need and this change closes with that evidence. Reaching production needs a UAR image bump, which is a separate operator-approved deploy item (the pattern in `site-agent-a2ui-policy`), not part of this change.

### `agui-a2ui-live-verification`

- 1.1 Playwright test on the local compose stack: a real turn produces an A2UI surface that renders as components, diagnostics are hidden, and a cancelled run shows its state.
- 1.2 Live public capture (types only) and a visitor turn on the deployed site; save under a new dated evidence folder with a README, never over an earlier folder. Pass conditions: zero event names or artifact types outside the allowlist; and if A2UI is on, at least one `a2ui` artifact or `/a2ui/` patch is present.
- 1.3 Live visual capture of the deployed site at 320 and 1440 in both themes; view and list the images. Pass condition: if A2UI is on, a surface renders as components (not code or text) in the captures; otherwise record that A2UI is off and why.
- 1.4 Cumulative diff-mode adversarial review of the phase's changes; carry CRITICAL findings back as blockers.
- 1.5 Record the operator-only boundary actions that happened (merges, PEM publish, Train A and B approvals) and close the change evidence.

## TASK MODEL ASSIGNMENTS

Key: phase path + change ID + backend task ID. The backend task ID is the ordinal that `kbd-apply list <change>` prints; the title carries the human number (`1.n`). The concrete model IDs come from this session's environment (the Claude IDs `claude-opus-5-5`, `claude-sonnet-5-5` and `claude-haiku-4-5-20251001` in its model list) and from the judge dispatch output (`gpt-6.1-sol`); the tool aliases actually passed are `opus`, `sonnet` and `haiku`. Evidence for every row, dated 2026-10-09: the harness is Claude Code; its Agent tool schema (read this session) exposes a `model` parameter with values `opus`, `sonnet`, `haiku`, `fable` and the `km-*` project agent types; it exposes **no reasoning-effort control**. **No capability benchmark was run for these tasks: assignments rest on task profile only, which is weak evidence and is labelled so.** The judge route was exercised twice this session (the assessment review); the tool reported `cross_model_check: unverified-producer-unknown`, so independence is not certified. Planning launches no workers and changes no provider configuration. The driver retains `begin-task` and `end-task`; workers return results to it.

**Legend** (the same wording applies to every row that cites the code).

| Code | Meaning |
|---|---|
| E1 | Reasoning effort: unsupported by the Agent tool (it exposes `model` only), so not set |
| E2 | Reasoning effort: gateway default, not set |
| R-opus | Security-sensitive, hard to reverse, or unknown root cause: deepest reasoning is worth the cost. Task profile only; no benchmark (2026-10-09). |
| R-sonnet | Default for implementation, tests and UI: sufficient for a well-specified task. Task profile only; no benchmark (2026-10-09). |
| R-haiku | Mechanical edit or bookkeeping with a verification step: cheapest adequate model. Task profile only; no benchmark (2026-10-09). |
| R-judge | Independence: a different model family from the producer, packet only. Independence flag: the tool reported it cannot certify (2026-10-09). |
| W1:`<role>` | Launch `Agent(subagent_type: <role>, model: <the model in the row>)`; scope: this one task; working directory: the repo the change lands in; tools: Read, Edit, Bash; result: a report to the driver, which alone runs `begin-task` and `end-task` |
| W2 | Launch `~/.claude/skills/adversarial-review/scripts/dispatch-judge.sh --mode artifact\|diff --packet <packet>` (outside this repo; exercised this session); scope: the packet only; result: `findings.json` to the driver |
| N1 | Native alternative: the driver does the task in-session |
| A1 | Availability: the Agent `model` enum and `km-*` agent types were listed in this session's tool schema (schema-verified, not exercised per type) |
| A2 | Availability: the gateway answered two judge dispatches this session; independence not certified |

| Phase path | Change ID | Backend task ID | Requirements | Provider/model | Reasoning effort | Rationale and dated evidence | Harness and route | Worker launch and handoff | Native alternative | Availability and verification |
|---|---|---|---|---|---|---|---|---|---|---|
| agui-rendering-functionality | register-pem-workspace | 1 (1.1) | Mechanical JSON edit; low risk; one file. | anthropic/claude-haiku-4-5-20251001 | E1 | R-haiku | Agent tool, `model: haiku` | W1:`km-product-owner` | N1 | A1 |
| agui-rendering-functionality | register-pem-workspace | 2 (1.2) | Governance wording; must not weaken the UAR rule. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-product-owner` | N1 | A1 |
| agui-rendering-functionality | register-pem-workspace | 3 (1.3) | Read-only verification of two commands. | anthropic/claude-haiku-4-5-20251001 | E1 | R-haiku | Agent tool, `model: haiku` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 1 (1.1) | Security classification; consequence of a wrong 'internal' call is a broken meter or client. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-security-officer` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 2 (1.2) | Rust unit tests in an existing module; patterns already present. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 3 (1.3) | Fail-closed security filter on the public path; framing subtleties. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 4 (1.4) | Integration test over existing harness (`server/tests`). | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 5 (1.5) | Document edit with pasted evidence. | anthropic/claude-haiku-4-5-20251001 | E1 | R-haiku | Agent tool, `model: haiku` | W1:`km-product-owner` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 6 (1.6) | Needs the local compose stack; real production path. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-public-artifact-allowlist | 7 (1.7) | Production verification; operator approves the deploy. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 1 (1.1) | Mechanical dependency pin; the probe already did it once. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 2 (1.2) | Unknown root cause in a third-party API change; needs reading the 0.12.0 source. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 3 (1.3) | Five concrete type errors with known locations. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 4 (1.4) | Design judgment; wrong call costs the whole renderer approach. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 5 (1.5) | Test authoring against a known bridge. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 6 (1.6) | Unverified UAR emission details; a late discovery would force a second 13-package release. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 7 (1.7) | Run existing scripts and report output. | anthropic/claude-haiku-4-5-20251001 | E1 | R-haiku | Agent tool, `model: haiku` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 8 (1.8) | Procedural; the repo has a written procedure and a history of mistakes. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 9 (1.9) | Read-only check of an irreversible step; three earlier releases were deprecated. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 10 (1.10) | Outward-facing and hard to reverse; needs an explicit go after the dry run. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | pem-a2ui-official-0-12-0 | 11 (1.11) | Registry read plus a scratch install. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 1 (1.1) | Test authoring over existing code. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 2 (1.2) | Reading a local codebase; feeds the API design. Closes the goal to leverage flint-forge as a reference. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 3 (1.3) | API design that every later change builds on; hard to change later. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 4 (1.4) | Data entry from the evidence table. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 5 (1.5) | Refactor guarded by the characterization tests. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 6 (1.6) | Refactor guarded by tests. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 7 (1.7) | UI with existing components under flat 2.0 tokens. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 8 (1.8) | Render-time filter; no migration. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 9 (1.9) | Needs image reading; standing project rule. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-render-registry | 10 (1.10) | Existing scripts plus one real scenario. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 1 (1.1) | Dependency work with a verification command. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 2 (1.2) | A two-minor jump of the app's data layer past a known behaviour change. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 3 (1.3) | Adapter with a clear contract after the spike. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 4 (1.4) | Registry wiring. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 5 (1.5) | UI craft; project design rules apply. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 6 (1.6) | Security default on a public surface. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-security-officer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 7 (1.7) | Measurement; closes an assessment unknown. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 8 (1.8) | Needs image reading. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | app-a2ui-surface-renderer | 9 (1.9) | Real browser on the production path. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-inferred-a2ui | 1 (1.1) | Rule design bounded by the nine components. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-inferred-a2ui | 2 (1.2) | Golden-file tests. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-inferred-a2ui | 3 (1.3) | Pure function with caps. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-inferred-a2ui | 4 (1.4) | Registry wiring. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-frontend-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-inferred-a2ui | 5 (1.5) | Needs image reading. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 1 (1.1) | Security test; UAR treats omission as Legacy, which allows surfaces, so OFF must be explicit. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 2 (1.2) | Security-sensitive request construction. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 3 (1.3) | The existing kill-switch volume is required and out of band; copying it unchanged would block pod start when the ConfigMap is missing. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 4 (1.4) | Route-table test over existing harness. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 5 (1.5) | Extends the allowlist tests. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 6 (1.6) | Independent review of a security change. | gpt-6.1-sol (via liter-llm gateway, localhost:4000) | E2 | R-judge | adversarial-review `dispatch-judge.sh` REST call | W2 | N1 | A2 |
| agui-rendering-functionality | site-proxy-a2ui-optin | 7 (1.7) | Real production path through the harness tap. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 1 (1.1) | Resolves assessment unknowns against what actually runs; production and compose are pinned older than `origin/main`. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-conversational-designer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 2 (1.2) | Production dependency change with a verification set; conditional on the previous task. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 3 (1.3) | Template authoring under UAR's nine components. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-conversational-designer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 4 (1.4) | Public attack surface change. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-security-officer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 5 (1.5) | FR-11 is specified but unwritten and fails on any extra model-facing tool; D-15 is undecided. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-security-officer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 6 (1.6) | Script change with an idempotence check. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 7 (1.7) | Measurement; budget decision stays with the operator. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 8 (1.8) | Adversarial testing of a public surface, run before anything reaches production. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-security-officer` | N1 | A1 |
| agui-rendering-functionality | site-agent-a2ui-policy | 9 (1.9) | Decision with security consequences; the switch is the control. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-security-officer` | N1 | A1 |
| agui-rendering-functionality | uar-a2ui-validator-parity | 1 (1.1) | Spec reading plus evidence; decides whether the rest runs. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | uar-a2ui-validator-parity | 2 (1.2) | Rust tests in UAR. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | uar-a2ui-validator-parity | 3 (1.3) | Strict `deny_unknown_fields` validator; conformance to the spec. | anthropic/claude-opus-5-5 | E1 | R-opus | Agent tool, `model: opus` | W1:`km-rust-engineer` | N1 | A1 |
| agui-rendering-functionality | uar-a2ui-validator-parity | 4 (1.4) | Either branch is a valid close; production reach is explicitly out of scope. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-a2ui-live-verification | 1 (1.1) | Real browser, real UAR. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-a2ui-live-verification | 2 (1.2) | Production evidence with assertions, so the change cannot close while the leak or rendering is broken. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-devops-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-a2ui-live-verification | 3 (1.3) | Needs image reading; pass condition stated. | anthropic/claude-sonnet-5-5 | E1 | R-sonnet | Agent tool, `model: sonnet` | W1:`km-qa-engineer` | N1 | A1 |
| agui-rendering-functionality | agui-a2ui-live-verification | 4 (1.4) | Independent judge, packet only. | gpt-6.1-sol (via liter-llm gateway, localhost:4000) | E2 | R-judge | adversarial-review `dispatch-judge.sh` REST call | W2 | N1 | A2 |
| agui-rendering-functionality | agui-a2ui-live-verification | 5 (1.5) | Bookkeeping. | anthropic/claude-haiku-4-5-20251001 | E1 | R-haiku | Agent tool, `model: haiku` | W1:`km-product-owner` | N1 | A1 |

Unresolved prerequisites: none block planning. Two are checked at execution: the PEM publish route (npm login exists as the packages' sole maintainer; ability to publish is untested) and the judge's independence flag.

## EXECUTION ROUND ORDER

Round 1 (parallel): `register-pem-workspace`, `agui-public-artifact-allowlist`
Round 2 (parallel): `pem-a2ui-official-0-12-0`, `agui-render-registry`
Round 3: `app-a2ui-surface-renderer`
Round 4 (parallel): `agui-inferred-a2ui`, `site-proxy-a2ui-optin`
Round 5: `site-agent-a2ui-policy`
Round 6 (conditional, may close with no code): `uar-a2ui-validator-parity`
Round 7 (phase gate): `agui-a2ui-live-verification`

At the end of each round that touched `src/`, run `npm run build` (the project's `on_iteration_complete` trigger). Server changes run `cargo test` in their final task (excluding the known baseline failure).

Ordering rationale: the live leak and the governance entry have no dependencies and go first. The PEM release is on the critical path for the renderer, so it starts in Round 2 beside the registry, which is independent of it. The renderer needs both. Inference and the proxy opt-in need the renderer and run in parallel: the opt-in only sets request fields and emits nothing itself, and inference runs in the client so it never touches UAR's validator. The agent policy comes after them because it is the public go-live switch and needs the opt-in plus a red-team result; its public template is limited to UAR's nine components by decision, so it does not wait on the validator. The UAR validator spike (conditional) runs after it, because UAR's validator governs only agent-authored surfaces and the public template is the first real input; it may close with no code. The cumulative gate runs once, at the end.

## Per-change validation (project constraints)

`.kbd-orchestrator/constraints.md` sets workflow triggers: `npm test && npm run lint` when a change completes and `npm run build` when an iteration (round) completes. Every change that touches `src/` ends with those, inside its final task; changes that touch `server/` run the server's `cargo test` (excluding the known baseline failure below); PEM changes run PEM's own gates (change 3, task 6). Change 10 is only the cumulative live verification, not the first time anything is built or tested.

## PROPOSED PUBLIC ALLOWLIST (change 2)

A starting point, derived from the assessment's event inventory. Change 2 task 1 audits it against a fresh capture before it is final, and every allowed and every denied name gets a test.

| Class | Names | Why |
|---|---|---|
| **Allowed artifact types** | `a2ui` | The only artifact the renderer will display; all others are internal |
| **Allowed events** | `agui.stream.start`, `agui.message.delta`, `agui.done`, `agui.error`, `agui.cancelled`, `agui.citation.added`, `agui.rag_citations`, `agui.tool_call.denied` | Client rendering and the spend meter (`agui.done` carries usage) |
| **Allowed with a path filter** | `agui.state.patch` only for paths under `/a2ui/` | A2UI surfaces may travel as state patches; the `/presentation` observation exposes internals |
| **Event-less frames** (no `event:` line; 12 of 31 frames in the live capture) | Allowed: `data: [DONE]` only. Other event-less frames (the OpenAI-format chunks) are denied unless the audit finds the client depends on them | `[DONE]` is the client's safety-net terminator; the chunks duplicate the text deltas and carry the model name |
| **Denied** | `provider_event`, `attempt_manifest`, `effective_run_policy`, `turn_manifest` artifacts; every event not listed above, including `agui.thinking.delta`, `agui.reasoning.delta`, `agui.tool_call.*` other than `denied`, `agui.memory.*`, `agui.skill.activated`, `agui.context.update`, `agui.budget.alert`, `agui.guardrail`, `agui.mcp.state`, `agui.quality.*`, `agui.subagent.*`, `agui.artifact_input_request`, and the `runtime.*` events | Internal diagnostics, or nothing the public client renders |

Open to the operator, found by the audit: denying reasoning deltas and `runtime.*` events changes what visitors see if any current feature relies on them. The audit lists any such feature; the operator decides before the allowlist ships. The spend meter's inputs are known from the code: `signal()` in `server/src/domain/agui_filter.rs` maps exactly `agui.message.delta`, `agui.done`, `agui.cancelled` and `agui.error` to meter signals, and `server/src/domain/meter.rs` reads usage from `agui.done`. All four are on the allowed list, and change 2 task 4 tests all four.

## RELEASE TRAINS AND OPERATOR CHECKPOINTS

Nothing below is done without the operator: merges, the PEM publish and production approvals are theirs (lesson: ask once at the boundary).

| Checkpoint | When | What the operator does | What is in it | Not in it |
|---|---|---|---|---|
| **CP1: Train A** | After change 2 passes locally | Merge the PR; approve the production deploy | The public-stream allowlist only (`server/`) | Any A2UI work, the registry, the PEM release |
| **CP2: PEM release** | After change 3's PR is ready | (1) Merge the PEM PR. (2) Review my dry-run report (`pnpm publish --dry-run` for all packages, packed manifests checked for `workspace:`). (3) Explicitly approve publication, or publish yourself (D-28, D-34). I stop if npm auth fails. | `@prometheus-ags/*` lockstep minor bump with A2UI 0.12.0 | Anything in this repo; publication before your explicit go |
| **CP3: Train B** | After changes 4 to 8 pass locally, including the local red-team subset | Merge the PRs with `[skip ci]`; run `scripts/ops/bootstrap-site.sh a2ui off` to create the opt-in switch (OFF) before the deploy; run one deploy (`workflow_dispatch`) and approve it; if change 8 found the pinned UAR lacks something needed, approve the UAR image bump in the same deploy; then, only after the red team, turn the A2UI opt-in switch ON (`scripts/ops/bootstrap-site.sh a2ui on`) | Render registry, A2UI surface renderer, inference, proxy opt-in (switch OFF by default), agent policy and seed, optional UAR image bump | The UAR validator change (separate PR in the UAR repo, only if the spike finds a need) |

PRs that do not need the cluster (the governance entry, KBD files) carry `[skip ci]` in the title so merging them starts no deploy. Changes to `server/`, `src/`, `uar/`, `k8s/`, `scripts/` or `docker-compose.yaml` reach production only through CP1 or CP3.

### Merge discipline (the trains are not enforced by CI)

`.github/workflows/site.yml` runs on every push to `main` and ships whatever is merged, and an approved deploy ships everything merged so far. So the trains are kept by how PRs are merged, not by the pipeline:

- **Train A (change 2):** merge without `[skip ci]`, so the deploy starts, and approve it at CP1.
- **Train B (changes 4 to 8):** every PR carries `[skip ci]` in its title when merged, so nothing deploys early. CP3 is then one `workflow_dispatch` deploy. The operator rejects any intermediate deploy run that appears.
- **CI seeds the agent on every deploy** (`site.yml`: "Seed the site agent (idempotent, every deploy)", and the agent PUT is a full replace). A merged change to `uar/agents/knowme-site.json` therefore takes effect at the next approved deploy of anything. That is why change 8's PR is merged only after the local red team passes, and why A2UI for visitors is controlled by the opt-in switch (change 7, default OFF, D-33) and not by the seed.

## DEFERRED AND CUT (explicit, with reasons)

- **A2UI actions and interactive tool approvals (D-26 trade-off).** Render-only first. Letting a surface send input back to the agent on a public site is a separate security decision; a read-only approval indicator ships instead. Revisit after change 8's red-team result.
- **UAR validator expansion (D-27).** Planned as conditional change 9: it begins with a gap spike and closes with no code if the nine components are enough.
- **A diagnostic-visibility tag in UAR.** A UAR PR that tags diagnostic artifacts would help other clients, but the allowlist plus the client registry already close the leak. Not planned.
- **A2UI spec v1.0.** `@a2ui/web_core` 0.12.0 ships a `v1_0` entry but `@a2ui/react` has none. PEM's existing v1.0-RC compatibility bridge is kept and tested (change 3); full v1.0 rendering is out of scope.
- **`@flint/react` as a renderer.** Cut: unpublished on npm (404), its own `a2ui:surface` dialect, needs the Flint gateway (assessment F13). flint-forge is used as a **design reference** for the registry (change 4, task 2), which satisfies the goal to leverage it without adopting it.
- **The rest of the `uar-integration` phase (D-25).** 25 open and 1 skipped change follow afterwards and are not planned here. This plan completes the parts on the A2UI path: `site-proxy-artifact-filter` 1.4 (change 2), and the A2UI parts of `site-agent-tool-allowlist` 1.2, 1.5 and 1.6 (change 8).

## RISKS AND TRADE-OFFS

- **The PEM release (change 3, tasks 9 and 10) is the riskiest step.** Thirteen packages, a manual token publish, and three earlier releases deprecated for `workspace:` leakage or stale builds. Mitigations: a dry run with a packed-manifest check first; the documented procedure; a stop-and-ask on any auth failure. Publishing is hard to reverse (deprecation, not rollback).
- **The 0.12.0 upgrade may be harder than the probe suggests.** The root cause of the `add` function error is not known, and the 0.12.0 Basic Catalog renders as Lit custom elements, which may fight the shadcn styling and add bundle weight (unmeasured). Change 3 has a decision gate (task 4) and change 5 measures the bundle (task 7). If the gate fails the approach changes (own React components over `web_core`), and this plan is revised.
- **A2UI on the public agent is the riskiest surface.** Mitigations: the proxy, not the visitor, controls opt-in, through an out-of-band switch that defaults OFF, where OFF is an explicit `presentation_mode: "text"` because omitting the field would let UAR choose Legacy, which allows surfaces (change 7, D-33, D-35); the public agent gets only the template-bound `presentation_render` tool (D-36); the allowlist drops everything unlisted (change 2); surfaces are render-only; the policy PR is merged only after a local red team passes (change 8, tasks 8 and 9). If the red team fails, the policy edits are reverted, A2UI stays off for the public agent, and the rest of the phase still delivers the app-side renderer.
- **Production and the local stack run an older UAR than `origin/main`.** Both are pinned to a build that predates UAR #358, #360 and #361 (verified in `docker-compose.yaml` and `k8s/base/uar-deployment.yaml`). Change 8 tasks 1 and 2 confirm what the pinned build lacks and make any image bump an operator-approved item in CP3. Until then, `agui.cancelled` may carry no usage and the client must cope.
- **The app's data layer moves two minors** (entity-graph packages 4.0.2 to the new version) as part of change 5, past a 4.1.0 garbage-collection behaviour change. It has its own task with a regression check (change 5, task 2).
- **UAR's A2UI carrier details are partly unverified.** The survey was a subagent's, and the real shape of what UAR emits is checked by a live capture in change 3 (task 6, before the PEM release) and again in change 10 (task 1). A wrong assumption there changes the adapter, not the direction.
- **Two production deploys (CP1, CP3) and one npm publish (CP2).** That is the minimum: the leak is urgent and cannot wait for the renderer, and the renderer cannot ship without the published PEM version.
- **The ledger is behind reality** (10 of 36 `uar-integration` changes recorded done while chat is live). This plan adds changes against that ledger without correcting it; correction is the deferred follow-up.

## Existing failing tests (baseline, so a red result is attributed correctly)

- `server/tests/meter_and_headers.rs` `responses_should_carry_report_only_csp_with_the_theme_hash_and_permissions_policy` fails on `main` (verified earlier this session with the change stashed). Changes in `server/` must not be blamed for it, and it should be fixed separately.
- UAR `cargo test --lib` does not compile on `main`, and several UAR integration tests do not compile (`settings_persistence`, `turn_shadow_parity`, `skill_activation_runtime`, `model_path_resiliency`). Change 9, if it runs, uses targeted new integration tests.

## Sycophancy self-check

- **S-02 (agreement without grounding):** the operator's wish for A2UI on the public agent is not assumed feasible; it is gated on a red-team result, and the renderer approach is gated on a decision task.
- **S-07 (scope creep):** the conditional UAR change, the diagnostic tag in UAR and the full v1.0 support were cut or gated; actions and approvals are deferred.
- **S-03 (caveat collapse):** the plan names its costs: three operator checkpoints, a risky publish, a possible approach change, two deploys.

## COMMANDS TO RUN

```
/opsx:new register-pem-workspace
/opsx:new agui-public-artifact-allowlist
/opsx:new pem-a2ui-official-0-12-0
/opsx:new agui-render-registry
/opsx:new app-a2ui-surface-renderer
/opsx:new agui-inferred-a2ui
/opsx:new site-proxy-a2ui-optin
/opsx:new site-agent-a2ui-policy
/opsx:new uar-a2ui-validator-parity
/opsx:new agui-a2ui-live-verification
```

The change structures are emitted by the plan stage after the adversarial review, then registered with `prometheus kbd change register` and `task register`.

## Adversarial review

Three review passes ran, with different reviewers. Independence is limited and stated: the gateway judge (`gpt-6.1-sol`) is a different provider but its tool reported it could not certify independence, and the two `artifact-critic` subagents are the same provider family as the producer (a different, larger model each time, in a fresh context). The cap of two revision rounds was reached.

| Round | Reviewer | Result | What was done |
|---|---|---|---|
| 0 | Gateway judge `gpt-6.1-sol`, earlier draft | BLOCK: 3 CRITICAL, 3 WARNING | Moved the UAR validator spike after the agent policy (it governs only agent-authored surfaces); added the flint-forge design review and the cut; proved `uar/agents/` is this repo's own directory; added per-change validation, a proposed allowlist, the full judge path |
| 1 | Gateway judge on the revised plan | **No result**: ran over 70 minutes under heavy machine load (load average 40 to 75) and was stopped | Replaced by the `artifact-critic` below; stated here so nobody assumes it passed |
| 1 | `artifact-critic` (opus) | 2 CRITICAL, 8 WARNING, 2 SUGGESTION | Each claim checked against files first (seed runs every deploy and is a full replace; the pinned UAR digest predates #358, #360, #361; the app pins entity-graph at 4.0.2; the meter reads four signal events). All accepted: out-of-band opt-in switch, PEM dry run then explicit approval, merge discipline, pinned-UAR check and conditional bump, FR-11 and D-15 tasks, entity-graph regression task, carrier spike moved before the PEM release, gates inside tasks, allowlist tests, red-team location, live-verification pass conditions; D-32 to D-34 recorded |
| 2 (last) | `artifact-critic` (fable) | Of 13 earlier findings, 9 fixed and 4 partly; **2 new CRITICAL**, 5 WARNING, 3 SUGGESTION | The two CRITICALs were verified in source before acting: with the switch OFF the proxy omitted the presentation fields, UAR resolves that to Legacy, and Legacy allows surfaces (at `origin/main` and the pinned build); and CP3 deployed a required ConfigMap volume before the ConfigMap existed. Fixed: OFF is an explicit `presentation_mode: "text"` (D-35, supersedes D-33's OFF), the volume is optional and the switch is created OFF before the deploy, the public agent gets `presentation_render` only (D-36), the carrier spike hand-seeds its own scratch template, event-less frames are in the allowlist, the switch is wired in compose, FR-11 is written not updated, `@ag-ui/core` is pinned, the decision range and model-ID sources are stated |

**Not re-reviewed:** every fix made after round 2 (the explicit-text OFF state, the optional volume, the tool choice and the rest above) has been checked by me against the source files but by no second reviewer, because the cap of two rounds was reached. Treat the opt-in switch design (change 7) and the public-agent policy (change 8) as the parts most worth a fresh look when their changes are reviewed in diff mode.

**Unresolved review findings:** none known open. The two caveats are the independence limit and the missing round-1 gateway result, both above.

PLAN COMPLETE
