# Always-on personal agents compared with KnowMe (Landscape)

This page compares one category of products, always-on cloud agents, with KnowMe, as of 2026-10-12. Everything said about other products comes from their makers' own pages, retrieved on that date; these facts change often. KnowMe is not publicly released, so everything said about KnowMe is KnowMe AI, LLC's design intent, not a description of shipped software. The page lists pluses and minuses for both sides.

## What an always-on cloud agent is (Landscape)

An always-on cloud agent keeps working on its maker's servers while the person is away and while the person's own device is off. According to OpenAI's announcement, each dot has its own cloud computer and browser and works toward goals around the clock. Google's blog says Gemini Spark runs in the cloud on Gemini 3.5 and keeps working when you close your laptop or lock your phone.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: Google blog, The next evolution of the Gemini app (2026-05-19), retrieved 2026-10-12.

## Claude Cowork and Microsoft Autopilot as always-on agents (Landscape)

Anthropic's Claude Cowork takes handed-off tasks, runs scheduled tasks unattended, and, per Anthropic, keeps working in the cloud when the laptop is closed. Microsoft describes Autopilot agents as always-on, each with its own governed identity, memory, computer and workspace inside the customer's tenant.

Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

## How OpenAI dots work, according to OpenAI (Landscape)

According to OpenAI's announcement, a dot is powered by GPT-6 Astra, learns from feedback and connects through plugins to more than 4,000 apps. A person reaches a dot in ChatGPT on desktop, web and mobile, in Slack and Teams, and by voice; texting is described as coming. When idle, a dot does proactive research using read-only access to connected apps. OpenAI's help page adds that a dot is created in the ChatGPT desktop app or desktop web; mobile apps can talk to an existing dot but cannot create one. The page OpenAI dots and KnowMe goes deeper.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## How Gemini Spark works, according to Google (Landscape)

According to Google's blog, Gemini Spark runs on Gemini 3.5 in the cloud, integrates with Workspace apps, and supports recurring or event-triggered tasks, reusable skills and multi-step workflows; MCP connections to some third-party services were announced. Google's help page says Spark runs in a remote browser and computer or in the person's local Chrome, that local-browser tasks need the device awake, and that it handles up to 15 tasks at once.

Source: Google blog, The next evolution of the Gemini app (2026-05-19), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## Who can use Gemini Spark, according to Google (Landscape)

Google's help page says Spark requires age 18 or over, a personal Google account, a Google AI Pro or Ultra subscription and Keep Activity switched on, and is available in the Gemini mobile app, the Mac app and the web. Google's blog names a US Ultra beta while the help page names Pro or Ultra; this page does not resolve that difference.

Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Google blog, The next evolution of the Gemini app (2026-05-19), retrieved 2026-10-12.

## How Claude Cowork works, according to Anthropic (Landscape)

According to Anthropic's product page, Claude Cowork works in the folders and tools the person selects. The desktop app is the full version, with web and mobile versions also offered. Tasks can be scheduled, a built-in browser exists, and computer use is offered. Cowork runs through a Claude account or through the customer's own cloud (Bedrock, Google Cloud or Microsoft Foundry), on the Pro, Max, Team and Enterprise plans, with usage limits.

Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.

## How Anthropic says Claude Cowork is contained (Landscape)

Anthropic's engineering post describes Cowork's containment design: the agent loop runs on the host, code runs in a local virtual machine, only the selected workspace is mounted (in read-only, read-write or no-delete modes), and credentials stay in the host keychain.

Source: Anthropic engineering, How we contain Claude (2026-05-25), retrieved 2026-10-12.

## How Microsoft Scout works, according to Microsoft's June post (Landscape)

Microsoft's June 2026 post introduced Scout as an always-on personal agent that operates across cloud, desktop and web and says it was built on OpenClaw open-source technology. Describing Scout, the post lists scoped credentials, approved resources, sensitivity labels with data-loss prevention, and human sign-off for sensitive actions.

Source: Microsoft Copilot blog, Introducing Microsoft Scout (2026-06-02), retrieved 2026-10-12.

## How Microsoft Autopilot works, according to Microsoft's September post (Landscape)

Microsoft's September 2026 post says Autopilot was previously called Scout, is cloud-hosted and lives in the customer's tenant, is reached in Teams and Outlook, comes with permissions, audit and governance, lets the person set the objective and boundaries, and is billed by usage separately from per-user licences. Autopilot is an enterprise, tenant-bound offering rather than a consumer assistant.

Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

## What always-on agents offer: work continues when the device is off (their pluses) (Landscape)

Work continues while the person's own device is off: OpenAI says a dot works around the clock on its own cloud computer; Google says Spark keeps working when you close your laptop or lock your phone; Anthropic says Cowork keeps working in the cloud when the laptop is closed.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: Google blog, The next evolution of the Gemini app (2026-05-19), retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.

## What always-on agents offer: integration and reach (their pluses) (Landscape)

Broad integration and reach: OpenAI cites plugins to more than 4,000 apps and reach through ChatGPT, Slack, Teams and voice; Google cites Workspace integration, MCP connections and the Gemini mobile app, Mac app and web; Microsoft cites Teams and Outlook.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: Google blog, The next evolution of the Gemini app (2026-05-19), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

## What always-on agents offer: availability and enterprise variants (their pluses) (Landscape)

