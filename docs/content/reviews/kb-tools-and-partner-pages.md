# Review record: kb-tools-and-partner-pages

Phase `usefulness-update`. Author: km-content-creator. This is an editorial self-review plus two AI pre-reviews. It is not the human review. Operator approval (name, date, approved commit hash) has not been recorded.

## Pages
Registered and generated (`content/knowledge/`): `phase-exit.md`, `knowme-project-management.md`, `htmx-doc-forge.md`, `native-agent-creator.md`, `artifact-refiner.md`.

Drafted and held from the build (task 1.2 gate, decision D-009, earlier gate kb-patientgpt-prior-auth 11.0): `patientgpt/`, `aso-prior-authorization-workbench/`, `tribehealth/`, `hotseaters/`, `asset-intertech-modernization/` under `docs/knowledge-source/`. They are not in `build-manifest.json`, not in the root index, not generated and have no eval questions. The `clients` row (`publication: withheld`) has no page and is not described anywhere.

## Sources used
- Portfolio Edition 2 (IPFS, last modified 2026-10-24) for every page, with the per-entry text in the scratchpad extract.
- Phase Exit: public README, `docs/capabilities.md`, LICENSE (Apache 2.0), read with `gh api`.
- KnowMe Project Management: public README, LICENSE (MIT), documentation site.
- Versions: `{{v:phase-exit}}`, `{{v:setup}}`, `{{v:docforge}}` from `product-facts.json`. Native agent creator and Artifact Refiner have `kind: none`, so their pages say no repository was identified.

## Status wording
- Phase Exit: "existing preview under reliability hardening"; README "published preview"; several host integrations listed as unverified.
- KnowMe Project Management: "existing project-setup skill and documentation".
- HTMX Doc Forge: "existing document tools"; the portfolio's note about the missing verified IPFS receipt for a standalone export is kept.
- Native agent creator: "templates and scaffolding; arbitrary workflow conversion not proven".
- Artifact Refiner: "existing skills; commercial service availability not established".

## Could not verify or left out
- The HTMX Doc Forge repository is private (`gh api` reports `private: true`). The page states this without a citation and uses only the portfolio otherwise.
- Native agent creator and Artifact Refiner: no repository, licence, release or install route is stated, and the pages say so. A `create-native-agent` skill exists in the skill pack, but the sources do not link it to this entry, so the pages do not mention it.
- The held drafts are under 1,200 characters because they contain description and status only.
- Retrieval eval (`eval-retrieval.mjs`) not run: it needs a seeded knowledge base, and seeding is the operator's step.

## AI pre-reviews (2026-10-24)
km-chief-content-officer: PASS WITH FIXES. Applied: Phase Exit hooks sentence no longer implies verified host support; the clause about the runtime phase verdict is removed; "Both" given a subject; HotSeaters "collaborator details withheld" line removed; HTMX Doc Forge "coverage gap" jargon reworded and repository status made explicit. Not applied, with reasons: the TribeHealth "not an automatic rename" line and the ASO "not a production or healthcare certification" line are in Edition 2's entry text, so they stay.

km-security-officer: PASS WITH FIXES. Applied: the withheld client name was removed from the new script's comment and its test, which now read the name from the facts file. Open: the untracked `openspec/changes/kb-tools-and-partner-pages/proposal.md` and `tasks.md` (not written by this author, not committed here) name that client. Their owner should amend them. Checker limits noted: hyphenated or split spellings, HTML entities, plurals and `.tsx`/`src/` output are not scanned. Emphasis marks and zero-width characters are now stripped before matching.

## For the human approver
Each held entry's own name identifies a client, so consent covers the title as well as the text. Whether "office pilot plan" (portfolio wording, used for PatientGPT and ASO) counts as a pilot arrangement is the approver's call.
