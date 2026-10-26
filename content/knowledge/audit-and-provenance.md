# Audit and provenance: what is recorded and what you must add (Solutions)

A visitor asks: "Can I see what the agent did, and reproduce how it reached an answer?" The honest answer is partly. The Universal Agent Runtime (UAR) records evidence of each tool call and each approval decision. It has no durable audit log of tool calls and no export endpoint, and it does not record a tool call's arguments or result. Prometheus Knowledge does not record which snapshot produced a given answer, and no source shows a record that would let an answer be reproduced. This page reads UAR at its v1.3.0 tag; the stable release is v1.2.3.

Source: Universal Agent Runtime v1.3.0 source: tool admission evidence, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: run events API, retrieved 2026-10-26.

## Audit and provenance: what UAR records [shipped] (Solutions)

- A per-tool-call evidence record holds identifiers for the run and the call, the tool name, the owner, the state and a timestamp. States include awaiting approval, succeeded, failed, denied, cancelled and outcome unknown. It holds no tool arguments and no result body.
- An approval record holds the tool name, who decided, whether it was approved and when, and its state: pending, approved, denied, cancelled, expired, interrupted or invalidated. The source says these records describe decisions and never grant execution.
- The run events endpoint is scoped to the owner, and its response labels its retention "process-local-bounded". That is an in-process, bounded history, not a durable trail.
- UAR logs a retrieval decision as the event rag.retrieval.decision when it looks up its knowledge base. Whether that event is kept durably was not checked.
- Which storage provider holds these records in a given deployment was not checked.

Source: Universal Agent Runtime v1.3.0 source: tool admission evidence, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: approval records, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: run events API, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: retrieval pipeline, retrieved 2026-10-26.

## Audit and provenance: what the memory and knowledge products record (Solutions)

- Surreal Memory Server [tag only], v1.10.2: each change to a memory writes a history row with old content, new content, version, time and change type (created, updated or deleted).
- The entity history tool in that server is not shown to return anything: the source compares a plain string against a record-link column, and its test only checks that no error occurs. Do not rely on it.
- The tool that returns the graph at a given time returns what existed by that time. It does not reconstruct entities or relations as they were before an edit or a deletion.
- Prometheus Knowledge [tag only], v1.11.0: its snapshots are immutable and content-addressed, and they are prompt context for coding sessions. Nothing records which snapshot produced a customer-facing answer.

Source: Surreal Memory Server source: memory history record, retrieved 2026-10-26.
Source: Surreal Memory Server source: SurrealDB storage, retrieved 2026-10-26.
Source: Prometheus Knowledge source: prompt snapshots, retrieved 2026-10-26.

## Audit and provenance: what a customer must add (Solutions)

1. A log you control that stores, for every answer, the question, the user, the time, the exact inputs given to the model, the model and version, the tool calls with their arguments, and the output.
2. A place to keep it that your own access rules protect, with a retention period you set.
3. A way to replay: keep the versions of the data, the documents and the prompt used for each answer, or accept that answers are not reproducible.
4. A review step for answers that matter. See [Human review workflow](/solutions/human-review-workflow.md).
5. Your own advice on which records the rules you operate under require. See [Regulated industries](/solutions/regulated-industry-readiness.md).

## Audit and provenance: what is not stated (Solutions)

- No source says UAR keeps a durable audit log of tool calls, or exports one.
- No source says reproducibility of an answer is supported. It is at most a goal.
- No source says whether tool arguments appear in any log.

## Audit and provenance: start here (Solutions)

List the questions an auditor would ask about one answer: who asked, what data it used, what the system did and who checked it. Mark which of those a product records and which your own log must. Then ask the KnowMe Concierge which piece covers each.
