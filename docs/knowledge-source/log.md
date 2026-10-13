# Update Log

## 2026-10-12

* **kb-knowme-flagship 9.2, review fixes**: Added the live-site data-flow disclosure (messages go to the Universal Agent Runtime, a cloud language model and an embedding service; session state stored on the server; retention not published), corrected The Boss packaging scope (sidecars in all current installers; Surreal Memory Server not inside the installer and pinned as a container image), KnowMe desktop and Android development-build wording, licence statements, the telemetry wording for The Boss, one-sentence descriptions of the Universal Agent Runtime, BossFang and the Surreal Memory Server, new FAQ answers and eval questions, and `stale_after` on the FAQ and The Boss.
* **kb-knowme-flagship 9.2**: Migrated the hand-authored `company`, `faq`, `knowme-*` and `the-boss` knowledge files into OKF concepts under `knowme/` and `the-boss/`, rewritten from corrected facts: KnowMe is not publicly released on any platform; The Boss platforms, versions, signing and installer sizes match the download page and release records; the company is KnowMe AI, LLC; KnowMe privacy statements are design intent. Registered the seven outputs in the build manifest. `ipfs-sync-for-obsidian.md` is untouched.
* **Initialization**: Created the bundle skeleton (root index, product directory indexes, authoring guide). No product concepts yet.
