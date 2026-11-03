# Code recipes taken from product READMEs (Solutions)

Short answer for Prometheus Entity Management: this site documents version 4.2.0. Install it with `pnpm add @prometheus-ags/entity-graph-core@4.2.0`. A plain `pnpm add` without a version installs the version tagged `latest` on npm, which was 4.3.0 on 3 November 2026.

A visitor asks: "Show me how to install and start these." Every snippet below is copied from the README named in its section, read on 25 October 2026. Nothing here is invented. Where a README gives no command, this page gives none. Check the README for changes before you rely on a command. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Recipe: Prometheus Entity Management, React install (Solutions)

Status: [shipped], version v4.2.0. npm lists 4.2.0 of the core package (published 2026-10-09 UTC) and of the prometheus-entity-management package (published 2026-10-10 UTC); 4.2.0 has no git tag or GitHub release, and its npm README shows `pnpm add @prometheus-ags/entity-graph-core`. Pin the version with `@4.2.0` as shown below, because `latest` and `next` on npm both point at 4.3.0.

```bash
pnpm add @prometheus-ags/entity-graph-core@4.2.0 \
  @prometheus-ags/prometheus-entity-management@4.2.0 \
  react@19 react-dom@19
```

Source: @prometheus-ags/entity-graph-core 4.2.0 on npm, retrieved 2026-11-03.

## Recipe: Prometheus Entity Management, DevTools in development only (Solutions)

The 4.2.0 npm README says the DevTools runtime is isolated behind the `@prometheus-ags/entity-graph-core/devtools` export and that normal application imports do not expose the controller API. The `devtools/auto` entry in the snippet below is taken from the GitHub README as read on 25 October 2026 and was not re-checked against 4.2.0.

```ts
if (import.meta.env.DEV) {
  void import("@prometheus-ags/prometheus-entity-management/devtools/auto");
}
```

Source: @prometheus-ags/entity-graph-core 4.2.0 on npm, retrieved 2026-11-03.
Source: Prometheus Entity Management README, retrieved 2026-10-25.

## Recipe: Prometheus Entity Management, Flutter install (Solutions)

Status: [shipped]. The README lists `entity_graph_flutter` 4.0.0 as published on pub.dev on 2026-09-05. Source: the same README.

```bash
flutter pub add entity_graph_flutter:^4.0.0
```

Source: Prometheus Entity Management README, retrieved 2026-10-25.

## Recipe: Prometheus Entity Management, what 4.2.0 means (Solutions)

npm lists 4.2.0 as published on 2026-10-09 (core) and 2026-10-10 (prometheus-entity-management), both UTC, and 4.3.0 as published on 2026-10-28 and tagged `latest` and `next`. The GitHub releases page still shows v4.1.1 as the latest release, and there is no v4.2.0 tag. This site uses 4.2.0 because the operator selected it; this page does not claim 4.2.0 is the newest version. The earlier 25 October reading of the GitHub README, which listed 4.2.0 as an unpublished candidate, is out of date.

## Recipe: Universal Agent Runtime, run locally (Solutions)

Status: [shipped], release v1.2.3, with v1.4.0-rc.2 a pre-release whose verification is pending. The portfolio's status line is "Work stopped; current runtime qualification not established." The repository's release record is newer, and neither is an audit. The README lists a current Rust toolchain, Node.js and pnpm 11.15.0 as requirements. Source: the Run locally section of the Universal Agent Runtime README.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm build
cargo run --bin universal-agent-runtime
```

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Universal Agent Runtime README, retrieved 2026-10-25.

## Recipe: Universal Agent Runtime, what to expect (Solutions)

The README says UAR listens on 127.0.0.1:1906 by default and the port is configurable. The README says every API request requires a JWT by default, and that tools/uar-jwt-proxy is a local-only proxy that mints and injects a token for development. Its sequence diagram shows a client creating a run with POST /api/uar/runs and then reading the run's server-sent-event stream. The README shows no request body, so this page gives none.

Source: Universal Agent Runtime README, retrieved 2026-10-25.

## Recipe: Universal Agent Runtime, client libraries (Solutions)

The README lists these install lines and says to use them after the corresponding package is published, because registry publication is release-ordered. This page does not establish that they are published. Status: [planned].

```text
Rust:       universal-agent-runtime-sdk = "1"
Python:     pip install universal-agent-runtime-sdk
TypeScript: npm install @prometheus-ags/universal-agent-runtime-sdk
```

Source: Universal Agent Runtime README, retrieved 2026-10-25.

## Recipe: Surreal Memory Server, build from source (Solutions)

Status: [planned], source only. The latest tag is v1.10.2, and the owner describes the publication as a source publication, not a release. The README gives this build and test sequence and names the native service as the canonical local deployment.

```bash
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --release
```

Source: Surreal Memory Server source publication note, 2026-10-05, retrieved 2026-10-25.
Source: Surreal Memory Server README, retrieved 2026-10-25.

## Recipe: Surreal Memory Server, durable operation API (Solutions)

The README says new write integrations use these routes. A 202 reply means a new operation was durably accepted, and a repeated POST with the same ID and hash returns 200.

```text
POST /api/v2/operations
GET  /api/v2/operations/{operation_id}
GET  /api/v2/operations/{operation_id}/events?after=N
GET  /health
GET  /ready
```

Source: Surreal Memory Server README, retrieved 2026-10-25.

## Recipe: Flint Gate, build and run (Solutions)

Status: [planned], source only, with no tagged release (last commit 2026-10-23). The README shows building and running with a config file. The proxy listens on port 4456 and the admin server on 4457, which the README says never to expose to the internet.

```bash
cargo build --release
./target/release/flint-gate --config config.yaml
```

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.
Source: Flint Gate README, retrieved 2026-10-25.

## Recipe: Flint Gate, limit what an agent may call (Solutions)

The README's tool-scope shortcut compiles to Cedar policy. A deny wins over an allow, and a policy that does not validate stops the gateway from starting. Comments in the README's example are omitted here.

```yaml
agent_tool_policies:
  - agent: "ci-bot"
    allow: ["deploy", "run_tests"]
    deny:  ["delete_*"]
```

Source: Flint Gate README, retrieved 2026-10-25.

## Recipe: Flint Gate, review a paused tool call (Solutions)

When a policy marks a call for approval, the gateway pauses it. An operator lists and decides pending requests through the admin API, and an undecided request is denied after its time limit. The README lists these routes, and the decision body is approve or deny.

```text
GET  :4457/approvals
GET  :4457/approvals/{id}
POST :4457/approvals/{id}/decision
```

Source: Flint Gate README, retrieved 2026-10-25.
