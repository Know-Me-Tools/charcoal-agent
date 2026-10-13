---
type: Concept
title: Prometheus skill packages status and licence
description: Release status, platform acceptance, skill counts and licences of the full Prometheus Skill Pack (MIT, LICENSE file present) and Prometheus Skills Mini (MIT, a LICENSE file has been proposed in its repository).
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - skill-packages
  - status
  - licence
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-license
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/LICENSE
    title: Prometheus Skill Pack LICENSE
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-system
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/skill-system.json
    title: Prometheus Skill Pack skill-system manifest
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-skills
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/SKILLS.md
    title: Prometheus Skill Pack skill catalog
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-package
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/package.json
    title: Prometheus Skills Mini package manifest
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-publication
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/docs/source-publication-20261005.md
    title: Prometheus Skills Mini source publication note, 2026-10-05
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-maintenance
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/docs/maintenance.md
    title: Prometheus Skills Mini maintenance and platform limits
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Prometheus skill packages status and licence

## How many skills the Prometheus skill packages have

Counted by listing the skill folders in the repository on 2026-10-13. The full pack, version 1.12.2 in its `skill-system.json`, has 120 skills in its `skills/<category>/<skill>/` folders, each with a SKILL.md; two of them are imported from other repositories. With nested helper skills it has 404 SKILL.md files in total, not counting installed dependencies.[^full-system] Mini, version 1.12.1 in its `package.json`, has 100 skills in its `skills/<name>/` folders.[^mini-package]

## Status of the full pack in the Prometheus skill packages

The full pack's `skill-system.json` gives release version 1.12.2; treat that as the source version, not a tested release.[^full-system] Its README does not select a release. Support depends on the release, the host machine and the entry point, and a successful install does not prove that every requested service works.[^full-readme]

## Status of Mini in the Prometheus skill packages

Mini's `package.json` gives version 1.12.1; treat that as the source version, not a tested release.[^mini-package] Mini's source and documentation were published for review on 2026-10-05. The note says this is a source publication, not a release.[^mini-publication] The owner plans to resume testing once the code base has stabilised. Its source targets Windows, macOS and Linux with Node 22 or later; acceptance on real installed coding assistants is still pending on each of the three.[^mini-maintenance]

## Prometheus skill packages licences

The full Prometheus Skill Pack is MIT licensed and has a LICENSE file.[^full-license] Prometheus Skills Mini is MIT licensed, as its package manifest and README say.[^mini-package][^mini-readme] The owners state it is MIT licensed; a LICENSE file has been proposed in the repository. Skills imported into either package keep their own licences.[^full-readme][^mini-readme]
