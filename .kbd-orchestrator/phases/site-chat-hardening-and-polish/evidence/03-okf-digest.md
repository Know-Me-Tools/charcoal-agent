# Plan-stage research 03: Open Knowledge Format digest

Source: Google Cloud Platform `knowledge-catalog`, `okf/SPEC.md`, **version 0.2** (supersedes 0.1; latest commit seen 2026-08-21), scraped 2026-10-12 and digested by an agent (model output; the digest was not independently re-read against the spec).

- A bundle is a directory tree of markdown files; one file per concept; the concept ID is the path without `.md`. `index.md` and `log.md` are reserved filenames at any level. `references/` is a naming convention only.
- Concept frontmatter: `type` is the **only required key** (non-empty string, not centrally registered). Recommended: `title`, `description`, `resource` (canonical URI), `tags` (YAML list). Extra keys are allowed and must be preserved.
- Optional provenance and lifecycle: `sources` (list; each entry needs `resource`; optional `id`, `title`, `author`, `usage_count`, `last_modified`; `usage_window` sibling), `generated: {by, at}`, `verified` (list of `{by, at}`), `status: draft | stable | deprecated` (absent means stable), `stale_after` (ISO 8601 datetime). All timestamps are ISO 8601 with an explicit offset. There is no numeric confidence field and no `related`/`links`/`supersedes` field; lineage is by markdown links. Per-claim attribution uses footnotes whose labels equal `sources[].id`.
- Actor convention: `<producer>/<version>` for agents, `human:<id>`, `process:<id>`; hand-authored or human-confirmed content must use `human:`.
- Links: standard markdown links, absolute bundle paths starting with `/` recommended; broken links must be tolerated.
- `index.md`: no frontmatter except an optional `okf_version: "0.2"` declaration at the bundle root; headings group bullet entries `* [Title](url) - description`. `log.md`: date-grouped entries (`## YYYY-MM-DD`), newest first.
- Conformance (§11): every non-reserved `.md` has parseable frontmatter and a non-empty `type`; any `index.md`/`log.md` follows §8/§9. Consumers must not reject for missing optional fields, unknown types, unknown keys, broken links or missing indexes.
- No official validator or CLI is mentioned by the spec.
- Ambiguities: YAML quoting of titles with colons; `team:` author values are not in the actor convention; index links may be relative while §6 recommends absolute.
