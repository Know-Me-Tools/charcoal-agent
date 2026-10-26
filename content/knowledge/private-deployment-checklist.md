# Private deployment checklist for the Universal Agent Runtime (Solutions)

A visitor asks: "How do I run this on my own machine so that nothing leaves my network?" The Universal Agent Runtime (UAR) binds to 127.0.0.1 by default, and it has an opt-in mode, UAR_LOCAL_ONLY=1, that refuses any model provider that is not on the local machine and fails closed. That mode is off by default. This page reads UAR at its v1.3.0 tag, and the stable release is v1.2.3. The portfolio's status for UAR is "Work stopped; current runtime qualification not established." Nothing on this page is a promise that a given install keeps data on your machine. You still have to check what your own setup sends out.

Source: Universal Agent Runtime v1.3.0 source: server configuration, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: local-only inference mode, retrieved 2026-10-26.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-26.

## Private deployment checklist: the items (Solutions)

1. Bind address [shipped]. The server host defaults to 127.0.0.1, so a default install does not listen on the network. Check it after any change to the configuration.
2. Local-only inference [shipped]. Set UAR_LOCAL_ONLY=1 and UAR refuses to call a model provider that is not on the loopback interface. Leaving it unset keeps the default, which allows remote providers.
3. Local embeddings [shipped, build feature]. The source has the build features local-models (fastembed) and candle-embeddings, and the full server build includes local-models. Which embedder a given image selects at runtime was not checked.
4. The image [shipped]. The published Dockerfile builds the full server with Cedar governance included. The deployment guide says the image is intentionally about 3 GB with no slim variant yet. That size is the guide's statement, not a measurement made here. Whether a default image loads any Cedar policy files was not checked.
5. The Helm chart [starting point]. A chart exists, and its chart version and app version both say 1.0.0 at the v1.3.0 tag, so treat it as a starting point and read it against the release.
6. Identity. UAR is JWT based, and the configuration guide describes jwt_required false as an explicit anonymous mode. You supply the identity provider and own the user records and token lifetimes.
7. Storage. UAR has storage providers for memory, Postgres and SurrealDB. Which one a default install uses was not checked. Pick one deliberately and test that your data survives a restart.
8. The model. A model in a cloud service receives what you send it. A local model keeps the text on the machine that runs it, and its quality, speed and hardware needs are yours to measure.

Source: Universal Agent Runtime v1.3.0 source: server configuration, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: local-only inference mode, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 Cargo.toml: build features, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 Dockerfile, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 deployment guide, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 Helm chart, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 configuration guide, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: storage providers, retrieved 2026-10-26.

## Private deployment checklist: what is not stated (Solutions)

- No source says a default install makes no outbound connections.
- No source gives hardware requirements for running a local model with UAR.
- No source says whether tool arguments appear in any log.
- No source says the Helm chart works unchanged at the current release.

## Private deployment checklist: start here (Solutions)

Run UAR on a laptop with UAR_LOCAL_ONLY=1 and a local model, then watch its network connections while you run one task. Then see [Audit and provenance](/solutions/audit-and-provenance.md) for what it records, or ask the KnowMe Concierge for the next step.
