---
type: Concept
title: Landscape and comparison questions
description: "Visitor questions about how KnowMe AI, LLC and Prometheus AGS products compare with other tools, answered from the sourced landscape pages in this knowledge base."
status: draft
generated:
  by: km-cmo/fable
  at: "2026-10-12T22:00:00+00:00"
stale_after: "2027-01-12T00:00:00+00:00"
tags: [landscape, faq, comparison, openai-dots, chatgpt, cherry-studio, the-boss, knowme]
sources:
  - id: dots-announce
    resource: https://openai.com/index/introducing-dots/
    title: "OpenAI, Introducing dots (announcement dated 2026-09-29)"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: dots-help
    resource: https://help.openai.com/en/articles/20001530-getting-started-with-your-dot
    title: "OpenAI Help Center, Getting started with your dot"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: chatgpt-download
    resource: https://openai.com/chatgpt/download/
    title: "OpenAI, ChatGPT download page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: cherry-repo
    resource: https://github.com/CherryHQ/cherry-studio
    title: "Cherry Studio repository"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: jan-home
    resource: https://www.jan.ai/
    title: "Jan home page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-license
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/LICENSE
    title: "The Boss LICENSE"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-12T00:00:00+00:00"
---

# Landscape and comparison questions

Short answers to the comparison questions visitors ask. Each answer rests on the sourced landscape pages in this knowledge base, which paraphrase other makers' own pages as of 2026-10-12. KnowMe is not released, so answers about KnowMe describe KnowMe AI, LLC's design intent.

## How is KnowMe different from OpenAI dots?

OpenAI dots are shipped always-on agents that run on OpenAI's cloud computers with OpenAI's model, reach the person through ChatGPT, Slack, Teams and voice, and keep their memories in OpenAI's systems, according to OpenAI's pages.[^dots-announce][^dots-help] KnowMe is not released; by design it runs on the person's own devices, keeps conversations and memory in an encrypted local database there, syncs only between the person's own devices and servers, and can use local models or several providers rather than one vendor's. Dots do more today; KnowMe asks the person to run more themselves. The page OpenAI dots and KnowMe gives the full comparison, with the minuses on both sides.

## Why not just use ChatGPT?

For many people ChatGPT is the right choice: it is available now, comes with OpenAI's models and account sync, and its desktop app brings ChatGPT and Codex to the desktop with context from files and screen content, according to OpenAI's download page.[^chatgpt-download] The trade-off is that conversations and memory live in OpenAI's systems under OpenAI's plan terms, and the person is tied to OpenAI's models. KnowMe is being designed for people who want the opposite trade: data and memory on their own hardware and a free choice of models, at the cost of running more themselves and of waiting, because KnowMe is not released. The Boss, available today, is a multi-provider desktop client rather than a hosted assistant.[^boss-site]

## Is The Boss better than Cherry Studio?

This knowledge base does not say so. The Boss is built on Cherry Studio and released under the same AGPL-3.0 licence; much of its chat experience is Cherry Studio's work.[^boss-license] The Boss adds artifact authoring, context management, skills selection, the agent protocols A2A, AG-UI and A2UI, memory-aware agents, and a bundled Universal Agent Runtime and BossFang that it administers.[^boss-site] It lacks Cherry Studio's Linux build and follows KnowMe AI, LLC's release schedule rather than CherryHQ's.[^cherry-repo] Choose Cherry Studio for Linux or upstream releases; choose The Boss for the bundled, governed agent runtime on macOS or Windows.

## Do I need a cloud account to use these products?

For The Boss, no: it is free, open source and downloadable without an account, though using a cloud model provider inside it needs that provider's credentials.[^boss-site] KnowMe is designed without a central account, but it is not released. The Universal Agent Runtime and the Surreal Memory Server are self-hosted software you run yourself.[^uar-readme] Among other tools, Jan states that no account is needed, while OpenAI dots, Gemini Spark, Claude Cowork, Claude Desktop and the ChatGPT app each require their vendor's account and plan.[^jan-home][^dots-help]

## Is KnowMe an always-on agent like dots or Gemini Spark?

No. Always-on agents run on their maker's servers while the person's device is off. KnowMe is designed to run on the person's own devices, with scheduled agents (Hands) that are designed but not yet built; anything that ran while the person's hardware was off would have to run on a server the person operates. If always-on behaviour is your first need, see Always-on personal agents compared with KnowMe for the vendors that offer it today.

## Which of these tools can I use today?

From KnowMe AI, LLC, The Boss for macOS and Windows.[^boss-site] From Prometheus AGS, the Universal Agent Runtime at version 1.0.0 with public source and an MIT licence, BossFang as public source without an established end-user release, and the Surreal Memory Server as source published for review rather than a tested release.[^uar-readme] KnowMe has no public release and no announced date. Every other product named in the landscape pages is available from its own maker under that maker's terms.

## Does this knowledge base pick a winner?

No. Each landscape page lists pluses and minuses for both sides, states facts about other products only as their makers' pages state them, writes "not stated" where a page did not say, and repeats no benchmark figures or prices. The page How to choose between these tools names, for each need, when another vendor's tool is the better fit.
