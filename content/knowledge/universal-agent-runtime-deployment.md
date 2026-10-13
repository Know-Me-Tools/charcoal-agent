# Universal Agent Runtime deployment

## Ways to run the Universal Agent Runtime

UAR can run as a server, in a container, or as a supervised service on your own machine. By default it listens on `127.0.0.1:1906`, so only the local machine can reach it; the address and port are configurable. The packaged product is the `server-full` bundle, which includes the React interface.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## The Universal Agent Runtime as a native service

Native packages install UAR as a macOS user LaunchAgent, a Linux systemd service or a Windows service. They bind HTTP on port 1906 and A2A gRPC on port 50051 to the local machine by default. The Linux and macOS archives are required release gates; the Windows native archive is Experimental.

Source: Universal Agent Runtime production deployment guide, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## The Universal Agent Runtime in containers and Kubernetes

The repository has a multi-stage Dockerfile. Its runtime image carries several language toolchains so skills and plugins can be compiled inside it, which makes it large, about 3 GB, and there is no slim variant yet. A Helm chart is provided as a starting point for a new cluster; its storage class is specific to one cloud and must be adjusted for others.

Source: Universal Agent Runtime production deployment guide, retrieved 2026-10-13.

## The Universal Agent Runtime on desktop and mobile

A desktop bundle built with Tauri exists and is Preview. Mobile is Experimental.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## How Universal Agent Runtime releases are signed

Release archives and the container image are built locally from a clean source checkout, with SBOMs, Sigstore signatures, SLSA provenance and a signed checksum list. The README shows how to verify a download yourself with cosign. Building from source needs a Rust toolchain, Node.js and pnpm.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
