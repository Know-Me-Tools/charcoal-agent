---
type: Concept
title: Prometheus skill packages questions
description: Visitor questions about the full Prometheus Skill Pack, Prometheus Skills Mini and Compass, answered from their own documentation.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - skill-packages
  - faq
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-license
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/LICENSE
    title: Prometheus Skill Pack LICENSE
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-platforms
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/docs/guide/17-platform-support.md
    title: Prometheus Skill Pack guide, platform and harness support
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-skills
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/SKILLS.md
    title: Prometheus Skill Pack skill catalog
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-contributing
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/CONTRIBUTING.md
    title: Prometheus Skill Pack contribution guide
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-maintenance
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/docs/maintenance.md
    title: Prometheus Skills Mini maintenance and platform limits
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: The Boss website
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-license
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/LICENSE
    title: Prometheus Skills Mini LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
---

# Prometheus skill packages questions

## What are the Prometheus skill packages?

Two packages of skills for AI coding assistants: the broad full Prometheus Skill Pack and the portable Prometheus Skills Mini. Both help an assistant plan work, assign ownership, implement a specification and keep lessons.[^full-readme][^mini-readme]

## Are the Prometheus skill packages free?

The full Prometheus Skill Pack is MIT licensed and has a LICENSE file.[^full-license] Prometheus Skills Mini is also MIT licensed (LICENSE file in the repository).[^mini-license]

## Do the Prometheus skill packages need a cloud account?

No account is needed. The skills are files installed into your coding assistant, and the services are optional.[^full-readme] Any model your assistant uses needs that provider's own account.

## Which of the Prometheus skill packages should I install?

Mini if you work on Windows without Git Bash or WSL, or want the least setup. The full pack if you want broad language and domain guidance and optional native services on macOS or Linux.[^full-platforms][^mini-readme] Ask about choosing between the Prometheus skill packages for the full comparison.

## Can I install both Prometheus skill packages?

Not in the same home directory. They share skill names and can hide each other. On a machine with the full pack, use Mini only inside The Boss application's own data directory.[^mini-readme]

## What is Compass, which comes with The Boss next to Mini from the Prometheus skill packages?

Compass turns source code into a graph of symbols, files and relationships that you and your agents can query: architecture maps, paths between symbols, change impact, and graphs pinned to past Git commits. It runs locally as one Rust binary on Windows, macOS and Linux, with no embeddings or model credentials. The Boss website says it is MIT or Apache-2.0 licensed; no LICENSE file is cited here, so check Compass's repository before relying on that. It is a fork of crabbuild/compass with Windows support.[^boss-site]

## Which coding assistants work with the Prometheus skill packages?

The full pack's installer documents targets including Claude Code, Codex, OpenCode, Kimi Code and MiniMax; its `skill-system.json` holds the current list.[^full-skills] Mini lists nine target IDs: claude, codex, opencode, agents, cursor, gemini, windsurf, zed and cline.[^mini-maintenance] A target is where skills are copied; it does not prove that a given assistant runs them.[^full-platforms]

## How do I report a bug in or contribute to the Prometheus skill packages?

The full pack's CONTRIBUTING.md asks contributors to open a scoped issue at https://github.com/Prometheus-AGS/prometheus-skill-system when a contract or ownership question needs clarifying, and sets out how changes are made.[^full-contributing] Mini's README links a contribution guide that is not yet in its repository, https://github.com/Prometheus-AGS/prometheus-skills-mini.[^mini-readme]

## Who makes the Prometheus skill packages?

Prometheus AGS makes the Prometheus skill packages, both the full Prometheus Skill Pack and Prometheus Skills Mini.

## What is Prometheus, behind the Prometheus skill packages?

Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. Prometheus is the name of its server-side AI platform work.
