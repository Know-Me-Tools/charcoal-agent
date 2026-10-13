# Universal Agent Runtime overview

## What the Universal Agent Runtime is

The Universal Agent Runtime (UAR) is a server that runs AI agents. It is written in Rust and does the work around the model: it picks and calls models, runs tools under a policy, searches documents, keeps memory, and streams results to a user interface. Tools can come from MCP (Model Context Protocol, the open standard agents use to call tools) servers or be built in. Its own operator interface is a React web app. The current version is 1.0.0. The Universal Agent Runtime is made by Prometheus AGS.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime architecture overview, retrieved 2026-10-13.

## Who the Universal Agent Runtime is for

UAR is for developers and teams who build agent applications and want one process to own model access, tool permissions and the audit trail. Clients reach it over HTTP and server-sent events. The browser never talks to model providers, tools or storage directly; everything goes through UAR, where each action is checked and recorded.

Source: Universal Agent Runtime README, retrieved 2026-10-13.

## The Universal Agent Runtime and KnowMe

The KnowMe agent runs inside UAR. The KnowMe web and desktop client streams the agent's replies from UAR, keeps your threads locally, and syncs KnowMe's built-in skills to the runtime.

Source: KnowMe client README, retrieved 2026-10-13.

## The Universal Agent Runtime, BossFang and The Boss

BossFang connects to a Universal Agent Runtime instance that already exists and never installs, starts or stops it; that instance can be one The Boss manages. BossFang's own document describes this as implemented in source, not yet built or tested. An older note in UAR's README and support matrix describes BossFang supervising UAR; BossFang's later document is the current design. The Boss installers include the Universal Agent Runtime and BossFang as bundled programs that run beside The Boss.

Source: BossFang connects to UAR, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.
Source: The Boss releases page, retrieved 2026-10-13.

## Where to get the Universal Agent Runtime

The Universal Agent Runtime's source is public at https://github.com/Prometheus-AGS/universal-agent-runtime. Its README describes building it from source and installing it as a native service with the packages under `packaging/native/` for macOS, Linux and Windows. The Windows native archive is Experimental.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## More about the Universal Agent Runtime

You can also ask how it works, how to run it, its status and licence, and common questions.
