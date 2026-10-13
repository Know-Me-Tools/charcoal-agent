# Universal Agent Runtime use cases and who it is for

## Who the Universal Agent Runtime is for

UAR suits developers and teams who want model access, tool permissions, retrieval and auditing in one server they run themselves, with clients that only render what the server sends. It is infrastructure, not an app for end users: a person meets it through a client such as KnowMe.

Source: Universal Agent Runtime README, retrieved 2026-10-13.
Source: KnowMe client README, retrieved 2026-10-13.

## Documented uses of the Universal Agent Runtime

The KnowMe client uses UAR as the runtime for the KnowMe agent. BossFang is documented as a client of UAR's OpenAI-compatible API. UAR's memory documentation gives a personal assistant that remembers people and their relationships across sessions as an example. Any OpenAI-compatible client can use UAR's `/v1` API.

Source: KnowMe client README, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.
Source: Universal Agent Runtime memory system, retrieved 2026-10-13.
Source: Universal Agent Runtime README, retrieved 2026-10-13.

## Universal Agent Runtime design intent: many small nodes

Design intent, not a shipped capability: UAR's licensing note says it is designed to run decentralized, on phones, laptops and small always-on machines that find and serve each other peer to peer, and that this is why it moved to MIT. Today mobile is Experimental and web is the Stable platform.

Source: Universal Agent Runtime licensing model, retrieved 2026-10-13.
Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.

## When the Universal Agent Runtime may not fit yet

Arbitrary WASM cannot run in the browser. The Windows native archive and mobile support are Experimental. The container image is about 3 GB. A production setup needs its own authentication, secrets, trusted origins and tool policy before it is exposed. If you need a hosted service with nothing to operate, UAR does not describe one.

Source: Universal Agent Runtime product support matrix, retrieved 2026-10-13.
Source: Universal Agent Runtime production deployment guide, retrieved 2026-10-13.
Source: Universal Agent Runtime README, retrieved 2026-10-13.
