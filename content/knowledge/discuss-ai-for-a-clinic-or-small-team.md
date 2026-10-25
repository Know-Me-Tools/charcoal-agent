# Discuss AI for a clinic or small team (Solutions)

A visitor asks: "I run a small office or clinic. Can we talk about using AI safely, and what would we need to decide?" This page names no client, describes no healthcare product and gives no legal advice. The sources make no regulatory-compliance statement about any product here. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Discuss AI for a small team: five decisions to settle first (Solutions)

1. What data goes to a model, and where does that model run? Models in a cloud service receive what you send them.
2. Who approves an action before an agent takes it?
3. What record exists of what an agent did, and who can read it?
4. Where does stored conversation and memory live?
5. Which rules from your regulator or insurer apply? That question is for you and your advisers. These pages do not answer it.

## Discuss AI for a small team: products that address control (Solutions)

- The Universal Agent Runtime [shipped], release v1.2.3: tool calls share schema validation, Cedar policy, approval, hard-deny and audit controls, and a Cedar Deny cannot be overridden by user approval. SurrealDB is the authoritative store in its default server bundle.
- The Boss [shipped], release v2.2.41: conversations with cloud or local model providers and agent sessions with approval boundaries. You supply your own provider credentials.
- Flint Gate [planned, source only]: a proxy with human approval for tool calls, per-agent token budgets and an audit trail of identity changes.

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: The Boss README, retrieved 2026-10-25.
Source: Flint Gate README, retrieved 2026-10-25.

## Discuss AI for a small team: what KnowMe is designed to do (Solutions)

KnowMe is designed to run models on the person's own hardware and keep data in an encrypted local database. KnowMe has no release, so treat that as design intent, not a promise about software you can run. See [KnowMe privacy and data model](/knowme/knowme-privacy.md). The portfolio lists KnowMe as "Implementation and specifications; full cross-platform qualification not established." A message typed into this site's agent leaves your device and reaches a cloud model, as the same page describes.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Discuss AI for a small team: how the products fit together (Solutions)

- The Boss with the Universal Agent Runtime sidecar in its installers: [shipped], per the release notes.
- Flint Gate in front of the Universal Agent Runtime: [planned], because Gate has no release. The UAR README says Gate owns edge auth enforcement, and the demo platform README assigns roles; both are design statements.

Source: The Boss v2.2.41 release notes, retrieved 2026-10-25.
Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: demos README, retrieved 2026-10-25.

## Discuss AI for a small team: what is not stated (Solutions)

- No source says any product here is suitable for patient or client records.
- No source gives a data-retention period for this site's server-side conversation state. The KnowMe privacy page says it has not been published.
- No source states a price for KnowMe. Pricing has not been announced.

## Discuss AI for a small team: start here (Solutions)

Write the five answers above for one task, such as drafting a letter. Then ask the KnowMe agent which product addresses each unanswered question, or contact the team through the site.
