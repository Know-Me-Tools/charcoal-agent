# Plan: site-chat-hardening-and-polish

Date: 2026-10-12 (revision 2, after adversarial review round 1). Phase path: `site-chat-hardening-and-polish`.
Inputs: `assessment.md` (adversarially reviewed), `goals.md` (updated this revision), the operator's decisions of 2026-10-12, and four Plan-stage research reports now saved under `evidence/` (02 to 04, sanitized: this repository is **public**).
OpenSpec available: YES. Changes: 15. Tasks: 79 (the task lists and the assignments table each have 79 entries).

## Operator decisions this plan implements (2026-10-12)

1. Duplication policy (b): prose is the answer; the card is title + one-line summary + source; citations are grouped in one Sources block. Citations stay.
2. Remote images in replies: own hosts only, enforced in sanitizer and `img-src`.
3. Reply links: shown the way citation cards show them (allowlisted hosts clickable, others as visible text).
4. HTML and Mermaid previews stay **enabled**. The operator answered "No, enable both" to my proposal to block, then "go with your recommendations" to my revised recommendation (keep both, add an isolating CSP to the preview frame, pin Mermaid strict, prove it in a browser). The assessment's earlier lean towards disabling was superseded by that exchange. See risk R3: the proof may show that scripted previews cannot survive an enforcing CSP.
5. Fixed caption on every A2UI surface, app-rendered, visually distinct from model `caption` text; wording needs content-officer review and operator approval.
6. Context panel becomes About / Sources on the site.
7. Better empty-state copy; starter prompts = an LLM-generated pool, reviewed, with the device ranking locally.
8. Step visibility in tiers: tool steps and citations; reasoning as an indicator; memory recall is not shown (D-P3).
9. Knowledge-base expansion from six product directories and the full and mini skill packages, plus researched landscape and competition, authored as OKF under `docs/knowledge-source/<product>/`.

## Findings from Plan-stage research that change the plan

- **P1. Memory recall is disabled for visitors.** `server/src/domain/chat_request.rs:70` sets `memory_enabled:false` on every turn (FR-41). All visitors share one upstream principal, so enabling recall could cross visitors. "Memory recall chunks" therefore do not exist on the site and stay that way (D-P3).
- **P2. The KB ingests flat `content/knowledge/*.md` only**, no subdirectories, no front-matter parsing, recursive 1000-character chunks, `top_k=5`, `min_score=0.5`. OKF is the *source*; a build step produces flat KB files. Because `sources` live in frontmatter that the build strips, the build must write an in-text attribution line (source and retrieval date) into every section that makes an external claim.
- **P3. FR-8 checks are fragile** for `ipfs-sync-for-obsidian.md` and `the-boss.md`. The eval must include those questions.
- **P4. The seed runs only inside the deploy job** and re-PUTs the agent each run. The new content workflow has a `sync` input (`kb`, `agent`, `all`) so prompt and template changes can reach UAR without an image build.
- **P5. The live KB states things the source repos contradict**: desktop "available now" on macOS/Windows/Linux, mobile "not certified on a physical device", The Boss platforms and installer sizes, company name. These corrections ship first and independently (change 13), not behind the research.
- **P6. Publishing hazards.** This repository is public, so committing a file to `docs/knowledge-source/` is publication, and so is committing this plan. The hazards found in the source directories (sensitive material and gaps that must not be published) are recorded in a **local-only, gitignored** file, `.prometheus/knowledge-evidence/product-hazards.md`, not here. Handling is in D-P1 to D-P7 and the tasks.
- **P7. The KB is also compiled into the client.** `src/lib/link-policy/corpus-urls.ts` globs `content/knowledge/*.md` at build time and every URL in it becomes an allowlisted link; `content/` is copied into the web build (Dockerfile) and `src/test/brand-naming.test.ts` scans `content/knowledge`. So (a) a growing KB grows the bundle that change 8 cuts, (b) competitor and attribution URLs would become allowlisted reply links unless the allowlist is restricted, and (c) a `sync: kb` run updates UAR but not the live bundle. Handling: 3.2 builds the allowlist from an explicit, reviewed URL list rather than the whole corpus; 5.2 derives citation display names from the uploaded filename by rule (strip the hash, de-slug), so no per-file map ships in the bundle; 8.2 and 8.5 are re-baselined after change 14's build; `site-content.yml` runs the brand-naming test.

## Decisions I am making (defaults; reversible; flagged for the operator)

