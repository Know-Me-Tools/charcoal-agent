# Human review workflow: who approves what before an agent acts (Solutions)

A visitor asks: "Who approves an agent's action before it happens, and how long does the approval last?" In the Universal Agent Runtime (UAR), only tools marked read-only skip approval by default, and a pending approval expires after 300 seconds. Every tool call in a run is decided before it runs: a Cedar policy can deny it, and a tool, the host or the run policy can require a person to approve it. This page reads UAR at its v1.3.0 tag; the stable release is v1.2.3.

Source: Universal Agent Runtime v1.3.0 source: tool registry and approval defaults, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: pending approvals, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: run manager tool decision, retrieved 2026-10-26.

## Human review workflow: the Universal Agent Runtime [shipped] (Solutions)

- Read-only tools: a tool declares its effect, and only a read-only effect defaults to no approval. Tools that change something outside, run code, or declare nothing need approval.
- Tools from an MCP server: the server's own read-only hint is not trusted. Approval is waived only for tools the administrator lists as pre-approved for that server.
- A denied call: a denial emits a tool-call-denied event, and the README says a Cedar denial cannot be overridden by a person's approval.
- The record: an approval record keeps who decided, the decision and when, and the states pending, approved, denied, cancelled, expired, interrupted and invalidated.
- The time limit: a pending approval that nobody answers within 300 seconds expires.

Source: Universal Agent Runtime v1.3.0 source: tool registry and approval defaults, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: run manager tool decision, retrieved 2026-10-26.
Source: Universal Agent Runtime README, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: approval records, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: pending approvals, retrieved 2026-10-26.

## Human review workflow: Flint Gate and The Boss (Solutions)

- Flint Gate [planned, source only], no tagged release (last commit 2026-10-23): a Cedar policy can mark a tool call for human approval. The call pauses, an operator approves or denies it, and an undecided request is denied when its limit passes (300 seconds by default). The README says pending approvals live in the memory of one replica, so a multi-replica setup is a stated limit. The portfolio status is "Existing implementation; production qualification not independently audited."
- The Boss [shipped], release v2.2.42: agent sessions use MCP tools and skills with approval boundaries, and you supply your own model provider credentials.

Source: Flint Gate README, retrieved 2026-10-26.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-26.
Source: The Boss README, retrieved 2026-10-26.

## Human review workflow: what a person still has to check (Solutions)

Approval covers an action, not the quality of an answer. An agent's draft, or a count it produced, still needs a person who knows the data to check it against a known figure. Plan reviewer time into the pilot. See [Scope a pilot](/solutions/scope-a-pilot.md).

## Human review workflow: what is not stated (Solutions)

- No source says an approval step was tested with a reviewer working on a real data set.
- No source gives how long reviewers take, or how often they reject a call.
- No source says Flint Gate is deployed in front of the UAR instance on this site.

## Human review workflow: start here (Solutions)

List the tools your agent would use, and mark each one read, write or code. Decide who approves each non-read tool and what happens when nobody answers in 300 seconds. Then ask the KnowMe Concierge how the pieces fit.
