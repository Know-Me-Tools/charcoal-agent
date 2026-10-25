---
type: Concept
title: "Discuss AI for a clinic or small team"
description: "How a visitor from a small office or clinic can frame a conversation about AI: the decisions to settle, which products address control and approval, and what no source states."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - small-team
  - governance
  - privacy
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: gate-readme
    resource: https://github.com/Know-Me-Tools/flint-gate/blob/main/README.md
    title: "Flint Gate README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-release
    resource: https://github.com/Prometheus-AGS/the-boss/releases/tag/v2.2.41
    title: "The Boss v2.2.41 release notes"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: demos-readme
    resource: https://github.com/Know-Me-Tools/demos/blob/main/README.md
    title: "demos README"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Discuss AI for a clinic or small team

A visitor asks: "I run a small office or clinic. Can we talk about using AI safely, and what would we need to decide?" This page names no client, describes no healthcare product and gives no legal advice. The sources make no regulatory-compliance statement about any product here.[^pf] Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

## Discuss AI for a small team: five decisions to settle first

1. What data goes to a model, and where does that model run? Models in a cloud service receive what you send them.
2. Who approves an action before an agent takes it?
3. What record exists of what an agent did, and who can read it?
4. Where does stored conversation and memory live?
5. Which rules from your regulator or insurer apply? That question is for you and your advisers. These pages do not answer it.

## Discuss AI for a small team: products that address control

- The Universal Agent Runtime [shipped], release {{v:uar}}: tool calls share schema validation, Cedar policy, approval, hard-deny and audit controls, and a Cedar Deny cannot be overridden by user approval.[^uar-readme] SurrealDB is the authoritative store in its default server bundle.[^uar-readme]
- The Boss [shipped], release {{v:boss}}: conversations with cloud or local model providers and agent sessions with approval boundaries. You supply your own provider credentials.[^boss-readme]
- Flint Gate [planned, source only]: a proxy with human approval for tool calls, per-agent token budgets and an audit trail of identity changes.[^gate-readme]

## Discuss AI for a small team: what KnowMe is designed to do

KnowMe is designed to run models on the person's own hardware and keep data in an encrypted local database. KnowMe has no release, so treat that as design intent, not a promise about software you can run. See [KnowMe privacy and data model](/knowme/knowme-privacy.md). The portfolio lists KnowMe as "Implementation and specifications; full cross-platform qualification not established."[^pf] A message typed into this site's agent leaves your device and reaches a cloud model, as the same page describes.

## Discuss AI for a small team: how the products fit together

- The Boss with the Universal Agent Runtime sidecar in its installers: [shipped], per the release notes.[^boss-release]
- Flint Gate in front of the Universal Agent Runtime: [planned], because Gate has no release. The UAR README says Gate owns edge auth enforcement, and the demo platform README assigns roles; both are design statements.[^uar-readme][^demos-readme]

## Discuss AI for a small team: what is not stated

- No source says any product here is suitable for patient or client records.
- No source gives a data-retention period for this site's server-side conversation state. The KnowMe privacy page says it has not been published.
- No source states a price for KnowMe. Pricing has not been announced.

## Discuss AI for a small team: start here

Write the five answers above for one task, such as drafting a letter. Then ask the KnowMe agent which product addresses each unanswered question, or contact the team through the site.
