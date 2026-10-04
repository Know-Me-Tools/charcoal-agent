# IPFS Sync for Obsidian product brief (starting point for marketing and content; the product repo remains the source of truth)

Compiled 2026-09-30 from `/Users/gqadonis/obsidian/.ipfs-sync` (git `main`, in step with `origin/main`, head `4c1a609`) and its public GitHub repo `Prometheus-AGS/obsidian-ipfs-sync` (visibility PUBLIC). Owner: km-cmo. Every claim cites its source. Re-check the source before using a claim, because product details change.

**Read this first:** this is a fixture-only pre-release with no encryption. Its own README says "Do not use it on real notes." Nothing about it may be marketed as a way to sync real notes today.

## What it is and who it's for
- An Obsidian community-style plugin plus a CLI. "Sync your vault over IPFS through your own kubo node. No Obsidian Sync subscription. No third-party cloud. Content-addressed snapshots now, CRDT multi-writer sync and an AI layer later." (`README.md` lines 1–4; the node URL in that line is omitted here on purpose)
- Plugin ID `ipfs-sync`, display name "IPFS Sync". (`manifest.json`)
- Audience (inferred, not stated): Obsidian users who run, or can run, their own kubo (IPFS) node and want sync without a subscription service. The README states no persona. See open questions.

## Shipped vs specified (check this before any claim)
Status comes from `CHANGELOG.md`, the GitHub pre-release `v0.2.0` and OpenSpec task checkboxes. Do not use `DESIGN.md` (its header: "draft — pre-implementation spec") or `docs/0*.md` for status.

| Capability | Status | Evidence | May marketing say it exists today? |
|---|---|---|---|
| CLI `status`, `publish`, `pull` with delta transfer | **Pre-release v0.2.0** (fixture vaults only) | `CHANGELOG.md` mvp-01..03; OpenSpec mvp-01..03 all tasks ticked | Only as "pre-release, test vaults only" |
| Plugin Publish, Pull, Status commands, settings tab, auto-publish, catch-up on load | **Pre-release v0.2.0** (fixture vaults only) | `CHANGELOG.md` mvp-04..05; mvp-04 11/12 and mvp-05 10/13 tasks ticked | Same: pre-release only |
| Conflict-safe pull (remote wins, local kept as a conflict copy; pull never deletes) | **Pre-release v0.2.0** | `CHANGELOG.md` mvp-03, mvp-05; `README.md` "Conflict policy" | Same |
| GitHub pre-release with `main.js`, `manifest.json`, CLI tarball and SHA-256 sums | **Published 2026-09-30**, marked pre-release | `gh release view v0.2.0` | Yes, as a pre-release |
| Client-side encryption | **In progress, not shipped** (mvp-06: 16 of 27 tasks ticked) | `openspec/changes/mvp-06-encrypted-vault-publish/tasks.md`; README "Encryption is planned" | No |
| Second-device encrypted pull, sync history, end-to-end fixture, real-vault release | **Planned** (mvp-07: 0 of 21; mvp-08..10: no tasks yet) | `openspec/changes/mvp-07..10` | No |
| Phase 2 CRDT multi-writer sync (Helia + OrbitDB) | **Roadmap only** | `README.md` "Roadmap" | No |
| Phase 3 AI layer (embeddings, semantic search, RAG chat, auto-backlinks) | **Roadmap only** | `README.md` "Roadmap" | No |
| Phase 4 mobile and always-on pinning | **Roadmap only** | `README.md` "Roadmap" | No |
| Any platform verified in Obsidian | **None recorded.** Target is Obsidian desktop on macOS; mobile, Windows and Linux not verified | `README.md` notice; release notes "Not verified" | No platform claim |

