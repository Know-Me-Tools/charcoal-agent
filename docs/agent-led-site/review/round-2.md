# Adversarial review, round 2 (2026-10-01)

Revision 2 was reviewed by two new fresh-context `artifact-critic` reviewers, using the same opposing lenses as round 1 (`isolation_mode: harness-native`). Both returned **BLOCK**. This was the last review round. Every finding below is either fixed in the final revision or listed in the document's "Unresolved review findings" section.

## Operator decision taken after round 2

- **DNS cutover moves to the end of Phase 1.** `know-me.tools` stays on Lovable until the crawlable topic pages, `/about`, the fixed chips, the failure states and the analytics exist. Phase 0 makes the site safe to deploy; Phase 1 is the public launch, and the cutover is its last change. Decided 2026-10-01. This resolves E2-C2.

## Facts sheet (verified against code; every section must agree)

**F1. Tool exposure (E2-C1, F2-C1, F2-W1).**
- An empty `selected` list is normalised to `tools.mode = none` at run admission (`manager.rs:3367-3368`).
- UAR still registers `activate_skill` on every run (`manager.rs:4116-4127`). The tool projection exempts built-in `ModelOnly` model-control tools from tool selection (`turn/contributors.rs:209-222`; `activate_skill.rs:61-63`), so the model is still offered `activate_skill`.
- `effective_run_policy` is computed before that registration, so it cannot show this.
- `activate_skill` is `ApprovalClass::Required` (`native_skill.rs:67-79`).
- **Rules:**
  - `tool_approval: "deny"` is a REQUIRED launch control, and the only lock on `activate_skill`. It is not "a second lock".
  - The launch gate (FR-11) passes when `tools.mode ∈ {none, selected}` and `tools.ids` set-equals the D-15 list. `none` is correct exactly when the list is empty. `tool_approval == deny` must hold while the list is empty. The model-facing tool names in the run's `turn_manifest` (`TurnManifest.selected_tools`, `manager.rs:5045-5060`) must equal the allowlist plus `activate_skill`, with `activate_skill` recorded as reviewed and blocked by `deny`.
  - The forced-call fixture uses `activate_skill`, the one tool the model can call, and must yield `agui.tool_call.denied`.
  - Before any D-15 addition switches approval to `auto`, one of two things must be true. Either UAR has changed so it drops `activate_skill` when `skills.mode == none`, or a test proves that an `activate_skill` call under `auto` is rejected and does not hang. Under `auto`, a Required-class tool waits on `POST /api/uar/runs/{id}/tool-approval`, which the proxy does not route. Until then, approval stays `deny` and allowlisted tools cannot run, so the sandbox depends on this.
  - The tool call seen in local testing may have been `activate_skill`.

**F2. The launch configuration exists in the working tree.** `uar/agents/knowme-site.json` carries `extensions["uar.run_policy"]`: tools `selected []`, skills `none`, MCP servers `none`, `tool_approval` `deny`. It was seeded to the local stack on 2026-10-01, and the agent record returns it. Label it CURRENT (verified locally by seeding), not "planned". A malformed or misspelled key is dropped silently (`RunPolicy` has no `deny_unknown_fields`, `policy.rs:153-193`).

**F3. Erasure (F2-W2, F2-W3).**
- UAR has no session delete and no session TTL.
- Visitor text also lands in `checkpoint` records (`manager.rs:6181-6215`), in cost entries (`:6485-6501`) and in tool-admission evidence (`:1737`).
- Erasure and retention must enumerate every store, and each must be tested by a direct SurrealDB query, since UAR has no read route.
- The per-conversation server delete (FR-20) depends on a UAR change. It is conditional, not a Phase 0 MUST.
- Phase 0 default: an operator-scheduled purge of every store, plus a published, request-based erasure process.
- `site-session-binding` does not depend on the deletion work.

**F4. Spend cap (F2-W5).** No `max_tokens` key exists in the agent policy (`AgentPolicy` holds only provider, tools and skills; `domain/artifact.rs:213-217`). The real output cap is the provider or model `max_output_tokens` in settings (`settings/manager.rs:1934`, `llm/registry.rs:104`). UAR already has an agent-scope cost budget (`manager.rs:6483-6487`), which is a candidate for D-4.

**F5. Artifact leakage (F2-W8).** Every run streams `effective_run_policy` and `turn_manifest` artifacts. The proxy passes them through and the client adds every `agui.artifact` to the thread. Phase 0 change: the proxy drops these artifact types on the public path, and FR-11 reads them in a test harness instead.

**F6. artifact-response (F2-W6).** Remove the route in `site-proxy-hardening`, since nothing uses it in Phase 0. Binding it with a run token is a Phase 2 exit criterion.

**F7. Phase 0 routes (F2-W9).** In Phase 0 the agent names no site routes. FR-6 and FR-9 route checks start in Phase 1 with FR-23.

**F8. CI secrets (F2-W4).** Moving the signing secret, admin key and database password out of CI needs its own change, `ci-secrets-out`, which must land before the first deploy. It replaces the seed job's JWT minting with a pre-minted, scoped token.

**F9. Sandbox gate (F2-W10).**
- The Phase 2 exit adds three checks: `presentations.mode == selected` with named template ids, the `turn_manifest` tool list, and the `activate_skill`-under-`auto` test.
- The opt-in sandbox does not protect against developers, the very people who will click it. A misbehaving sandbox widget is a brand incident like any other, so kill criterion 2 covers it.

