---
type: Concept
title: BossFang overview
description: What BossFang is, where it comes from, and how it relates to the Universal Agent Runtime, the Surreal Memory Server and The Boss.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:05:39+00:00"
tags:
  - bossfang
  - overview
sources:
  - id: bf-agents
    resource: https://github.com/GQAdonis/librefang/blob/main/AGENTS.md
    title: BossFang AGENTS.md, product identity and fork additions
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-releases
    resource: https://github.com/GQAdonis/librefang/releases
    title: BossFang fork releases page
    last_modified: "2026-10-13T00:05:39+00:00"
  - id: bf-license
    resource: https://github.com/GQAdonis/librefang/blob/main/LICENSE
    title: BossFang repository LICENSE
    last_modified: "2026-10-13T00:05:39+00:00"
---

# BossFang overview

## What BossFang is

BossFang is a fork of LibreFang, an open-source agent operating system written in Rust. LibreFang manages AI agents backed by language models, along with their tools, memory, messaging channels and networking between agents.[^bf-agents] BossFang keeps that core and changes three things: where data is stored, how memory works, and how it reaches models through the Universal Agent Runtime. It also carries its own name and look.[^bf-agents]

## Where BossFang comes from

BossFang's code starts from LibreFang and is merged with upstream LibreFang changes over time. Features that exist only in BossFang are listed in its repository so they survive each upstream merge.[^bf-agents] The licence file is MIT, with copyright held by the LibreFang contributors.[^bf-license]

## BossFang and the Universal Agent Runtime

BossFang does not bundle, install, start, stop or supervise the Universal Agent Runtime. As implemented in source, not yet built or tested, it connects to a runtime instance that already exists, which can be one The Boss manages, and sends new agent runs to the instance currently selected.[^bf-uar]

## BossFang and the Surreal Memory Server

BossFang's memory uses the Surreal Memory Server library with an embedded database, so it does not need a separate SurrealDB service.[^bf-agents]

## Where to get BossFang

BossFang's source is public at https://github.com/GQAdonis/librefang, the BossFang fork of LibreFang.[^bf-agents] Its releases page carries native payloads built for The Boss, several marked pre-release, whose notes say release acceptance is tracked separately.[^bf-releases] No end-user BossFang release or tested install path is established here.

## More about BossFang

* [BossFang and upstream LibreFang](/bossfang/bossfang-and-upstream-librefang.md)
* [How it works](/bossfang/bossfang-how-it-works.md)
* [Use cases](/bossfang/bossfang-use-cases-and-who-it-is-for.md)
* [Status and licence](/bossfang/bossfang-status-and-licence.md)
* [Questions](/bossfang/bossfang-faq.md)
