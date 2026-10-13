# BossFang status and licence

## How BossFang tracks its own status

BossFang keeps a feature ledger of every BossFang-only feature with a status: GREEN means shipped with an automated guard, PARTIAL means shipped with an incomplete guard or known debt, DEFERRED means a gap left open on purpose, and DRIFT means the documentation and the code disagree. Most rows are GREEN or PARTIAL.

Source: BossFang feature ledger, retrieved 2026-10-13.

## Known gaps in BossFang

The ledger records them openly. The command-line binary is still named `librefang`, although some documents say otherwise. Remote SurrealDB mode is tested through configuration only, not against a live server. The Surreal Memory semantic backend is not yet wired into the kernel's boot path. Several recent upstream schema changes have no SurrealDB counterpart yet.

Source: BossFang feature ledger, retrieved 2026-10-13.

## Status of the BossFang connection to the Universal Agent Runtime

The current connection design, where BossFang connects to an existing runtime and never runs it, is described in its documentation as implemented in source without builds, tests or review. Desktop packaging and real desktop operation remain to be done.

Source: BossFang connects to UAR, retrieved 2026-10-13.

## BossFang releases

The BossFang fork's releases page carries native BossFang payloads built for The Boss's integrated desktop app: 14 entries when checked on 2026-10-13, named like "BossFang sidecar" or "BossFang payload" with a source commit, several marked pre-release. Their notes say application operation and release acceptance are tracked separately. No end-user BossFang release or tested install path is established here.

Source: BossFang fork releases page, retrieved 2026-10-13.

## Installing BossFang

The README mixes upstream LibreFang package channels with fork-specific steps, such as an install script and a Cargo install from the fork. The ledger records that the BossFang binary name is not settled. This knowledge base therefore gives no install command.

Source: BossFang repository README, retrieved 2026-10-13.
Source: BossFang feature ledger, retrieved 2026-10-13.

## BossFang licence

BossFang is MIT licensed. Its LICENSE file is the MIT licence with copyright held by the LibreFang contributors, because BossFang is a fork of LibreFang.

Source: BossFang repository LICENSE, retrieved 2026-10-13.
