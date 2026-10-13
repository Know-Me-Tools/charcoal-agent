---
type: Concept
title: Desktop and self-hosted AI clients compared with The Boss
description: "Cherry Studio, LibreChat, Claude Desktop, the ChatGPT desktop app and Msty compared with The Boss, which is built on Cherry Studio under AGPL-3.0, with what The Boss adds and where it falls short."
status: draft
generated:
  by: km-cmo/fable
  at: "2026-10-12T22:00:00+00:00"
stale_after: "2027-01-12T00:00:00+00:00"
tags: [landscape, desktop-clients, cherry-studio, librechat, claude-desktop, chatgpt-desktop, msty, the-boss]
sources:
  - id: cherry-repo
    resource: https://github.com/CherryHQ/cherry-studio
    title: "Cherry Studio repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: cherry-site
    resource: https://www.cherry-ai.com/
    title: "Cherry Studio official site"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: librechat-site
    resource: https://www.librechat.ai/
    title: "LibreChat site"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: librechat-repo
    resource: https://github.com/LibreChat-AI/LibreChat
    title: "LibreChat repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: claude-download
    resource: https://claude.com/download
    title: "Anthropic, Claude download page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: chatgpt-download
    resource: https://openai.com/chatgpt/download/
    title: "OpenAI, ChatGPT download page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: msty-studio
    resource: https://msty.ai/products/studio/
    title: "Msty Studio product page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: msty-pricing
    resource: https://msty.ai/pricing/
    title: "Msty pricing page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-license
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/LICENSE
    title: "The Boss LICENSE"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-privacy
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/PRIVACY.md
    title: "The Boss privacy policy file"
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Desktop and self-hosted AI clients compared with The Boss

A desktop AI client is an application for talking to language models and agents from your own computer, usually with your own provider accounts or local models. This page compares five of them (Cherry Studio, LibreChat, Claude Desktop, the ChatGPT desktop app and Msty) with The Boss, KnowMe AI, LLC's desktop workspace. The Boss is built on Cherry Studio, so this page says plainly what is inherited and what is added. Facts about the other products are paraphrased from their own pages read on 2026-10-12; items that came from an automated page extraction rather than a direct reading are marked as such.

## Cherry Studio, according to its pages, and its relation to The Boss

According to its repository and site, Cherry Studio is a desktop client for many LLM providers by CherryHQ for Windows, macOS and Linux, with MCP support and more than 300 preset assistants; its community edition is under the AGPL-3.0 licence, and an enterprise edition with team knowledge bases exists. Its official site says chat history, settings and knowledge-base files are stored locally.[^cherry-repo][^cherry-site] From an automated extraction, not a direct reading: commercial use is allowed when AGPL terms are met, a commercial licence is offered, and the latest release shown was v2.1.6 (2026-10-11). Cherry Studio is the project The Boss is built on.[^cherry-repo]

## The Boss is built on Cherry Studio

The Boss is an Electron desktop application with a React interface, built on the open-source Cherry Studio client and extended by KnowMe AI, LLC, and released under the GNU Affero General Public License v3.0, as its LICENSE file states.[^boss-readme][^boss-license] Because it is a derivative, upstream contributors, copyright notices and licence obligations remain applicable, and The Boss name and logo identify the fork.[^boss-license] Much of what a person sees in The Boss, including multi-provider chat and MCP tool support, is Cherry Studio's work. This knowledge base says so rather than presenting those capabilities as original.

## What The Boss adds to Cherry Studio

According to The Boss's download page and README, The Boss adds artifact authoring, context management, skills selection, the agent protocols A2A, AG-UI and A2UI, and memory-aware agents to the Cherry Studio foundation, and describes itself as an agent studio for builders.[^boss-site][^boss-readme] Its installers include the Universal Agent Runtime and BossFang (with its dashboard) as bundled programs that run beside The Boss, and The Boss is the operator-facing administration surface for that runtime: agent sessions with workspace context, MCP tools, skills and approval boundaries, plus settings for packaged skills, workspace indexing, tools and optional services.[^boss-readme] The Surreal Memory Server is not inside the installer; The Boss works with it over MCP as a separate service.

## LibreChat, according to its pages

According to its site and repository, LibreChat is a self-hosted, open-source AI platform run as a web application with Docker or Node rather than as a desktop installer, with agents, a code interpreter, artifacts, MCP, memory, web search, multi-user login and single sign-on. Setup creates an account and needs a model API key.[^librechat-site][^librechat-repo] From an automated extraction, not a direct reading: the MIT licence. Its documentation banner says LibreChat is joining ClickHouse; that announcement was not read.[^librechat-site] Data location beyond "self-hosted" is not stated.

