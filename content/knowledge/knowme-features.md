# KnowMe features

KnowMe is designed around eight tiles: Chat, Hands, Image, Audio, Prompt Lab, Skills, Models and Settings. Only some of KnowMe's capabilities are available today; the rest are planned. This page lists what's available now in KnowMe and what's still planned.

## Available now in KnowMe

- **Chat with the KnowMe agent, right on this site.** This site's chat runs on the Universal Agent Runtime. Conversations with the KnowMe agent become threads, saved on your own device. (Source: this site's own copy)
- **Skills that attach to the KnowMe agent, on this site.** Skills extend what the KnowMe agent can do here. (Source: this site's own copy)
- **KnowMe's downloadable desktop app.** Separately, KnowMe's desktop app runs on macOS, Windows and Linux, built with Tauri and React. (Source: KnowMe README)
- **On-device model inference, in KnowMe's desktop app.** KnowMe's Rust core runs models on the user's own device. (Source: KnowMe README)

## Planned for KnowMe

- **Hands (scheduled agents).** KnowMe's Hands tile is designed for unsupervised, scheduled agents, with six templates: Researcher, Inbox Triage, Code Watcher, Market Pulse, Daily Journal and Reading List. The Hands interface exists in KnowMe today, but the scheduler and policy execution that would run it are not yet wired up, so Hands is not available yet. (Source: KnowMe implementation roadmap)
- **Multi-device sync.** KnowMe is designed to sync a user's devices peer-to-peer through the user's own BossFang server. This part of KnowMe is still in early development. (Source: KnowMe implementation roadmap)
- **Plugin system and marketplace.** KnowMe is designed to let plugins extend the app without touching KnowMe's core. KnowMe's plugin marketplace is still in early development. (Source: KnowMe implementation roadmap)
- **Mobile (iOS and Android).** A mobile version of KnowMe, built with Flutter, is planned. KnowMe's mobile agent runtime compiles today but has not been certified on a physical device, so KnowMe is not yet available on phones or tablets. (Source: KnowMe README; KnowMe platform support notes)
- **Image, Audio, Prompt Lab, Models and Settings tiles.** These are part of KnowMe's eight-tile design. This page will list them as available once KnowMe's release notes confirm they've shipped. (Source: KnowMe product documentation)
