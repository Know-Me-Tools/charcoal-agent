---
type: Concept
title: Universal Agent Runtime deployment
description: The documented ways to run UAR, native service, container, Kubernetes chart, desktop, and how releases are signed.
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-12T00:00:00+00:00"
tags:
  - universal-agent-runtime
  - deployment
sources:
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: Universal Agent Runtime README
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-deploy
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/DEPLOYMENT.md
    title: Universal Agent Runtime production deployment guide
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-matrix
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md
    title: Universal Agent Runtime product support matrix
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Universal Agent Runtime deployment

## Ways to run the Universal Agent Runtime

UAR can run as a server, in a container, or as a supervised service on your own machine.[^uar-readme] By default it listens on `127.0.0.1:1906`, so only the local machine can reach it; the address and port are configurable.[^uar-readme] The packaged product is the `server-full` bundle, which includes the React interface.[^uar-matrix]

## The Universal Agent Runtime as a native service

Native packages install UAR as a macOS user LaunchAgent, a Linux systemd service or a Windows service. They bind HTTP on port 1906 and A2A gRPC on port 50051 to the local machine by default.[^uar-deploy] The Linux and macOS archives are required release gates; the Windows native archive is Experimental.[^uar-matrix]

## The Universal Agent Runtime in containers and Kubernetes

The repository has a multi-stage Dockerfile. Its runtime image carries several language toolchains so skills and plugins can be compiled inside it, which makes it large, about 3 GB, and there is no slim variant yet.[^uar-deploy] A Helm chart is provided as a starting point for a new cluster; its storage class is specific to one cloud and must be adjusted for others.[^uar-deploy]

## The Universal Agent Runtime on desktop and mobile

A desktop bundle built with Tauri exists and is Preview. Mobile is Experimental.[^uar-matrix]

## How Universal Agent Runtime releases are signed

Release archives and the container image are built locally from a clean source checkout, with SBOMs, Sigstore signatures, SLSA provenance and a signed checksum list. The README shows how to verify a download yourself with cosign.[^uar-readme] Building from source needs a Rust toolchain, Node.js and pnpm.[^uar-readme]