## Capabilities (as shipped in the v0.2.0 pre-release; fixture vaults only)
- Publish sends "only changed files" and points an IPNS key at the new snapshot; pull "fetch[es] only files whose sha256 differs". (`README.md` "CLI usage")
- "pull never deletes and never loses data"; a differing local file is kept as `name (ipfs conflict YYYY-MM-DD).ext`. Remote deletions are reported, not applied. (`README.md` "Conflict policy")
- Plugin code and data, including stored credentials, are never published or pulled: "`.obsidian/plugins/` is never published and never pulled". (`README.md` "Obsidian plugin")
- Separate write (RPC) and read (gateway) endpoints; auth schemes none, basic, bearer, custom header. (`CHANGELOG.md` mvp-01)
- The CLI "is a plain Node HTTP client against the kubo RPC and gateway — no local IPFS daemon needed." (`README.md` "CLI usage")
- Requirements: Obsidian 1.12.3 or later; the CLI needs Node 24.15 or later and pnpm; the user's own kubo node. (`README.md`; `versions.toml` pins Node 24.15.0; release notes "Requirements")

## Differentiators, in the product's own words
- "No Obsidian Sync subscription. No third-party cloud." (`README.md` line 2) This describes the design; with no encryption, the data on the user's node is readable by anyone with the CID, so do not pair it with a privacy promise.
- "Content-addressed snapshots now, CRDT multi-writer sync and an AI layer later." (`README.md` line 3) The "later" half is roadmap only.
- Conflict handling that keeps both versions: "keeps your local bytes when both sides changed, saving the remote version as a conflict copy." (GitHub release notes v0.2.0)

## Pricing and availability
- License: MIT, "copyright KnowMe AI, LLC". (`README.md` "License"; `LICENSE` line 3)
- No price is stated. It depends on the user's own kubo node; hosting cost is the user's.
- Availability: GitHub pre-release only. It is not listed in the Obsidian community plugin directory (no evidence in the repo). Manual install: copy `main.js` and `manifest.json` into `<vault>/.obsidian/plugins/ipfs-sync/`. (`README.md` "Obsidian plugin")

## Relationship to KnowMe
- Copyright holder is KnowMe AI, LLC. (`LICENSE`) That is the only relationship the sources state.
- Do not connect it to KnowMe's sync, BossFang or the KnowMe app; no source links them.

## Warnings: stale or risky sources
- **Stale release text:** `README.md` and `CHANGELOG.md` say 0.2.0 "is not released yet" and "`manifest.json` still reads 0.1.0". Both are out of date: `manifest.json` reads 0.2.0 and the GitHub pre-release `v0.2.0` exists. The release notes also do not say whether the in-Obsidian macOS demonstration that "defines the release" was recorded.
- **Minor conflict:** README says files are "read whole"; release notes say "the plugin appends large files in chunks". Ask the product owner before describing large-file handling.
- **Internal hostnames:** README and DESIGN name the maintainer's own kubo node, its DNS and other projects' keys, and describe that node's RPC as open to the internet. Never reproduce the hostname, key names or that security note in public material. Marketing should say "your own kubo node" only.
- **Aspirational docs:** `DESIGN.md` and `docs/001..011` describe mobile, iOS/Android, a VPS sync daemon, Rust/WASM and local agents. None of that is built. Do not quote them as features.
- **Internal material:** `.kbd-orchestrator/` files and the decision log were read for status only and are not quoted.

## Open questions for the operator
1. Official product name: "IPFS Sync" (manifest), "IPFS Sync for Obsidian" (README) or `obsidian-ipfs-sync` (repo). Can the name use "Obsidian"? Obsidian's plugin guidelines should be checked before any public naming.
2. Is this a KnowMe AI, LLC product to feature on this site at all while it is fixture-only? If yes, only as "pre-release, not for real notes".
3. Who is the intended audience: self-hosters with a kubo node only, or a wider Obsidian audience once a hosted node exists?
4. Was the in-Obsidian macOS release demonstration recorded for v0.2.0? The README makes it the release criterion.
5. Target date or milestone for encryption (mvp-06) and real-vault use (mvp-10)? Until then no "sync your notes" message is possible.
6. Will it be submitted to the Obsidian community plugin directory?
7. Should the site link the GitHub repo, given the README exposes internal node details? Recommend the owner clean the README before we link it.
