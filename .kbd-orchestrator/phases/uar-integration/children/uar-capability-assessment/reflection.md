# Reflection — uar-integration › uar-capability-assessment

Date: 2026-10-02. Child phase of `uar-integration`. Implementation: 6 of 6 changes complete. Certification: operator-accepted after the final review returned BLOCK. The run-2 fixes were not re-reviewed.

## Delta between plan and delivery

| Planned | Delivered | Delta |
|---|---|---|
| Goal 1: fix the UAR compile error, the only code change | UAR #324 merged; post-merge image build green on amd64 and arm64 (run 36997759532; GHCR `main` = `sha-e73b5f67`) | **It was not a compile error.** Three Dependabot merges had left `main` unresolvable: an `rmcp` exact-pin split, plus lock-only bumps of `wasmtime-wasi` and `fastembed` outside the manifest ranges. The goal statement misdiagnosed it; the fix was to dependency resolution. |
| Goal 2: assess which UAR capabilities the site needs | `assessment.md` revision 3: an 18-row capability matrix, a U1–U19 status table, findings F1–F8 | **The biggest finding was not a UAR gap.** The project's own paper (§9) already held a 24-change Phase 0 plan that the KBD plan had never absorbed. |
| Goal 3: weigh changes against UAR's other uses | Roadmap candidates with a risk-to-other-uses column; one proposal dropped (per-agent budgets, which UAR had shipped and then removed on purpose in `d6f4f862`) | Met, but only after review: the first draft listed benefits only. |
| Goal 4: deep-research plus adversarial review | Adversarial review ran 8 times: assessment ×2, plan ×2, final ×2, plus the code inventory and research agents | **Deep-research did not work.** Its daemon stalled at stage 01 with 0 sources and a hard-coded 10-source cap. A Firecrawl landscape (74 sources) replaced it, accepted by the operator (D-23). |
| Goal 5: an adjusted plan, not code | Parent plan revision 3: 36 registered changes; 24 new OpenSpec changes; canonical KBD state 6 / 3 / 1 / 26 | Met. Beyond plan, it also corrected the paper (B6) and drafted UAR roadmap issues (B5); both were planned in this child's own plan, not the goals. |
| Part B: 6 native changes | All 6 complete | B4's first run was interrupted by a single-writer conflict **I caused** (concurrent KBD writes). It was resumed idempotently with no duplicates. |
| Final gate: one cumulative review, PASS | Two BLOCK verdicts; every finding fixed; the run-2 fixes unreviewed; the operator chose to close | **Not a pass.** Recorded as operator-accepted. |

## Goal achievement

| Goal | Status |
|---|---|
| 1. Fix the UAR build | MET (verified by the green post-merge build) |
| 2. Capability assessment for the site | MET |
| 3. Weigh against UAR's general uses | MET |
| 4. Deep-research + adversarial review | PARTIAL: adversarial review MET; deep-research replaced (D-23) |
| 5. Adjusted plan, no new product code | MET |

## What the reviews caught that I got wrong

Every review round found at least one real error. Most were mine, and all but one sit in the spend ceiling:

1. **Assessment round 1.** I claimed UAR could enforce a per-agent spend ceiling. It enforces only per-run and per-session limits, and the session id is client-chosen.
2. **Assessment round 2.** I proposed Envoy-style gate metering, which cannot see AG-UI usage under ext_authz. I also missed that `agui.done` already carries usage.
3. **Plan round 1.** Non-streaming turns bypassed the meter (`stream: false` → `usage: None`).
4. **Plan round 2.** `stream_mode: agui_spec` bypassed it too. The fix became structural: reserve before forwarding and keep the reservation unless it settles.
5. **Final round 1.** Settlement could overshoot. Period rollover would refuse every turn after midnight. The fail-closed test could not tell fail-open from fail-closed. The first deploy had an unmetered window.
6. **Final round 2.** The kill-switch staging deadlocked. `UPDATE … WHERE` with no matching row does not cancel a SurrealQL transaction.

The pattern: I kept fixing the reported instance, not the class, and restated the design in five documents that then drifted apart. Two things finally changed the trend. The reserve-and-settle design closed the bypass class. Making `openspec/changes/site-spend-ceiling/tasks.md` the single authoritative meter description stopped the drift.

