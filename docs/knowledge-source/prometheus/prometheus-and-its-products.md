---
type: Concept
title: Prometheus and its products
description: Short direct answers about who makes the Universal Agent Runtime, BossFang, the Surreal Memory Server, the Prometheus skill packages, The Boss and KnowMe, what licence each uses, and where to get them.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T08:21:34+00:00"
tags:
  - prometheus
  - makers
  - licence
sources:
  - id: uar-repo
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime
    title: Universal Agent Runtime repository
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: uar-license
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/LICENSE
    title: Universal Agent Runtime LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: bf-repo
    resource: https://github.com/GQAdonis/librefang
    title: BossFang repository
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: bf-license
    resource: https://github.com/GQAdonis/librefang/blob/main/LICENSE
    title: BossFang LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: sms-repo
    resource: https://github.com/Prometheus-AGS/surreal-memory-server
    title: Surreal Memory Server repository
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: sms-license
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/LICENSE
    title: Surreal Memory Server LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: Surreal Memory Server source publication note
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: full-repo
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system
    title: Prometheus Skill Pack repository
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: full-license
    resource: https://github.com/Prometheus-AGS/prometheus-skill-system/blob/main/LICENSE
    title: Prometheus Skill Pack LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: mini-repo
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini
    title: Prometheus Skills Mini repository
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: mini-license
    resource: https://github.com/Prometheus-AGS/prometheus-skills-mini/blob/main/LICENSE
    title: Prometheus Skills Mini LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
  - id: boss-license
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/LICENSE
    title: The Boss LICENSE
    last_modified: "2026-10-13T08:21:34+00:00"
---

# Prometheus and its products

## What is Prometheus?

Prometheus is the name of Prometheus AGS's server-side AI platform work. Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. KnowMe AI, LLC makes KnowMe, The Boss and IPFS Sync for Obsidian, and builds KnowMe and The Boss on those Prometheus parts.

## Who makes the Universal Agent Runtime (Prometheus)?

Prometheus AGS makes the Universal Agent Runtime, a server written in Rust that runs AI agents and calls models and tools under policy. Its source is public at https://github.com/Prometheus-AGS/universal-agent-runtime.[^uar-repo] KnowMe AI, LLC builds KnowMe and The Boss on it, and the KnowMe agent on this site runs on it.

## Who makes BossFang (Prometheus)?

Prometheus AGS makes BossFang, an agent operating system forked from the open-source LibreFang project, with SurrealDB storage, for agents that run on schedules. BossFang's source is at https://github.com/GQAdonis/librefang.[^bf-repo] The Boss, from KnowMe AI, LLC, bundles BossFang.

## Who makes the Surreal Memory Server (Prometheus)?

Prometheus AGS makes the Surreal Memory Server, a memory service for AI agents with a knowledge graph and search, written in Rust on SurrealDB. Its source is public at https://github.com/Prometheus-AGS/surreal-memory-server.[^sms-repo] KnowMe and The Boss, from KnowMe AI, LLC, work with it through MCP (Model Context Protocol) as a separate service.

## Who makes the Prometheus skill packages?

Prometheus AGS makes both Prometheus skill packages: the full Prometheus Skill Pack at https://github.com/Prometheus-AGS/prometheus-skill-system and the smaller Prometheus Skills Mini at https://github.com/Prometheus-AGS/prometheus-skills-mini.[^full-repo][^mini-repo] Both are packages of skills for AI coding assistants.

## Is the Universal Agent Runtime MIT licensed?

Yes. The Universal Agent Runtime's code, including its SDKs, is MIT licensed, and its repository has a LICENSE file naming Prometheus AGS as copyright holder.[^uar-license] Its documentation is licensed CC-BY-4.0.[^uar-readme] The MIT licence lets you use, change and redistribute the code if you keep the copyright and licence notice.

## Is the Surreal Memory Server MIT licensed?

Yes. The Surreal Memory Server is MIT licensed (LICENSE file in the repository), with Prometheus AGS as copyright holder.[^sms-license] The MIT licence lets you use, change and redistribute it if you keep the copyright and licence notice. Its source was published for review on 2026-10-05; that publication is not a release.[^sms-publication]

## Are the Prometheus skill packages MIT licensed?

Yes, both are. The full Prometheus Skill Pack is MIT licensed (LICENSE file in the repository).[^full-license] Prometheus Skills Mini is MIT licensed (LICENSE file in the repository).[^mini-license] Skills that either package imports from other projects keep their own licences.

## Is BossFang open source and what licence does it use?

Yes. BossFang is open source under the MIT licence. Its LICENSE file names the LibreFang contributors as copyright holders, because BossFang is a fork of the open-source LibreFang project.[^bf-license] Prometheus AGS makes BossFang; its source is at https://github.com/GQAdonis/librefang.

## Is The Boss open source and what licence does it use?

Yes. The Boss, from KnowMe AI, LLC, is open source under the GNU Affero General Public License v3.0 (AGPL-3.0), and its repository has a LICENSE file.[^boss-license] The Boss keeps that licence because it is built on the open-source Cherry Studio client. It is free to download from https://the-boss.know-me.tools.

## Who makes The Boss and KnowMe?

KnowMe AI, LLC makes The Boss and KnowMe, and also IPFS Sync for Obsidian. The Boss and KnowMe are built on parts made by Prometheus AGS: the Universal Agent Runtime, BossFang and, through MCP, the Surreal Memory Server. The Boss is available now. KnowMe has not been publicly released; it is planned to be released under the MIT licence.

## Where can I get the Universal Agent Runtime, BossFang, the Surreal Memory Server and the skill packages?

Universal Agent Runtime: https://github.com/Prometheus-AGS/universal-agent-runtime. BossFang: source at https://github.com/GQAdonis/librefang. Surreal Memory Server: https://github.com/Prometheus-AGS/surreal-memory-server. Skill packages: https://github.com/Prometheus-AGS/prometheus-skill-system and https://github.com/Prometheus-AGS/prometheus-skills-mini. The Boss desktop app bundles the Universal Agent Runtime and BossFang: https://the-boss.know-me.tools.
