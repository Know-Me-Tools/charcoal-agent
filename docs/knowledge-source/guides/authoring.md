---
type: Guide
title: Knowledge bundle authoring guide
description: Rules for writing, sourcing and building concept files in the KnowMe AI, LLC knowledge bundle.
status: stable
generated:
  by: km-devops-engineer/sonnet
  at: "2026-10-12T00:00:00+00:00"
---

# Knowledge bundle authoring guide

This bundle follows Open Knowledge Format (OKF) 0.2. One concept per markdown file; the concept ID is the path without `.md`. `index.md` and `log.md` are reserved names. This repository is public: committing a file publishes it.

## Frontmatter

OKF requires only `type`. Project rule, not an OKF rule: every concept here also requires `title`, `description`, `status` (`draft`, `stable` or `deprecated`), `generated` (`by`, `at`) and, for any externally sourced claim, `sources`. Optional OKF keys: `resource`, `tags` (YAML list), `verified` (list of `by`/`at`), `stale_after` (ISO 8601 datetime). Do not invent other fields. Timestamps are ISO 8601 with an explicit offset. Actors are `<producer>/<version>` for agents, `human:<id>` for people; human-confirmed content must use `human:`. Quote titles that contain colons.

## Sources

Each external claim needs a public URL and a retrieval date. Put the URL in `sources[].resource` and the retrieval date in `last_modified` (ISO 8601 with offset), or in the entry `title`. Give each entry an `id`; footnote labels in the body match it. The build step writes the in-text attribution line; do not hand-write one.

Marking external claims: put a footnote reference `[^id]` after each externally sourced claim, where `id` is a `sources` entry. If the whole concept rests on external sources, set `external_claims: true` in the frontmatter instead. The validator fails a reference with no matching entry, a source without a URL or retrieval date, and `external_claims: true` without sources. Footnote definition lines (`[^id]: ...`) are optional and are dropped by the build.

## Claims about our own products

Every claim must be supported by the product's own public documentation or code. If it is not, write it as design intent or leave it out. Never write certification, compliance, "provably", pricing or availability claims that are not documented as released. Mandated sentences: "pricing has not been announced" and "browser-certified on synthetic data only". Comparative claims about other products need a source, paraphrase (quotes under 15 words), and capability and trade-off framing, not superiority.

## Forbidden content

Secrets, credentials, personal data, client names, private repository paths, local absolute paths, internal analyses, unreleased roadmap detail. State a licence only where a licence file exists; otherwise write "licence not yet published".

## Writing for retrieval

The knowledge base is chunked at about 1000 characters. Repeat the product name in every section heading, and make each section stand alone. One topic per concept file. Use descriptive file names: the file name becomes the citation name visitors see, so `knowme-platforms-and-status.md` reads well. The seed adds hash suffixes; do not add them. FAQ concepts use visitor-question style: the heading is the question as a visitor would ask it, the answer follows directly.

## Company name

Use "KnowMe AI, LLC" until the operator confirms the legal name.

## Links

Use absolute bundle paths starting with `/`, for example `/knowme/knowme-platforms-and-status.md`. Broken links are tolerated by consumers but should not be shipped.

## Build contract

`scripts/kb/build-kb.mjs` converts the concept files listed in `/build-manifest.json` (`{"entries": [{"source": "knowme/x.md", "output": "x.md"}]}`) into flat files in `content/knowledge/`. It writes only listed outputs and never deletes, renames or rewrites any other file there; it refuses an output that would reach an unlisted file (a name differing only by case, or a symbolic link). Hand-authored files, including `ipfs-sync-for-obsidian.md` and `the-boss.md`, are touched only if listed. Removing an entry does not delete its output; delete that file by hand.

The build strips frontmatter and footnote markup, appends `Source: <title or URL>, retrieved <date>.` under each section with an external claim, and makes every `#` and `##` heading carry the product label: the `# ` heading of the concept's top-level directory `index.md` (for example "The Boss"). A heading that does not already contain the label gets ` (<label>)` appended. Concepts must sit in a product directory, not the bundle root. Output is deterministic.

The frontmatter parser accepts a strict YAML subset: the keys named above (plus `external_claims`), two-space indentation, plain or quoted scalars, lists and lists of maps. Comments, anchors, block scalars and unknown keys are errors.

## Commands

* `node scripts/kb/build-kb.mjs` builds; `--check` exits non-zero if any output would change.
* `node scripts/kb/validate-kb.mjs` runs OKF conformance, the frontmatter and sourcing rules, a broken-link report (warnings), the secret and personal-data pattern scan, the banned-assertion scan and the FR-8 file check. Allowed email addresses go in `scripts/kb/email-allowlist.txt`.
* `UAR_BASE_URL=... KB_ID=... UAR_TOKEN=... node scripts/kb/eval-retrieval.mjs` checks that each question in `/eval/questions.json` retrieves its expected file in the top 5 (`--min-recall`, default 0.9; any `critical` failure fails).
* `node --test 'scripts/kb/__tests__/*.test.mjs'` runs the pipeline tests (Node 24 does not accept a bare directory here).
* The `Site content sync` workflow (`.github/workflows/site-content.yml`) runs the build check, validator and brand-naming test, then seeds UAR with `SEED_MODE` `kb`, `agent` or `all` unless `dry_run` is set.
