# Prometheus skill packages questions

## What are the Prometheus skill packages?

Two packages of skills for AI coding assistants: the broad full Prometheus Skill Pack and the portable Prometheus Skills Mini. Both help an assistant plan work, assign ownership, implement a specification and keep lessons.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## Are the Prometheus skill packages free?

The full Prometheus Skill Pack is MIT licensed and has a LICENSE file. Prometheus Skills Mini is also MIT licensed. The owners state it is MIT licensed; a LICENSE file has been proposed in the repository.

Source: Prometheus Skill Pack LICENSE, retrieved 2026-10-13.

## Do the Prometheus skill packages need a cloud account?

No account is needed. The skills are files installed into your coding assistant, and the services are optional. Any model your assistant uses needs that provider's own account.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.

## Which of the Prometheus skill packages should I install?

Mini if you work on Windows without Git Bash or WSL, or want the least setup. The full pack if you want broad language and domain guidance and optional native services on macOS or Linux. Ask about choosing between the Prometheus skill packages for the full comparison.

Source: Prometheus Skill Pack guide, platform and harness support, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## Can I install both Prometheus skill packages?

Not in the same home directory. They share skill names and can hide each other. On a machine with the full pack, use Mini only inside The Boss application's own data directory.

Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## What is Compass, which comes with The Boss next to Mini from the Prometheus skill packages?

Compass turns source code into a graph of symbols, files and relationships that you and your agents can query: architecture maps, paths between symbols, change impact, and graphs pinned to past Git commits. It runs locally as one Rust binary on Windows, macOS and Linux, with no embeddings or model credentials. The Boss website says it is MIT or Apache-2.0 licensed; no LICENSE file is cited here, so check Compass's repository before relying on that. It is a fork of crabbuild/compass with Windows support.

Source: The Boss website, retrieved 2026-10-13.

## Which coding assistants work with the Prometheus skill packages?

The full pack's installer documents targets including Claude Code, Codex, OpenCode, Kimi Code and MiniMax; its `skill-system.json` holds the current list. Mini lists nine target IDs: claude, codex, opencode, agents, cursor, gemini, windsurf, zed and cline. A target is where skills are copied; it does not prove that a given assistant runs them.

Source: Prometheus Skill Pack skill catalog, retrieved 2026-10-13.
Source: Prometheus Skills Mini maintenance and platform limits, retrieved 2026-10-13.
Source: Prometheus Skill Pack guide, platform and harness support, retrieved 2026-10-13.

## How do I report a bug in or contribute to the Prometheus skill packages?

The full pack's CONTRIBUTING.md asks contributors to open a scoped issue at https://github.com/Prometheus-AGS/prometheus-skill-system when a contract or ownership question needs clarifying, and sets out how changes are made. Mini's README links a contribution guide that is not yet in its repository, https://github.com/Prometheus-AGS/prometheus-skills-mini.

Source: Prometheus Skill Pack contribution guide, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## Who makes the Prometheus skill packages?

Prometheus AGS makes the Prometheus skill packages, both the full Prometheus Skill Pack and Prometheus Skills Mini.

## What is Prometheus, behind the Prometheus skill packages?

Prometheus AGS makes the Universal Agent Runtime, the Surreal Memory Server, BossFang and the Prometheus skill packages. Prometheus is the name of its server-side AI platform work.
