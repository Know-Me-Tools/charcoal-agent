# Update Log

## 2026-10-15

* **Product relationships**: Added `prometheus/product-relationships.md`, which collects every relationship between the eight products that the existing files already state, one per line, and lists the pairs with no stated relationship. A visitor asking for a diagram of how the products relate got "I don't know" because those statements sit in about six files. Four non-critical eval questions added.

## 2026-10-13

* **Makers and licences, short answers**: Added `prometheus/prometheus-and-its-products.md`, one short, standalone section per visitor question (who makes each product, each licence, where to get them), because the maker and licence facts were not retrieved from inside longer sections. Surreal Memory Server and Prometheus Skills Mini LICENSE files are now merged (Prometheus-AGS/surreal-memory-server#50, Prometheus-AGS/prometheus-skills-mini#58), so their status, FAQ and index text now states MIT with a LICENSE file instead of the proposed-file clause. Three non-critical eval questions added.

## 2026-10-12

* **kb-knowme-flagship 9.2, operator answers (D-10)**: retention wording for conversations in the browser versus the server; the Universal Agent Runtime, BossFang and the Surreal Memory Server attributed to Prometheus (Prometheus AGS) with KnowMe and The Boss built on them; KnowMe planned MIT licence; the planned AT Protocol update channel; BossFang's public home; two new FAQ answers.
* **kb-knowme-flagship 9.2, review fixes**: Added the live-site data-flow disclosure (messages go to the Universal Agent Runtime, a cloud language model and an embedding service; session state stored on the server; retention not published), corrected The Boss packaging scope (sidecars in all current installers; Surreal Memory Server not inside the installer and pinned as a container image), KnowMe desktop and Android development-build wording, licence statements, the telemetry wording for The Boss, one-sentence descriptions of the Universal Agent Runtime, BossFang and the Surreal Memory Server, new FAQ answers and eval questions, and `stale_after` on the FAQ and The Boss.
* **kb-knowme-flagship 9.2**: Migrated the hand-authored `company`, `faq`, `knowme-*` and `the-boss` knowledge files into OKF concepts under `knowme/` and `the-boss/`, rewritten from corrected facts: KnowMe is not publicly released on any platform; The Boss platforms, versions, signing and installer sizes match the download page and release records; the company is KnowMe AI, LLC; KnowMe privacy statements are design intent. Registered the seven outputs in the build manifest. `ipfs-sync-for-obsidian.md` is untouched.
* **Initialization**: Created the bundle skeleton (root index, product directory indexes, authoring guide). No product concepts yet.
