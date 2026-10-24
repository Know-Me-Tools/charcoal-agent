# BossFang overview

## What BossFang is

BossFang is a fork of LibreFang, an open-source agent operating system written in Rust. LibreFang manages AI agents backed by language models, along with their tools, memory, messaging channels and networking between agents. BossFang keeps that core and changes three things: where data is stored, how memory works, and how it reaches models through the Universal Agent Runtime. It also carries its own name and look. BossFang is made by Prometheus AGS.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.

## Where BossFang comes from

BossFang's code starts from LibreFang and is merged with upstream LibreFang changes over time. Features that exist only in BossFang are listed in its repository so they survive each upstream merge. The licence file is MIT, with copyright held by the LibreFang contributors.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.
Source: BossFang repository LICENSE, retrieved 2026-10-13.

## BossFang and the Universal Agent Runtime

BossFang does not bundle, install, start, stop or supervise the Universal Agent Runtime. As implemented in source, not yet built or tested, it connects to a runtime instance that already exists, which can be one The Boss manages, and sends new agent runs to the instance currently selected.

Source: BossFang connects to UAR, retrieved 2026-10-13.

## BossFang and the Surreal Memory Server

BossFang's memory uses the Surreal Memory Server library with an embedded database, so it does not need a separate SurrealDB service.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.

## Where to get BossFang

BossFang's source code is at https://github.com/GQAdonis/librefang, the BossFang fork of LibreFang. Its releases page carries native payloads built for The Boss, several marked pre-release, whose notes say release acceptance is tracked separately. No end-user BossFang release or tested install path is established here.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-13.
Source: BossFang fork releases page, retrieved 2026-10-13.

## More about BossFang

You can also ask how it differs from LibreFang, how it works, its status and licence, and common questions.
