# Desktop and self-hosted AI clients compared with The Boss (Landscape)

A desktop AI client is an application for talking to language models and agents from your own computer, usually with your own provider accounts or local models. This page compares five of them (Cherry Studio, LibreChat, Claude Desktop, the ChatGPT desktop app and Msty) with The Boss, KnowMe AI, LLC's desktop workspace. The Boss is built on Cherry Studio, so this page says plainly what is inherited and what is added. Facts about the other products are paraphrased from their own pages read on 2026-10-12; items that came from an automated page extraction rather than a direct reading are marked as such.

## Cherry Studio, according to its pages, and its relation to The Boss (Landscape)

According to its repository and site, Cherry Studio is a desktop client for many LLM providers by CherryHQ for Windows, macOS and Linux, with MCP support and more than 300 preset assistants; its community edition is under the AGPL-3.0 licence, and an enterprise edition with team knowledge bases exists. Its official site says chat history, settings and knowledge-base files are stored locally. From an automated extraction, not a direct reading: commercial use is allowed when AGPL terms are met, a commercial licence is offered, and the latest release shown was v2.1.6 (2026-10-11). Cherry Studio is the project The Boss is built on.

Source: Cherry Studio repository, retrieved 2026-10-12.
Source: Cherry Studio official site, retrieved 2026-10-12.

## The Boss is built on Cherry Studio (Landscape)

The Boss is an Electron desktop application with a React interface, built on the open-source Cherry Studio client and extended by KnowMe AI, LLC, and released under the GNU Affero General Public License v3.0, as its LICENSE file states. Because it is a derivative, upstream contributors, copyright notices and licence obligations remain applicable, and The Boss name and logo identify the fork. Much of what a person sees in The Boss, including multi-provider chat and MCP tool support, is Cherry Studio's work. This knowledge base says so rather than presenting those capabilities as original.

Source: The Boss README, retrieved 2026-10-12.
Source: The Boss LICENSE, retrieved 2026-10-12.

## What The Boss adds to Cherry Studio (Landscape)

According to The Boss's download page and README, The Boss adds artifact authoring, context management, skills selection, the agent protocols A2A, AG-UI and A2UI, and memory-aware agents to the Cherry Studio foundation, and describes itself as an agent studio for builders. Its installers include the Universal Agent Runtime and BossFang (with its dashboard) as bundled programs that run beside The Boss, and The Boss is the operator-facing administration surface for that runtime: agent sessions with workspace context, MCP tools, skills and approval boundaries, plus settings for packaged skills, workspace indexing, tools and optional services. The Surreal Memory Server is not inside the installer; The Boss works with it over MCP as a separate service.

Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss README, retrieved 2026-10-12.

## LibreChat, according to its pages (Landscape)

According to its site and repository, LibreChat is a self-hosted, open-source AI platform run as a web application with Docker or Node rather than as a desktop installer, with agents, a code interpreter, artifacts, MCP, memory, web search, multi-user login and single sign-on. Setup creates an account and needs a model API key. From an automated extraction, not a direct reading: the MIT licence. Its documentation banner says LibreChat is joining ClickHouse; that announcement was not read. Data location beyond "self-hosted" is not stated.

Source: LibreChat site, retrieved 2026-10-12.
Source: LibreChat repository, retrieved 2026-10-12.

## Claude Desktop, according to its pages (Landscape)

According to Anthropic's download page, Claude Desktop is Anthropic's app for macOS, Windows and Linux (Linux in beta), with iOS and Android apps; an account syncs conversations, projects and memory across devices, and it supports connectors and locally installed extensions. It works with Claude models; source code and licence are not stated (a proprietary product). Not stated on the page read: data retention and MCP details.

Source: Anthropic, Claude download page, retrieved 2026-10-12.

## The ChatGPT desktop app, according to its pages (Landscape)

According to OpenAI's download page, the ChatGPT desktop app brings ChatGPT Work and Codex to the desktop with context from files and screen content, and sign-in is implied. Not stated on the page read: MCP support, memory, local data handling and licence. It works with OpenAI's models. OpenAI dots, described on a separate page in this knowledge base, are created from the ChatGPT desktop app or desktop web.

Source: OpenAI, ChatGPT download page, retrieved 2026-10-12.

## Msty Studio, according to its pages (Landscape)

