# Always-on personal agents compared with KnowMe (Landscape)

This page compares one category of products, always-on cloud agents, with KnowMe, as of 2026-10-12. Everything said about other products comes from their makers' own pages, retrieved on that date; these facts change often. KnowMe is not publicly released, so everything said about KnowMe is KnowMe AI, LLC's design intent, not a description of shipped software. The page lists pluses and minuses for both sides.

## What an always-on cloud agent is (Landscape)

An always-on cloud agent keeps working on its maker's servers while the person is away and while the person's own device is off. According to OpenAI's announcement, each dot has its own cloud computer and browser and works toward goals around the clock. Google describes Gemini Spark as a 24/7 personal agent that runs in the cloud, so it keeps working when the device is off. Microsoft describes Autopilot agents as always-on, each with its own governed identity, memory, computer and workspace inside the customer's tenant. Anthropic's Claude Cowork is a neighbouring shape: an agent that takes handed-off tasks in the folders and tools the person chooses, with scheduling, rather than a standing cloud presence.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: Google, The next evolution of the Gemini app (announcement dated 2026-05-19), retrieved 2026-10-12.
Source: Microsoft Official Blog, Introducing the new Copilot with Home, Code and Autopilot (dated 2026-09-25), retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.

## How OpenAI dots work, according to OpenAI (Landscape)

According to OpenAI's announcement, a dot is powered by GPT-6 Astra, learns from feedback and connects through plugins to more than 4,000 apps. A person reaches a dot in ChatGPT on desktop, web and mobile, in Slack and Teams, and by voice; texting is described as coming. When idle, a dot does proactive research using read-only access to connected apps. OpenAI's help page adds that a dot is created in the ChatGPT desktop app or desktop web; mobile can talk to an existing dot but cannot create one. A dedicated page, OpenAI dots and KnowMe, goes deeper.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## How Gemini Spark works, according to Google (Landscape)

According to Google's announcement, Gemini Spark runs on Gemini 3.5 in the cloud, integrates with Workspace apps, and supports recurring or event-triggered tasks, reusable skills and multi-step workflows; MCP connections to some third-party services were announced. Google's help page says Spark runs in a remote browser and computer or in the person's local Chrome, handles up to 15 tasks at once, requires age 18 or over, a personal Google account, a Google AI Pro or Ultra subscription and Keep Activity on, and is available in the Gemini mobile app, Mac app and web. Google's announcement names a US Ultra beta while the help page names Pro or Ultra; this page does not resolve that difference.

Source: Google, The next evolution of the Gemini app (announcement dated 2026-05-19), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## How Claude Cowork works, according to Anthropic (Landscape)

According to Anthropic's product page, Claude Cowork takes knowledge-work tasks the person hands off and works in folders and tools the person selects. The desktop app is the full version; web and mobile are labelled beta. Tasks can be scheduled, a built-in browser exists, and computer use is a research preview. It runs through a Claude account or through the customer's own cloud (Bedrock, Google Cloud or Microsoft Foundry), on Pro, Max, Team and Enterprise plans with usage limits. Anthropic's engineering post describes the containment design: the agent loop runs on the host, code runs in a local virtual machine, only the selected workspace is mounted, and credentials stay in the host keychain.

Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Anthropic engineering blog, How we contain Claude (dated 2026-05-25), retrieved 2026-10-12.

## How Microsoft Autopilot (formerly Scout) works, according to Microsoft (Landscape)

Microsoft's June 2026 post introduced Scout as an always-on personal agent and says it was built on OpenClaw open-source technology. Microsoft's September 2026 post says Autopilot was previously called Scout, is cloud-hosted, lives in the customer's tenant with scoped credentials, approved resources, sensitivity labels and human sign-off for sensitive actions, is reached in Teams and Outlook, is in private preview, and is billed by usage separately from per-user licences. The two posts describe the product differently (an experimental desktop release versus a tenant-hosted cloud agent) and do not say whether it was re-architected. Autopilot is an enterprise, tenant-bound offering rather than a consumer assistant.

Source: Microsoft Copilot blog, Introducing Microsoft Scout (dated 2026-06-02), retrieved 2026-10-12.
Source: Microsoft Official Blog, Introducing the new Copilot with Home, Code and Autopilot (dated 2026-09-25), retrieved 2026-10-12.

## What always-on agents offer, according to their makers (their pluses) (Landscape)

- Work continues while the person's own device is off, because the agent runs on the maker's servers.
- Broad integration: OpenAI cites plugins to more than 4,000 apps; Google cites Workspace integration and MCP connections; Microsoft cites Teams and Outlook.
- Reach across channels: ChatGPT apps, Slack, Teams and voice for dots; mobile, Mac and web for Spark.
- Availability today for eligible plans and regions: dots were rolling out at announcement; Spark is available to Pro or Ultra subscribers; Cowork is on Anthropic's paid plans.
- Enterprise variants: OpenAI previews specialist dots with their own identity and credentials; Microsoft's Autopilot is tenant-governed.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: Google, The next evolution of the Gemini app (announcement dated 2026-05-19), retrieved 2026-10-12.
Source: Microsoft Official Blog, Introducing the new Copilot with Home, Code and Autopilot (dated 2026-09-25), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.

## Stated limits of always-on agents: vendor, plan and region (their minuses) (Landscape)

