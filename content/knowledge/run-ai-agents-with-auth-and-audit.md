# Run AI agents with authentication and an audit trail (Solutions)

A visitor asks: "I want agents that act for my team, but only with permission, and I need a record of what they did." Two products address this: the Universal Agent Runtime, which has a release, and Flint Gate, which is existing source without one. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Run agents with auth and audit: the Universal Agent Runtime [shipped] (Solutions)

The Universal Agent Runtime (UAR), release v1.2.3, runs every tool call through the same path. The README says tools found through MCP and built-in tools share schema validation, Cedar policy, approval, hard-deny and audit controls, and that a Cedar Deny cannot be overridden by user approval. By default every API request requires a JWT. The portfolio's status for UAR is "Work stopped; current runtime qualification not established." The repository is the newer record, and v1.3.0 is a pre-release with verification pending.

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Run agents with auth and audit: Flint Gate [planned, source only] (Solutions)

Flint Gate is an authentication and authorization proxy for streaming AI workloads, with no tagged release (last commit 2026-10-23). Its README lists session, JWT, API-key and anonymous authentication. It treats agent and service identities as separate kinds from human users, so a policy can allow an agent a tool that a person may not call. Token budgets can be set per agent, and an outage of the budget store denies agent requests rather than allowing them. The portfolio status is "Existing implementation; production qualification not independently audited."

Source: Flint Gate README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Run agents with auth and audit: human approval in Flint Gate (Solutions)

A Cedar policy in Flint Gate can mark a tool call for human approval. The gateway pauses the call, an operator approves or denies it in the admin API or the web interface, and an undecided request is denied when its time limit passes (300 seconds by default). The README says pending approvals live in the memory of one replica in this release, so a multi-replica deployment is a stated limit. Identity issue, rotation and revocation are written to an audit trail, and revocation takes effect on the next authorization.

Source: Flint Gate README, retrieved 2026-10-25.

## Run agents with auth and audit: how the products fit together (Solutions)

- UAR alone, with its token requirement, Cedar policy and audit controls: [shipped].
- Flint Gate in front of UAR for edge authentication: [planned]. The UAR README says Flint Gate owns edge auth enforcement, and the demo platform README assigns Gate identity and UAR agent execution. Those are design statements, and Gate has no release.
- The Boss: its agent sessions use MCP tools, skills and approval boundaries, and the v2.2.42 release notes say its installers include UAR sidecar payloads [shipped].

Source: Universal Agent Runtime README, retrieved 2026-10-25.
Source: demos README, retrieved 2026-10-25.
Source: The Boss README, retrieved 2026-10-25.
Source: The Boss v2.2.42 release notes, retrieved 2026-10-25.

## Run agents with auth and audit: what is not stated (Solutions)

- No source gives an independent audit of either product's production use.
- No source says Flint Gate is deployed in front of the UAR instance on this site.
- The Gate README names a single-replica limit for approvals.
- The sources for these products make no regulatory-compliance statement.

Source: Flint Gate README, retrieved 2026-10-25.

## Run agents with auth and audit: start here (Solutions)

Read the UAR README security section and run UAR locally, then read the Flint Gate README on non-human identities. Commands are in [code recipes from READMEs](/solutions/code-recipes-from-readmes.md).
