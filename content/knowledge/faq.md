# Frequently asked questions about KnowMe AI, LLC and its products

Answers to common questions about KnowMe AI, LLC and its products: KnowMe, The Boss and IPFS Sync for Obsidian, and about the chat on this site.

## What is KnowMe?

KnowMe is KnowMe AI, LLC's personal AI platform. It is designed so that the person helps build their own product by using it: its assistants and agents adapt to the person, and the person's data stays under their own control. KnowMe is still in development and has not been publicly released. See the KnowMe overview for what it is designed to do.

## Can I download KnowMe today?

No. KnowMe has not been publicly released, and KnowMe AI, LLC has not announced a download or a release date. The app from KnowMe AI, LLC that you can download today is The Boss, a free, open-source desktop workspace for macOS and Windows.

## When will KnowMe be released, and how do I follow it?

KnowMe AI, LLC has not announced a release date for KnowMe. KnowMe AI, LLC plans to publish updates through a Bluesky-compatible server using the AT Protocol. That server has not been deployed yet, so there is no update channel to follow today. The KnowMe agent here is the way to check; this answer will change when there is news.

## Is KnowMe available on my phone?

Not yet. KnowMe's phone app is being built with Flutter for iOS and Android, and KnowMe AI, LLC has run an Android development build on a phone, but there is no public release for either platform and no published date.

## Is KnowMe open source?

KnowMe is planned to be released under the MIT licence. KnowMe has not been publicly released yet, so nothing is available under that licence today. The Boss is open source now, under the GNU Affero General Public License v3.0, derived from Cherry Studio.

Source: The Boss LICENSE, retrieved 2026-10-12.

## Does KnowMe send my data to the cloud?

KnowMe is designed to run models on your own device and to require your explicit approval before anything is sent to a cloud model provider. KnowMe has not shipped, and some of the systems that would enforce that everywhere are still being built, so treat this as KnowMe AI, LLC's design intent rather than a guarantee. See KnowMe privacy for more. The chat on this site works differently; see the next question.

## Does the KnowMe agent on this site send my messages to a model provider?

Yes. Your message leaves your device: the site's Universal Agent Runtime stores the conversation's session state in its database (SurrealDB) on KnowMe AI, LLC's server, a cloud language model (Qwen, qwen3.8-max, through Alibaba Cloud's model service) composes the reply, and Alibaba Cloud's embedding service is used to search the knowledge base. A copy of the thread is also kept in your browser. The conversations stored in your browser are yours: you decide how long they are kept, because they live on your own device. How long the site's server keeps the runtime's conversation state has not been published. This website agent is not the KnowMe app, which is designed to run models on the person's own device.

## How much does KnowMe cost?

Pricing has not been announced for KnowMe. Nothing is sold on know-me.tools, and The Boss is free. Any paid offering from KnowMe AI, LLC will have its own site.

## What is The Boss from KnowMe AI, LLC?

The Boss is a free, open-source AI desktop workspace from KnowMe AI, LLC for conversations, agents, tools and project work. It is built on Cherry Studio and extended with artifact authoring, context management, skills selection and agent protocols. See The Boss page for more.

Source: The Boss download page, retrieved 2026-10-12.

## Is The Boss an early version of KnowMe?

No. The Boss is not a KnowMe edition or tier, and it is not built on KnowMe. The two share the Universal Agent Runtime: The Boss bundles it as a program that runs beside The Boss, and KnowMe is built on it. The Boss is a desktop workspace for developers and technical operators that you can download today; KnowMe is a personal AI platform still in development.

## What platforms does The Boss from KnowMe AI, LLC run on?

The Boss runs on macOS and Windows. The latest release is v2.2.41, with installers for macOS on Apple Silicon, macOS on Intel and Windows x64; no Windows ARM64 installer is published in it. The macOS builds are notarized; the Windows installers are unsigned, so Windows may show a warning. Linux is not offered.

Source: The Boss release records, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## What does The Boss from KnowMe AI, LLC need to run?

A Mac with macOS 12 or later or a PC with Windows 10 or later, room for an installer of roughly 470 to 690 MB depending on platform, and a model to talk to: either a cloud model provider you configure with your own credentials, or a local model. No account is needed.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss release records, retrieved 2026-10-12.

## Does The Boss from KnowMe AI, LLC need an account or API key?

