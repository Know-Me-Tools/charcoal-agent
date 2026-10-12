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
