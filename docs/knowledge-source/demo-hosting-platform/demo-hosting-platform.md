---
type: Concept
title: "Demo hosting platform"
description: "What the demo hosting platform is: a proposed host for packaged demos, at scaffold and design stage."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - demos
  - hosting
  - proposed
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: demos-readme
    resource: https://github.com/Know-Me-Tools/demos/blob/main/README.md
    title: "demos README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Demo hosting platform

The demo hosting platform is proposed hosting for packaged single-page and HTMX demos, with agent, data and runtime bindings.[^pf] The portfolio's status is "Scaffold and server/API design; inspected historical server implemented only health route."[^pf] It is a proposal at scaffold stage. Nothing here says it can host a demo today.

## Demo hosting platform status and version

The demo hosting platform has {{v:demos}}. The portfolio inspected a historical server that implemented only a health route.[^pf] Its README labels the project a P0 workspace.[^demos-readme] The portfolio adds that synthetic hosted demos do not prove the planned hosting fabric is complete.[^pf]

## What the demo hosting platform design states

* A demo package is a web front end (HTMX with Alpine.js, or a static React build), an agent definition, a data model and a design system.[^demos-readme]
* The design mounts each demo at its own path and adds or removes demos at runtime through an admin interface.[^demos-readme]
* The service routes requests and keeps the demo registry and bundle store. It does not execute agents.[^demos-readme]

## How the demo hosting platform relates to other products

The README assigns the roles in its design. The Universal Agent Runtime runs agents. Flint Gate owns identity. Flint Forge supplies data. Flint Realtime Fabric supplies live updates.[^demos-readme] These are design statements. The portfolio treats relationships as architectural intent, not proof of completed integration.[^pf]
