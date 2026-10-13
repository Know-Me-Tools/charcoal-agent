# Review record: KnowMe and The Boss knowledge corrections (kb-knowme-flagship 9.1 to 9.3)

Corpus: `content/knowledge/*.md` (8 files; 7 rebuilt from `docs/knowledge-source/`, `ipfs-sync-for-obsidian.md` unchanged). Content hash (sha1 of the per-file git blob hashes): `3032f691256b`.
Branch: `feat/kb-knowme-corrections`. Sources: `docs/knowledge-source/knowme/*.md`, `docs/knowledge-source/the-boss/the-boss.md`, built by `scripts/kb/build-kb.mjs` from `docs/knowledge-source/build-manifest.json`.

## Sources checked
- The product repositories for KnowMe and The Boss (public facts only; private paths are in the untracked evidence table under `.prometheus/knowledge-evidence/`).
- The Boss public download page and the public repository `Prometheus-AGS/the-boss` (`README.md`, `PRODUCT.md`, `RELEASES.md`, `LICENSE`, `PRIVACY.md`, `build/integration-artifacts.json`, `build/prometheus-payload/release-manifest.json`), retrieved 2026-10-12.
- This repository's public runtime configuration (`k8s/base/uar-configmap.yaml`, `uar/agents/knowme-site.json`) for the live-site data flow.
- `marketing/strategy/the-boss-brief.md`, `PRODUCT.md`, the phase decision log (operator answers D-8).

## Checks run (2026-10-12)
- `node scripts/kb/build-kb.mjs`: 7 outputs written; `--check`: 0 out of date.
- `node scripts/kb/validate-kb.mjs`: 0 failures (5 pre-existing index-bullet warnings in untouched product indexes).
- `npx vitest run src/test/brand-naming.test.ts`: 2 passed.
- `node --test 'scripts/kb/__tests__/*.test.mjs'`: 17 of 20 pass. The three failures are the test asserting the committed manifest is empty and the two eval tests that replay `eval/questions.json` against a two-question mock; both are addressed outside this change.
- No local absolute path, secret pattern or banned assertion in the bundle or corpus; `ipfs-sync-for-obsidian.md` is byte-identical to `origin/main`.

## Editorial pre-review (km-chief-content-officer) and fact check (critic)
Two independent reviews were applied in the second commit on this branch: the live-site data-flow disclosure replaces every "your history stays with you" sentence; The Boss packaging scope covers all current installers and states that the Surreal Memory Server is not inside the installer; KnowMe desktop and Android development-build wording follows the documented runs; licence statements name the authoritative LICENSE file; The Boss telemetry is stated as not yet published, with the upstream policy's default collection described; one-sentence descriptions of the Universal Agent Runtime, BossFang and the Surreal Memory Server were added; FAQ answers and eval questions were added; `stale_after` is set on the FAQ and The Boss sources.

## Sentences that require the operator's approval before publication
Each is quoted from the built corpus and must be approved, changed or removed by the operator; the AI pre-review above is not that approval.

