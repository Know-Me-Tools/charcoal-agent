# Flint Forge: Quarry, Anvil and Kiln

Flint Forge is the data and edge-compute plane of the Flint platform: REST and GraphQL access to Postgres, database extensions, and signed WebAssembly edge functions. Its parts are named Quarry, Anvil and Kiln. The README's v1.0-ready is a source claim, and a v1.0.0 GitHub release exists; neither is an audit. Quarry has no read-only mode, and its REST surface includes writes, so read-only access has to come from a read-only Postgres role.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Flint Forge README, retrieved 2026-10-24.
Source: Flint Forge release v1.0.0, retrieved 2026-10-24.
Source: Flint Forge source: fdb-postgres backend and row-level security, retrieved 2026-10-26.

## Flint Forge status and version (Flint Forge: Quarry, Anvil and Kiln)

The portfolio's status is "README reports v1.0-ready; treated as a source claim, not a fresh release audit." That is a claim in the project's own README, not an audit. Separately, a stable GitHub release exists: v1.0.0, dated 2026-07-07. A GitHub release is not evidence of an independent audit.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Flint Forge release v1.0.0, retrieved 2026-10-24.

## What Flint Forge's parts do (Flint Forge: Quarry, Anvil and Kiln)

* Quarry offers a PostgREST-compatible REST surface and a GraphQL surface over Postgres 18.
* Anvil is a suite of Postgres extensions for authentication context, webhooks, in-database language-model calls, an encrypted secret store and metadata.
* Kiln compiles and runs signed WebAssembly components as edge functions.
* The README also lists an operator command-line tool and client SDKs.

Source: Flint Forge README, retrieved 2026-10-24.

## How Flint Forge relates to other products (Flint Forge: Quarry, Anvil and Kiln)

Flint Forge's README says it sits behind Flint Gate, which handles ingress and authentication, and consumes Flint Realtime Fabric for its realtime source. Realtime changes can come from Postgres notifications by default or from the Fabric stream when configured. The portfolio treats such relationships as architectural intent, not proof of completed integration.

Source: Flint Forge README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
