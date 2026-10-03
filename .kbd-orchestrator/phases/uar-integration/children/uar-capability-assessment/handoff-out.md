# Handoff out — uar-integration › uar-capability-assessment

**Status:** DONE. Implementation 6/6. Certification: operator-accepted after the final review returned BLOCK; the run-2 fixes were not re-reviewed.

## Deliverables

- `.kbd-orchestrator/phases/uar-integration/plan.md`: **revision 3**. The phase is now the paper's Phase 0, with 36 registered changes (6 done, 3 in progress, 1 cancelled, 26 pending). Revision 2 is kept as superseded.
- `.kbd-orchestrator/phases/uar-integration/decision-log.md`: D-2 (Token Plan, operator-accepted risk), D-21 (adopt §9), D-22 (document-level chunks), D-23 (Firecrawl research accepted).
- `openspec/changes/`: 24 new changes from §9, plus edits to `site-chat-proxy`, `site-agent-seed`, `k8s-stack-manifests`, `github-deploy-workflows` and `apex-dns-cutover`. All 36 pass `openspec validate --strict`.
- `openspec/changes/site-spend-ceiling/tasks.md`: the **authoritative** spend-meter design (reserve-and-settle in SurrealDB `site/meter`, fail closed, staged behind the kill switch).
- `docs/agent-led-site/`: sections corrected and `agent-led-site.md` reassembled.
- `uar-roadmap.md` (this dir): 6 UAR issue drafts. Filing waits on D-12.
- UAR #324: dependency-resolution fix. The post-merge image `sha-e73b5f67` is green on amd64 and arm64.

## Goal completion

4 MET, 1 PARTIAL: deep-research was replaced by a Firecrawl landscape (D-23). See `reflection.md`.

## Unresolved items

- The spend-meter design's final form has not been reviewed. Its tests in `site-spend-ceiling` are the first independent check.
- KBD task labels lag the OpenSpec text, because the CLI cannot edit titles or sequence. OpenSpec files are authoritative.
- The paper's assembly script lives in the session scratchpad, not the repo.
- `apex-dns-cutover`: canonical `cancelled`, projected as `SKIPPED`.
- U12 is open (D-2 accepted risk).

## Recommendations to the parent (uar-integration)

Resume execution in revision 3's order:
1. Close `uar-jwks-es256` after `ci-supply-chain-pins` pins the digest.
2. In parallel: `uar-runtime-host-lockdown`, `ci-supply-chain-pins`, `gate-ext-authz-endpoint`, `site-chat-proxy` 1.5 → 1.4, `local-compose-stack`, `about-endpoint-truth`, `kb-chunking-quality`.

Operator decisions needed on the critical path: D-18, D-3, D-4. D-12 approves filing the UAR roadmap.
