# Universal Agent Runtime overview

## What the Universal Agent Runtime is

The Universal Agent Runtime (UAR) is a server that runs AI agents. It is written in Rust and does the work around the model: it picks and calls models, runs tools under a policy, searches documents, keeps memory, and streams results to a user interface. Its own operator interface is a React web app. The current version is 1.0.0.

Source: Universal Agent Runtime README, retrieved 2026-10-13.

## Who the Universal Agent Runtime is for

UAR is for developers and teams who build agent applications and want one process to own model access, tool permissions and the audit trail. Clients reach it over HTTP and server-sent events. The browser never talks to model providers, tools or storage directly; everything goes through UAR's one governed boundary.

Source: Universal Agent Runtime README, retrieved 2026-10-13.

## The Universal Agent Runtime and KnowMe

The KnowMe agent runs inside UAR. The KnowMe web and desktop client streams the agent's replies from UAR, keeps your threads locally, and syncs KnowMe's built-in skills to the runtime.

Source: KnowMe client README, retrieved 2026-10-13.

## The Universal Agent Runtime, BossFang and The Boss

The documents disagree on who runs UAR. UAR's README and support matrix say BossFang should supervise UAR out of process, using UAR's OpenAI-compatible API first and adding A2A or AG-UI where needed. BossFang's own documents say it never bundles, installs, spawns, restarts or terminates UAR, and connects to an existing instance, which can be one The Boss manages. BossFang's document is the later one and describes its current design.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.
Source: BossFang connects to UAR, retrieved 2026-10-13.

## Where to get the Universal Agent Runtime

The Universal Agent Runtime's source is public at https://github.com/Prometheus-AGS/universal-agent-runtime. Its README describes building it from source and installing it as a native service with the packages under `packaging/native/` for macOS, Linux and Windows. The Windows native archive is Experimental.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## More about the Universal Agent Runtime

* [How it works](/universal-agent-runtime/universal-agent-runtime-how-it-works.md)
* [Protocols](/universal-agent-runtime/universal-agent-runtime-protocols.md)
* [Deployment](/universal-agent-runtime/universal-agent-runtime-deployment.md)
* [Status and licence](/universal-agent-runtime/universal-agent-runtime-status-and-licence.md)
* [Use cases](/universal-agent-runtime/universal-agent-runtime-use-cases-and-who-it-is-for.md)
* [Questions](/universal-agent-runtime/universal-agent-runtime-faq.md)
