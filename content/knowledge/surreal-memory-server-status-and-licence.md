# Surreal Memory Server status and licence

## Surreal Memory Server publication status

On 2026-10-05 the owner published the completed source and documentation for review. The publication note is explicit: this is a source publication, not a release and not a certification of any installed runtime. The owner plans to resume testing once the code base has stabilised. No release tags are part of the publication.

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-13.

## Surreal Memory Server version

The Surreal Memory Server's workspace manifest gives version 1.10.2. Treat that as the source version, not as a tested release, given the publication note above.

Source: Surreal Memory Server workspace manifest, retrieved 2026-10-13.

## How the Surreal Memory Server is run

Its README names the native service as the standard local deployment. You point it at a SurrealDB endpoint and an embedding provider through environment variables; containers are optional packaging for development. It can sign in to SurrealDB as a root, namespace or database user, so it does not need root access to a shared database.

Source: Surreal Memory Server README, retrieved 2026-10-13.

## Surreal Memory Server licence

The Surreal Memory Server is MIT licensed. The owners state it is MIT licensed; a LICENSE file has been proposed in the repository. Its library package manifest already declares MIT.

Source: surreal-memory library package manifest, retrieved 2026-10-13.
