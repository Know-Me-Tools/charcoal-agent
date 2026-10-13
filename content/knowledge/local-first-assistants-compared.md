# Local-first AI assistants compared with The Boss and KnowMe (Landscape)

Local-first assistants run language models on the person's own computer or let the person connect their own servers, instead of sending every prompt to a vendor's cloud. This page describes five of them as their own pages did on 2026-10-12 (Ollama, LM Studio and Bionic, Jan, Open WebUI and GPT4All) and then says where The Boss, which you can download today, and KnowMe, which is not released, differ. Facts about other products are paraphrased from their pages and change; "not stated" means the pages read did not say.

## What local-first means in this comparison (Landscape)

In this comparison a tool is local-first when its maker states that models can run on the person's device and that local chats need not leave it. Several of these tools also offer cloud models or hosted versions as options. Running models locally needs capable hardware, model downloads and some setup; that is the trade-off every tool on this page shares, The Boss and KnowMe included.

## Ollama, according to its pages (Landscape)

According to its repository, Ollama runs open models with a command-line interface and a REST API on macOS, Windows, Linux and Docker, uses llama.cpp as its backend, shows an MIT licence, and has an `ollama launch` command that connects it to coding tools and a messaging assistant integration. Its pricing page says local use is free and unlimited, that its Free plan includes starter cloud credits, that paid plans add cloud-hosted model usage, which needs an account, and that cloud prompts and responses are not logged or trained on. Not stated: whether local use needs an account; memory features.

Source: Ollama repository README, retrieved 2026-10-12.
Source: Ollama pricing page, retrieved 2026-10-12.

## LM Studio and Bionic, according to their pages (Landscape)

LM Studio's home page now leads with Bionic, a separate agent app for open models that can use local models, a cloud service for open models with a zero-data-retention claim, or remote models on another device. Classic LM Studio runs llama.cpp and MLX models on macOS, Windows and Linux, acts as an MCP client, serves OpenAI-compatible endpoints and supports offline document chat. Not stated: whether the app is open source; whether the classic app requires an account; paid-plan prices.

Source: LM Studio home page, retrieved 2026-10-12.
Source: LM Studio app documentation, retrieved 2026-10-12.

## LM Studio's privacy statements (Landscape)

LM Studio's privacy policy says messages, chats and documents with local models never leave the device and states no telemetry. The same policy says update checks send the app and operating-system version and the IP address, and that model searches are logged anonymously.

Source: LM Studio app privacy policy, retrieved 2026-10-12.

## Jan, according to its pages (Landscape)

Jan presents itself as an open-source ChatGPT replacement for macOS, Windows and Linux with full offline support and no account needed; its documentation states the Apache 2.0 licence, llama.cpp inference, a local OpenAI-compatible server and MCP connectors, with a preview mode for autonomous file and web tasks. A separate agent product and a hosted web version also exist. Memory is marked "coming soon" on the home page while the agent documentation lists a Memory section, so its status is unclear, and the version banners on the two pages disagree.

Source: Jan home page, retrieved 2026-10-12.
Source: Jan desktop documentation, retrieved 2026-10-12.

## Open WebUI, according to its pages (Landscape)

Open WebUI is a self-hosted AI platform and front end, not a model runner: it works with Ollama and OpenAI-compatible APIs, is described as able to run fully offline, and installs through Docker, pip, Kubernetes or a desktop app. Its documentation lists agent-style tools (a terminal tool, a local agent runtime), retrieval over documents, web search and an MCP-to-OpenAPI bridge.

Source: Open WebUI documentation, retrieved 2026-10-12.

## Open WebUI's licence, according to its licence page (Landscape)

Open WebUI's licence page says releases up to v0.6.5 are BSD-3-Clause and that from v0.6.6 a branding-protection clause applies, which the page says is not OSI-approved open source. The page also says the branding clause applies only to deployments above 50 users in a 30-day period.

Source: Open WebUI licence page, retrieved 2026-10-12.

## GPT4All, according to its pages (Landscape)

GPT4All is a local chatbot from Nomic AI for Windows, macOS and Linux with local document chat, under the MIT licence. Its repository's visible activity (last commit May 2025; the app reached 3.10.x in early 2025, as seen on 2026-10-12) suggests maintenance mode; whether it is actively developed is unverified.

Source: Nomic AI, GPT4All product page, retrieved 2026-10-12.
Source: GPT4All repository, retrieved 2026-10-12.

## Licence and account facts: Ollama, LM Studio and GPT4All, as stated (Landscape)

