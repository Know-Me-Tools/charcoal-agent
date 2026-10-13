---
type: Concept
title: Universal Agent Runtime overview
description: What the Universal Agent Runtime (UAR) is, who it is for, where to get it, and how it relates to KnowMe, BossFang and The Boss.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-13T00:25:33+00:00"
tags:
  - universal-agent-runtime
  - overview
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: uar-arch
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/ARCHITECTURE.md
    title: Universal Agent Runtime architecture overview
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: knowme-readme
    resource: https://github.com/Know-Me-Tools/charcoal-agent/blob/main/README.md
    title: KnowMe client README
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: bossfang-uar
    resource: https://github.com/GQAdonis/librefang/blob/main/docs/bossfang-uar-connections.md
    title: BossFang connects to UAR
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: boss-fabric
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/docs/agent-fabric-convergence.md
    title: The Boss agent fabric convergence notes
    last_modified: "2026-10-13T00:25:33+00:00"
  - id: boss-profiles
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/docs/agent-fabric/supported-profiles.md
    title: The Boss supported execution profiles
    last_modified: "2026-10-13T00:25:33+00:00"
---

# Universal Agent Runtime overview

## What the Universal Agent Runtime is

The Universal Agent Runtime (UAR) is a server that runs AI agents. It is written in Rust and does the work around the model: it picks and calls models, runs tools under a policy, searches documents, keeps memory, and streams results to a user interface.[^uar-readme] Tools can come from MCP (Model Context Protocol, the open standard agents use to call tools) servers or be built in.[^uar-arch] Its own operator interface is a React web app. The current version is 1.0.0.[^uar-readme]

## Who the Universal Agent Runtime is for

UAR is for developers and teams who build agent applications and want one process to own model access, tool permissions and the audit trail. Clients reach it over HTTP and server-sent events. The browser never talks to model providers, tools or storage directly; everything goes through UAR, where each action is checked and recorded.[^uar-readme]

## The Universal Agent Runtime and KnowMe

The KnowMe agent runs inside UAR. The KnowMe web and desktop client streams the agent's replies from UAR, keeps your threads locally, and syncs KnowMe's built-in skills to the runtime.[^knowme-readme]

## The Universal Agent Runtime, BossFang and The Boss

BossFang connects to a Universal Agent Runtime instance that already exists and never installs, starts or stops it; that instance can be one The Boss manages. BossFang's own document describes this as implemented in source, not yet built or tested.[^bossfang-uar] An older note in UAR's README and support matrix describes BossFang supervising UAR; BossFang's later document is the current design.[^uar-matrix] The Boss desktop app can run a managed UAR instance as a sidecar program.[^boss-fabric][^boss-profiles]

## Where to get the Universal Agent Runtime

The Universal Agent Runtime's source is public at https://github.com/Prometheus-AGS/universal-agent-runtime. Its README describes building it from source and installing it as a native service with the packages under `packaging/native/` for macOS, Linux and Windows.[^uar-readme] The Windows native archive is Experimental.[^uar-matrix]

## More about the Universal Agent Runtime

You can also ask how it works, how to run it, its status and licence, and common questions.