No account. The Boss is free and needs no sign-up. To use a cloud model provider you supply that provider's own credentials in The Boss's settings; a local model needs none. Provider access and optional integrations each need their own configuration.

Source: The Boss download page, retrieved 2026-10-12.

## Where do I download The Boss from KnowMe AI, LLC?

From The Boss download page at https://the-boss.know-me.tools, which links to the installers on GitHub releases. It is free and needs no account.

Source: The Boss download page, retrieved 2026-10-12.

## Is The Boss from KnowMe AI, LLC free and open source?

Yes. The Boss is free to download, and its source is published under the GNU Affero General Public License v3.0 (AGPL-3.0). The LICENSE file in The Boss repository is the authoritative statement of its licence; the public download page uses different words. The Boss is derived from Cherry Studio, whose licence obligations continue to apply.

Source: The Boss LICENSE, retrieved 2026-10-12.

## Does The Boss from KnowMe AI, LLC include the Universal Agent Runtime, BossFang and the Surreal Memory Server?

All current The Boss installers include the Universal Agent Runtime and BossFang as bundled programs that run beside The Boss. The Surreal Memory Server is not inside the installer: The Boss works with it over MCP as a separate service that The Boss can manage or connect to, and running the Surreal Memory Server as a service managed by The Boss needs a container runtime, because The Boss pins it as a container image.

Source: The Boss integration artifacts manifest, retrieved 2026-10-12.
Source: The Boss managed services manifest, retrieved 2026-10-12.

## What are the Universal Agent Runtime, BossFang and the Surreal Memory Server that KnowMe and The Boss are built on?

The Universal Agent Runtime is a governed agent runtime, written in Rust, that routes models and runs agents and tools under policy. BossFang is an agent operating system forked from the open-source LibreFang project, with SurrealDB storage, for agents that run on schedules; its source code is at https://github.com/GQAdonis/librefang. The Surreal Memory Server is a memory service with a knowledge graph and search. All three are made by Prometheus (Prometheus AGS); KnowMe and The Boss, from KnowMe AI, LLC, are built on them.

## Who makes the Universal Agent Runtime, BossFang and the Surreal Memory Server that KnowMe uses?

Prometheus (Prometheus AGS) makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. KnowMe AI, LLC makes KnowMe, The Boss and IPFS Sync for Obsidian, and KnowMe and The Boss are built on those Prometheus parts: the KnowMe agent on this site runs on the Universal Agent Runtime, and The Boss bundles the Universal Agent Runtime and BossFang. BossFang's source code is at https://github.com/GQAdonis/librefang.

## What is Prometheus, and how does it relate to KnowMe?

Prometheus is the name of Prometheus AGS's server-side AI platform work. It makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. KnowMe and The Boss, from KnowMe AI, LLC, are built on those parts; the KnowMe agent on this site runs on the Universal Agent Runtime.

## What is IPFS Sync for Obsidian from KnowMe AI, LLC?

IPFS Sync for Obsidian is an early-preview Obsidian plugin and command-line tool from KnowMe AI, LLC that syncs a vault over IPFS through your own kubo node. It is a pre-release, tested on fixture vaults only.

## Can I use KnowMe AI, LLC's IPFS Sync for Obsidian on my real notes?

Not yet. IPFS Sync for Obsidian's own documentation says not to use it on real notes: it has not shipped encryption, so data on your IPFS node is readable by anyone with the file's address. Wait for an encrypted release.

## Who is KnowMe AI, LLC?

KnowMe AI, LLC is the company behind this site and its products: KnowMe, The Boss and IPFS Sync for Obsidian. KnowMe and The Boss are built on the Universal Agent Runtime, BossFang and the Surreal Memory Server, which are made by Prometheus (Prometheus AGS).

## How do I contact KnowMe AI, LLC?

KnowMe AI, LLC has not published a contact address on this site yet. The KnowMe agent can answer questions here, but it cannot pass a message to a person.

## Is the KnowMe agent on this site a person or an AI?

The KnowMe agent is an AI. It runs on the Universal Agent Runtime, answers from KnowMe AI, LLC's curated knowledge base and cites its sources. It cannot act on your behalf. It is not the KnowMe app; your messages go to a cloud language model to be answered, as described under KnowMe privacy.
