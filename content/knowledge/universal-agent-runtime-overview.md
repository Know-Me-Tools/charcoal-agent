# Universal Agent Runtime overview

## What the Universal Agent Runtime is

The Universal Agent Runtime (UAR) is a server that runs AI agents. It is written in Rust and does the work around the model: it picks and calls models, runs tools under a policy, searches documents, keeps memory, and streams results to a user interface. Its own operator interface is a React web app. The current version is 1.0.0.

Source: Universal Agent Runtime README, retrieved 2026-10-12.

## Who the Universal Agent Runtime is for

UAR is for developers and teams who build agent applications and want one process to own model access, tool permissions and the audit trail. Clients reach it over HTTP and server-sent events. The browser never talks to model providers, tools or storage directly; everything goes through UAR's one governed boundary.

Source: Universal Agent Runtime README, retrieved 2026-10-12.

## The Universal Agent Runtime and KnowMe

The KnowMe agent runs inside UAR. The KnowMe web and desktop client streams the agent's replies from UAR, keeps your threads locally, and syncs KnowMe's built-in skills to the runtime.

Source: KnowMe client README, retrieved 2026-10-12.

## The Universal Agent Runtime, BossFang and The Boss

UAR's support matrix says BossFang should reach UAR as a separate local service, starting with UAR's OpenAI-compatible API and adding A2A or AG-UI where it needs richer task and event detail. BossFang's own documentation says BossFang connects to a UAR instance and does not install or run it, and that the instance can be one The Boss manages. Both keep UAR in its own process.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-12.
Source: BossFang connects to UAR, retrieved 2026-10-12.

## More about the Universal Agent Runtime

* [How it works](/universal-agent-runtime/universal-agent-runtime-how-it-works.md)
* [Protocols](/universal-agent-runtime/universal-agent-runtime-protocols.md)
* [Deployment](/universal-agent-runtime/universal-agent-runtime-deployment.md)
* [Status and licence](/universal-agent-runtime/universal-agent-runtime-status-and-licence.md)
* [Use cases](/universal-agent-runtime/universal-agent-runtime-use-cases-and-who-it-is-for.md)
* [Questions](/universal-agent-runtime/universal-agent-runtime-faq.md)
