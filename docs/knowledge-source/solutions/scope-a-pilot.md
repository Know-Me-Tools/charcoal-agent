---
type: Concept
title: "Scope a pilot: one task, ten timed examples, clear exit criteria"
description: "How to scope a first pilot of an AI assistant over private data: one task, ten timed examples, data-quality checks as the customer's job, exit criteria, and where the cost formulas are."
status: draft
generated:
  by: km-content-creator/sonnet-5-5
  at: "2026-10-26T00:00:00+00:00"
tags:
  - solutions
  - private-data
  - pilot
  - business-case
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-26T00:00:00+00:00"
---

# Scope a pilot: one task, ten timed examples, clear exit criteria

A visitor asks: "How do we start without betting the practice on it?" Scope a pilot around one task, ten real examples that someone times by hand, and exit criteria written before you start. KnowMe pricing has not been announced, and no source gives time saved or return for any product, so the pilot has to produce your own numbers.[^pf] The formulas for turning them into cost and return are in [Business case and ROI framework](/solutions/business-case-and-roi-framework.md). This page does not repeat them.

## Scope a pilot: the steps

1. Pick one task, such as answering one kind of question about your own records. One task means one question shape, one data source and one reviewer.
2. Collect ten real examples. Time each one done by hand, and write down the answer a careful person would give.
3. For each example, write the expected count, the denominator, and the number of records with missing values. The model does not decide these. Your data owner does.
4. Choose the pieces from [Answer questions over private data](/solutions/private-data-question-answering.md) and note each piece's status. Say which part you build yourself.
5. Run the pilot read-only: a read-only database role, a copy of the data if you can, and approval on every tool that is not a read. See [Human review workflow](/solutions/human-review-workflow.md).
6. Keep your own log of every question, input, tool call and output. See [Audit and provenance](/solutions/audit-and-provenance.md).
7. Compare the ten answers with the expected ones, and time the reviewer.

## Scope a pilot: data quality is the customer's job

Missing values, duplicate records, changed definitions and records entered late all change a count. The products here do not detect or correct them. Before the pilot, decide how each case is handled and write it down. An answer without its denominator and its missing-record count is not an answer to accept.

## Scope a pilot: exit criteria

Write these before you start, and change them only in writing.

- Every one of the ten answers matches the expected count, or the difference is explained and accepted by the data owner.
- Every answer shows its denominator and its missing-record count.
- No write reached the database during the pilot.
- Reviewer time per answer is recorded, and it is lower than doing the task by hand, or you decide to stop.
- Every answer can be traced in your own log to its question, inputs and tool calls.
- A named person with authority decides: stop, extend to a second task, or build.

## Scope a pilot: what is not stated

- No source gives how long a pilot takes or what it costs.
- No source says any product here has been piloted on a private clinical or business data set.
- No source gives accuracy figures for any product.

## Scope a pilot: start here

Write the task and the ten examples first. Then ask the KnowMe Concierge which pieces fit that task and what their status is.
