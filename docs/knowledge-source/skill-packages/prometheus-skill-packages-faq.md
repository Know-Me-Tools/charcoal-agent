---
type: Concept
title: Prometheus skill packages questions
description: Visitor questions about the full Prometheus Skill Pack, Prometheus Skills Mini and Compass, answered from their own documentation.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:05:39+00:00"
tags:
  - skill-packages
  - faq
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: full-license
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/LICENSE
    title: Prometheus Skill Pack LICENSE
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: full-platforms
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/docs/guide/17-platform-support.md
    title: Prometheus Skill Pack guide, platform and harness support
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: The Boss website
    last_modified: "2026-10-13T00:05:39+00:00"
---

# Prometheus skill packages questions

## What are the Prometheus skill packages?

Two packages of skills for AI coding assistants: the broad full Prometheus Skill Pack and the portable Prometheus Skills Mini. Both help an assistant plan work, assign ownership, implement a specification and keep lessons.[^full-readme][^mini-readme]

## Are the Prometheus skill packages free?

The full Prometheus Skill Pack is MIT licensed and has a LICENSE file.[^full-license] For Prometheus Skills Mini, its package manifest and README say MIT, but no LICENSE file is in the repository yet, so check the repository before relying on that.[^mini-readme]

## Do the Prometheus skill packages need a cloud account?

No account with KnowMe AI, LLC is needed. The skills are files installed into your coding assistant, and the services are optional.[^full-readme] Any model your assistant uses needs that provider's own account.

## Which Prometheus skill package should I install?

Mini if you work on Windows without Git Bash or WSL, or want the least setup. The full pack if you want broad language and domain guidance and optional native services on macOS or Linux.[^full-platforms][^mini-readme] See [choosing full or mini](/skill-packages/prometheus-skill-packages-choosing-full-or-mini.md).

## Can I install both Prometheus skill packages?

Not in the same home directory. They share skill names and can hide each other. On a machine with the full pack, use Mini only inside The Boss application's own data directory.[^mini-readme]

## What is Compass, which comes with The Boss next to Prometheus Skills Mini?

Compass turns source code into a graph of symbols, files and relationships that you and your agents can query: architecture maps, paths between symbols, change impact, and graphs pinned to past Git commits. It runs locally as one Rust binary on Windows, macOS and Linux, with no embeddings or model credentials. It is MIT or Apache-2.0 licensed and is a fork of crabbuild/compass with Windows support.[^boss-site]
