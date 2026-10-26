# Answer questions over private data: which products help and which do not (Solutions)

A visitor asks: "Can I ask plain-language questions of our own private data and get counted answers back, with the denominators and the missing data shown?" None of the KnowMe or Prometheus products does that today. No product turns a plain-language question into a cohort or analytics query, counts patients or records, or reports denominators and missing data, and no source in the portfolio or in the four repositories read for this page describes such a feature. The KnowMe Concierge can map your problem onto the pieces that do exist, state each piece's status and name what is still missing. It does not run queries over your data. Status tags on this page: [shipped] is a published release, [tag only] is a git tag without a GitHub release, [pattern] is a design this page describes and no product implements, and [not offered] means no source shows it.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-26.
Source: Universal Agent Runtime README, retrieved 2026-10-26.
Source: Flint Forge README, retrieved 2026-10-26.

## Answer questions over private data: the pieces that exist (Solutions)

- The Universal Agent Runtime [shipped], release v1.2.3, with v1.3.0 as the pre-release checked here: every tool call in a run is decided before it runs. A Cedar policy can deny it, and a tool, the host or the run policy can require human approval. An opt-in mode, UAR_LOCAL_ONLY=1, refuses any model provider that is not on the local machine and fails closed. It is off by default. The portfolio's status is "Work stopped; current runtime qualification not established."
- Flint Forge, with Quarry [shipped], release v1.0.0: a typed request plan becomes SQL with bound parameters and validated identifiers, and Postgres row-level security is applied per request. Its input is REST request syntax, not natural language. The README's "v1.0-ready" is a source claim, not an audit.
- Surreal Memory Server [tag only], v1.10.2: stores memories and records a history row for each change, with old content, new content, version, time and change type.
- Prometheus Knowledge [tag only], v1.11.0: writes immutable, content-addressed knowledge snapshots. They are prompt context for coding sessions, not a record of which snapshot produced an answer.

Source: Universal Agent Runtime v1.3.0 source: run manager tool decision, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: local-only inference mode, retrieved 2026-10-26.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-26.
Source: Flint Forge source: fdb-query request-to-SQL translator, retrieved 2026-10-26.
Source: Flint Forge source: fdb-postgres backend and row-level security, retrieved 2026-10-26.
Source: Surreal Memory Server source: memory history record, retrieved 2026-10-26.
Source: Prometheus Knowledge source: prompt snapshots, retrieved 2026-10-26.

## Answer questions over private data: not offered (Solutions)

- Natural-language-to-query: [not offered]. A model proposing a typed query spec that deterministic code compiles is a [pattern]. See [Constrained query pattern](/solutions/constrained-query-pattern.md).
- Cohort definitions, patient or record counts, denominators and missing-data reporting: [not offered].
- A durable, exportable audit log of answers: [not offered]. See [Audit and provenance](/solutions/audit-and-provenance.md).
- A read-only mode in Quarry: [not offered]. Its REST surface includes writes, so read-only has to come from a read-only database role.

Source: Flint Forge source: fdb-query request-to-SQL translator, retrieved 2026-10-26.

## Answer questions over private data: what the customer would still need (Solutions)

1. A query layer that you build or buy, with a typed spec the model fills in and code you can test.
2. A written definition of each cohort and of what counts as missing, signed off by the people who own the data.
3. Counts that show the denominator and the number of records with missing values, produced by code and not by the model.
4. A read-only database role, and a copy of the data if you cannot trust the live system with the pilot.
5. An audit trail you keep yourself, because the runtime does not keep a durable one.
6. Your own decisions on regulation. See [Regulated industries](/solutions/regulated-industry-readiness.md).

## Answer questions over private data: other ways to get the answer (Solutions)

These are categories, not products, and these pages state nothing about any named product in them: analytics built into your existing record system, open-source cohort-analysis tools, and manual chart review. Compare any option on the same criteria: where the data stays, whether every count shows its denominator and its missing records, who validated the counts, how long the first answer takes, and what a wrong answer costs.

## Answer questions over private data: what is not stated (Solutions)

- No source shows any product here handling patient records or any regulated data set.
- No source gives accuracy, speed or time-saved figures for any of these pieces.

## Answer questions over private data: start here (Solutions)

Write one question you would ask, the table it would touch and the answer you would expect. Then see [Scope a pilot](/solutions/scope-a-pilot.md), or ask the KnowMe Concierge which pieces fit that question and what each one's status is.
