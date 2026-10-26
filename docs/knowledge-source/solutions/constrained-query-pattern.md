---
type: Concept
title: "Constrained query pattern: let a model propose, let code compile"
description: "A design pattern, not a product, for letting a model help with questions over a private database while deterministic code compiles read-only parameterised queries; which parts exist in Flint Forge and the Universal Agent Runtime and which do not."
status: draft
generated:
  by: km-content-creator/sonnet-5-5
  at: "2026-10-26T00:00:00+00:00"
tags:
  - solutions
  - private-data
  - design-pattern
  - read-only
sources:
  - id: uar-manager
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/v1.3.0/src/uar/runtime/manager.rs
    title: "Universal Agent Runtime v1.3.0 source: run manager tool decision"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: forge-readme
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/README.md
    title: "Flint Forge README"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: forge-query
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/crates/fdb-query/src/lib.rs
    title: "Flint Forge source: fdb-query request-to-SQL translator"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: forge-backend
    resource: https://github.com/Know-Me-Tools/flint-forge/blob/main/crates/fdb-postgres/src/backend.rs
    title: "Flint Forge source: fdb-postgres backend and row-level security"
    last_modified: "2026-10-26T00:00:00+00:00"
---

# Constrained query pattern: let a model propose, let code compile

This is a design pattern, not a shipped product, and none of the KnowMe or Prometheus products implements it end to end. The idea: a model never writes SQL. It proposes a typed query spec from the user's question, and deterministic code that you can test checks the spec against an allow-list and compiles a parameterised read-only query. The safety rests on a read-only database role, because Flint Forge's Quarry has no read-only mode and its REST surface includes writes.[^forge-query] A Cedar policy that denies every tool except named read tools can be configured in the Universal Agent Runtime. No such policy ships.[^uar-manager]

## Constrained query pattern: the steps

1. The user asks a question in plain language.
2. The model returns a typed spec only: a table or view from an allow-list, filters, a grouping, and which counts to return. It is a JSON object checked against a schema. Anything outside the schema is rejected.
3. Deterministic code compiles the spec to a parameterised query. Every value is a bound parameter and every table and column name is checked against the allow-list. The model's text never reaches the database as SQL.
4. The query runs under a database role that can only read, on a replica or a copy if you can.
5. The same code computes the counts, the denominator and the number of records with missing values, and returns them next to the answer. The model words the result, and it does not do the arithmetic.
6. Your system stores the question, the spec and the result, so a person can check them later.

## Constrained query pattern: what already exists

- Flint Forge Quarry [shipped], release {{v:forge}}, uses the same idea for HTTP requests. Its translator parses a REST request into a typed plan and renders SQL in which every value is a bound parameter and every identifier is validated.[^forge-query] Its input is REST request syntax, not a model's spec. The README's "v1.0-ready" is a source claim, not an audit.[^forge-readme]
- Quarry applies row-level security by running each request inside a transaction under a database role, with the caller's token claims set for the policies to read.[^forge-backend] The policies are written in Postgres by the customer.
- The Universal Agent Runtime [shipped], release {{v:uar}}, decides every tool call a run makes. A Cedar policy can deny it, and approval can be required.[^uar-manager] Which policy files a default install loads was not checked.

## Constrained query pattern: what does not exist

- A step that turns a question into a spec, and a compiler for that spec: [not offered]. You build them.
- Counts with denominators and missing-data reporting: [not offered].
- A read-only mode in Quarry: [not offered]. Use a read-only Postgres role.[^forge-query]
- A shipped Cedar policy that permits only read tools: [not offered].

## Constrained query pattern: what is not stated

- No source says the pattern was built or tested with any product here.
- No source gives accuracy figures for a model filling in such a spec.
- No source says Quarry's behaviour under a read-only role was tested for its write paths.

## Constrained query pattern: start here

Pick one question and write its spec by hand: the table, the filters and the counts you expect. If you cannot write the spec, a model cannot either. Then see [Scope a pilot](/solutions/scope-a-pilot.md), or ask the KnowMe Concierge which pieces fit your database.
