# Demo hosting platform

The demo hosting platform is proposed hosting for packaged single-page and HTMX demos, with agent, data and runtime bindings. The portfolio's status is "Scaffold and server/API design; inspected historical server implemented only health route." It is a proposal at scaffold stage. Nothing here says it can host a demo today.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## Demo hosting platform status and version

The demo hosting platform has no tagged release (last commit 2026-10-21). The portfolio inspected a historical server that implemented only a health route. Its README labels the project a P0 workspace. The portfolio adds that synthetic hosted demos do not prove the planned hosting fabric is complete.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: demos README, retrieved 2026-10-24.

## What the demo hosting platform design states

* A demo package is a web front end (HTMX with Alpine.js, or a static React build), an agent definition, a data model and a design system.
* The design mounts each demo at its own path and adds or removes demos at runtime through an admin interface.
* The service routes requests and keeps the demo registry and bundle store. It does not execute agents.

Source: demos README, retrieved 2026-10-24.

## How the demo hosting platform relates to other products

The README assigns the roles in its design. The Universal Agent Runtime runs agents. Flint Gate owns identity. Flint Forge supplies data. Flint Realtime Fabric supplies live updates. These are design statements. The portfolio treats relationships as architectural intent, not proof of completed integration.

Source: demos README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
