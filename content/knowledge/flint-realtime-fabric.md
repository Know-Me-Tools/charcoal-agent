# Flint Realtime Fabric

Flint Realtime Fabric is a realtime substrate written in Rust: a durable event spine, one multiplexed client connection, and separate transports for media, peer CRDT synchronization and federation. The portfolio's status is "README reports phase-18 scope complete; full media loop and broader integration remain qualified separately."

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Flint Realtime Fabric README, retrieved 2026-10-24.

## Flint Realtime Fabric status and version

Flint Realtime Fabric has no tagged release (last commit 2026-10-11). The phase-18 completion is the README's own statement.

Source: Flint Realtime Fabric README, retrieved 2026-10-24.

## What Flint Realtime Fabric states

* The event spine is built on Apache Iggy.
* The repository holds the core, the gateway and the SDKs, with the SDKs generated from one frozen protocol contract.
* Flint Realtime Fabric's README says phase 18 completed media, federation and authentication-flow work, including a WebRTC negotiation spike, Matrix inbound sync and AT Protocol outbound writes.
* Flint Realtime Fabric's README lists work still deferred: full sovereign SFU media, LiveKit cross-node inbound, full OIDC login and AT Protocol outbound gateway wiring.

Source: Flint Realtime Fabric README, retrieved 2026-10-24.

## How Flint Realtime Fabric relates to other products

Flint Forge's README says Forge consumes Fabric as its realtime source. The Prometheus Entity Sync README says Entity Sync is built on Fabric and reuses its change capture, CRDT and operation-log code. These are statements of design. The portfolio does not treat them as proof of a completed integration.

Source: Flint Forge README, retrieved 2026-10-24.
Source: Prometheus Entity Sync README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
