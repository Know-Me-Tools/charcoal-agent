---
type: Concept
title: Prometheus skill packages overview
description: What the Prometheus Skill Pack (full) and Prometheus Skills Mini are, and what they have in common.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:05:39+00:00"
tags:
  - skill-packages
  - overview
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: full-intro
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/docs/guide/01-introduction.md
    title: Prometheus Skill Pack guide, introduction
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

# Prometheus skill packages overview

## What the Prometheus skill packages are

A skill is a packaged set of instructions an AI coding assistant can load for a kind of task. The Prometheus skill packages give a coding assistant a repeatable way to plan work, assign ownership, implement a specification and keep useful lessons for later sessions.[^full-readme] There are two packages: the full Prometheus Skill Pack and Prometheus Skills Mini.[^full-readme]

## The full Prometheus Skill Pack

The full pack is broad. It covers many languages and domains, process orchestration and learning, and it can add optional native services for durable memory, model routing, research and signed execution records. It installs with Git, Node and Bash; some workflows also need Python, jq or Rust.[^full-readme][^full-intro]

## Prometheus Skills Mini

Mini is a smaller, portable set: process, team, research and UI guidance with Node entry points. It needs Node 22 or later and Git, and runs on Windows, macOS and Linux without Git Bash, Python or WSL.[^mini-readme] The Boss website describes Mini as a development process an agent can follow: assess, plan, execute, reflect, with OpenSpec holding the specifications.[^boss-site]

## What the Prometheus skill packages share

Both packages share skill names, the KBD workflow and contracts, but they are separate products. A copied skill or an exported team definition does not prove that a given coding assistant can run it.[^full-readme] Both work without the separate Prometheus Companion extension.[^full-intro]

## More about the Prometheus skill packages

* [Choosing full or mini](/skill-packages/prometheus-skill-packages-choosing-full-or-mini.md)
* [How they work](/skill-packages/prometheus-skill-packages-how-it-works.md)
* [Installing](/skill-packages/prometheus-skill-packages-install.md)
* [Use cases](/skill-packages/prometheus-skill-packages-use-cases-and-who-it-is-for.md)
* [Status and licence](/skill-packages/prometheus-skill-packages-status-and-licence.md)
* [Questions](/skill-packages/prometheus-skill-packages-faq.md)
