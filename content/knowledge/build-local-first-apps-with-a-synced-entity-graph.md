# Build local-first apps with a synced entity graph (Solutions)

A visitor asks: "I'm building an app that must work offline and show the same data in every view. What can I use?" Prometheus Entity Management has a stable release. The sync and realtime parts it can connect to are existing source without releases. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Local-first apps: Prometheus Entity Management [shipped] (Solutions)

Prometheus Entity Management is a normalized, reactive entity graph. Each entity is stored once at a type and id address, so one write updates every list row and detail view. The latest stable release is v4.1.1. Its README lists React 19, Flutter with Riverpod 3, Svelte 5, Solid, Alpine, Web Components and HTMX bindings, plus Tauri 2 for desktop and mobile. Local-first support is PGlite persistence, Loro convergence, offline queues and reconnect recovery. The portfolio notes that version records differ across snapshots.

Source: Prometheus Entity Management README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Local-first apps: transports and the Flint platform (Solutions)

Prometheus Entity Management lists REST, GraphQL, WebSocket, Supabase Realtime and Flint Realtime Fabric as transports. The Flint adapter turns Fabric events into graph changes and resumes from an acknowledged checkpoint after a reconnect. Flint Realtime Fabric is existing source with no tagged release (last commit 2026-10-11). Prometheus Entity Sync, which replicates Postgres to PGlite and SQLite, is existing source with no tagged release (last commit 2026-09-17).

Source: Prometheus Entity Management README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Prometheus Entity Sync README, retrieved 2026-10-25.

## Local-first apps: how the products fit together (Solutions)

- The entity graph with PGlite persistence in the browser: [shipped].
- The entity graph reading Fabric events through the Flint adapter: [planned]. The adapter is in the README, and Fabric has no release.
- Flint Forge behind Flint Gate, consuming Fabric as its realtime source: [planned]. This is a repository statement of design.
- Entity Sync built on Fabric's change capture and operation-log code: [planned].

Source: Prometheus Entity Management README, retrieved 2026-10-25.
Source: Flint Forge README, retrieved 2026-10-25.
Source: Prometheus Entity Sync README, retrieved 2026-10-25.

## Local-first apps: what is not stated (Solutions)

- No source says Prometheus Entity Management and Prometheus Entity Sync work together. The entity graph has its own sync package for CRDT and local-first providers.
- The portfolio says Entity Sync's deployment qualification is not audited, and Fabric's full media loop and broader integration are qualified separately.
- The README's example table calls its five example apps implemented and says that is bounded evidence, not a claim about stable promotion of every package.

Source: Prometheus Entity Management README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Local-first apps: start here (Solutions)

Install the core package and the React binding, or the Flutter package, with the commands in [code recipes from READMEs](/solutions/code-recipes-from-readmes.md). Then read the README's package chooser.