- Ollama: MIT; local use free; the Free plan includes starter cloud credits; paid cloud plans need an account; local account requirement not stated.
- LM Studio: open-source status not stated; account requirement for the classic app not stated.
- GPT4All: MIT.

Source: Ollama repository README, retrieved 2026-10-12.
Source: Ollama pricing page, retrieved 2026-10-12.
Source: LM Studio app documentation, retrieved 2026-10-12.
Source: GPT4All repository, retrieved 2026-10-12.

## Licence and account facts: Jan and Open WebUI, as stated (Landscape)

- Jan: Apache 2.0; no account needed.
- Open WebUI: BSD-3-Clause through v0.6.5, then a licence with a branding clause (applying above 50 users in 30 days) that its page says is not OSI-approved.

Source: Jan desktop documentation, retrieved 2026-10-12.
Source: Jan home page, retrieved 2026-10-12.
Source: Open WebUI licence page, retrieved 2026-10-12.

## Licence and account facts: The Boss and KnowMe (Landscape)

- The Boss: GNU Affero General Public License v3.0, as a derivative of Cherry Studio; no account needed; free.
- KnowMe: not released; planned for release under the MIT licence; designed without a central account.

Source: The Boss LICENSE, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## How The Boss differs from local-first assistants (Landscape)

The Boss is KnowMe AI, LLC's free, open-source desktop workspace for macOS and Windows, built on Cherry Studio and downloadable today without an account. Like the tools above it is a client that works with cloud or local model providers and supports MCP tools; it differs in what it bundles: the Universal Agent Runtime and BossFang run beside it as bundled programs, and The Boss acts as the administration surface for that runtime, with agent sessions, skills and approval boundaries. Whether The Boss itself ships a local model runner is not stated in the pages this knowledge base relies on.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss README, retrieved 2026-10-12.
Source: The Boss integration artifacts manifest, retrieved 2026-10-12.

## Where The Boss is weaker than local-first assistants: platforms and installers (our minuses) (Landscape)

- No Linux build, where the five tools above each list Linux on the pages cited in their sections.
- Large installers (several hundred megabytes) and unsigned Windows installers, which Windows may warn about; checksums are published.
- AGPL-3.0 is a stronger copyleft licence than the MIT or Apache 2.0 licences most tools here use, which matters to people who build on it, and The Boss is a derivative of Cherry Studio, so much of its chat experience is upstream work.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss LICENSE, retrieved 2026-10-12.

## Telemetry statements: The Boss compared with Cherry Studio and LM Studio (Landscape)

The Boss's own telemetry behaviour has not yet been published. The Boss repository carries Cherry Studio's privacy policy as its PRIVACY.md; that policy describes collecting anonymised usage and crash data by default, excluding conversation content and API keys, which can be switched off in settings. LM Studio's policy states no telemetry for local use, while noting that update checks send app and OS version and IP and that model searches are logged anonymously.

Source: The Boss privacy policy file, retrieved 2026-10-12.
Source: LM Studio app privacy policy, retrieved 2026-10-12.

## How KnowMe differs from local-first assistants, by design intent (Landscape)

KnowMe is not released. By design, as stated in this knowledge base's KnowMe pages, KnowMe shares the local-first premise of running models on the person's own hardware and goes further in two ways: it is designed to store conversations, memory and settings in an encrypted local database and sync them between the person's own devices and servers the person runs, peer to peer, and its assistants and agents are designed to adapt to the person from a knowledge graph on those devices. It is designed to depend on no single LLM vendor, routing through the Universal Agent Runtime. The tools above are, in the main, single-device chat clients or model runners; sync and adaptive memory are not what their pages lead with.

## Where KnowMe is weaker than local-first assistants today (our minuses) (Landscape)

- Every tool above can be installed today; KnowMe cannot. Pricing has not been announced.
- Hands, multi-device sync and the plugin system are still being built; Ask Image, Audio Scribe, Prompt Lab and Skills are designed but not built.
- KnowMe has no community, model library or integration ecosystem to compare with the tools above.
- A person running KnowMe as designed takes on more: devices, models, storage and their own sync server.

## Choosing among local-first assistants, The Boss and KnowMe (Landscape)

If you want to run open models locally with the least setup, Ollama (as a runner) with a client such as Open WebUI or Jan is a sound starting point, and Jan is the one that states no account at all. If you want a polished desktop app with offline document chat and a stated no-telemetry policy for local use, LM Studio fits. If you want a desktop workspace that also administers a governed agent runtime, with agent sessions and skills, The Boss is built for that, on macOS and Windows. If what you want is an assistant that adapts to you across devices with your data staying under your control, that is what KnowMe is being designed for, and it is not yet available.
