---
type: Concept
title: Universal Agent Runtime overview
description: What the Universal Agent Runtime (UAR) is, who it is for, and how it relates to KnowMe, BossFang and The Boss.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-12T00:00:00+00:00"
tags:
  - universal-agent-runtime
  - overview
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: knowme-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: KnowMe client README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: bossfang-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Universal Agent Runtime overview

## What the Universal Agent Runtime is

The Universal Agent Runtime (UAR) is a server that runs AI agents. It is written in Rust and does the work around the model: it picks and calls models, runs tools under a policy, searches documents, keeps memory, and streams results to a user interface.[^uar-readme] Its own operator interface is a React web app. The current version is 1.0.0.[^uar-readme]

## Who the Universal Agent Runtime is for

UAR is for developers and teams who build agent applications and want one process to own model access, tool permissions and the audit trail. Clients reach it over HTTP and server-sent events. The browser never talks to model providers, tools or storage directly; everything goes through UAR's one governed boundary.[^uar-readme]

## The Universal Agent Runtime and KnowMe

The KnowMe agent runs inside UAR. The KnowMe web and desktop client streams the agent's replies from UAR, keeps your threads locally, and syncs KnowMe's built-in skills to the runtime.[^knowme-readme]

## The Universal Agent Runtime, BossFang and The Boss

UAR's support matrix says BossFang should reach UAR as a separate local service, starting with UAR's OpenAI-compatible API and adding A2A or AG-UI where it needs richer task and event detail.[^uar-matrix] BossFang's own documentation says BossFang connects to a UAR instance and does not install or run it, and that the instance can be one The Boss manages.[^bossfang-uar] Both keep UAR in its own process.

## More about the Universal Agent Runtime

* [How it works](/universal-agent-runtime/universal-agent-runtime-how-it-works.md)
* [Protocols](/universal-agent-runtime/universal-agent-runtime-protocols.md)
* [Deployment](/universal-agent-runtime/universal-agent-runtime-deployment.md)
* [Status and licence](/universal-agent-runtime/universal-agent-runtime-status-and-licence.md)
* [Use cases](/universal-agent-runtime/universal-agent-runtime-use-cases-and-who-it-is-for.md)
* [Questions](/universal-agent-runtime/universal-agent-runtime-faq.md)
