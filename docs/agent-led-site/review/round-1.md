# Adversarial review, round 1 (2026-10-01)

The draft reviewed is `agent-led-site.md` as first assembled. It went to two fresh-context `artifact-critic` reviewers, each with opposing priorities. Each reviewer saw only the artifact, its research sources and the code. The model gateway for the cross-model judge was unreachable, so this is the adversarial-review skill's documented harness-native fallback: `isolation_mode: harness-native`, same model family.

**Verdict: BLOCK. The reviewers found 8 CRITICAL findings and about 30 WARNINGs.**

Orchestrator verification of the reviewers' claims:
- **F2-W2** (`runtime.know-me.tools` is live today) is half wrong. Namespace `knowme` does not exist and the host returns 404 (checked 2026-10-01). The rest of the finding stands. The exposure starts on the first deploy unless the lockdown lands first. The deploy cannot delete a route (no `--prune`, and the Role has no `delete`).
- **E-W7** says the 8.7k-token figure is unsourced. It is sourced: the `run_finished` event of a local-stack run on 2026-09-30 reported `"input_tokens":8732` for the question "In one sentence, what is KnowMe?". At that point the knowledge base held zero embedded chunks, because every document had failed to embed.

## Lens E: evidence and claim integrity

### CRITICAL
- **E-C1 — the agent's fallback page is broken.** The "About page (exists today)" that §5.5, §5.6(a), FR-6 and §8.0 point the agent at is `/settings/about`. That route is excluded from the site build (`src/App.tsx:33-50`, `use-site-config.ts:22`), so it returns 404. The prompt fix therefore repeats the "invented Contact page" defect. **Fix:** point to the in-chat company topic now. Publish a real `/about` page in Phase 1 and make it a dependency of `site-agent-prompt-fixes`. FR-6 and FR-9 may name only routes that pass FR-23.
- **E-C2 — the launch gate cannot catch the observed tool call.** The gate asserts `tools.allow` is empty, and it already is. A run still invoked a tool. No Phase 0 change addresses this. §6.2 T2, §1.4 and FR-11 claim "no actions". Superseded in part by F-C1 below.
- **E-C3 — false privacy claim.** §5.5 says "memory.conversation already keeps threads on-device". In fact UAR stores conversation state server-side in SurrealDB, with no retention set (§4.5, §6.3).
- **E-C4 — §7.1 overstates the crawler evidence.** It calls an SEO blog (getpassionfruit) "vendor documentation". It also says crawler non-rendering is "confirmed", which contradicts §3.7's evidence gap. C1 is December 2024 data and did not measure Claude-SearchBot or Claude-User. Use [C1] only and confirm from our own logs.
- **E-C5 — the experiment is underpowered.** 2,000 sessions per arm detects only about a 50% lift at a 3% baseline. The evidence predicts "none to 16.3%" [A22] and "+3.00%" [R5]. "Or 2,000" works as an optional stopping point. **Fix:** a fixed horizon at the n from §7.4 for a 20% relative lift at the measured baseline (currently 7,000–12,000 per arm), with no interim stopping. If 12 weeks pass below that sample, the result is HOLD.

### WARNING
- **W1.** The rule that "[R#] never stands alone" is broken in §1.2 (item 3), §3.2 ([R5], [R10]) and §3.5 ([R8], a practitioner essay). [R6] is the same Vercel data as [C1], so it is not corroboration.
- **W2.** Qualifiers were dropped:
  - "Visitors ignore site chatbots" rests on 9 users in a qualitative NN/g study.
  - "No measured precedent" is an absence of evidence. Change "say that version fails" to "argue against that version".
  - B1 is pre-LLM.
  - "Autonomy predicted satisfaction" is [A21], not [B1].
- **W3.** Intent is reported as behaviour. Write "only 27% say they would try again". "49% would have used; 7% did" are separate figures, not one conditional figure.
- **W4.** Liability is generalised. The source is a Canadian tribunal, not binding precedent elsewhere.
- **W5.** The honesty bet misreads [B18]. Being exposed is worse than self-disclosing, and concealment is unlawful [C24]. [B19] says ">40%" of weekly AI users, in a news context. "Our audience skews heavy" is uncited, so it is an assumption to measure. [B18]'s own caveat (it is about a person's work, not a concierge) must stay.
- **W6.** "The novelty is real" contradicts the preceding line and refers to something not built. Change it to "If built, the narrow difference…".
- **W7.** $0.075 is an illustrative session shape, not a measurement. §1.7 states caching as fact, but §4.8 lists it as an open question. The 0.7 top-3 threshold needs a UAR file citation (`src/uar/runtime/manager.rs` ~3766-3845).
- **W8.** Strength labels: B3 and B5 should be small qualitative studies. B6 is a favourable vendor result. Only B7 is evidence against the vendor's interest.
- **W9.** A2UI contradictions:
  - §2.3 "[built]" A2UI blocks contradicts §4.3 (legacy artifact forms only).
  - §5.4's text fallback and `artifactType` catalog contradict §4.3's v0.9.1 registry and FR-12.
  - Fix: add §8.0 item 6 so the §4.3 registry supersedes §5.4.