- **D-P1 Company name.** "KnowMe AI, LLC" (live site footer and KB) until the operator confirms the legal name (source docs say "KnowMe, LLC"). Gate at 14.4.
- **D-P2 Pricing and tiers.** Excluded; content says pricing has not been announced.
- **D-P3 Memory chunks.** Not shown; recall not enabled; pinned by a regression test (4.5).
- **D-P4 PatientGPT / prior-auth.** Included as a public-safe product description; **no committed file is written until the operator confirms the client's consent (task 11.0)**, because commit equals publication. No client name, patient data, credentials, or compliance/certification claims.
- **D-P5 Licences.** Stated only where a licence file exists; otherwise "licence not yet published".
- **D-P6 Comparative claims.** Each claim about another product carries URL and retrieval date in `sources` and an in-text attribution line after the build; paraphrase, with quotes under 15 words; capability and trade-off framing, not superiority. Counsel review of comparative-advertising or regulated-domain wording is **not** arranged; the operator decides whether to arrange it before change 12 publishes (gate 14.4).
- **D-P7 Reasoning visibility.** Indicator only, no text. A summary is deferred.
- **D-P8 Deploys.** Production image deploy (Train C) once, after the integration gate, operator-approved, with the CSP flip as its own commit so it can be reverted by changing one header name. Content and agent/template sync use the new workflow, each run operator-dispatched through the `production` environment. Interim PRs carry `[skip ci]`.
- **D-P9 Size.** Two workstreams in one phase (UI/security: 01, 03–08, 15; knowledge: 02, 09–14), touching at 02, 07 and 05.1. A split into two phases is available if the knowledge work runs long.
- **D-P10 Private evidence stays private.** The claims-versus-evidence table (9.1) names private repo paths, so it is kept untracked under `.prometheus/knowledge-evidence/`; committed OKF documents cite only public URLs or product-owned public pages, never private repo paths.

## Scope cuts and deferrals

- Public-surface items not in the goals (prompt-caching toggle, thread-list visibility, other copy) stay out unless a task names them.
- Deferred: reasoning summaries, memory display, automatic regeneration of the starter-prompt pool, the remainder of `uar-integration` (D-25, D-15), a no-deploy path for starter prompts (see 7.4).
- No new runtime dependencies.

## Recalled lessons that shape ordering

Real model early (4.4, 5.5 run on a local stack before the deploy, and again on production); assertions count only after a mutation check fails on the bug (3.1, 5.3, 6.5); look at captures (1.2, 6.4, and the Round 4 gate); record a decision when a PR reverses one; `tier-guard.sh` blocks command text, so scripts are written with the Write tool; server tests need `KNOWME_WEB_DIST_DIR=tests/fixtures/web`.

## CHANGE LIST (ordered)