Availability today for eligible plans and regions: OpenAI's announcement describes dots rolling out to Pro and Business Premium plans; Spark is available to Google AI Pro or Ultra subscribers; Cowork is on Anthropic's paid plans. Enterprise variants: OpenAI previews specialist dots with their own identity and credentials; Microsoft's Autopilot is tenant-governed.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

## Stated limits of always-on agents: hosting and models (their minuses) (Landscape)

Each runs where its maker says it does: dots on OpenAI's cloud computers; Spark in Google's cloud or the person's local Chrome; Cowork through a Claude account or the customer's own cloud (Bedrock, Google Cloud or Microsoft Foundry); Autopilot in the customer's tenant. Each is described with its maker's own model (GPT-6 Astra, Gemini 3.5, Claude); Microsoft's posts do not name a model.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

## Stated limits of always-on agents: plans and regions (their minuses) (Landscape)

OpenAI's help page says Pro availability for dots excludes the European Economic Area, Switzerland and the UK; Google's help page says Spark is not available in the EEA, Nigeria, Switzerland or the UK. Dots, Spark and Cowork each require a paid plan on the pages read.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.

## Stated limits of always-on agents: what happens to data (their minuses) (Landscape)

OpenAI's help page says a dot's memories, conversations and scheduled tasks are deleted by resetting the dot, and that disconnecting an app does not delete information already obtained from it. Google's help page says Spark saves remote-browser data such as sign-in cookies for later sessions; the person can delete it, Google may delete it automatically, and turning Spark off deletes it.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## Stated limits of always-on agents: the makers' own warnings (their minuses) (Landscape)

OpenAI says a dot can make mistakes, including when following rules. Google calls Spark experimental and early-stage, says safeguards do not guarantee protection, warns about prompt injection and says scheduled tasks running offline may not be stoppable.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## Controls and permissions in OpenAI dots and Gemini Spark (Landscape)

According to OpenAI, the person chooses which apps a dot may access; Custom Rules let the person allow an action, require pre-approval, ask before acting or hand off to the person; some sensitive actions always stay with the person; an Activity View shows progress and a monitoring system can pause or stop a dot. Google says Spark asks for confirmation before sending communications, modifying data, purchases, form submissions and Google sign-in, and pauses for the person on passwords and payments.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## Controls and permissions in Claude Cowork and Microsoft Scout (Landscape)

Anthropic says Cowork requires approval for deletions, offers an optional plan-approval setting, and gives administrators toggles, spend limits and role-based permissions. Microsoft's June Scout post, describing Scout, lists scoped credentials, approved resources, sensitivity labels with data-loss prevention, and human sign-off for sensitive actions.

Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft Copilot blog, Introducing Microsoft Scout (2026-06-02), retrieved 2026-10-12.

## Training and data use for OpenAI dots, according to OpenAI (Landscape)

According to OpenAI, content from ChatGPT Business, Enterprise and Edu workspaces is not used to improve models by default, and on personal plans the person controls this. OpenAI also says it does not train directly on proactive research or a dot's notes to itself. A dot receives memories from ChatGPT and creates its own, including from connected apps.

Source: OpenAI, Introducing dots (2026-09-29), retrieved 2026-10-12.
Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.

## Training and data use for Spark, Cowork and Autopilot, as stated (Landscape)

Google's pages read for this knowledge base do not state Spark's data-use or training terms. Anthropic's product page does not state Cowork's memory behaviour or data-use terms; its engineering post describes the containment design summarised above. Microsoft's posts say Autopilot lives in the customer's tenant and do not state training or memory-deletion terms.

Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.
Source: Anthropic, Claude Cowork product page, retrieved 2026-10-12.
Source: Microsoft blog, Introducing the new Copilot with Autopilot (2026-09-25), retrieved 2026-10-12.

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
- The person takes on more: choosing and running models, hardware, storage and sync.

## Differences in KnowMe's favour, by design: data and memory (our pluses) (Landscape)

These are differences in design, not verified superiority. On the makers' pages, a dot's memories are held in OpenAI's systems and deleted by resetting the dot, and Spark saves remote-browser data for later sessions; KnowMe is designed to hold conversations and memory on the person's own device.

Source: OpenAI Help Center, Getting started with your dot, retrieved 2026-10-12.
Source: Google Gemini Help, Gemini Spark, retrieved 2026-10-12.

## Differences in KnowMe's favour, by design: models, plans and accounts (our pluses) (Landscape)

Dots, Spark and Cowork are each described with their maker's own model; KnowMe is designed to let the person switch between local models and several providers. Access to dots and Spark is limited by plan and region on the makers' pages; KnowMe is planned for release under the MIT licence with no central account. Whether KnowMe delivers on this design can only be judged when it ships.

## Choosing between an always-on agent and KnowMe (Landscape)

If you need an agent that works for you today while your laptop is closed, with wide app integration and reach into Slack, Teams or Workspace, an always-on agent from OpenAI, Google, Anthropic or Microsoft is the fit, within its plan and regional limits. If your priority is that your data and memory stay on hardware you control, that you are not tied to one model vendor, and you are willing to wait for KnowMe and to run more yourself, KnowMe is being designed for you; follow its status and try The Boss in the meantime. See How to choose between these tools for guidance by need.