1. **Live-site data-flow disclosure** (`knowme-privacy.md`, "What happens to a message you type on this site"; `faq.md`, "Does the KnowMe agent on this site send my messages to a model provider?"; `company.md`): "When you send a message to the KnowMe agent on this site, it leaves your device. The site runs on KnowMe AI, LLC's Universal Agent Runtime, which stores the conversation's session state in its own database (SurrealDB) on the server. The reply is composed by a cloud language model, Qwen (qwen3.8-max), served through Alibaba Cloud's model service, and the search that finds knowledge-base passages uses Alibaba Cloud's embedding service. A copy of each thread is also kept in your browser." followed by "The conversations stored in your browser are yours: you decide how long they are kept, because they live on your own device. How long the site's server keeps the runtime's conversation state has not been published." Why: this is a public statement about the company's own data handling, read from deployment configuration; server-side retention is stated as unpublished rather than as a period. Operator confirmed in chat, 2026-10-13: Alibaba Cloud is accepted as the model and embedding provider, and retention of conversations on the visitor's own device is the visitor's. Still open: the exact approval of this wording.
2. **Android development-build sentence** (`knowme-platforms-and-status.md`, `faq.md`, `knowme-features.md`): "KnowMe AI, LLC has installed and run an Android development build on a current Android phone, but there is no public release for iOS or Android, and no date has been announced." and "Development builds have run on macOS; Windows and Linux are build targets." Why: these describe unreleased development work from internal records. Operator confirmed in chat, 2026-10-13: KnowMe is not publicly released on any platform; development builds have run on macOS and an Android phone.
3. **Status section** (`knowme-features.md`, "What exists in KnowMe today"): "In KnowMe AI, LLC's development builds of KnowMe, chat and the local memory graph work on macOS and in an Android development build. The Models and Settings tiles are partially present on desktop. Hands, multi-device sync and the plugin system are still being built, and Ask Image, Audio Scribe, Prompt Lab and Skills are designed but not yet built." Why: unreleased status detail; the operator asked to say little. Operator confirmed in chat, 2026-10-13: this status section may be published.
4. **Legal-name equivalence** (`company.md`, "KnowMe AI, LLC is the company's legal name"): "The company's legal name is KnowMe AI, LLC. Older documents that say "KnowMe, LLC" refer to the same company, and The Boss's own README calls The Boss the "Know Me Tools" desktop workspace, which is this company too." Why: the equivalence of "KnowMe, LLC" and "Know Me Tools" to KnowMe AI, LLC rests on the operator's statement; public pages for The Boss carry a different brand. Operator confirmed in chat, 2026-10-13: "KnowMe, LLC" and "Know Me Tools" are the same company.
5. **The Boss version, size and OS facts** (`the-boss.md`, `faq.md`): "Today the download page offers The Boss v2.2.36 for macOS on Apple Silicon and for Windows x64. The Intel Mac and Windows ARM64 downloads are the older v2.2.30 builds; the v2.2.36 update for those two platforms is pending. The Boss needs macOS 12 or later or Windows 10 or later." and "v2.2.36 macOS Apple Silicon 685.0 MB and Windows x64 509.6 MB; v2.2.30 macOS Intel 713.2 MB and Windows ARM64 472.0 MB." Why: these go stale with each release (`stale_after` is 2026-10-26). Still open: perishable facts, to be re-checked at publication.
6. **Surreal Memory Server not inside the installer** (`the-boss.md`, `faq.md`): "The Surreal Memory Server is not inside the installer: The Boss works with it over MCP as a separate service that The Boss can manage or connect to. Running The Boss's managed Surreal Memory service needs a container runtime, because The Boss pins it as a container image." Why: this corrects the operator's earlier statement that The Boss embeds the Surreal Memory Server; packaging it is tracked in The Boss repository (issue 73). Operator accepted in chat, 2026-10-13, that it is not in the installer; the wording itself is still open.
7. **KnowMe licence** (`faq.md`, "Is KnowMe open source?"; `knowme-overview.md`): "KnowMe is planned to be released under the MIT licence." (with "KnowMe has not been publicly released yet, so nothing is available under that licence today."). Why: the operator confirmed MIT on 2026-10-13 and a LICENSE file is proposed in the KnowMe repository (pull request 13, not yet merged); the Rust workspace metadata still declares a different licence, which the operator will change. Still open: the sentence as worded, until the LICENSE file is merged.
8. **Makers** (`company.md`, "The parts KnowMe and The Boss are built on"; `faq.md`, three answers): "KnowMe and The Boss are built on parts made by Prometheus (Prometheus AGS); Prometheus is the name of that company's server-side AI platform work" and "KnowMe AI, LLC plans to publish updates through a Bluesky-compatible server using the AT Protocol. That server has not been deployed yet, so there is no update channel to follow today." Why: both come from the operator's answers of 2026-10-13; the decision log reads the maker's name as Prometheus AGS and marks it "to be confirmed". No corporate relationship between the two companies is stated.

## Operator decisions still open
- Whether to publish a server-side retention period for the site's conversation state (item 1); the visitor's own-device retention is settled.
- Merging the proposed KnowMe LICENSE file (MIT) and aligning the Rust workspace metadata (item 7).
- Confirming the maker's name as Prometheus AGS (item 8; the decision log marks it "to be confirmed").
- Whether The Boss download page's licence wording and brand should be aligned with the repository LICENSE and KnowMe AI, LLC.
- The Boss's own telemetry behaviour (task 10.5 completes this).

## Approval
Not yet approved. Operator approval (name, date, commit hash of the approved files):

- Name:
- Date:
- Commit:
