---
type: Concept
title: Installing the Prometheus skill packages
description: The documented install steps for the full Prometheus Skill Pack and for Prometheus Skills Mini.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-12T00:00:00+00:00"
tags:
  - skill-packages
  - install
sources:
  - id: full-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/README.md
    title: Prometheus Skill Pack README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: full-install
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/docs/guide/19-installation.md
    title: Prometheus Skill Pack guide, installation
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: full-skills
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/SKILLS.md
    title: Prometheus Skill Pack skill catalog
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: mini-readme
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/README.md
    title: Prometheus Skills Mini README
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Installing the Prometheus skill packages

## Before installing a Prometheus skill package

Pick one package per home directory: Mini must not go into a home that already has the full pack.[^mini-readme] Keep the source checkout somewhere permanent, because installed plugins can point back to it.[^full-readme][^mini-readme]

## Installing the full Prometheus Skill Pack

Clone `https://github.com/Prometheus-AGS/prometheus-skill-system`, run `npm ci`, then run `./install.sh --profile skills --targets detected --dry-run` to see the plan, and the same command without `--dry-run` to install. The installer shows which coding assistants it found and what it will change before you confirm.[^full-readme] Check the result with `./install.sh --verify --targets detected --non-interactive`.[^full-readme]

## Full Prometheus Skill Pack targets and services

If no coding assistant is detected, name targets such as `claude`, `codex`, `opencode`, `kimi-code` or `minimax`; the authoritative list is in the pack's `skill-system.json`.[^full-skills] The skills profile does not build binaries or start services. The `full` profile adds native services on macOS and Linux only, and needs Bash 4 or later, not the Bash 3.2 that ships with macOS.[^full-readme][^full-install]

## Installing Prometheus Skills Mini

Clone `https://github.com/Prometheus-AGS/prometheus-skills-mini`, run `npm ci`, then `node scripts/doctor.mjs --human` to check your setup.[^mini-readme] On a machine without the full pack, `node scripts/doctor.mjs --fix copy-skills` copies Mini's skills into your home's `.agents/skills` and `.claude/skills`, keeps any files you changed, and never deletes extra files.[^mini-readme] Claude and Codex plugin packages are a separate route, registered through each assistant's own marketplace flow.[^mini-readme]

## Updating or removing a Prometheus skill package

The full pack updates with `npm run update` from a clean checkout, can roll back to the previous skill generation, and has an uninstall command that removes only the files it owns.[^full-readme] Mini has no automatic rollback or blanket uninstall: you remove its registration and the copies listed in its installation receipts.[^mini-readme]