- **W10.** §7.1 says "exactly one public route". The site build actually exposes `/`, `/threads` and `/threads/:id`. Applebot renders JS [C1].
- **W11.** The llms.txt claims in §7.2 are not in the research (v2 Aug 2026, 5–15% adoption, Anthropic/Perplexity support). The 300K-domain study is SE Ranking's, not Ahrefs' [C6].
- **W12.** §7.3 has uncited claims: FAQ extraction reliability, 40–60-word answers, specificity, Google split-content guidance, "skeleton" statuses.
- **W13.** §4.5 says the server stores "nothing else about the visitor". This contradicts §6.3 and T13: IPs and session ids are in logs, and data transfers to Alibaba.
- **W14.** §8.9 puts streamed replies in a live region. This contradicts §3.5's rule to announce status once, not per token.
- **W15.** §3.6 says MCP Apps "executes third-party code in our origin". It runs in a sandboxed iframe [D6, D25].
- **W16.** `handoff_clicked` has almost nothing to count. Contact is removed and no waitlist exists, so the base rate is likely below 3–5%.
- **W17.** Phase 3 compares chat+widgets against static, so a GO cannot be credited to widgets. The 15% and one-third thresholds measure usage, not effect.
- **Suggestions:**
  - "keeps output auditable [B16]" is the wrong cite.
  - The Personal vs Team Token Plan quotes differ.
  - Verify the AG-UI 1.0 `CUSTOM` fields: `metadata` replaced custom fields [D1].
  - Appendix A read-date should be 2026-10-01.
  - §6.3: the session id leaves the device in `X-UAR-Session-ID` [C29].
- **Uncomfortable thing.** "The site is the demo" cuts both ways. One screenshot of the agent misbehaving discredits UAR itself, and developers are the audience most likely to try. The kill criteria treat harm as cumulative, but one incident is enough. The evidence supports shipping Phase 1 and keeping the full runtime demo as an opt-in sandbox until enforcement is proven.

## Lens F: feasibility, security, plan

### CRITICAL
- **F-C1 — "zero tools" is false.** In UAR, an empty `tools.allow` means `SelectionMode::Auto`, which picks tools at run time (`src/uar/domain/policy.rs:235-240`, `:86-90`). `SelectionMode::None` is the mode that means no tools. `skills.prefer: []` maps to Auto in the same way (`:227-232`).
  - The observed tool call was configured behaviour.
  - A "hard-deny on empty" change would contradict UAR's semantics.
  - The empty-list test would lock in the dangerous state.
  - The ~8.7k tokens are likely Auto-mode run context, which agent config may be able to fix.
  - **Fix:** set tools and skills to an explicit None in the artifact (confirm the syntax with UAR). Make FR-11 assert the effective run policy `tools.mode == none` from UAR's effective-policy output. Re-measure tokens. Correct §1.4, 2.3, 4.1, 5.1 and 6.2.
- **F-C2 — the deletion path does not exist.** UAR routes `/api/sessions` and `/api/sessions/{*path}` to `legacy_sessions_route_disabled`, which returns 404 (`server.rs:1604-1605`, `:3337-3349`). The client already knows this (`use-chat-messages.ts:63`). This affects §4.5, §4.7, §6.3, §6.4 item 5, FR-20 and `site-retention-and-privacy`.
  - The real cross-visitor read vector is `POST /api/chat/completion` with another visitor's `X-UAR-Session-ID`. FR-34 does not cover it.
  - **Fix:** find UAR's real deletion and retention primitive and make it a Phase 0 change. Remove the dead routes from the proxy allowlist. Extend FR-34 to chat completion and resume.
- **F-C3 — Phase 0 exit criteria depend on later phases or on nothing.**
  - 6.4 item 9 (component and link allowlists) maps to Phase 2 work.
  - The golden set is created in Phase 1, and its composition needs Phase 2 widgets.
  - Items 10 (red-team) and 11 (SHA/digest pins) have no owning change.
  - No staging environment exists. CI smoke runs against production.
  - FR-36's "offline notice" UI is Phase 1.
  - `citation-block.tsx` already renders any URL.
  - **Fix:**
    - Move the citation-link allowlist to Phase 0, and a text-only golden set too.
    - Assign owners for items 10 and 11.
    - Make staging an operator decision, or rewrite the gate as "against production before DNS cutover".
    - Move the offline and 429 client states into Phase 0.

