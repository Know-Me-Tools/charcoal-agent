---
type: Concept
title: OpenAI dots and KnowMe
description: "What OpenAI dots are, who they are for, how they use memory and permissions, their stated limits, and an even-handed comparison with KnowMe, which is not yet released."
status: draft
generated:
  by: km-cmo/fable
  at: "2026-10-12T22:00:00+00:00"
stale_after: "2027-01-12T00:00:00+00:00"
tags: [landscape, openai-dots, always-on-agents, knowme, comparison]
sources:
  - id: dots-announce
    resource: https://openai.com/index/introducing-dots/
    title: "OpenAI, Introducing dots (announcement dated 2026-09-29)"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: dots-help
    resource: https://help.openai.com/en/articles/20001530-getting-started-with-your-dot
    title: "OpenAI Help Center, Getting started with your dot"
    last_modified: "2026-10-12T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-12T00:00:00+00:00"
---

# OpenAI dots and KnowMe

Visitors ask how KnowMe relates to OpenAI dots, so this page describes dots as OpenAI's own pages did on 2026-10-12 and then compares them with KnowMe. Dots are a shipped product from OpenAI; KnowMe is not publicly released, so every statement about KnowMe here is KnowMe AI, LLC's design intent. OpenAI's facts change often; check OpenAI's pages for the current state.

## What OpenAI dots are

According to OpenAI's announcement, dots are always-on agents. Each dot has its own cloud computer and browser, is powered by GPT-6 Astra, works toward goals around the clock, learns from feedback, and connects through plugins to more than 4,000 apps. A dot can message the person with progress and questions, and when idle it does proactive research using read-only access to connected apps.[^dots-announce] A person reaches a dot through ChatGPT on desktop, web and mobile, in Slack and Teams, and by voice call; texting is described as coming.[^dots-announce]

## Who OpenAI dots are for

According to OpenAI's announcement, dots were rolling out in ChatGPT to Pro and Business Premium plans in eligible markets, with an Enterprise beta (including Edu and Healthcare) that an administrator enables. OpenAI also previews specialist dots with their own identity and credentials for organisations, and describes a Microsoft Agent 365 integration as in progress.[^dots-announce] OpenAI's help page says a dot is set up in the ChatGPT desktop app or desktop web; mobile apps can talk to an existing dot but cannot create one, and dots are not supported on mobile web. Pro availability excludes the European Economic Area, Switzerland and the UK; Business Premium is available across supported regions; Enterprise is off until an admin enables it.[^dots-help]

## What OpenAI dots cost

Pricing for OpenAI dots is by OpenAI plan and is out of scope for this knowledge base, which states no amounts for any product. OpenAI's announcement says the first dot is included in an eligible plan and describes paid add-on dots as a future option.[^dots-announce] For current prices and plan terms, see OpenAI's own pages. Pricing has not been announced for KnowMe.

## How OpenAI dots use memory

According to OpenAI's help page, a dot receives memories from ChatGPT and creates its own, including from connected apps, and carries context across the channels it is reached on.[^dots-help] Disconnecting an app does not delete information the dot already obtained from it. Deleting a dot's saved data requires deleting (resetting) the dot, which removes its conversations, memories and scheduled tasks.[^dots-help] On data use for training, OpenAI's announcement says content from ChatGPT Business, Enterprise and Edu workspaces is not used to improve models by default, and that on personal plans the person controls this.[^dots-announce]

## How OpenAI dots handle permissions and control

According to OpenAI, the person chooses which apps a dot may access. Custom Rules give four behaviours for a kind of action: act without asking, act if pre-approved, ask before acting, or hand off to the person. Certain sensitive actions, for example changing a password, always stay with the person. An Activity View shows what the dot is doing, a monitoring system can pause or stop a dot, and the person can pause and resume it or take over its cloud browser.[^dots-announce][^dots-help] The dot's cloud computer is separate from the person's own computer; access to the local computer is optional and off by default.[^dots-help]

## Stated limits of OpenAI dots at launch

OpenAI's help page lists limits at launch: a dot cannot place calls to the person, has no standalone email address, and texting is a limited US-only Pro beta through a third-party provider. The same page states that a dot can make mistakes, including when following rules.[^dots-help] Regional and plan restrictions are described above. Beyond these pages, this knowledge base makes no claims about dots' reliability, security or performance.

## How KnowMe differs from OpenAI dots, by design intent

KnowMe is designed from the other end of the architecture. Where a dot runs on OpenAI's cloud computer with OpenAI's model and keeps its memories in OpenAI's systems, KnowMe is designed to run on the person's own devices, to keep conversations, memory and settings in an encrypted local database there, to sync only between the person's own devices and servers, and to work without a central account. Where a dot is tied to one vendor's model, KnowMe is designed to route work through the Universal Agent Runtime so that local models or several providers can serve the same tasks. Its assistants and agents are meant to adapt to the person from a knowledge graph on the person's devices. These are design statements from this knowledge base's KnowMe pages; KnowMe has not shipped.

## What OpenAI dots offer that KnowMe does not today

- Dots exist and can be used now on eligible plans; KnowMe has no public release and no announced date.
- Dots work around the clock on OpenAI's servers while the person's devices are off; KnowMe is designed to run on the person's own hardware, so nothing runs when that hardware is off unless the person operates a server of their own.
- OpenAI cites plugins to more than 4,000 apps and reach into Slack, Teams and voice; KnowMe has announced no comparable integrations or channels.[^dots-announce]
- KnowMe's scheduled agents (Hands), multi-device sync and plugin system are designed but not built.
- A dot comes with OpenAI's infrastructure; KnowMe asks the person to provide and manage models, hardware, storage and sync.

## What KnowMe is designed to offer that OpenAI's pages do not describe for dots

These are design differences, not claims that KnowMe performs better. OpenAI's pages describe data and memories held in OpenAI's systems, deleted by resetting the dot, with training controls that depend on the plan; KnowMe is designed to keep data on the person's device, where deletion is the person's own act and no training on the person's data is designed in.[^dots-help] OpenAI's pages tie dots to GPT-6 Astra and to OpenAI plans with regional limits; KnowMe is designed for model choice across local and several hosted providers and is planned for release under the MIT licence with no central account.[^dots-announce][^dots-help] Until KnowMe ships, these remain intentions.

## Which fits whom, OpenAI dots or KnowMe

Choose OpenAI dots if you want an always-on agent today, you are on an eligible OpenAI plan in a supported region, and you are comfortable with your agent's memory living in OpenAI's systems under OpenAI's controls. KnowMe is being designed for people who want an assistant that adapts to them while their data stays on hardware they control and who do not want to depend on one model vendor; it asks for patience, because it is not released, and for more hands-on operation. In the meantime, KnowMe AI, LLC's downloadable product is The Boss, a free, open-source desktop workspace for macOS and Windows, which is a client for models and agents rather than an always-on agent.[^boss-site]
