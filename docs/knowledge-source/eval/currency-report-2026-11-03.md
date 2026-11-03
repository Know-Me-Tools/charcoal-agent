# Currency report, 3 November 2026

Read-only audit for the `usefulness-update` phase. It compares `docs/knowledge-source/product-facts.json` (checked 2026-10-24, pinned to portfolio Edition 2) with the live repositories, npm and the current portfolio page. Nothing in the registry, the knowledge base or the site changes in this PR.

Method: `gh api repos/<repo>/releases`, `/tags` and `/repos` for the 23 rows that name a GitHub repository; `npm view` for PEM; a live scrape of the portfolio index. Repositories, the registry and the cluster win over the portfolio (D-002).

## 1. The portfolio moved on: Edition 3

| | Registry says | Live |
|---|---|---|
| Edition pin | Edition 2, `bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie` | Edition 3, `bafybeidn2uiph3kmd3ygmgtt53mollpr2eymo7is6xinaeawwbo6l5e46i`, dated 25 October 2026, 61 directory entries |
| Rows | 60 | 61 entries; the extra one is Flint core infrastructure, excluded by operator decision (`flint-infra`) |
| Added in Edition 3 | | ASSET stub specification, Rust DLL feasibility paper, Rust performance skill. The registry already carries all three (checked 25 October). |

Action: repoint `edition` to Edition 3 and bump `checked`. No new row is needed.

## 2. Version drift, row by row

| Row | Registry | Live | Proposed registry value |
|---|---|---|---|
| `uar` | stable v1.2.3, preRelease v1.3.0 | v1.4.0-rc.2 released 2026-11-01 ("release candidate, validated on macOS"); v1.3.0 is a GitHub pre-release ("verification pending"); last stable is still v1.2.3 | stable v1.2.3 with `preRelease` v1.4.0-rc.2, labelled release candidate. The site cluster runs rc.2 (PR #195). |
| `boss` | stable v2.2.42 (2026-10-24) | v2.2.44, 2026-10-30 (v2.2.43 on 2026-10-29) | stable v2.2.44 |
| `pem` | stable v4.1.1 (2026-10-08) | GitHub latest release is still v4.1.1. Tag v4.3.0 (2026-10-28, "prepare 4.3.0") has no release. npm `latest` is 4.3.0 (published 2026-10-28; 4.2.0 on 2026-10-10). | Two sources disagree. Proposed: registry kind with npm 4.3.0, and a note that the latest GitHub release is v4.1.1. |
| `mini` | stable v1.12.1 (2026-10-12) | Tag v1.13.2 (PR #71 merged 2026-10-27, "mini-parity-1-13-2"); no release since v1.12.1 | tag v1.13.2 with a note: latest GitHub release v1.12.1 |
| `bossfang` | tag `bossfang-sidecar-92bc005f3` (2026-10-10) | Newer pre-release tags: `-2ec0f66ec`, `-37f05a819` (both 2026-10-12) | tag `bossfang-sidecar-2ec0f66ec`, still no semantic version |
| `skills` | stable v1.13.0 | v1.13.0 (2026-10-18) | no change |
| `forge` | stable v1.0.0 | v1.0.0 (2026-07-07) | no change |
| `memory` | tag v1.10.2 | v1.10.2 | no change |
| `knowledge` | tag v1.11.0 | v1.11.0 | no change |
| `parking` | registry v0.4.0 | v0.4.0 (2026-10-25) | no change |

Untagged repositories, last push: `knowme` 10-20, `locus` 10-21, `meet` 10-19, `decision` 09-30, `concierge` 11-02, `gate` 10-31, `fabric` 10-30, `sync` 09-17, `demos` 10-27, `phase-exit` 10-16, `setup` 09-30, `docforge` 10-13, `candle-vllm` 05-26. Rows with no repository are unchanged and unverified here.

## 3. Wording conflict: Universal Agent Runtime

Portfolio Edition 3 still says "Work stopped; current runtime qualification not established." The repository shipped 1.4.0-rc.1 (2026-10-30) and rc.2 (2026-11-01), and this site runs rc.2. D-002 puts the repository first, so the row's `portfolioStatus` should say active, release candidate, and record that the portfolio text predates it. The portfolio itself is the operator's document; the registry should not repeat a claim the repository contradicts.

## 4. Where stale values are written into content

Over 30 generated files in `content/knowledge/` plus `content/site/directory.ts` carry versions. Two kinds, which need different handling:

- **Current-version claims**, for example "release v2.2.42", "release v1.2.3", "Entity Management (v4.1.1". These follow the registry.
- **Verification claims**, for example "Universal Agent Runtime v1.3.0" in `private-data-question-answering`, `regulated-industry-readiness`, `human-review-workflow`, `private-deployment-checklist`. These say the claim was checked against UAR's source at v1.3.0. Changing the number without re-reading the source at rc.2 would make a false statement. Those pages need a re-check, not a find-and-replace.

## 5. Findings outside this change

- `locus`, `demos` and `docforge` are private repositories per the GitHub API (`private: true`), yet `product-facts.json` and several knowledge pages cite their URLs as `resource:` links (`solutions/*`, `locus/locus.md`, `demo-hosting-platform`). A visitor cannot open them. "Missing and private are different" applies; this needs an operator decision, not a silent edit.
- `candle-vllm` last pushed 2026-05-26; its registry summary describes work verified at 10f844d. Not re-verified here.

## 6. Proposed P2 registry change

`edition` and `checked` updated; `uar`, `boss`, `pem`, `mini`, `bossfang` rows updated as in section 2; `uar` status wording per section 3. The "Check product directory" gate will require a matching update to `content/site/directory.ts`.
