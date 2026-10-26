# Constrained query pattern: let a model propose, let code compile (Solutions)

This is a design pattern, not a shipped product, and none of the KnowMe or Prometheus products implements it end to end. The idea: a model never writes SQL. It proposes a typed query spec from the user's question, and deterministic code that you can test checks the spec against an allow-list and compiles a parameterised read-only query. The safety rests on a read-only database role, because Flint Forge's Quarry has no read-only mode and its REST surface includes writes. A Cedar policy that denies every tool except named read tools can be configured in the Universal Agent Runtime. No such policy ships.

Source: Flint Forge source: fdb-query request-to-SQL translator, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: run manager tool decision, retrieved 2026-10-26.

## Constrained query pattern: the steps (Solutions)

1. The user asks a question in plain language.
2. The model returns a typed spec only: a table or view from an allow-list, filters, a grouping, and which counts to return. It is a JSON object checked against a schema. Anything outside the schema is rejected.
3. Deterministic code compiles the spec to a parameterised query. Every value is a bound parameter and every table and column name is checked against the allow-list. The model's text never reaches the database as SQL.
4. The query runs under a database role that can only read, on a replica or a copy if you can.
5. The same code computes the counts, the denominator and the number of records with missing values, and returns them next to the answer. The model words the result, and it does not do the arithmetic.
6. Your system stores the question, the spec and the result, so a person can check them later.

## Constrained query pattern: what already exists (Solutions)

- Flint Forge Quarry [shipped], release v1.0.0, uses the same idea for HTTP requests. Its translator parses a REST request into a typed plan and renders SQL in which every value is a bound parameter and every identifier is validated. Its input is REST request syntax, not a model's spec. The README's "v1.0-ready" is a source claim, not an audit.
- Quarry applies row-level security by running each request inside a transaction under a database role, with the caller's token claims set for the policies to read. The policies are written in Postgres by the customer.
- The Universal Agent Runtime [shipped], release v1.2.3, decides every tool call a run makes. A Cedar policy can deny it, and approval can be required. Which policy files a default install loads was not checked.

Source: Flint Forge source: fdb-query request-to-SQL translator, retrieved 2026-10-26.
Source: Flint Forge README, retrieved 2026-10-26.
Source: Flint Forge source: fdb-postgres backend and row-level security, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: run manager tool decision, retrieved 2026-10-26.

## Constrained query pattern: what does not exist (Solutions)

- A step that turns a question into a spec, and a compiler for that spec: [not offered]. You build them.
- Counts with denominators and missing-data reporting: [not offered].
- A read-only mode in Quarry: [not offered]. Use a read-only Postgres role.
- A shipped Cedar policy that permits only read tools: [not offered].

Source: Flint Forge source: fdb-query request-to-SQL translator, retrieved 2026-10-26.

## Constrained query pattern: what is not stated (Solutions)

- No source says the pattern was built or tested with any product here.
- No source gives accuracy figures for a model filling in such a spec.
- No source says Quarry's behaviour under a read-only role was tested for its write paths.

## Constrained query pattern: start here (Solutions)

Pick one question and write its spec by hand: the table, the filters and the counts you expect. If you cannot write the spec, a model cannot either. Then see [Scope a pilot](/solutions/scope-a-pilot.md), or ask the KnowMe Concierge which pieces fit your database.
