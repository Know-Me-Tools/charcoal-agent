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

A build step (task 2.2) converts concept files into `content/knowledge/` using a build manifest. It never deletes hand-authored files in `content/knowledge/`; it only writes and removes files listed in the manifest. This section describes the contract; the script is not yet written.
