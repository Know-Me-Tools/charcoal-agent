---
type: Concept
title: Choosing between the Prometheus skill packages
description: How to choose between the full Prometheus Skill Pack and Prometheus Skills Mini, and why not to install both in one place.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T01:28:18+00:00"
tags:
  - skill-packages
  - comparison
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: full-platforms
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/docs/guide/17-platform-support.md
    title: Prometheus Skill Pack guide, platform and harness support
    last_modified: "2026-10-13T01:28:18+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-13T01:28:18+00:00"
---

# Choosing between the Prometheus skill packages

## What is the difference between the full and mini Prometheus skill packages?

The full Prometheus Skill Pack gives broad guidance across languages and domains, a learning pipeline, and optional native services; it needs Git, Node and Bash.[^full-readme] Prometheus Skills Mini gives the process, team, research and UI skills with less setup: it needs Node 22 or later and Git, keeps its state in plain files, and runs on Windows, macOS and Linux.[^mini-readme] Do not install both in the same home.[^mini-readme]

## When to choose the full pack from the Prometheus skill packages

You want broad guidance across languages and domains, the learning pipeline, and optional native services such as durable memory, a model gateway, native research and signed execution records. The full profile with native services runs on macOS and Linux and needs Bash 4 or later.[^full-readme][^full-platforms] On Windows, the skills-only profile works through Git Bash or WSL; full native service installation is refused.[^full-readme]

## When to choose Mini from the Prometheus skill packages

You want the process, team, research and UI skills with as little setup as possible, or you work on Windows without Git Bash or WSL. Mini needs Node 22 or later and Git, uses plain files for its state, and can talk to optional HTTP services or a supplied container stack.[^mini-readme] It does not depend on the full pack's Python learning pipeline.[^mini-readme]

## Do not install both Prometheus skill packages in the same home

Mini and the full pack share skill names, so one can hide the other. Mini's README says not to install it into a home that already has the full pack; on such a machine, use Mini only inside The Boss application's own data directory. Mini's doctor command reports conflicting copies, refuses to copy over a detected full-pack installation, and never deletes anything on its own.[^mini-readme]

## The Prometheus skill packages side by side

Full: categorized skill source, Git plus Node plus Bash, Windows through Git Bash or WSL, native memory, knowledge, gateway, research and execution components.[^full-readme] Mini: flat skill source, Node 22+ plus Git, Node entry points on Windows, macOS and Linux, file state with optional HTTP services.[^mini-readme]
