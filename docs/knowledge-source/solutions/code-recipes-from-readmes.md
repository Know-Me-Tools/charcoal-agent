---
type: Concept
title: "Code recipes taken from product READMEs"
description: "Install and run commands for Prometheus Entity Management, the Universal Agent Runtime, the Surreal Memory Server and Flint Gate, each copied from the named README with its version status."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - recipes
  - code
  - install
sources:
  - id: pem-npm
    resource: https://www.npmjs.com/package/@prometheus-ags/entity-graph-core/v/4.2.0
    title: "@prometheus-ags/entity-graph-core 4.2.0 on npm"
    last_modified: "2026-11-03T00:00:00+00:00"
  - id: pem-readme
    resource: https://github.com/Prometheus-AGS/prometheus-entity-management/blob/main/README.md
    title: "Prometheus Entity Management README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sms-publication
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/docs/source-publication-20261005.md
    title: "Surreal Memory Server source publication note, 2026-10-05"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: sms-readme
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/README.md
    title: "Surreal Memory Server README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: gate-readme
    resource: https://github.com/Know-Me-Tools/flint-gate/blob/main/README.md
    title: "Flint Gate README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Code recipes taken from product READMEs

Short answer for Prometheus Entity Management: this site documents version 4.2.0. Install it with `pnpm add @prometheus-ags/entity-graph-core@4.2.0`. A plain `pnpm add` without a version installs the version tagged `latest` on npm, which was 4.3.0 on 3 November 2026.

A visitor asks: "Show me how to install and start these." Every snippet below is copied from the README named in its section, read on 25 October 2026. Nothing here is invented. Where a README gives no command, this page gives none. Check the README for changes before you rely on a command. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Recipe: Prometheus Entity Management, React install

Status: [shipped], version {{v:pem}}. npm lists 4.2.0 of the core package (published 2026-10-09 UTC) and of the prometheus-entity-management package (published 2026-10-10 UTC); 4.2.0 has no git tag or GitHub release, and its npm README shows `pnpm add @prometheus-ags/entity-graph-core`.[^pem-npm] Pin the version with `@4.2.0` as shown below, because `latest` and `next` on npm both point at 4.3.0.

```bash
pnpm add @prometheus-ags/entity-graph-core@4.2.0 \
  @prometheus-ags/prometheus-entity-management@4.2.0 \
  react@19 react-dom@19
```

## Recipe: Prometheus Entity Management, DevTools in development only

The 4.2.0 npm README says the DevTools runtime is isolated behind the `@prometheus-ags/entity-graph-core/devtools` export and that normal application imports do not expose the controller API.[^pem-npm] The `devtools/auto` entry in the snippet below is taken from the GitHub README as read on 25 October 2026 and was not re-checked against 4.2.0.[^pem-readme]

```ts
if (import.meta.env.DEV) {
  void import("@prometheus-ags/prometheus-entity-management/devtools/auto");
}
```

## Recipe: Prometheus Entity Management, Flutter install

Status: [shipped]. The README lists `entity_graph_flutter` 4.0.0 as published on pub.dev on 2026-09-05.[^pem-readme] Source: the same README.

```bash
flutter pub add entity_graph_flutter:^4.0.0
```

## Recipe: Prometheus Entity Management, what 4.2.0 means

npm lists 4.2.0 as published on 2026-10-09 (core) and 2026-10-10 (prometheus-entity-management), both UTC, and 4.3.0 as published on 2026-10-28 and tagged `latest` and `next`. The GitHub releases page still shows v4.1.1 as the latest release, and there is no v4.2.0 tag. This site uses 4.2.0 because the operator selected it; this page does not claim 4.2.0 is the newest version. The earlier 25 October reading of the GitHub README, which listed 4.2.0 as an unpublished candidate, is out of date.

## Recipe: Universal Agent Runtime, run locally

Status: [shipped], release {{v:uar}}, with {{v:uar:pre}} a pre-release whose verification is pending. The portfolio's status line is "Work stopped; current runtime qualification not established." The repository's release record is newer, and neither is an audit.[^pf] The README lists a current Rust toolchain, Node.js and pnpm 11.15.0 as requirements.[^uar-readme] Source: the Run locally section of the Universal Agent Runtime README.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm build
cargo run --bin universal-agent-runtime
```

## Recipe: Universal Agent Runtime, what to expect

The README says UAR listens on 127.0.0.1:1906 by default and the port is configurable. The README says every API request requires a JWT by default, and that tools/uar-jwt-proxy is a local-only proxy that mints and injects a token for development.[^uar-readme] Its sequence diagram shows a client creating a run with POST /api/uar/runs and then reading the run's server-sent-event stream. The README shows no request body, so this page gives none.[^uar-readme]

## Recipe: Universal Agent Runtime, client libraries

The README lists these install lines and says to use them after the corresponding package is published, because registry publication is release-ordered.[^uar-readme] This page does not establish that they are published. Status: [planned].

```text
Rust:       universal-agent-runtime-sdk = "1"
Python:     pip install universal-agent-runtime-sdk
TypeScript: npm install @prometheus-ags/universal-agent-runtime-sdk
```

## Recipe: Surreal Memory Server, build from source

Status: [planned], source only. The latest tag is {{v:memory}}, and the owner describes the publication as a source publication, not a release.[^sms-publication] The README gives this build and test sequence and names the native service as the canonical local deployment.[^sms-readme]

```bash
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --release
```

## Recipe: Surreal Memory Server, durable operation API

The README says new write integrations use these routes. A 202 reply means a new operation was durably accepted, and a repeated POST with the same ID and hash returns 200.[^sms-readme]

```text
POST /api/v2/operations
GET  /api/v2/operations/{operation_id}
GET  /api/v2/operations/{operation_id}/events?after=N
GET  /health
GET  /ready
```

## Recipe: Flint Gate, build and run

Status: [planned], source only, with {{v:gate}}.[^pf] The README shows building and running with a config file. The proxy listens on port 4456 and the admin server on 4457, which the README says never to expose to the internet.[^gate-readme]

```bash
cargo build --release
./target/release/flint-gate --config config.yaml
```

## Recipe: Flint Gate, limit what an agent may call

The README's tool-scope shortcut compiles to Cedar policy. A deny wins over an allow, and a policy that does not validate stops the gateway from starting.[^gate-readme] Comments in the README's example are omitted here.

```yaml
agent_tool_policies:
  - agent: "ci-bot"
    allow: ["deploy", "run_tests"]
    deny:  ["delete_*"]
```

## Recipe: Flint Gate, review a paused tool call

When a policy marks a call for approval, the gateway pauses it. An operator lists and decides pending requests through the admin API, and an undecided request is denied after its time limit.[^gate-readme] The README lists these routes, and the decision body is approve or deny.

```text
GET  :4457/approvals
GET  :4457/approvals/{id}
POST :4457/approvals/{id}/decision
```