## Artifact Quality Summary

| Metric | Value |
|---|---|
| Changes with artifact-refiner QA | 0/6. `refine-validate` was not run; these are process changes with no `.refiner/artifacts` entry. |
| Changes with mechanical validation | 6/6 (OpenSpec `--strict` 36/36; KBD state; grep checks; paper assembly check) |
| Adversarial review rounds | 8, all same model family (no distinct judge model configured; `cross_model_check: same-model-collision`) |
| First-pass review pass rate | 0/4 artifacts (assessment, plan, final, final re-run each blocked at least once) |
| Review findings addressed | All CRITICAL and WARNING; the final run-2 fixes unreviewed |

### Recurring defects

- **Restating one design in many places:** 4 rounds (assessment r2, final r1, final r2, and every edit pass of plan/paper/OpenSpec).
- **Fixing an instance instead of a class:** 2 rounds (plan r1 → r2 bypass).
- **Unchecked premises about UAR code:** 3 rounds (budget scopes, usage on the stream, SurrealQL `UPDATE` semantics).

## Technical debt introduced

- **KBD task labels lag the OpenSpec text.** The KBD CLI cannot edit task titles or re-sequence tasks once registered. Examples: `site-spend-ceiling` titles still say tests "(1)–(6)"; new tasks carry higher sequence numbers than the gate tasks they now precede. The OpenSpec files are authoritative. `kbd-apply` follows file order, but a waypoint's derived "next task" can name a gate early.
- **The paper is assembled by a script in the session scratchpad** (`assemble.py`), not in the repo. A future section edit has no committed way to reassemble.
- **`apex-dns-cutover`** is canonically `cancelled` but projects as `SKIPPED`.
- **The spend-meter design is unreviewed in its final form.** Its own build and its seven tests are its first independent check.
- **No distinct judge model** is configured for adversarial review, so every "independent" review was same-family.

## Lessons for the knowledge base

1. KBD's local runtime accepts one writer at a time. Never issue KBD writes from two shells at once; a causal-frontier conflict aborts the second one. Batch scripts should stop on the first failure and be resumable from a status snapshot.
2. SurrealQL `UPDATE … WHERE` that matches no row returns empty and does not fail. A conditional reservation inside a transaction must check the result and `THROW` to cancel.
3. Dependabot can leave a workspace unresolvable in two ways: it bumps an exact pin in one member only, or it bumps a lock entry outside the manifest range. A green Dependabot PR does not prove `main` builds.
4. The deep-research daemon (`prometheus-research`) caps `max_sources` at 10 and stalled at stage 01. Plan a direct-retrieval fallback.
5. When a design must appear in several documents, pick one authoritative file and make the others summarise and point to it, before the first review, not after the third.
6. A GitHub org billing lock surfaces as `startup_failure` with no log on every Actions run in the org. Read the run's check-run annotations to find it.
7. A fine-grained PAT must have the target org as its resource owner. The packages API rejects fine-grained tokens entirely; read image digests from a build artifact instead.

## Recommended next step

Exit this child (`/kbd-child-exit`) and resume `uar-integration` execution at its waypoint. Revision 3's order:
1. Close `uar-jwks-es256` once `ci-supply-chain-pins` pins the digest.
2. Start in parallel: `uar-runtime-host-lockdown`, `ci-supply-chain-pins`, `gate-ext-authz-endpoint`, `site-chat-proxy` 1.5 → 1.4, `local-compose-stack`, `about-endpoint-truth`, `kb-chunking-quality`.

Operator decisions on the critical path: D-18, D-3, D-4; then D-5, D-6, D-8, D-16 for Phase 0 exit; D-12 to file the UAR roadmap.

## The uncomfortable part

This child was asked to research what UAR should add. Its most important output was discovering that the project had already written its own plan and then ignored it. Its most expensive part was eight review rounds spent correcting a spend-ceiling design I kept getting wrong in new ways. The design that came out is better than §9's, which could not see usage at all. But no reviewer has read its final form, so the claim that it works rests on tests that have not been written yet.
