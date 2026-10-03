# decisions

Append-only. Dated entries. Mark superseded entries; do not delete them.

## 2026-09-25
- Initialized by prometheus-context-bootstrap.

## 2026-09-26 · landing-and-about-brand scope
- **Decision (operator):** restyle now, concept later. landing-and-about-brand does the planned brand restyle (landing, /settings/about, 404). Its landing copy is structured as the future crawlable static layer: a real h1, a value line, sections ready to hold FAQ content.
- **Deferred:** the chat-led marketing site (a concierge agent on UAR, prerendered marketing routes, AI disclosure, crawler policy, rate limits and cost caps) becomes its own phase after complete-rebranding. See the `agent-led-marketing-site` skill.
- **Why:** it keeps this phase finishable. The concept needs backend, security and marketing work that a restyle change can't hold.

## 2026-10-02 · uar-integration re-plan (uar-capability-assessment child)
- **D-2 (operator, risk accepted):** keep the Qwen Token Plan under the operator's "operator model" reading: the client owns the plan and it assists them. U12 stays open; neither written approval nor a capped key was taken.
- **D-21 (operator):** adopt `agent-led-site.md` §9 Phase 0 into `uar-integration`. `apex-dns-cutover` moves to Phase 1.
- **D-22 (operator, on recommendation):** the site KB uses `chunk_strategy: "document"`, keeping retrieval. Full context is not adopted. The UAR default-chunker fix goes upstream.
- **D-23 (operator):** accept the Firecrawl landscape research in place of the stalled deep-research package.
- **Spend ceiling design (planned, not yet built):** a site-server reserve-and-settle meter in SurrealDB `site/meter`, failing closed. It replaces §9's flint-gate ceiling, because under ext_authz gate never sees run usage. See `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` N15.
- Full entries: `.kbd-orchestrator/phases/uar-integration/decision-log.md`.

## 2026-10-02 · correction to the entry above (operator's words; final review)
- The entry above paraphrased the operator. The operator's words, verbatim:
  - **D-2:** "we are in the 'operator' model where the token plan is being used to assist the owner of the plan, who is the client." (On the question of keeping the Token Plan: "Do it.")
  - **D-21:** "Adopt in this phase."
  - **D-22:** "do as you recommend" (assessment F4: document-level chunks, keep retrieval).
  - **D-23:** "Yes. accept."
- The "Spend ceiling design" line above is **not an operator decision**. It is the planned design in the child plan (N15), recorded for context.

## 2026-10-03 · uar-integration revision 3 execution start
- **D-3 (operator):** meter budgets 1M tokens/day, 20M tokens/month. Words: "1M/day, 20M/month (Recommended)".
- **D-7 (operator):** delete `runtime.know-me.tools`. Words: "Delete it (Recommended)".
- **D-12 (operator):** file the six UAR roadmap issues. Words: "Yes, file them (Recommended)".
- **D-18 (operator):** the operator issues the site gate credential, stores it in Secret `site-proxy` and rotates it every 90 days. Words: "You, quarterly (Recommended)".
- **Defaults applied, pending objection:** D-4 (no gate feed), D-5 (30 days), D-20 (tracked open). Full entries in `.kbd-orchestrator/phases/uar-integration/decision-log.md`.
