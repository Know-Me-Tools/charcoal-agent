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

A visitor asks: "Show me how to install and start these." Every snippet below is copied from the README named in its section, read on 25 October 2026. Nothing here is invented. Where a README gives no command, this page gives none. Check the README for changes before you rely on a command. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Recipe: Prometheus Entity Management, React install

Status: [shipped], release {{v:pem}}. The README says all thirteen npm packages are public at 4.1.1, with the `latest` and `next` tags pointing at it, published 2026-10-08.[^pem-readme] Source: the Quickstarts section of the Prometheus Entity Management README.

```bash
pnpm add @prometheus-ags/entity-graph-core \
  @prometheus-ags/prometheus-entity-management \
  react@19 react-dom@19
```

## Recipe: Prometheus Entity Management, DevTools in development only

The README says npm 4.1.1 ships the optional `./devtools` and development-only `./devtools/auto` entries, and that the ordinary package root stays inspector-free.[^pem-readme] Source: the same README.

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

The README's registry snapshot of 2026-10-08 names `4.2.0` as the expected candidate and lists each package's release state as pending-publication. Its package chooser shows 4.2.0 as the candidate for every package.[^pem-readme] This page does not establish that 4.2.0 is published. The commands above install what the registry serves as `latest`, which the README gives as 4.1.1.

## Recipe: Universal Agent Runtime, run locally

Status: [shipped], release {{v:uar}}, with {{v:uar:pre}} a pre-release whose verification is pending.[^pf] The README lists a current Rust toolchain, Node.js and pnpm 11.15.0 as requirements.[^uar-readme] Source: the Run locally section of the Universal Agent Runtime README.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm build
cargo run --bin universal-agent-runtime
```

## Recipe: Universal Agent Runtime, what to expect

UAR listens on 127.0.0.1:1906 by default. The README says every API request requires a JWT by default, and that tools/uar-jwt-proxy is a local-only proxy that mints and injects a token for development.[^uar-readme] Its sequence diagram shows a client creating a run with POST /api/uar/runs and then reading the run's server-sent-event stream. The README shows no request body, so this page gives none.[^uar-readme]

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
