# Review record: kb-apps-pages

Phase `usefulness-update`. Author self-review (km-content-creator). Not the content officer's pre-review and not operator approval; both are still needed.

## What changed
Twenty-three concept pages, one per portfolio application entry, each in its own directory under `docs/knowledge-source/` and registered at the end of `build-manifest.json`: locus, knowme-dot, synaxis, numen, knowme-praxis, know-meet, know-decision, operator-service, lampas, knowme-concierge, knowtes, prometheus-tune, logos, prometheus-studio, light-creator, prometheus-pulse, tranquil, knowme-poppy-integration, authentic-digital-twin, companion, numen-enclave, knowme-realtor-assistant, kaia. The `knowme` entry is not touched. Eight eval questions were appended (none critical).

## Sources used
- Portfolio edition 2 (entry summary, status, coverage-gap and document lists), for every page.
- Read-only repository files: Know-Me-Tools/locus README.md and docs/architecture/STATUS.md; know-meet README.md; know-me-decision README.md; charcoal-agent README.md.
- Versions come from `product-facts.json` placeholders. Locus, Know Meet, Know Decision and the Concierge are untagged and render "no tagged release (last commit ...)". All other entries have no repository, and the pages say so.

## Status wording
Every first paragraph states the portfolio status. Proposals, designs, prototypes and specifications are never in the present tense as available. Knowtes (unresolved), Kaia (under assessment) and Light Creator (needs confirmation) say only that, in short pages. Numen Enclave and Companion quote the portfolio's proposed, tested and still-ahead wording.

## Left out, and why
- PatientGPT and the clinical pilot profile (pending consent): Numen Enclave says only that a concrete proposed deployment profile is listed.
- Know Decision README detail on hosted providers, clinic hardware and protected data: not needed and outside what the page must say.
- Locus and dot IPFS paper contents: only the portfolio's listing was read, so no claim is made about their text.
- Praxis: the 22 KB edition is a list of 239 source records; the page summarises the portfolio line and counts only.
- A statement that this repository is the concierge running on the KnowMe AI, LLC site: not in the README, so not asserted. Needs the product owner to confirm if wanted.
- The Synaxis name-clearance note: omitted as not useful to visitors.

## Not verified
- I did not open the IPFS documents behind the portfolio links.
- I did not run the retrieval eval (needs a live UAR).
- The root `docs/knowledge-source/index.md` product list was not edited; the lead should decide how to list these directories.
