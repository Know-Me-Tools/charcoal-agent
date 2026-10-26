---
type: Concept
title: "Answer questions over private data: which products help and which do not"
description: "For a visitor who wants plain-language questions answered from their own private data with counts, denominators and missing data: no product does that today; the pieces that exist, their status, and what the customer would still need."
status: draft
generated:
  by: km-content-creator/sonnet-5-5
  at: "2026-10-26T00:00:00+00:00"
tags:
  - solutions
  - private-data
  - analytics
  - governance
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: uar-local
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/v1.3.0/src/llm/local_only.rs
    title: "Universal Agent Runtime v1.3.0 source: local-only inference mode"
    last_modified: "2026-10-26T00:00:00+00:00"
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
  - id: mem-code
    resource: https://github.com/Prometheus-AGS/surreal-memory-server/blob/main/crates/surreal-memory/src/memory.rs
    title: "Surreal Memory Server source: memory history record"
    last_modified: "2026-10-26T00:00:00+00:00"
  - id: pk-snap
    resource: https://github.com/Prometheus-AGS/prometheus-knowledge-rs/blob/main/pk-store/src/prompt_snapshot.rs
    title: "Prometheus Knowledge source: prompt snapshots"
    last_modified: "2026-10-26T00:00:00+00:00"
---

# Answer questions over private data: which products help and which do not

A visitor asks: "Can I ask plain-language questions of our own private data and get counted answers back, with the denominators and the missing data shown?" None of the KnowMe or Prometheus products does that today. No product turns a plain-language question into a cohort or analytics query, counts patients or records, or reports denominators and missing data, and no source in the portfolio or in the four repositories read for this page describes such a feature.[^pf][^uar-readme][^forge-readme] The KnowMe Concierge can map your problem onto the pieces that do exist, state each piece's status and name what is still missing. It does not run queries over your data. Status tags on this page: [shipped] is a published release, [tag only] is a git tag without a GitHub release, [pattern] is a design this page describes and no product implements, and [not offered] means no source shows it.

## Answer questions over private data: the pieces that exist

- The Universal Agent Runtime [shipped], release {{v:uar}}, with {{v:uar:pre}} as the pre-release checked here: every tool call in a run is decided before it runs. A Cedar policy can deny it, and a tool, the host or the run policy can require human approval.[^uar-manager] An opt-in mode, UAR_LOCAL_ONLY=1, refuses any model provider that is not on the local machine and fails closed. It is off by default.[^uar-local] The portfolio's status is "Work stopped; current runtime qualification not established."[^pf]
- Flint Forge, with Quarry [shipped], release {{v:forge}}: a typed request plan becomes SQL with bound parameters and validated identifiers, and Postgres row-level security is applied per request.[^forge-query][^forge-backend] Its input is REST request syntax, not natural language. The README's "v1.0-ready" is a source claim, not an audit.[^pf]
- Surreal Memory Server [tag only], {{v:memory}}: stores memories and records a history row for each change, with old content, new content, version, time and change type.[^mem-code]
- Prometheus Knowledge [tag only], {{v:knowledge}}: writes immutable, content-addressed knowledge snapshots. They are prompt context for coding sessions, not a record of which snapshot produced an answer.[^pk-snap]

## Answer questions over private data: not offered

- Natural-language-to-query: [not offered]. A model proposing a typed query spec that deterministic code compiles is a [pattern]. See [Constrained query pattern](/solutions/constrained-query-pattern.md).
- Cohort definitions, patient or record counts, denominators and missing-data reporting: [not offered].
- A durable, exportable audit log of answers: [not offered]. See [Audit and provenance](/solutions/audit-and-provenance.md).
- A read-only mode in Quarry: [not offered]. Its REST surface includes writes, so read-only has to come from a read-only database role.[^forge-query]

## Answer questions over private data: what the customer would still need

1. A query layer that you build or buy, with a typed spec the model fills in and code you can test.
2. A written definition of each cohort and of what counts as missing, signed off by the people who own the data.
3. Counts that show the denominator and the number of records with missing values, produced by code and not by the model.
4. A read-only database role, and a copy of the data if you cannot trust the live system with the pilot.
5. An audit trail you keep yourself, because the runtime does not keep a durable one.
6. Your own decisions on regulation. See [Regulated industries](/solutions/regulated-industry-readiness.md).

## Answer questions over private data: other ways to get the answer

These are categories, not products, and these pages state nothing about any named product in them: analytics built into your existing record system, open-source cohort-analysis tools, and manual chart review. Compare any option on the same criteria: where the data stays, whether every count shows its denominator and its missing records, who validated the counts, how long the first answer takes, and what a wrong answer costs.

## Answer questions over private data: what is not stated

- No source shows any product here handling patient records or any regulated data set.
- No source gives accuracy, speed or time-saved figures for any of these pieces.

## Answer questions over private data: start here

Write one question you would ask, the table it would touch and the answer you would expect. Then see [Scope a pilot](/solutions/scope-a-pilot.md), or ask the KnowMe Concierge which pieces fit that question and what each one's status is.
