# Surreal Memory Server status and licence

## Surreal Memory Server publication status

On 2026-10-05 the owner published the completed source and documentation for review. The publication note is explicit: this is a source publication, not a release and not a certification of any installed runtime. An earlier release integration did not pass as a whole, and the owner stopped further product testing and the planned rollout. No release tags are part of the publication.

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-12.

## Surreal Memory Server version

The server's workspace manifest gives version 1.10.2. Treat that as the source version, not as a tested release, given the publication note above.

Source: Surreal Memory Server workspace manifest, retrieved 2026-10-12.

## How the Surreal Memory Server is run

Its README names the native service as the standard local deployment. You point it at a SurrealDB endpoint and an embedding provider through environment variables; containers are optional packaging for development. It can sign in to SurrealDB as a root, namespace or database user, so it does not need root access to a shared database.

Source: Surreal Memory Server README, retrieved 2026-10-12.

## Surreal Memory Server licence

Its authors state the Surreal Memory Server is MIT licensed, and the library package's own manifest declares MIT. The repository does not yet contain a LICENSE file.

Source: surreal-memory library package manifest, retrieved 2026-10-12.
