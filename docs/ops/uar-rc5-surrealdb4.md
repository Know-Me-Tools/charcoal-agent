# UAR RC5 and SurrealDB 4.0.0 rollout

Compose and Kubernetes select the signed `1.4.0-rc.5` UAR image on Linux amd64 and the official SurrealDB `4.0.0` image. The database uses SurrealKV. The dedicated memory server, UAR, and site meter still share one database server with separate namespaces or databases.

Merging into `main` can start the site deployment workflow. Keep this PR in draft until the cutover prerequisites are satisfied and the rollout is ready for its production environment approval.

The existing store uses RocksDB from SurrealDB 3.3.0. Before rollout, stop writers, verify a logical export and a storage backup, and rehearse conversion on a separate copy. Preserve the original storage and record the restore procedure. Keep the experimental conversion option out of the normal Compose and Kubernetes settings. Prepare the verified converted copy at the configured data path before starting the new stack. For rollback, reopen a preserved 3.x copy with the previous stack and reconcile writes accepted after cutover.

The previous memory-server image used SDK 3.3, which refuses the 4.0 server during connection. The replacement `ghcr.io/prometheus-ags/surreal-memory-server:sha-f74c53d8e5383eff833ebc8bc9ec6f9b0397bd11@sha256:87197bfb8c23a6df6dc48b10c66ffab5af5ba876fb83c1a3a9cd35ccb9a2713f` is built with SDK 4.0.0. Before promoting this change, prove the replacement against the restored 4.0.0 server. Check the UAR and memory namespaces and site-meter reads and writes. Confirm UAR readiness and model verification through the existing operator runbook. The published UAR release qualification used embedded SurrealKV, so it does not substitute for this shared remote-store rehearsal.

[SurrealDB 3.x to 4.0 upgrade guide](https://surrealdb.com/docs/build/migrating/from-old-surrealdb-versions/3x-to-4x) · [Signed UAR RC5 release](https://github.com/Prometheus-AGS/universal-agent-runtime/releases/tag/v1.4.0-rc.5) · [Memory-server image build](https://github.com/Prometheus-AGS/surreal-memory-server/actions/runs/43386476133)

## Memory API cutover

The newer memory server binds to loopback by default and requires verified JWTs on a network listener. Compose takes the issuer, audience and RSA public key from the `MEMORY_AUTH_JWT_*` settings. Kubernetes takes `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE` and `AUTH_JWT_KEY` from the operator-provisioned `memory-api-auth` Secret. Supply the matching issuer's public verification key. Keep the private signing key with the issuer.

Validate the intended clients with their trusted issuer and tenant claims. The server uses the verified tenant to select its database, so check access to existing memory data and qualify any required tenant data adoption before cutover. A healthy listener only proves the service started.

The previous Kubernetes UAR image was `ghcr.io/prometheus-ags/universal-agent-runtime:1.4.0-rc.2@sha256:08ff2c2f0d95320e785df77b13540576993642d3f8f304b5f467e8da4a09bb5b`. Retain the previous Compose and Kubernetes manifests with the database backup.
