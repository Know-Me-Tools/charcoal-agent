# Surreal Memory Server status and licence

## Who makes the Surreal Memory Server and what licence it uses

The Surreal Memory Server is MIT licensed, and its LICENSE file names Prometheus AGS as copyright holder. Prometheus AGS makes the Surreal Memory Server.

Source: Surreal Memory Server LICENSE, retrieved 2026-10-13.

## Surreal Memory Server publication status

On 2026-10-05 the owner published the completed source and documentation for review. The publication note is explicit: this is a source publication, not a release and not a certification of any installed runtime. The owner plans to resume testing once the code base has stabilised. No release tags are part of the publication.

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-13.

## Surreal Memory Server version

The Surreal Memory Server's latest git tag is v1.10.2, last changed 2026-10-13, and the repository has no GitHub release. Treat that as the source version, not as a tested release, given the publication note above.

Source: Surreal Memory Server tags, retrieved 2026-10-24.

## How the Surreal Memory Server is run

Its README names the native service as the standard local deployment. You point it at a SurrealDB endpoint and an embedding provider through environment variables; containers are optional packaging for development. It can sign in to SurrealDB as a root, namespace or database user, so it does not need root access to a shared database.

Source: Surreal Memory Server README, retrieved 2026-10-13.

## Surreal Memory Server licence

The Surreal Memory Server is MIT licensed (LICENSE file in the repository), with Prometheus AGS as copyright holder. Its library package manifest also declares MIT.

Source: Surreal Memory Server LICENSE, retrieved 2026-10-13.
Source: surreal-memory library package manifest, retrieved 2026-10-13.
