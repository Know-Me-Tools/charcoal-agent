# BossFang overview

## What BossFang is

BossFang is a fork of LibreFang, an open-source agent operating system written in Rust. LibreFang manages AI agents backed by language models, along with their tools, memory, messaging channels and networking between agents. BossFang keeps that core and changes three things: where data is stored, how memory works, and how it reaches models through the Universal Agent Runtime. It also carries its own name and look.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-12.

## Where BossFang comes from

BossFang's code starts from LibreFang and is merged with upstream LibreFang changes over time. Features that exist only in BossFang are listed in its repository so they survive each upstream merge. The licence file is MIT, with copyright held by the LibreFang contributors.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-12.
Source: BossFang repository LICENSE, retrieved 2026-10-12.

## BossFang and the Universal Agent Runtime

BossFang does not bundle, install, start, stop or supervise the Universal Agent Runtime. It connects to a runtime instance that already exists, which can be one The Boss manages, and sends new agent runs to the instance currently selected.

Source: BossFang connects to UAR, retrieved 2026-10-12.

## BossFang and the Surreal Memory Server

BossFang's memory uses the Surreal Memory Server library with an embedded database, so it does not need a separate SurrealDB service.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-12.

## More about BossFang

* [BossFang and upstream LibreFang](/bossfang/bossfang-and-upstream-librefang.md)
* [How it works](/bossfang/bossfang-how-it-works.md)
* [Use cases](/bossfang/bossfang-use-cases-and-who-it-is-for.md)
* [Status and licence](/bossfang/bossfang-status-and-licence.md)
* [Questions](/bossfang/bossfang-faq.md)
