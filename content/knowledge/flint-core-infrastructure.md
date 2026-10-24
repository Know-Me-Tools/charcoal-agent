# Flint core infrastructure

Flint core infrastructure is the shared identity, authorization, data and realtime infrastructure configuration for the platform. It is configuration code kept in a repository, with the automation that checks and deploys it. It is not itself a running service. The portfolio's status is "Existing infrastructure source; current deployment not audited."

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
Source: Flint core infrastructure README, retrieved 2026-10-24.

## Flint core infrastructure status and version

Flint core infrastructure has no tagged release (last commit 2026-10-23). The portfolio did not audit the current deployment, and the portfolio withholds operational details. This page does not describe hosting, addresses or deployment.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## What Flint core infrastructure covers

* The repository holds infrastructure-as-code for the platform's core stack, with automation that builds, validates and deploys it, and the source of one small supporting service.
* The README groups the stack by capability: identity, an authorization edge, a data plane, and realtime.
* The README names Flint Gate as the authorization edge, Flint Forge's Quarry as the data plane and Flint Realtime Fabric as the realtime component.
* The portfolio notes that architecture Markdown exists but no verified public standalone publication of it.

Source: Flint core infrastructure README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.

## How Flint core infrastructure relates to other products

The repository's README places Flint Gate, Flint Forge's Quarry and Flint Realtime Fabric in the stack it configures. The portfolio treats relationships as architectural intent, not proof of completed integration or of a running deployment.

Source: Flint core infrastructure README, retrieved 2026-10-24.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-24.
