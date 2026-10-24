---
type: Concept
title: KnowMe Project Management
description: What the KnowMe Project Management setup skill is, its status, what it sets up and its stated relationships.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - knowme-project-management
  - tools
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: KnowMe and Prometheus portfolio, Edition 2
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: kpm-readme
    resource: https://github.com/Know-Me-Tools/know-me-project-management/blob/main/README.md
    title: know-me-project-management README
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: kpm-docs
    resource: https://know-me-tools.github.io/know-me-project-management/
    title: KnowMe Project Management documentation site
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: kpm-license
    resource: https://github.com/Know-Me-Tools/know-me-project-management/blob/main/LICENSE
    title: know-me-project-management LICENSE
    last_modified: "2026-10-24T00:00:00+00:00"
---

# KnowMe Project Management

KnowMe Project Management is a repeatable way to set up a new project, or convert an existing one, for code, business processes, research and documentation.[^portfolio] The portfolio lists it as an existing project-setup skill and documentation.[^portfolio]

## KnowMe Project Management status and version

KnowMe Project Management has {{v:setup}}. Its documentation is published as a website.[^kpm-docs] The KnowMe Project Management source is public under the MIT licence.[^kpm-license]

## What KnowMe Project Management does

- The work is packaged as one skill, `knowme-project-setup`, that follows the AgentSkills.io specification.[^kpm-readme]
- The skill detects whether a project is new or existing and what type it is (code, business process, skill development, or research and docs), states its plan, and then runs its stages.[^kpm-readme]
- A finished setup has one shared instruction file for every agent, a spec-driven change workflow (OpenSpec), tracked orchestration state, a knowledge log, an agent team with separate owned areas, product and design files, and a branded documentation site on GitHub Pages.[^kpm-readme]
- The skill ships read-only detection and verification scripts, including a privacy check to run before any push.[^kpm-readme]
- The README explains each setup step and lists the parameters that change from one project to the next.[^kpm-readme]

## How KnowMe Project Management relates to other products

The README lists other skills it needs, such as `kbd-init`, `prometheus-context-bootstrap` and `agent-team-creator`.[^kpm-readme] The portfolio groups Project Management with Prometheus Skills, Know Decision, Phase Exit and Doc Forge as tools that support building and governing the work, and says these relationships are architectural intent, not proof of completed integration.[^portfolio]
