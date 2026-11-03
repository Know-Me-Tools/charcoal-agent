---
type: Concept
title: "Prometheus Entity Management"
description: "What Prometheus Entity Management (entity-graph) is, its latest stable release and the caveat on version records."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags:
  - prometheus
  - entity-graph
  - local-first
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: pem-npm
    resource: https://www.npmjs.com/package/@prometheus-ags/entity-graph-core/v/4.2.0
    title: "@prometheus-ags/entity-graph-core 4.2.0 on npm"
    last_modified: "2026-11-03T00:00:00+00:00"
  - id: pem-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-management/blob/main/README.md
    title: "Prometheus Entity Management README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Prometheus Entity Management

Prometheus Entity Management, also called entity-graph, is a normalized, reactive entity graph for web, mobile, desktop and local-first apps, with generated-UI integration.[^pf][^pem-readme] The portfolio's status is "Published package family; version records differ across snapshots and are not a current release audit."[^pf]

## Prometheus Entity Management status and version

This site documents version {{v:pem}}, published on npm on {{v:pem:date}}.[^pem-npm] It has no git tag or GitHub release: the latest GitHub release is v4.1.1, and npm now also lists 4.3.0 (published 2026-10-28), tagged `latest`. The portfolio warns that version records differ across snapshots and that its own figures are not a current release audit.[^pf] Check npm and the project's releases for the current number.

## What Prometheus Entity Management states

* Each entity lives once at a type and id address. Lists keep ordered ids, and views resolve the canonical entity plus a local patch, so one write updates every view of it.[^pem-readme]
* An earlier reading of the GitHub README, on 24 October 2026, recorded thirteen npm packages published at 4.1.1 on 2026-10-08. Later versions 4.2.0 and 4.3.0 are on npm.[^pem-readme][^pem-npm]
* The 4.0.0 release moved the workspace to ESM-only output and published the React binding as its own package, with the older package name kept as an alias.[^pem-readme]
* A Flutter 4.0.0 package is public on pub.dev, and a Chrome DevTools extension is available as a ZIP for developer-mode installation. It is not a Chrome Web Store listing.[^pem-readme]

## How Prometheus Entity Management relates to other products

The sources read for this page do not state a relationship between Prometheus Entity Management and another portfolio product. Prometheus Entity Sync has its own page.[^pf]