1. **site-impeccable-design-context**: design foundation. Depends: NONE. Agents: km-creative-director, km-chief-content-officer, km-qa-engineer. M. HIGH. Exit evidence: design context committed; captures and a ranked critique/audit findings list exist in `evidence/`; copy brief approved by the operator.
2. **site-kb-content-pipeline**: OKF bundle skeleton, OKF to flat-KB build, validator, content workflow with `sync` and `dry_run` inputs and the `production` environment, eval harness, committed live validator. Depends: NONE. Agents: km-devops-engineer, km-qa-engineer, km-security-officer. L. HIGH. Exit evidence: a dry run on a branch checkout passes; building a tree with no OKF sources leaves `content/knowledge/` byte-identical; the validator rejects a planted fake secret, a planted banned assertion and a missing FR-8 file (mutation checks).
3. **site-reply-content-hardening** (W2): sanitizer image/link policy, isolating CSP in previews, Mermaid strict, CSP code, browser proof under the enforcing header. Depends: NONE. Agents: km-security-officer, km-frontend-engineer, km-rust-engineer, km-qa-engineer. L. HIGH. Exit evidence: failing-then-passing tests with mutation checks; the 3.5 browser-proof table recorded; security review passed; server tests green with `KNOWME_WEB_DIST_DIR=tests/fixtures/web`.
4. **site-stream-step-visibility**: whitelisted tool steps, reasoning indicator, memory-off regression test. Depends: NONE (4.1 captures real events first). Agents: km-rust-engineer, km-frontend-engineer, km-security-officer, km-qa-engineer. L. HIGH. Exit evidence: leak tests pass and fail when the whitelist is widened; a real-model local run shows steps and 0 leak-validator problems.
5. **site-answer-card-and-sources**: duplication fix, Sources block, snippet and display-name cleanup, W3 caption. Depends: 01; 5.1 depends on 02.4 (agent sync path) and is published only in the Train C window. Agents: km-conversational-designer, km-frontend-engineer, km-chief-content-officer, km-qa-engineer. L. HIGH. Exit evidence: caption test fails when a model caption fills the slot; 20-prompt local measurement recorded; captures looked at.
6. **site-shell-about-panel-and-empty-state**: infra status hidden on site, About/Sources panel, empty state. Depends: 01. Agents: km-frontend-engineer, km-creative-director, km-chief-content-officer, km-qa-engineer. M. HIGH. Exit evidence: captures at four widths and both themes looked at; keyboard and reduced-motion checks recorded; new e2e specs fail on the mutated build.
7. **site-starter-prompts**: privacy gate, pool, generator, ranker, chips. Depends: 06, and 14.1 to 14.2 (the local build and eval of the expanded KB, not its publication). Agents: km-conversational-designer, km-frontend-engineer, km-security-officer, km-devops-engineer. L. MEDIUM. Exit evidence: signed-off privacy decision; every pool prompt retrieves its expected document in the eval; chips work by keyboard at 320 px.
8. **site-bundle-attribution**: baseline, target, cuts, gate. Depends: NONE (re-baselined after 14's build). Agents: performance-optimizer, km-frontend-engineer. M. MEDIUM. Exit evidence: CWV baseline and a numeric target below it recorded; the gate fails above the target; the result is stated plainly if 300 kB is unreachable.
9. **kb-knowme-flagship**: KnowMe sources and the corrections of existing live KB files, including `the-boss.md`. Depends: 02. Agents: km-cmo, km-content-creator, km-chief-content-officer, km-security-officer. L. HIGH (operator's priority). Exit evidence: untracked claims table covers every KnowMe claim published; validator clean; content and security reviews recorded.
10. **kb-prometheus-stack**: UAR, Surreal Memory Server, BossFang, The Boss, full and mini skill packages, ecosystem map. Depends: 02, 9.2. Agents: km-content-creator, km-cmo, km-chief-content-officer. L. HIGH. Exit evidence: validator clean; every licence statement matches a licence file; reviews recorded.
11. **kb-patientgpt-prior-auth**: public-safe PatientGPT and prior-authorization content. Depends: 02 and the consent gate 11.0 (first task). Agents: km-content-creator, km-security-officer. M. MEDIUM. Exit evidence: consent recorded by the operator; exclusion check clean; security review recorded.
12. **kb-landscape-and-competition**: researched landscape, sourced comparisons. Depends: 02. Agents: km-cmo, km-content-creator, main thread (firecrawl). L. HIGH. Exit evidence: every external claim has a logged URL, retrieval date and excerpt; the critic's sample check finds no unsupported claim.
13. **kb-live-corrections-publish**: publish the corrected existing KB files (tasks 9.1 to 9.3 only) through the content workflow. Depends: 02, 9.1 to 9.3. Agents: km-qa-engineer, km-devops-engineer. S. HIGH (fixes wrong answers visitors get today). Exit evidence: indexed in the seed log; the corrected questions answered correctly on the live site; FR-8 passed.
14. **kb-publish-and-retrieval-eval**: build, validate and evaluate the full expanded KB; publish. Depends: 02, 09, 10, 11 (or its documented exclusion), 12 (or its documented exclusion), 13. Agents: km-qa-engineer, km-devops-engineer. M. HIGH. Exit evidence: recall@5 of at least 90% overall and 100% on flagship, FR-8 and corrected-facts questions; live validator 0 problems; 15 sample answers read.
15. **site-live-observation**: forced tool denial, payment-prompt repeats, meter rows, CSP report review, live repeats of 4.4 and 5.5. Depends: Train C deployed. Agents: km-qa-engineer, km-security-officer. M. MEDIUM. Exit evidence: each item recorded as observed with evidence, or reported as not reproducible.

## EXECUTION ROUND ORDER

Round 1 (parallel): 01, 02, 03, 04 (4.1), 08.
Round 2 (parallel): 05, 06, 09 (9.1 to 9.3 first), 10, 12; 03 and 04 continue.
Round 2b: 13 as soon as 9.1 to 9.3 and 02 are merged: operator dispatches the content workflow (`sync: kb`).
Round 3: 11 (after 11.0), then 14 (needs 09, 10, 11, 12, 13), then 07 (needs 06 and 14).
Round 4 (phase boundary): production-path integration gate (including captures at 320/768/1024/1440 × both themes of every changed surface from changes 03 to 07 and the keyboard/reduced-motion checks), cumulative review by `artifact-critic`, `km-security-officer` review, operator-approved Train C deploy, then 15.

Interim PRs: `[skip ci]`; the operator merges all PRs.

## TASKS

Task IDs are the OpenSpec ordinals in each change's `tasks.md`.

### 01 site-impeccable-design-context
- 1.1 Run `teach-impeccable` from `src/styles/tokens.css`, `content/brand`, the brand guide and `content/site/*`; commit the design context.
- 1.2 Capture the live site at 320/768/1024/1440 × light/dark (landing, empty thread, answered thread with card and sources, panel open) and look at each image.
- 1.3 Run `critique` and `audit` on the captures; ranked findings with the exact surface and token.
- 1.4 Content brief from `km-chief-content-officer`: voice, three caption wordings, empty-state direction, what the site must never claim.

### 02 site-kb-content-pipeline
- 2.1 First commit: add `.prometheus/knowledge-evidence/` to `.gitignore` (done in the working tree during Plan; it must be in the first Round 1 commit). Then create `docs/knowledge-source/` as an OKF 0.2 bundle (root `index.md` with `okf_version: "0.2"`, per-product directories with `index.md`, a `log.md`) and an authoring guide: frontmatter fields, `sources` rules, claim-evidence rules, forbidden content, and the rule that committed documents cite only public URLs or product-owned public pages, never private repository paths.
- 2.2 Build script: OKF concepts to flat files in `content/knowledge/` (strip frontmatter; one topic per file; product name in every section heading; an in-text attribution line wherever `sources` supports an external claim; descriptive file basenames so the filename-derived display name reads well; deterministic output). **The build writes only the files listed in a committed build manifest and never deletes or rewrites any other file in `content/knowledge/`**, because the seed deletes remote documents whose local source is gone and skips the FR-8 checks when `ipfs-sync-for-obsidian.md` or `the-boss.md` is missing. Acceptance: running the build on a tree with no OKF sources leaves `content/knowledge/` byte-identical; `ipfs-sync-for-obsidian.md` is never edited; `the-boss.md` is edited only by task 9.2 and 10.5, keeping the sentence naming Windows and macOS.
- 2.3 Validator: OKF §11 conformance; provenance required for external claims; broken-link report; secret, credential and PHI **pattern** scan (generic patterns, no literal credential strings in the repo); banned **assertions** (certification or compliance claims, "provably", prices) matched in assertion context, with the mandated sentences "pricing has not been announced" and "browser-certified on synthetic data only" explicitly allowed; fails if `ipfs-sync-for-obsidian.md` or `the-boss.md` is absent from `content/knowledge/`.
- 2.4 `site-content.yml`: `workflow_dispatch` only; inputs `sync: kb | agent | all` and `dry_run: true|false` (dry run builds, validates, runs the brand-naming test and the eval but does not seed); `environment: production`; its own concurrency group (it must not silently displace a queued deploy). Before any seed step it runs the build, the validator, the brand-naming test and the eval, and fails closed. `agent` includes the agent PUT **and** the presentation templates; `kb` is the corpus sync and the FR-8 checks; the seed script gains these modes and makes the FR-8 checks fail, not skip, when their files are missing. The workflow file must be merged to `main` before it can be dispatched, so its first dispatch is a `dry_run`; the seed uses the dispatched ref's checkout, so a content PR is merged before dispatch. `paths-ignore` in `site.yml` for exactly `content/knowledge/**` and `docs/knowledge-source/**` (not `content/site/**`, which ships in the bundle). Uses existing secrets by name; no new secret.
- 2.5 Retrieval-eval harness: question set with expected source file; reports top-5; includes the two FR-8 questions. Also move the 10-prompt live validator (currently a scratch script) into `scripts/ops/` after review for secrets, so "the live validator" in the exit criteria is a committed command.

### 03 site-reply-content-hardening
- 3.1 Failing tests first: remote image blocked, non-allowlisted link shown as text with destination, `javascript:`/`data:` still blocked; mutation-check each.
- 3.2 Sanitizer and renderer: image `src` allowlist (own hosts), link renderer matching citation-card policy; user messages use the same rules. The link allowlist is built from an explicit, reviewed URL list, not from the whole KB corpus (P7), so competitor and attribution URLs do not become clickable by accident.
- 3.3 `HtmlArtifactCard`: inject the isolating CSP meta into `srcdoc` correctly for documents that start with `<!DOCTYPE html>` (insert after `<head>` or wrap; a test proves no quirks-mode switch); Mermaid `securityLevel: 'strict'`.
- 3.4 Rust: CSP enforcing header (own commit), tests updated (`meter_and_headers.rs`; `img-src` is already `'self' data: blob:` so this pins existing values and removes `data:`/`blob:` only if built-asset evidence shows they are unused). No parallel report-only twin: it would only duplicate reports and has no failure scenario. Acceptance rule, measured on the local run and over the first 48 hours after deploy (corrected after the 3.5 proof, `evidence/07-csp-preview-proof.md`): **zero CSP reports other than (a) any report whose document is `about:srcdoc` (an HTML preview frame: inline script, `img-src` for remote images, `connect-src`, any directive), (b) `frame-src`/`default-src` reports on the app page blocking a remote origin, raised when a preview navigates itself away (the app has no other iframe), and (c) browser-extension origins**; any other report (document is the app page) triggers a revert by renaming the header back (one-line change). The `csp violation` log line carries the report's document (query and fragment stripped, thread ids masked) so (a) can be applied. **Deploy-bearing.**
- 3.5 Browser proof **under the enforcing header, run locally**, recording each of: a remote `fetch` from the preview frame (blocked by `connect-src`); a same-origin `fetch` (the request is sent; record what the response allows); `<script src>` of the app's own bundle from the opaque-origin frame (`script-src 'self'` may allow it; record); a remote `<img>` (blocked); a static HTML/CSS preview (renders); an inline-script preview (an inherited `script-src` without `'unsafe-inline'` likely blocks it); a document that starts with `<!DOCTYPE html>` (no quirks mode after the meta is added). Note that a meta CSP can only tighten the inherited policy. **Gate:** if scripted previews are blocked, the operator chooses (static-only previews; a dedicated sandbox route with its own CSP) before Train C.
- 3.6 Security review by `km-security-officer`.

### 04 site-stream-step-visibility
- 4.1 Capture a real stream with a tool-using prompt and record actual UAR event names and fields for tool steps and reasoning.
- 4.2 `agui_filter.rs`: whitelist tool-step events with a fixed label set per call class (no arguments, no results, no tool ids; a server-minted opaque index for start/finish pairing) and a reasoning-in-progress signal without text; update the tests that pin these events as dropped and keep a mutation check on everything still dropped.
- 4.3 Client renderers and registry entries; `aria-live` politeness, keyboard, reduced motion, 320 px.
- 4.4 Real-model run on a **local UAR stack** with the agent seeded locally (the operator supplies model credentials in their own environment; I do not read them); repeated on production in change 15.
- 4.5 Decision record D-P3 and a regression test pinning `memory_enabled:false` and that no `agui.memory.*` event passes.

### 05 site-answer-card-and-sources
- 5.1 Change `uar/agents/knowme-site.json` and `uar/presentations/answer-card.json` (title, summary, source). Verified locally first. It is published with `sync: agent` **in the same window as Train C, after the new client is live**, never at Round 2: the new card shape against the old client would give visitors a thin card plus three citation cards and no caption.
- 5.2 Client: one Sources block (revive `CitationList`), snippet markdown stripped and trimmed at word boundaries, citation display name derived from the uploaded filename by rule (strip the 12-hex hash and `.md`, de-slug), `marker` rendered when present.
- 5.3 W3: app-rendered caption wrapper around every A2UI surface, distinct from model `caption` text; mutation-checked test that a model-written caption cannot occupy the slot.
- 5.4 Caption wording approved by the operator (content-officer pre-review); string comes from `content/site/ai-disclosure.ts`.
- 5.5 Real-model measurement on the local stack: 20 prompts, how often the card is emitted and whether prose repeats it, plus the 10-prompt security validator; repeated on production in change 15.

### 06 site-shell-about-panel-and-empty-state
- 6.1 Hide `UarStatus` and "localhost" on the site build at both mounts.
- 6.2 About / Sources panel on the site; design critique before the build; remove "Choose an agent" on the site.
- 6.3 Empty-state layout and copy.
- 6.4 Captures at 320/768/1024/1440 × both themes for empty, answered and panel-open states; keyboard walk; reduced-motion; contrast via the token tests.
- 6.5 E2E specs for the new surfaces with mutation checks.

### 07 site-starter-prompts
- 7.1 **Privacy design gate (first):** nothing about a visitor reaches the server or model; decide shared-device behaviour before anything is built. Default: an unranked pool, or ranking from the current session only; history-based ranking only as an explicit opt-in with a visible "Clear suggestions" control, because the order and choice of chips reveal a previous user's topics on a shared browser. `km-security-officer` signs this off and the operator approves.
- 7.2 Pool schema and generator (runs through UAR, operator-run); every pool prompt is checked by the eval harness to be answerable from the KB (expected document retrieved); the content officer reviews; competitor, pricing and compliance questions the KB cannot support are removed.
- 7.3 Ranker per the 7.1 decision (on-device only); chips always show pool text, never history text.
- 7.4 Empty-state chips: keyboard, focus, 320 px, one-tap send.
- 7.5 Delivery: the pool is a reviewed static file under `content/site/` that ships with the image on the next deploy. This is **not** independent of a deploy; a no-deploy path (server route reading a file) is deferred and named as such.

### 08 site-bundle-attribution
- 8.1 CWV baseline (Lighthouse mobile) on the live site: LCP, TBT, JS bytes.
- 8.2 Fix a numeric target strictly below the baseline from the attribution, re-baselined after change 14's build because the KB is compiled into the client (P7); state plainly if 300 kB gzip is unreachable without a product change.
- 8.3 Behaviour-preserving cuts (for example KaTeX only when a message has math).
- 8.4 PGlite on the site: operator decision before any change.
- 8.5 Size-gate script (no new dependency) that fails above the recorded target; the target cannot equal the current size.

### 09 kb-knowme-flagship
- 9.1 Claims-versus-evidence table (untracked, D-P10): status, platforms, privacy and sovereignty claims, each with its source file; unsupported claims dropped or phrased as design intent.
- 9.2 Rewrite the existing `company`, `faq`, `knowme-*` KB sources **and `the-boss.md`** from corrected public facts (P5): the existing eight hand-authored files are migrated into OKF sources here and are then produced by the build manifest; `ipfs-sync-for-obsidian.md` is left exactly as is; `the-boss.md` keeps its sentence naming Windows and macOS, with the current release's platforms and installer sizes.
- 9.3 Content-officer and security-officer review of the corrections.
- 9.4 OKF concepts: what KnowMe is, who it is for, architecture in plain language, what "sovereign" does and does not guarantee.
- 9.5 OKF concepts: tiles, Hands, memory, plugins, use cases, personas.
- 9.6 OKF concepts: platforms, release status and roadmap with dates; "not yet released" where true.
- 9.7 OKF concepts: FAQ and glossary as visitor questions.
- 9.8 Final content/security review.

### 10 kb-prometheus-stack
- 10.1 Operator-approved `git pull` in the local BossFang checkout (path recorded in the untracked evidence file); record HEAD in that file.
- 10.2 UAR: what it is, support tiers, protocols, governance, deployment; version and support matrix; licence MIT.
- 10.3 Surreal Memory Server: capabilities, API, status wording from its publication note; no certification claim; licence "not yet published".
- 10.4 BossFang: what is BossFang-specific versus upstream LibreFang; never attribute upstream marketing to it.
- 10.5 The Boss: extends the `the-boss.md` correction from 9.2 with the full product description; current release, platforms, installer sizes, AGPL-3.0; an honest statement of the telemetry defaults in its privacy policy, with the source; flag the policy mismatch to the operator.
- 10.6 Skill packages: full versus mini, counts expressed as "see the package's skill index" where files disagree, install, when to choose which.
- 10.7 Ecosystem map: how KnowMe, UAR, BossFang, Surreal Memory, The Boss and the skills fit together.
- 10.8 Review.

### 11 kb-patientgpt-prior-auth
- 11.0 **Gate:** operator confirms the client's consent and the public description before any file is written.
- 11.1 Public-safe description: purpose, evidence states, surgeon gates, status "browser-certified on synthetic data only".
- 11.2 Exclusion check: no client name, patient data, credentials, compliance or certification claims; run the validator.
- 11.3 Security-officer review.

### 12 kb-landscape-and-competition
- 12.1 Research plan: categories (always-on cloud agents including OpenAI dots; local-first and sovereign assistants; agent runtimes; agent memory systems; desktop agent clients; prior-authorization tools) and the primary-source rule.
- 12.2 Firecrawl research by the main thread; each fetched page is logged to `evidence/` with URL, retrieval date and the excerpt relied on.
- 12.3 OKF concepts per category with sourced claims only.
- 12.4 Comparison tables by capability and trade-off; every cell sourced or "not stated".
- 12.5 Independent verification: the critic re-checks a sample of claims against the logged excerpts (no web access needed).

### 13 kb-live-corrections-publish
- 13.1 Build and validate the corrected KB files from 9.2 (including `the-boss.md`); zero validator failures; the two FR-8 files are present.
- 13.2 Eval: the corrected facts (platforms, availability, mobile status, The Boss platforms and sizes) are retrieved correctly; the two FR-8 questions still pass.
- 13.3 **Gate:** the content PR is merged first (the seed uses the dispatched ref's checkout); operator approves publication and company name (D-P1); operator dispatches the content workflow with `dry_run: true`, then `sync: kb`.
- 13.4 Post-publish: seed log shows documents indexed; ask the corrected questions on the live site and look at the answers.

### 14 kb-publish-and-retrieval-eval
- 14.1 Build and validate the full KB; zero validator failures.
- 14.2 Question set of at least 60 visitor questions with expected source; pass rule: recall@5 of at least 90% overall and 100% on the flagship, the two FR-8 and the corrected-facts questions; misses are fixed in content, not by changing thresholds.
- 14.3 FR-8 protection confirmed on the final corpus; the build leaves hand-authored files untouched (2.2 acceptance).
- 14.4 **Gate:** the content PR is merged first; operator confirms D-P1 and D-P6 (whether counsel reviews comparative or regulated-domain wording); dispatches the content workflow (`dry_run` first).
- 14.5 Post-publish: indexed status, the committed live validator (`scripts/ops/`), and 15 sample questions read by a person.

### 15 site-live-observation
- 15.1 Forced non-allowlisted tool call observed denied (a UAR-side harness or a crafted run); evidence recorded.
- 15.2 Payment-prompt stream at least 10 times; completions and any missing `agui.done` recorded.
- 15.3 Meter rows on the new image: the exact query is given to the operator; accepted when the reserved and settled values for a Stop and a completed turn are recorded.
- 15.4 `/api/csp-report` review after enforcement against the 3.4 acceptance rule. First step, before counting: prove report delivery works on the real site (the 3.5 proof could not show it in headless Chrome). Raise one deliberate violation in the app page (e.g. in the browser console on the live site: `fetch("https://example.invalid/csp-delivery-check")`), then confirm a `csp violation` line with `directive=connect-src`, `blocked=https://example.invalid` and the app page as `document` appears in the server logs within a few minutes. If none arrives, the 48-hour count of zero proves nothing: fix delivery first. Then ask the agent for an HTML preview with an inline script and confirm its report logs `document=about:srcdoc` (unverified until then; rule (a) depends on it).
- 15.5 Repeat 4.4 and 5.5 on production.

## TASK MODEL ASSIGNMENTS

**Common to every row.** Phase path `site-chat-hardening-and-polish`. Harness: Claude Code, native `Agent` tool with the named agent type and `model` override. The main-thread model of this session is **claude-sonnet-5-5**. Route: native; liter-llm is not needed. Reasoning effort: harness default (the `Agent` tool's `effort` field is reserved for an explicit operator request). Worker handoff: task scope, working directory the repository root, the agent type's own tools, result returned in writing to the main thread; `kbd-apply` (main thread) alone calls `begin-task`/`end-task`. Model-choice evidence is **weak**: no local benchmark exists; choices are a suitability judgement dated 2026-10-12 from the harness's model descriptions plus the rule that a reviewer is a different model than its producer. Availability: observed in this harness's listing, not verified by a launch. Native alternative for every row: the main thread doing the task directly. Reviews by "critic-X" mean the `artifact-critic` agent run with model X on the artifact alone. A reviewer is never the same model as the producer; the main thread (sonnet) therefore reviews only opus- or fable-produced work or tasks that need no review.

| Change | Task | Requirements | Model | Agent type | Reviewer |
|---|---|---|---|---|---|
| 01 | 1.1 | design judgement, tokens | opus | km-creative-director | critic-fable |
| 01 | 1.2 | captures, looking at images | sonnet | km-qa-engineer | main thread is the same model: reviewed by critic-opus |
| 01 | 1.3 | critique, ranking | opus | km-creative-director | critic-fable |
| 01 | 1.4 | voice, claims discipline | opus | km-chief-content-officer | operator |
| 02 | 2.1 | spec-conformant docs | sonnet | km-devops-engineer | critic-fable |
| 02 | 2.2 | deterministic build script | sonnet | km-devops-engineer | critic-opus |
| 02 | 2.3 | validator, security patterns | opus | km-devops-engineer | critic-fable |
| 02 | 2.4 | CI, cluster access, secrets by name | opus | km-devops-engineer | km-security-officer (fable) |
| 02 | 2.5 | eval harness | sonnet | km-qa-engineer | critic-opus |
| 03 | 3.1 | tests first, mutation checks | sonnet | km-frontend-engineer | critic-opus |
| 03 | 3.2 | sanitizer and renderer | opus | km-frontend-engineer | critic-fable |
| 03 | 3.3 | iframe isolation | opus | km-frontend-engineer | critic-fable |
| 03 | 3.4 | Rust CSP, test pins | opus | km-rust-engineer | critic-fable |
| 03 | 3.5 | real-browser proof | opus | km-qa-engineer | km-security-officer (fable) |
| 03 | 3.6 | security review | fable | km-security-officer | operator |
| 04 | 4.1 | live stream capture | sonnet | km-qa-engineer | critic-opus |
| 04 | 4.2 | Rust filter, leak tests | opus | km-rust-engineer | critic-fable |
| 04 | 4.3 | renderers, a11y | sonnet | km-frontend-engineer | km-qa-engineer (opus) |
| 04 | 4.4 | local real-model run | sonnet | km-qa-engineer | critic-opus |
| 04 | 4.5 | decision record, regression pin | sonnet | km-rust-engineer | critic-opus |
| 05 | 5.1 | prompt and template | opus | km-conversational-designer | critic-fable |
| 05 | 5.2 | grouping, text cleaning | sonnet | km-frontend-engineer | critic-opus |
| 05 | 5.3 | trust-boundary UI, mutation check | opus | km-frontend-engineer | km-security-officer (fable) |
| 05 | 5.4 | copy | opus | km-chief-content-officer | operator |
| 05 | 5.5 | local live measurement | sonnet | km-qa-engineer | critic-opus |
| 06 | 6.1 | small gating change | haiku | km-frontend-engineer | critic-sonnet |
| 06 | 6.2 | panel design and build | opus | km-frontend-engineer | km-creative-director (fable) |
| 06 | 6.3 | layout and copy | opus | km-creative-director | km-chief-content-officer (fable) |
| 06 | 6.4 | captures, keyboard, motion | sonnet | km-qa-engineer | critic-opus |
| 06 | 6.5 | e2e with mutation checks | sonnet | km-qa-engineer | critic-opus |
| 07 | 7.1 | privacy design gate | fable | km-security-officer | operator |
| 07 | 7.2 | pool generation and review | opus | km-conversational-designer | km-chief-content-officer (fable) |
| 07 | 7.3 | ranker per the 7.1 decision | opus | km-frontend-engineer | critic-fable |
| 07 | 7.4 | chips UI | sonnet | km-frontend-engineer | km-qa-engineer (opus) |
| 07 | 7.5 | delivery file | sonnet | km-devops-engineer | critic-opus |
| 08 | 8.1 | Lighthouse baseline | sonnet | performance-optimizer | critic-opus |
| 08 | 8.2 | target and honesty | opus | performance-optimizer | operator |
| 08 | 8.3 | behaviour-preserving cuts | sonnet | km-frontend-engineer | critic-opus |
| 08 | 8.4 | product decision | n/a | main thread | operator |
| 08 | 8.5 | size gate script | haiku | performance-optimizer | critic-sonnet |
| 09 | 9.1 | evidence table | fable | km-cmo | critic-opus |
| 09 | 9.2 | rewrite live KB files | opus | km-content-creator | critic-fable |
| 09 | 9.3 | review | fable | km-chief-content-officer | operator |
| 09 | 9.4 | writing, sovereignty wording | fable | km-content-creator | km-chief-content-officer (opus) |
| 09 | 9.5 | writing | opus | km-content-creator | critic-fable |
| 09 | 9.6 | status honesty | opus | km-content-creator | critic-fable |
| 09 | 9.7 | FAQ writing | sonnet | km-content-creator | critic-opus |
| 09 | 9.8 | final review | fable | km-security-officer | operator |
| 10 | 10.1 | git pull, hash | n/a | main thread | operator |
| 10 | 10.2 | UAR writing | opus | km-content-creator | critic-fable |
| 10 | 10.3 | Surreal Memory writing | sonnet | km-content-creator | critic-opus |
| 10 | 10.4 | BossFang vs upstream | opus | km-content-creator | critic-fable |
| 10 | 10.5 | The Boss writing | sonnet | km-content-creator | critic-opus |
| 10 | 10.6 | skill packages | sonnet | km-content-creator | critic-opus |
| 10 | 10.7 | ecosystem map | opus | km-cmo | critic-fable |
| 10 | 10.8 | review | fable | km-chief-content-officer | operator |
| 11 | 11.0 | operator gate | n/a | main thread | operator |
| 11 | 11.1 | regulated-domain writing | fable | km-content-creator | km-security-officer (opus) |
| 11 | 11.2 | exclusion check | opus | km-security-officer | critic-fable |
| 11 | 11.3 | review | fable | km-security-officer | operator |
| 12 | 12.1 | research plan | opus | km-cmo | critic-fable |
| 12 | 12.2 | firecrawl research (main thread; subagent firecrawl access unverified) | sonnet | main thread | critic-opus on the logged excerpts |
| 12 | 12.3 | sourced writing | opus | km-content-creator | critic-fable |
| 12 | 12.4 | comparison tables | opus | km-cmo | critic-fable |
| 12 | 12.5 | claim verification sample | fable | artifact-critic | operator |
| 13 | 13.1 | build and validate | sonnet | km-devops-engineer | critic-opus |
| 13 | 13.2 | corrected-facts eval | sonnet | km-qa-engineer | critic-opus |
| 13 | 13.3 | operator gate | n/a | main thread | operator |
| 13 | 13.4 | post-publish check | sonnet | km-qa-engineer | critic-opus |
| 14 | 14.1 | build and validate | sonnet | km-devops-engineer | critic-opus |
| 14 | 14.2 | eval set and misses | opus | km-qa-engineer | critic-fable |
| 14 | 14.3 | FR-8 protection | sonnet | km-qa-engineer | critic-opus |
| 14 | 14.4 | operator gate | n/a | main thread | operator |
| 14 | 14.5 | post-publish validation | sonnet | km-qa-engineer | critic-opus |
| 15 | 15.1 | tool-denial harness | opus | km-qa-engineer | km-security-officer (fable) |
| 15 | 15.2 | repeated runs | sonnet | km-qa-engineer | critic-opus |
| 15 | 15.3 | meter rows (operator runs the query) | n/a | main thread | operator |
| 15 | 15.4 | CSP report review | sonnet | km-security-officer | critic-opus |
| 15 | 15.5 | live repeats | sonnet | km-qa-engineer | critic-opus |

**Unresolved prerequisites.** (a) Subagent access to firecrawl is unverified, so 12.2 runs on the main thread. (b) 4.4, 5.5 and 15.1 need a local UAR with a real model; the operator must supply credentials in their own environment, otherwise the live runs happen only after an operator-approved early deploy. (c) 10.1, 11.0, 13.3, 14.4 and 15.3 are operator actions. (d) Design context (01.1) must exist before 05 and 06. (e) "critic-X" runs assume `artifact-critic` accepts a model override; unverified until launched.

## PLAN-LEVEL RISKS

- **R1 Model compliance (4.x, 5.x):** prompt changes are proven only by live runs, and they can fail. Fallback: client collapse of prose (policy a), which needs an operator decision.
- **R2 Retrieval (14.2):** more documents can lower precision and displace the two FR-8 chunks. The eval decides; thresholds are not lowered to pass.
- **R3 Previews under an enforcing CSP (3.5):** inherited `script-src` has no `'unsafe-inline'`, so scripted previews are likely blocked. If so, "enable previews" can be honoured for static HTML/CSS only, or by building a dedicated sandbox route with its own CSP; the operator chooses after the proof.
- **R4 Truth risk in the KB:** the largest risk in the phase is publishing a claim the product does not back. Defences: claims table, validator, in-text attribution, content-officer and security-officer review. Residual: no counsel review is arranged (D-P6).
- **R5 Cost:** change 12 and the KB writing are the bulk of the work. 11 and 12 can be cut without blocking 13 and 14's flagship publication.
- **R6 CSP flip (3.4):** shipped in the same deploy as other changes; mitigated by its own commit, a numeric acceptance rule (zero reports other than any `about:srcdoc` preview-frame report, top-page `frame-src`/`default-src` reports from a preview navigating away, and browser-extension origins; corrected after 3.5), and a one-line revert.
- **R7 Public repository:** everything committed is public. See D-P10 and 11.0.

## COMMANDS TO RUN

`node "$KBD_ORCHESTRATOR_ROOT/shared/openspec/cli.mjs" run --project "$PWD" -- new change <id>` for each of the 15 change ids; write `proposal.md` and `tasks.md` (ordinals above); register changes and tasks with `prometheus kbd change register` and `prometheus kbd task register`.

## Review record

Round 1 (artifact-critic, same model family; the cross-model judge gateway was not used): 5 CRITICAL, 13 WARNING, all addressed in revision 2.
Round 2: 3 CRITICAL, 8 WARNING, 3 SUGGESTION; addressed in revision 3: the Boss correction moved into 9.2 and the build never deletes hand-authored files (C1, C2); private evidence gitignored and private paths removed (C3, W8); KB compiled into the client handled (P7, W1); the content workflow validates and has a dry run, its own concurrency group and a documented first-dispatch procedure (W2, W3); 5.1 timing (W4); CSP acceptance rule numeric and the twin dropped (W5); 3.5 criteria completed (W6); starter-prompt privacy gate moved first (W7); exit evidence per change and a committed live validator (S1); agent headers (S2); dependency clauses for 12 and 7 (S3).

Unresolved review findings (rounds exhausted, per the skill's cap of 2): (1) `artifact-critic` accepting a model override is unverified, so the "critic-X" reviewer assignments are intended, not proven; (2) whether `ipfs-sync-for-obsidian.md` and `the-boss.md` surviving FR-8 after the 9.2 rewrite is only provable at 13.2; (3) the plan was not re-vetted after revision 3. The next review of this plan is the cumulative review at the phase boundary.

PLAN COMPLETE (revision 3)