## Claude Desktop, according to its pages

According to Anthropic's download page, Claude Desktop is Anthropic's app for macOS, Windows and Linux (Linux in beta), with iOS and Android apps; an account syncs conversations, projects and memory across devices, and it supports connectors and locally installed extensions.[^claude-download] It works with Claude models; source code and licence are not stated (a proprietary product). Not stated on the page read: data retention and MCP details.

## The ChatGPT desktop app, according to its pages

According to OpenAI's download page, the ChatGPT desktop app brings ChatGPT Work and Codex to the desktop with context from files and screen content, and sign-in is implied.[^chatgpt-download] Not stated on the page read: MCP support, memory, local data handling and licence. It works with OpenAI's models. OpenAI dots, described on a separate page in this knowledge base, are created from the ChatGPT desktop app or desktop web.

## Msty Studio, according to its pages

According to Msty's pages, Msty Studio is a desktop and web workspace that combines local and hosted models with an agent mode, a knowledge-stack feature, MCP tools and team controls; it is free to start, with limited desktop features on the free tier, and its home page claims zero product telemetry.[^msty-studio][^msty-pricing] Not stated on the pages read: whether an account is required and whether data stays local.

## Platforms, accounts and licences across desktop AI clients

- Cherry Studio: Windows, macOS, Linux; AGPL-3.0 community edition; account requirement not stated.[^cherry-repo]
- The Boss: macOS and Windows, no Linux; AGPL-3.0; no account required; free.[^boss-site][^boss-license]
- LibreChat: self-hosted web app; MIT (from an automated extraction); creates an account on setup.[^librechat-repo]
- Claude Desktop: macOS, Windows, Linux beta, iOS, Android; proprietary; Anthropic account.[^claude-download]
- ChatGPT desktop: OpenAI account implied; licence not stated.[^chatgpt-download]
- Msty Studio: desktop and web; account requirement not stated; free tier with limited desktop features.[^msty-pricing]

## Where The Boss is weaker than other desktop AI clients (our minuses)

- No Linux build, where Cherry Studio, Claude Desktop (beta) and the self-hosted LibreChat all reach Linux.[^boss-site][^cherry-repo][^claude-download][^librechat-site]
- Large installers (several hundred megabytes) and unsigned Windows installers that Windows may warn about; checksums are published.[^boss-site]
- Its telemetry behaviour has not yet been published; the repository carries Cherry Studio's privacy policy, which describes collecting basic operational data by default. Msty claims zero product telemetry.[^boss-privacy][^msty-studio]
- As a derivative, The Boss inherits Cherry Studio's pace and decisions, and its licence is AGPL-3.0 rather than the permissive MIT that LibreChat uses.[^boss-license]
- Claude Desktop and the ChatGPT app come with their makers' models and account sync; The Boss needs the person's own provider credentials or local models.[^boss-readme]

## Where The Boss differs in its favour (their minuses, our pluses)

These are documented differences, not measured results. The Boss bundles a governed agent runtime and BossFang and acts as their administration surface, which none of the other pages read describes.[^boss-readme] It speaks the agent protocols A2A, AG-UI and A2UI, which are not stated for the others.[^boss-site] It needs no account, where Claude Desktop and the ChatGPT app are built around one vendor's account and models, and LibreChat creates an account on setup.[^boss-site][^claude-download][^chatgpt-download][^librechat-repo] It is open source under AGPL-3.0, where Claude Desktop and the ChatGPT app are proprietary.[^boss-license]

## Is The Boss better than Cherry Studio

This knowledge base does not claim that. The Boss is Cherry Studio plus the additions listed above, minus Linux, and with KnowMe AI, LLC's release schedule rather than CherryHQ's. If you want a multi-provider desktop client on Linux, or the upstream project's own releases, Cherry Studio is the fit. If you want the same client with a bundled, governed agent runtime, BossFang and agent protocols, The Boss is the fit on macOS and Windows.

## Choosing a desktop or self-hosted AI client

If you want one vendor's assistant with account sync across devices, Claude Desktop or the ChatGPT app fit, within that vendor's models. If you want a self-hosted web platform for several people with login, LibreChat fits. If you want a multi-provider desktop client, including on Linux, Cherry Studio fits. If you want local and hosted models in one workspace with a stated no-telemetry policy, Msty fits. If you want a multi-provider desktop workspace that also runs and administers a governed agent runtime, The Boss fits, with the limits above.