### WARNING
- **CI smoke test.** It sends `dual` but greps for `"type":"TEXT_MESSAGE_CONTENT"`. Dual emits `agui.message.delta` without `type`, so the test can never pass. **Fix** in `.github/workflows/site.yml`.
- **runtime.know-me.tools.** Removing the manifest does not delete the live route: there is no prune and no delete verb. Delete the route explicitly with operator credentials, update the smoke steps that hit the host, and verify it is gone. The host serves `/metrics` and `/admin` once a route attaches.
- **Spend ceiling.**
  - Counting at `agui.done` misses disconnect-cancelled runs, whose input is already billed (`manager.rs:703-723`).
  - Counters are per pod.
  - An env kill switch needs a redeploy.
  - Title requests are a second model call.
  - **Fix:** charge an estimate at admission, keep a shared counter (UAR principal budget or a shared store), and reload the kill switch from a mounted ConfigMap file.
- **Session binding.** An in-memory map breaks across 2 replicas. **Fix:** derive the upstream session id as HMAC(secret, cookie id ‖ thread id). It is stateless and covers completion, resume and artifact-response.
- **Prerender.**
  - FR-1 needs the React chips and composer in the initial HTML, which a Markdown generator cannot produce.
  - There are no topic routes.
  - `npm run build` is plain `vite build`.
  - `/about` does not exist.
  - **Fix:** a Phase 1 decision between React SSG (or Framework mode) and static-plus-island, with `/about` as a deliverable.
- **FR-13.** `sequence` and `eventId` exist only in `agui_spec`, and the dotted `agui.state.patch` is `{kind, phase, request_id, patch}`. **Fix:** migrate the client to `agui_spec` in `site-surface-registry`, or restate FR-13 using SSE `id`.
- **Catalog.**
  - UAR's nine components have no link, URL, image or citation component, so the download, next-steps and CTA cards and the per-field citations need a UAR catalog change from outside maintainers. The two-week timebox ignores that.
  - Surfaces are published only through the `a2ui_render` and `presentation_render` tools. Phase 2 therefore needs an explicit, narrow tool exception (`Selected: [presentation_render]`), which contradicts §8.10 and T2 unless stated.
  - The §5.4 / FR-12 conflict needs resolving.
- **Memory auto-capture.** `memory_enabled` defaults to true and `auto_capture` defaults to true. Extracted memories are stored under `user_id=knowme-site`, and FR-33 does not cover them. Recall is ANDed on `session_id` (vendored `surreal.rs get_all_memories`), which answers 6.4 item 6. **Fix:** inject `memory_enabled:false` at the proxy or disable auto-capture for this agent, and bring the memory table under FR-33.
- **Proxy guarantees are overstated.**
  - `upstream.rs:52-60` passes upstream status and body through as-is. Upstream 5xx is not logged.
  - `artifact_response` accepts any `Content-Type` and has no body check (`site_proxy.rs:85-99`).
  - `session_messages` forwards the query string.
  - **Fix:** map non-2xx to `AppError`, and require JSON plus a size and schema check on artifact-response.
- **Experiment.**
  - Underpowered (same as E-C5).
  - No fixed analysis point.
  - `handoff_clicked` is defined "out of the chat flow", so the static arm is near zero. Use one event definition for both arms.
  - The localStorage bucket is device storage under ePrivacy Art. 5(3), so it needs a legal decision on consent. FR-40's "scoped to the session" contradicts a persistent bucket.
- **Suggestions:**
  - Read the run id for resume from `agui.stream.start.request_id`, because the proxy strips the `x-uar-run-id` response header.
  - `a2ui_render` needs only negotiation.
  - Pick one caching assumption.
  - CI holds `UAR_JWT_SECRET`, which can forge any principal, a larger exposure than T14 states.
  - Missing operator decisions: staging, the Alibaba DPA/SCCs, EU geo-policy, whether `runtime.know-me.tools` is needed at all, and the spend numbers.
- **Already exists** (listed as PLANNED): UAR emits `agui.tool_call.denied` (`sse.rs:751`), so "Blocked by policy" needs only a client case.
- **Uncomfortable thing.** The security case rests on "zero tools", and that is false. The erasure path points at a disabled route. Phase 0 could exit green while the public agent can be steered into tools and visitor data cannot be deleted.
