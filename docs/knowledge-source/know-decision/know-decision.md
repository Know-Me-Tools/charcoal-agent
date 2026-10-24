---
type: Concept
title: "Know Decision (KnowMe Decision Layer) status and what is stated"
description: "Know Decision is a planned local decision layer; the repository is pre-implementation and holds design, research and a build playbook."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-24T00:00:00+00:00"
tags: [know-decision, decision-layer, pre-implementation]
sources:
  - id: portfolio
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-24T00:00:00+00:00"
  - id: decision-readme
    resource: https://github.com/Know-Me-Tools/know-me-decision/blob/main/README.md
    title: "Know Decision repository README"
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Know Decision (KnowMe Decision Layer) status and what is stated

Know Decision, also called the KnowMe Decision Layer, is a planned set of local decision models with typed Act, Review and Escalate outcomes, a Rust API and MCP support. The portfolio lists it as pre-implementation: the bundled Julia candidate and native acceptance remain pending. It does not exist as working software yet.[^portfolio]

## Know Decision status and version

The portfolio status for Know Decision is "Pre-implementation; bundled Julia candidate and native acceptance remain pending."[^portfolio] The repository README says the repository currently holds the design, research and build playbook, and that code starts at milestone M0.[^decision-readme] Its repository is Know-Me-Tools/know-me-decision. Version line: {{v:decision}}.

## What Know Decision is stated to do

- Know Decision plans to answer typed questions about a piece of state: choose one of up to 255 options, give an ordinal score, or give an independent probability per statement.[^decision-readme]
- Each answer carries a separate outcome: Act, Review (a human confirms) or Escalate (a tripwire fired; always logged, and no model can override it).[^decision-readme]
- Julia 1 is the selected candidate for the bundled default model, and native platform acceptance is pending.[^decision-readme]
- The README says first launch must work fully offline, and that model availability does not imply calibration.[^decision-readme]
- The published model checkpoint is about 550.5 MiB before the runtime, which the README calls its uncomfortable deployment cost.[^decision-readme]

## How Know Decision relates to other products

The README describes Know Decision as the decision layer shared by KnowMe's products and names no integration that exists. The portfolio treats such relationships as architectural intent, not proof of completed integration.[^portfolio]
