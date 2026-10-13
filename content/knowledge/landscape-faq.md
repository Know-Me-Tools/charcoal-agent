# Landscape and comparison questions

Short answers to the comparison questions visitors ask. Each answer rests on the sourced landscape pages in this knowledge base, which paraphrase other makers' own pages as of 2026-10-12. KnowMe is not released, so answers about KnowMe describe KnowMe AI, LLC's design intent.

## How is KnowMe different from OpenAI dots? (Landscape)

OpenAI dots are shipped always-on agents that run on OpenAI's cloud computers with OpenAI's model, reach the person through ChatGPT, Slack, Teams and voice, and keep their memories in OpenAI's systems, according to OpenAI's pages. KnowMe is not released; by design it runs on the person's own devices, keeps conversations and memory in an encrypted local database there, syncs only between the person's own devices and servers, and can use local models or several providers rather than one vendor's. Dots do more today; KnowMe asks the person to run more themselves. The page OpenAI dots and KnowMe gives the full comparison, with the minuses on both sides.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## Why not just use ChatGPT? (Landscape)

For many people ChatGPT is the right choice: it is available now, comes with OpenAI's models and account sync, and its desktop app brings ChatGPT and Codex to the desktop with context from files and screen content, according to OpenAI's download page. The trade-off is that conversations and memory live in OpenAI's systems under OpenAI's plan terms, and the person is tied to OpenAI's models. KnowMe is being designed for people who want the opposite trade: data and memory on their own hardware and a free choice of models, at the cost of running more themselves and of waiting, because KnowMe is not released. The Boss, available today, is a multi-provider desktop client rather than a hosted assistant.

Source: OpenAI, ChatGPT download page, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.

## Is The Boss better than Cherry Studio? (Landscape)

This knowledge base does not say so. The Boss is built on Cherry Studio and released under the same AGPL-3.0 licence; much of its chat experience is Cherry Studio's work. The Boss adds artifact authoring, context management, skills selection, the agent protocols A2A, AG-UI and A2UI, memory-aware agents, and a bundled Universal Agent Runtime and BossFang that it administers. It lacks Cherry Studio's Linux build and follows KnowMe AI, LLC's release schedule rather than CherryHQ's. Choose Cherry Studio for Linux or upstream releases; choose The Boss for the bundled, governed agent runtime on macOS or Windows.

Source: The Boss LICENSE, retrieved 2026-10-12.
Source: The Boss download page, retrieved 2026-10-12.
Source: Cherry Studio repository, retrieved 2026-10-12.

## Do I need a cloud account to use these products? (Landscape)

For The Boss, no: it is free, open source and downloadable without an account, though using a cloud model provider inside it needs that provider's credentials. KnowMe is designed without a central account, but it is not released. The Universal Agent Runtime and the Surreal Memory Server are self-hosted software you run yourself. Among other tools, Jan states that no account is needed, while OpenAI dots, Gemini Spark, Claude Cowork, Claude Desktop and the ChatGPT app each require their vendor's account and plan.

Source: The Boss download page, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.
Source: Jan home page, retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## Is KnowMe an always-on agent like dots or Gemini Spark? (Landscape)

No. Always-on agents run on their maker's servers while the person's device is off. KnowMe is designed to run on the person's own devices, with scheduled agents (Hands) that are designed but not yet built; anything that ran while the person's hardware was off would have to run on a server the person operates. If always-on behaviour is your first need, see Always-on personal agents compared with KnowMe for the vendors that offer it today.

## Which of these tools can I use today? (Landscape)

From KnowMe AI, LLC, The Boss for macOS and Windows. From Prometheus AGS, the Universal Agent Runtime at version 1.0.0 with public source and an MIT licence, BossFang as public source without an established end-user release, and the Surreal Memory Server as source published for review rather than a tested release. KnowMe has no public release and no announced date. Every other product named in the landscape pages is available from its own maker under that maker's terms.

Source: The Boss download page, retrieved 2026-10-12.
Source: Universal Agent Runtime README, retrieved 2026-10-12.

## Does this knowledge base pick a winner? (Landscape)

No. Each landscape page lists pluses and minuses for both sides, states facts about other products only as their makers' pages state them, writes "not stated" where a page did not say, and repeats no benchmark figures or prices. The page How to choose between these tools names, for each need, when another vendor's tool is the better fit.