- Tied to one vendor's plan, model and cloud: dots to OpenAI, Spark to Google, Cowork to Anthropic, Autopilot to Microsoft 365, as each maker's pages describe.
- Regional and plan gating: OpenAI's help page says Pro availability for dots excludes the European Economic Area, Switzerland and the UK; Google's help page says Spark is not available in the EEA, Nigeria, Switzerland or the UK.
- Early-stage status: Autopilot is in private preview; Cowork's web and mobile versions are beta.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft Official Blog, Introducing the new Copilot with Home, Code and Autopilot (dated 2026-09-25), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## Stated limits of always-on agents: data and the makers' own warnings (their minuses) (Landscape)

- Data in the vendor's systems: a dot's memories, conversations and scheduled tasks are deleted by resetting the dot, and disconnecting an app does not delete information already obtained from it; Spark's remote browser data persists until the person deletes it.
- The makers' own warnings: OpenAI says a dot can make mistakes, including when following rules; Google calls Spark experimental, says safeguards do not guarantee protection, warns about prompt injection and says scheduled tasks running offline may not be stoppable.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## Controls and permissions in always-on agents (Landscape)

According to OpenAI, the person chooses which apps a dot may access; Custom Rules let the person allow an action, require pre-approval, ask before acting or hand off to the person; some sensitive actions always stay with the person; an Activity View shows progress, and a monitoring system can pause or stop a dot. Google says Spark asks for confirmation before sending communications, modifying data, purchases, form submissions and Google sign-in, and pauses for the person on passwords and payments. Anthropic says Cowork requires approval for deletions, offers an optional plan-approval setting, and gives administrators toggles, spend limits and role-based permissions. Microsoft says Autopilot uses scoped credentials and human sign-off for sensitive actions.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft Official Blog, Introducing the new Copilot with Home, Code and Autopilot (dated 2026-09-25), retrieved 2026-10-12.

## Where the data lives for always-on agents (Landscape)

According to OpenAI, content from ChatGPT Business, Enterprise and Edu workspaces is not used to improve models by default, and on personal plans the person controls this; a dot receives memories from ChatGPT and creates its own, including from connected apps. Google's pages read for this knowledge base do not state Spark's data-use or training terms. Anthropic's product page does not state Cowork's memory behaviour or data-use terms; its engineering post describes a past exfiltration route through an allowed API domain that was fixed, and lists persistent-memory poisoning as a future risk. Microsoft's posts say Autopilot lives in the customer's tenant and do not state training or memory-deletion terms.

Source: OpenAI, Introducing dots (announcement dated 2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Anthropic engineering blog, How we contain Claude (dated 2026-05-25), retrieved 2026-10-12.
Source: Microsoft Official Blog, Introducing the new Copilot with Home, Code and Autopilot (dated 2026-09-25), retrieved 2026-10-12.

## How KnowMe differs from always-on agents, by design intent (Landscape)

KnowMe is not released, so these are KnowMe AI, LLC's design commitments as stated in this knowledge base's KnowMe pages, not shipped behaviour. KnowMe is designed to keep a person's conversations, memory and settings in an encrypted local database on their own device, to sync only between the person's own devices and servers the person runs, and to work without a central account. It is designed to run models on the person's own hardware and to route work through the Universal Agent Runtime so that local models or any of several providers can serve the same tasks. Its assistants and agents are meant to adapt to the person from a knowledge graph on the person's devices. KnowMe is not designed as a cloud service run by KnowMe AI, LLC.

## Where KnowMe is weaker than always-on agents today: status (our minuses) (Landscape)

- KnowMe is not publicly released; there is no download and no announced date. Pricing has not been announced.
- Hands, KnowMe's scheduled autonomous agents, are designed but not built, and multi-device sync and the plugin system are still being built. Nothing in KnowMe runs around the clock today.
- What is available today from KnowMe AI, LLC is The Boss, a desktop workspace for macOS and Windows, not an always-on agent.

Source: The Boss download page, retrieved 2026-10-12.

## Where KnowMe is weaker than always-on agents by design: operation and ecosystem (our minuses) (Landscape)

- By design, nothing runs while the person's own hardware is off unless the person operates a server of their own; always-on agents remove that burden by running on the maker's cloud.
- KnowMe has no app ecosystem comparable to the integrations OpenAI, Google and Microsoft describe, and no voice, Slack, Teams or messaging reach has been announced.
- The person takes on more: choosing and running models, hardware, storage and sync. KnowMe AI, LLC is a small company with a far smaller ecosystem than the vendors named here.

## Where always-on agents are weaker than KnowMe's design (their minuses, our pluses) (Landscape)

These are differences in design, not verified superiority. An always-on agent holds the person's data and memories in the vendor's systems under the vendor's controls, as the makers' pages describe; KnowMe is designed to hold them on the person's device. An always-on agent is tied to its maker's model; KnowMe is designed to let the person switch between local models and several providers. Access to dots and Spark is limited by plan and region on the makers' pages; KnowMe is planned to be released under the MIT licence with no central account. Whether KnowMe delivers on this design can only be judged when it ships.

## A note on Perplexity Comet (Landscape)

Perplexity describes Comet as a browser that acts as a personal assistant on Mac, Windows, iOS and Android and asks before interacting with the browser; its page does not describe always-on behaviour, so Comet is a weak match for this category and this knowledge base does not rely on it.

Source: Perplexity, Comet product page, retrieved 2026-10-12.

## Choosing between an always-on agent and KnowMe (Landscape)

If you need an agent that works for you today while your laptop is closed, with wide app integration and reach into Slack, Teams or Workspace, an always-on agent from OpenAI, Google, Anthropic or Microsoft is the fit, within its plan and regional limits. If your priority is that your data and memory stay on hardware you control, that you are not tied to one model vendor, and you are willing to wait for KnowMe and to run more yourself, KnowMe is being designed for you; follow its status and try The Boss in the meantime. See How to choose between these tools for guidance by need.
