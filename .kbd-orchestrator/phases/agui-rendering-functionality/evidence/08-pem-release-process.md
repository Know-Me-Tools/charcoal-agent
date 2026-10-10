# PEM release process (verbatim excerpt of RELEASING.md)

From `/Users/gqadonis/Projects/prometheus/prometheus-entity-management/RELEASING.md` at `origin/main` commit `35f43cb7d589ef242bcff4dd45c1ddf8fc13dd43`, lines 1-30.

```
# Releasing Prometheus Entity Management

## 4.x status: stable published

**Update 2026-10-08: 4.1.1 stable is published.** All thirteen
`@prometheus-ags/*` npm packages are public at `4.1.1` with both `latest` and
`next` pointing at it (tag `v4.1.1`). `4.0.0` moved every package to ESM-only
output and published the React binding as `@prometheus-ags/entity-graph-react`,
keeping `@prometheus-ags/prometheus-entity-management` as a compatibility alias;
`4.0.1` shipped with an unresolved pnpm `workspace:` protocol and is deprecated;
`4.0.2` was its corrective republication; `4.1.0` makes garbage collection treat
list membership as a reference (#43). These publications ran with `pnpm publish`
and a granular npm token at operator direction, so they carry no npm provenance
attestation. The `publish-stable-3.0.0.sh` script publishes the twelve
long-standing packages; the `prometheus-entity-management` alias is published
afterwards by hand with the same command, and `next` is moved with
`npm dist-tag add` from a scratch directory.

## 3.x status: stable published

**Update 2026-08-30: 3.2.0 stable is published.** All twelve
`@prometheus-ags/*` npm packages are public at `3.2.0` with both `latest` and
`next` pointing at it (tag `v3.2.0`). `3.0.0` shipped with an unresolved pnpm
`workspace:` protocol in ten of twelve manifests and is deprecated; `3.0.1` and
`3.0.2` were corrective republications, `3.0.3` made fetched list ingestion
atomic, `3.0.4` was deprecated after stale build artifacts were discovered,
and `3.1.0` introduced the optional React DevTools entries. `3.2.0` completes
the DevTools distribution with bounded event metadata and responsive search,
while retaining the provider-scoped imperative-access fix and A2UI 1.0-RC compatibility. These
publications ran directly with a granular npm token at
```

## npm login check from this machine

Run from `/tmp`: `npm whoami` prints `babyice1906`. Run **inside** the PEM checkout it fails with `EBADDEVENGINES` (PEM's `devEngines` constraint on the npm version), which is why an earlier check looked like "not logged in". Both are true; the login exists.

Maintainers (names only; `npm view <pkg> maintainers`) for `@prometheus-ags/a2ui-react`, `@prometheus-ags/entity-graph-core` and `@prometheus-ags/prometheus-entity-management`: `babyice1906` in each case.

What is **still untested**: whether this login can actually publish (token type, 2FA, scope). `RELEASING.md` says earlier releases used "a granular npm token at operator direction", so the interactive login may not be that token. A `pnpm publish --dry-run` from the PEM checkout, run under the release procedure, would show it. Not done.