According to Msty's pages, Msty Studio is a desktop and web workspace that combines local and hosted models with an agent mode, a knowledge-stack feature, MCP tools and team controls; it is free to start, with limited desktop features on the free tier, and its home page claims zero product telemetry. Not stated on the pages read: whether an account is required and whether data stays local.

Source: Msty Studio product page, retrieved 2026-10-12.
Source: Msty pricing page, retrieved 2026-10-12.

## Platforms, accounts and licences across desktop AI clients (Landscape)

- Cherry Studio: Windows, macOS, Linux; AGPL-3.0 community edition; account requirement not stated.
- The Boss: macOS and Windows, no Linux; AGPL-3.0; no account required; free.
- LibreChat: self-hosted web app; MIT (from an automated extraction); creates an account on setup.
- Claude Desktop: macOS, Windows, Linux beta, iOS, Android; proprietary; Anthropic account.
- ChatGPT desktop: OpenAI account implied; licence not stated.
- Msty Studio: desktop and web; account requirement not stated; free tier with limited desktop features.

Source: Cherry Studio repository, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.
Source: The Boss LICENSE, retrieved 2026-10-12.
Source: LibreChat repository, retrieved 2026-10-12.
Source: Anthropic, Claude download page, retrieved 2026-10-12.
Source: OpenAI, ChatGPT download page, retrieved 2026-10-12.
Source: Msty pricing page, retrieved 2026-10-12.

## Where The Boss is weaker than other desktop AI clients (our minuses) (Landscape)

- No Linux build, where Cherry Studio, Claude Desktop (beta) and the self-hosted LibreChat all reach Linux.
- Large installers (several hundred megabytes) and unsigned Windows installers that Windows may warn about; checksums are published.
- Its telemetry behaviour has not yet been published; the repository carries Cherry Studio's privacy policy, which describes collecting basic operational data by default. Msty claims zero product telemetry.
- As a derivative, The Boss inherits Cherry Studio's pace and decisions, and its licence is AGPL-3.0 rather than the permissive MIT that LibreChat uses.
- Claude Desktop and the ChatGPT app come with their makers' models and account sync; The Boss needs the person's own provider credentials or local models.

Source: The Boss download page, retrieved 2026-10-12.
Source: Cherry Studio repository, retrieved 2026-10-12.
Source: Anthropic, Claude download page, retrieved 2026-10-12.
Source: LibreChat site, retrieved 2026-10-12.
Source: The Boss privacy policy file, retrieved 2026-10-12.
Source: Msty Studio product page, retrieved 2026-10-12.
Source: The Boss LICENSE, retrieved 2026-10-12.
Source: The Boss README, retrieved 2026-10-12.

## Where The Boss differs in its favour (their minuses, our pluses) (Landscape)

These are documented differences, not measured results. The Boss bundles a governed agent runtime and BossFang and acts as their administration surface, which none of the other pages read describes. It speaks the agent protocols A2A, AG-UI and A2UI, which are not stated for the others. It needs no account, where Claude Desktop and the ChatGPT app are built around one vendor's account and models, and LibreChat creates an account on setup. It is open source under AGPL-3.0, where Claude Desktop and the ChatGPT app are proprietary.

Source: The Boss README, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.
Source: Anthropic, Claude download page, retrieved 2026-10-12.
Source: OpenAI, ChatGPT download page, retrieved 2026-10-12.
Source: LibreChat repository, retrieved 2026-10-12.
Source: The Boss LICENSE, retrieved 2026-10-12.

## Is The Boss better than Cherry Studio (Landscape)

This knowledge base does not claim that. The Boss is Cherry Studio plus the additions listed above, minus Linux, and with KnowMe AI, LLC's release schedule rather than CherryHQ's. If you want a multi-provider desktop client on Linux, or the upstream project's own releases, Cherry Studio is the fit. If you want the same client with a bundled, governed agent runtime, BossFang and agent protocols, The Boss is the fit on macOS and Windows.

## Choosing a desktop or self-hosted AI client (Landscape)

If you want one vendor's assistant with account sync across devices, Claude Desktop or the ChatGPT app fit, within that vendor's models. If you want a self-hosted web platform for several people with login, LibreChat fits. If you want a multi-provider desktop client, including on Linux, Cherry Studio fits. If you want local and hosted models in one workspace with a stated no-telemetry policy, Msty fits. If you want a multi-provider desktop workspace that also runs and administers a governed agent runtime, The Boss fits, with the limits above.
