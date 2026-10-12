# Goals

Original goals (from the predecessor's reflection, 2026-10-12):

- Security W2: allowlist or drop links and images in reply text on the site build and enforce the CSP (not report-only)
- Security W3: add a fixed machine-generated caption to every A2UI surface so a model-written fake notice is labelled
- Visible quality: the card duplicates the prose answer (card plus prose plus three citation cards), raw markdown and mid-word cuts in citation snippets, the localhost footer on production, the Context panel 'Choose an agent' copy on a site with no picker
- S-tier UI/UX: walk the full KBD process with the km-* agent team and the impeccable design skills; captures at 320/768/1024/1440 in both themes, a11y (keyboard, reduced motion, contrast)
- Attribute and cut the main bundle (684.81 kB gzip vs 300 kB budget), baseline first
- Observe what was never seen live: forced non-allowlisted tool denial, meter rows on the new image, the payment-prompt stream
- Constraints: never touch the kill switch; no deploy unless a change must reach the cluster ([skip ci] otherwise); operator merges PRs and approves deploys; no CopilotKit; pin official A2UI exactly

Added by the operator on 2026-10-12 (recorded here so the exit criteria are unambiguous; adversarial plan review W11):

- Policy (b) for the duplicated answer: prose is the answer; the card is title, one-line summary and source; citations are grouped in one Sources block and kept.
- Reply images allowed from own hosts only; reply links rendered the way citation cards are.
- HTML and Mermaid previews stay enabled, with an isolating CSP in the preview frame, Mermaid strict, and a real-browser proof.
- The Context panel becomes an About / Sources panel on the site.
- Better empty-state copy and starter prompts: an LLM-generated, reviewed pool; the device ranks it from local history; nothing about the visitor leaves the device.
- Visible step chunks (tool steps, citations, a reasoning indicator). Memory recall is not shown and is not enabled (privacy; decision D-P3).
- Knowledge-base expansion: accurate, sourced content on UAR, Surreal Memory Server, BossFang, The Boss, KnowMe (the flagship), PatientGPT and the prior-authorization system, the full and mini skill packages, and the landscape and competition (including OpenAI dots), authored in Open Knowledge Format under `docs/knowledge-source/<product>/`. Correct the live KB's wrong statements first.

Done means: every change in `plan.md` verified at the phase boundary with its stated exit evidence; the live validator reports 0 problems; the retrieval eval meets its stated pass rule; the observed items in change 15 are recorded or reported as not reproducible; and the operator has approved the deploy and each content publication.
