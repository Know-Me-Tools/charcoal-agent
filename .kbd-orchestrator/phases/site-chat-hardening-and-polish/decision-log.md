# Decision log: site-chat-hardening-and-polish

## D-1 · 2026-10-12 · assess/plan · Duplicated answer: policy (b)
Operator chose: prose is the answer; the A2UI card carries title, one-line summary and source; citations grouped in one Sources block and kept. Why: the duplication is caused by our own agent prompt ("the card replaces nothing"). Falsifier: if the live model keeps repeating the card in prose after 5.1, policy (a) (client collapses prose) is the fallback and needs a new operator decision.

## D-2 · 2026-10-12 · plan · Remote images and reply links
Remote images: own hosts only, in sanitizer and `img-src`. Links: rendered as citation cards render them. Why: an image URL is a zero-click channel out of the chat. Falsifier: a legitimate need for third-party images; none known.

## D-3 · 2026-10-12 · plan · HTML and Mermaid previews stay enabled
Operator answered "No, enable both" to a proposal to block. Mitigation: isolating CSP meta in the preview frame, Mermaid strict, and a real-browser proof under the enforcing header (3.5). Risk: scripted previews are likely blocked by an inherited `script-src` without `'unsafe-inline'`; operator chooses between static-only previews and a dedicated sandbox route after the proof. Supersedes the assessment's earlier lean to disable.

## D-4 · 2026-10-12 · plan · Caption, About panel, starter prompts
Caption on every A2UI surface (operator wording approval pending). Context panel becomes About / Sources. Starter prompts: reviewed LLM-generated pool, shipped as a static file with the image (not independent of a deploy), device ranks locally.

## D-5 (D-P3) · 2026-10-12 · plan · Memory recall chunks are not shown and recall is not enabled
Evidence: `chat_request.rs` sets `memory_enabled:false` (FR-41); all visitors share one upstream principal. Showing recall would require enabling shared memory, which could surface one visitor's content to another. Falsifier: per-visitor memory identity upstream; none exists. Pinned by a regression test (4.5).

## D-6 · 2026-10-12 · plan · Knowledge-base expansion rules
OKF 0.2 is the source format under `docs/knowledge-source/`; a build step produces flat KB files (the KB ingests flat `.md` only). Public repository: committing equals publishing (D-P10). Pricing excluded; licences stated only where a licence file exists; no client names, patient data, credentials or compliance/certification claims; competitor claims sourced with URL and retrieval date and attributed in text. Live wrong statements are corrected first (change 13). Open operator items: company legal name, client consent for PatientGPT/prior-auth, whether counsel reviews comparative wording.

## D-7 · 2026-10-12 · plan · Content and agent sync without an image deploy
New `site-content.yml`: `workflow_dispatch` only, `sync: kb | agent | all`, `environment: production`. `paths-ignore` limited to `content/knowledge/**` and `docs/knowledge-source/**` (not `content/site/**`, which ships in the bundle).

## D-8 · 2026-10-12 · plan/execute · Operator answers to the open questions
- **Visitor (Q1):** visitors arrive from the operator's Medium and LinkedIn articles and other product-specific marketing links. The site gives selective, minimal content per product; the concierge chat is the route to whatever depth the visitor wants ("selective discovery"). Visitors are remembered through the threads stored locally in PGlite, whether or not logged in, and the experience is customised from that local data; using the chat is itself the demonstration of the platform.
- **Claim (Q2):** KnowMe's truthful claim: the customer helps build their own product through use; assistants and agents adapt to them; local data sovereignty and decentralised, secure data management, so a user is not dependent on any one LLM vendor. Say little more, because more products are coming and the concierge handles navigation.
- **Never say (Q3):** as proposed: no pricing, no availability beyond what is documented, no compliance or certification claims, no stronger privacy promise than the product backs, no client names.
- **Release status (Q4):** The Boss, the desktop app, is free, open source and downloadable now from the-boss.know-me.tools. The operator states it embeds the Universal Agent Runtime, BossFang and the Surreal Memory Server (to be verified against The Boss repository before publishing).
- **Company (Q5):** the legal name is **KnowMe AI, LLC** (D-P1 resolved).
- **Q6:** `git pull` approved and run in the BossFang reference clone (already up to date; HEAD recorded in the private evidence file).
- **Licences (Q7):** all original work (not derived from other open-source works) is MIT. Derived work keeps its upstream licence (The Boss is built on Cherry Studio and is AGPL-3.0 in its repository). Surreal Memory Server and KnowMe have no LICENSE file at the repository root; content may say MIT per the operator, and adding LICENSE files is recommended.
- **Local live runs (Q8):** approved; credentials are used from the operator's own environment and are never read into the conversation.
- **Pricing (Q9):** nothing is bought on know-me.tools; each paid offering will have its own site; business models are undecided and depend on feedback from this site.
- **Comparisons (Q10):** the KB must compare with comparable tools and go deeper on differences, pluses and minuses (ours included). Counsel review was not requested; the D-P6 rules (sourced, dated, capability and trade-off framing) stay.

## D-9 · 2026-10-12 · plan · Starter-prompt personalisation (revises task 7.1's default)
The operator intends customisation from the visitor's locally stored history. History-based ranking therefore stays on-device and defaults ON, on the reasoning that the thread list on the same browser already shows that history, so chips drawn only from the reviewed pool and ordered by local history reveal nothing the sidebar does not. Conditions: chips show pool text only, never history text; nothing about the visitor is sent to the server or model; deleting threads removes their influence. Task 7.1 still needs the security officer's sign-off and the operator's approval. Falsifier: a shared-browser scenario where the thread list is hidden but chips are shown.

## D-10 · 2026-10-13 · execute · Operator answers to the second question list
1. **Model provider:** Alibaba Cloud is acceptable as the model and embedding provider for the public site agent.
2. **Retention:** the visitor determines retention of their own conversations on their own devices. Server-side retention of the runtime's session state is still not published; the KB says so and does not state a period.
3. **Makers:** the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages are made by Prometheus (Prometheus AGS; the operator wrote "Promethity", read as Prometheus AGS, to be confirmed). KnowMe, The Boss and IPFS Sync for Obsidian remain KnowMe AI, LLC products as the existing KB states.
4. **Prometheus** is the name of the AI platform's server-side work.
5. **KnowMe licence:** MIT. LICENSE file proposed in Know-Me-Tools/know-me-system PR 13 (holder KnowMe AI, LLC). The workspace metadata `MIT OR Apache-2.0` in `rust/Cargo.toml` still disagrees and is for the operator to change.
6. **Surreal Memory Server and Prometheus Skills Mini** are MIT: LICENSE PRs Prometheus-AGS/surreal-memory-server#50 and Prometheus-AGS/prometheus-skills-mini#58 (holder Prometheus AGS, to be confirmed).
7. **BossFang's home:** https://bossfang.know-me.tools (not yet checked by the main thread: the first fetch failed with a proxy error).
8. **BossFang is always called BossFang;** the binary-name drift will be fixed in the repository later, so the KB does not mention the old binary name. **Skill counts:** stated from a defined count, not from the packages' own inconsistent figures. **Surreal Memory Server testing** resumes after the code base stabilises; the KB says testing is planned, not that it was stopped. Preference recorded: no worthless or repeated testing.
9. **Update channel:** a Bluesky-compatible PDS using the AT Protocol, not yet deployed. The KB says no channel is live yet and names the planned one.
10. **Confirmed true:** KnowMe is not publicly released on any platform; development builds have run on macOS and an Android phone; the "still being built" status section may be published; the legal-name equivalence sentence (KnowMe, LLC and Know Me Tools are the same company).
