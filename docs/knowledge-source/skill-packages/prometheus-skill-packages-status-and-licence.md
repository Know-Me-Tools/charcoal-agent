---
type: Concept
title: Prometheus skill packages status and licence
description: Release status, platform acceptance, skill counts and licences of the full Prometheus Skill Pack (MIT, LICENSE file present) and Prometheus Skills Mini (MIT per its manifest and README, no LICENSE file yet).
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:25:33+00:00"
tags:
  - skill-packages
  - status
  - licence
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: full-license
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/LICENSE
    title: Prometheus Skill Pack LICENSE
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: full-system
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/skill-system.json
    title: Prometheus Skill Pack skill-system manifest
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: full-skills
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/SKILLS.md
    title: Prometheus Skill Pack skill catalog
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: mini-package
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/package.json
    title: Prometheus Skills Mini package manifest
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: mini-publication
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/docs/source-publication-20261005.md
    title: Prometheus Skills Mini source publication note, 2026-10-05
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: mini-maintenance
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/docs/maintenance.md
    title: Prometheus Skills Mini maintenance and platform limits
    last_modified: "2026-10-13T00:25:33+00:00"
---

# Prometheus skill packages status and licence

## How many skills the Prometheus skill packages have

See each package's own skill index. The full pack's catalog is `SKILLS.md` and its inventory is generated from `skill-system.json`; the counts in its files do not all agree, so this knowledge base does not quote one.[^full-skills][^full-readme] Mini's counts and targets come from its `skill-system.json`, `package.json` and `versions.toml`.[^mini-readme]

## Status of the full pack in the Prometheus skill packages

The full pack's `skill-system.json` gives release version 1.12.2; treat that as the source version, not a tested release.[^full-system] Its README does not select a release. Support depends on the release, the host machine and the entry point, and a successful install does not prove that every requested service works.[^full-readme]

## Status of Mini in the Prometheus skill packages

Mini's `package.json` gives version 1.12.1; treat that as the source version, not a tested release.[^mini-package] Mini's source and documentation were published for review on 2026-10-05. The note says this is a source publication, not a release, and that an earlier release integration did not pass as a whole.[^mini-publication] Its source targets Windows, macOS and Linux with Node 22 or later; acceptance on real installed coding assistants is still pending on each of the three.[^mini-maintenance]

## Prometheus skill packages licences

The full Prometheus Skill Pack is MIT licensed and has a LICENSE file.[^full-license] For Prometheus Skills Mini, its package manifest and README say MIT, but no LICENSE file is in the repository yet, so check the repository before relying on that.[^mini-package][^mini-readme] Skills imported into either package keep their own licences.[^full-readme][^mini-readme]