**F10. Experiment (E2-C3, E2-W1, F2-W7).**
- `sessionStorage` is still device storage, so no claim of "no consent needed" may stand. D-10 defaults to "no bucket until counsel decides". Server-side assignment is an option, but the cookie used for binding must not be stretched to cover measurement.
- The sample size at a 3–5% baseline (two-sided, α 0.05, power 0.8, 20% relative lift) is about 8,200–13,900 per arm. At a 1% baseline it is about 43,000. For a 50% lift it is about 1,500–2,500.
- Remove the calendar-week fallback.
- A third arm raises the total sample by half.
- §1.6 must use §9's GO / HOLD / NO-GO rules.

**F11. `a2ui_render` (E2-W3, F2-S1).** It is gated by `tools`, like `presentation_render`. Delete "needs only the negotiation" wherever it appears.

**F12. Contact (E2-W4).** §1.3 promises "a plain page", not a person. A data-request contact is "Needed by: Phase 0 exit" for the privacy notice (D-8 or a separate decision).

**F13. Memory (S-1).** Memory is "not enabled (default false, unset in config)". It is not "disabled in the deploy config".

**F14. UAR revision label (S-2).** Cite UAR source as "UAR main (e6a2caae); anchors checked at fefbf35e".

## Lens E, round 2 (BLOCK, 3 CRITICAL)

- **E2-C1.** FR-11 asserts `tools.mode == selected`, which fails on the correct launch configuration. Fixed by F1.
- **E2-C2.** The document named Phase 1 as the launch, but the plan cut over in Phase 0. Resolved by the operator decision above.
- **E2-C3.** The no-consent-banner conclusion contradicted [C29] and §6.3. Fixed by F10.
- **W.** Warnings:
  - **E2-W1:** sample numbers. Covered by F10.
  - **E2-W2:** deletion rules disagree. Covered by F3.
  - **E2-W3:** `a2ui_render`. Covered by F11.
  - **E2-W4:** contact. Covered by F12.
  - **E2-W5:** §5.6(c) labels the token cause "verified". It must say "probable; unverified until re-measured".
  - **E2-W6:**
    - `use-chat-messages.ts` still calls `/api/sessions/{id}/messages` for persisted threads.
    - The "client already skips it" claim is wrong.
    - Add that file to the removal list.
  - **E2-W7:** forced-call fixture. Covered by F1, which uses `activate_skill`.
  - **E2-W8:** §5.2's six chips must become the four chips in §2.2. Delete §8.0 items 9 and 10.
  - **E2-W9:** cross-references are wrong after §2.4 was inserted:
    - 6.4 "item 1" should be item 3.
    - FR-32 should trace items 8 and 9.
    - §7 references to §2.3, §2.4, §2.6 and §2.7 must be renumbered.
    - FR-2, FR-3, FR-21, FR-24, FR-27, FR-28 and FR-29 trace the wrong sections.
    - §9 points to "section 2.9" for the fallback.
    - The §9 risk row about T14 is out of date.
  - **E2-W10:** legal and external claims outside threads A–D lack read dates. Examples: Singapore adequacy, the GDPR fine tiers, CCPA thresholds, CalOPPA, the EC FAQ, the CSA note, and the OpenAI, Google, React Router and Anthropic pages. Add them to Appendix A with read dates, or mark them "unverified, counsel to confirm".
- **Suggestions:**
  - §7.1 credits Googlebot figures to [C1]; they are [C2].
  - Restore [A17]'s 9-user limit and [B18]'s caveat in §3.8.
  - §3.7 cites [R] alone.
  - Art. 50 says "at the latest at the time of the first interaction", and "unless obvious".
  - Restore B25's "confirm on EUR-Lex".
  - [C14] is "per outcome", not "per resolved conversation".
  - Widget names must be kebab-case everywhere.
- **Part 4 (correction scaffolding):** rewrite every "Correction", "earlier draft", "round-1", "F-C#", "E-C#" or "W#" passage as current fact. History stays in `review/`. §8.0 becomes "Key constraints" (current facts only), and FR "Trace:" fields cite sections, not review ids.
- **Part 5.** The recommendation mostly follows from the evidence. The real case for the agent layer is demo value at low cost, not measured lift, and the document should say so plainly instead of resting on reviewer authority.

## Lens F, round 2 (BLOCK, 1 CRITICAL)

- **F2-C1.** `activate_skill` is exposed and FR-11 is blind to it. Fixed by F1.
- **Round-1 verdicts:**
  - F-C1, F-C2 and F-C3: PARTIAL. Covered by F1, F3, F7 and F8.
  - CI smoke, runtime host, prerender, FR-13, memory and the proxy guarantees: RESOLVED.
  - Spend: PARTIAL. Covered by F4.
  - Session binding: PARTIAL. Covered by F6.
  - Experiment: PARTIAL. Covered by F10.
- **Warnings:** F2-W1 through F2-W10, as mapped into the facts sheet above.
- **Suggestions:**
  - S-2: the "proxy-injected run policy fallback" is unspecified. Remove it.
  - S-3: under D-1's default, production before cutover can be reached through a Host header. Run gates only after the Phase 0 controls are deployed.
  - S-4: add an incident on-call owner decision (D-16).
  - S-5: the FR-11 test cannot reach `GET /api/uar/runs/{id}` once the NetworkPolicy is in place. Read the streamed artifact through the proxy test harness, or run the test from the seed job.
- **Missing operator decisions:**
  - The D-12 fallback, now covered by F3's default.
  - Incident on-call (D-16).
  - Counsel confirmation of CCPA applicability and the Art. 50 provider reading (D-17).

## Uncomfortable things raised

- **Lens E.** The opt-in sandbox does not protect against developers, who are exactly the people who will click it. The Phase 0 gate, as written, would fail on a correct config, and the fastest way past a red gate is to loosen it.
- **Lens F.** Revision 2 traced the policy resolver but never read how the model's tool list is built. The deny setting it called redundant is the only lock on the one tool the model can still call.
