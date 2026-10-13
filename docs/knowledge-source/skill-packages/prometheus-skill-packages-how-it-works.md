---
type: Concept
title: How the Prometheus skill packages work
description: Plain-language description of how the Prometheus skill packages are used, the KBD workflow, agent teams and optional services.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:05:39+00:00"
tags:
  - skill-packages
  - workflow
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

# How the Prometheus skill packages work

## Using a Prometheus skill

After installation you open a project in your coding assistant and ask for a skill by name, for example asking `kbd-process-orchestrator` to plan a small feature, record its specification and acceptance criteria, and assign file ownership.[^full-readme][^mini-readme]

## The KBD workflow in the Prometheus skill packages

KBD gives work a fixed shape: assess the code as it is, plan changes small enough to finish, execute one change at a time, then reflect on what held.[^boss-site] KBD keeps the identity of each change and task across sessions, so another session can pick up the work. Missing models or prerequisites stay visible in the task record instead of being reported as done.[^full-readme] Mini can keep its specifications in OpenSpec, GitHub Spec Kit or its own native format.[^mini-readme]

## Agent teams in the Prometheus skill packages

Team skills create a team, give each role an owned set of paths, track tasks, and record a handoff before ownership moves. An exported team definition is a proposal; it does not start agents or prove that a coding assistant found them.[^full-readme][^mini-readme]

## Optional services in the Prometheus skill packages

The packages work without any service. The full pack can add a durable memory service (the Surreal Memory Server), a knowledge tool, the liter-llm model gateway, native research and signed execution records.[^full-readme] Mini's optional container stack runs SurrealDB, the Surreal Memory Server and liter-llm on local interfaces.[^mini-readme] Learning can improve later sessions only when publishing and recall actually succeed; repeating a loop does not by itself make it better.[^full-intro]
