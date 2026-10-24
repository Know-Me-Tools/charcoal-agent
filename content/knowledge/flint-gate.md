# Flint Gate

Flint Gate is an authentication and authorization proxy for streaming AI workloads, with policy hooks and runtime routing. The portfolio's status is "Existing implementation; production qualification not independently audited."

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## Flint Gate status and version

Flint Gate has no tagged release (last commit 2026-10-23). The portfolio status stands: an existing implementation whose production qualification has not been independently audited.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## What Flint Gate does

* Its README describes it as a replacement for Ory Oathkeeper built for streaming language-model traffic. It authenticates, authorizes and enriches requests, then passes them to upstream services.
* It passes server-sent event streams through without buffering the response, and it can validate or filter AG-UI events and filter A2UI intents.
* It reloads configuration while running, and routes can be created and changed through an admin API, stored in Postgres.
* It counts tokens mid-stream from message-content deltas, and a session watchdog ends active streams when a session expires.
* Its authentication options include a Kratos session, JWT verification, a database-backed API key and anonymous access.

Source: Flint Gate README, retrieved 2026-10-24.

## How Flint Gate relates to other products

Flint Gate's README names no other portfolio product in what was read for this page. Flint Forge's README says Forge sits behind Flint Gate, which handles ingress and authentication. These are repository statements of design, not proof that the two run together in a given deployment.

Source: Flint Forge README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
