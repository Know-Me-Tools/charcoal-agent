# Prometheus skill packages questions

## What are the Prometheus skill packages?

Two packages of skills for AI coding assistants: the broad full Prometheus Skill Pack and the portable Prometheus Skills Mini. Both help an assistant plan work, assign ownership, implement a specification and keep lessons.

Source: Prometheus Skill Pack README, retrieved 2026-10-12.
Source: Prometheus Skills Mini README, retrieved 2026-10-12.

## Are the Prometheus skill packages free?

Both are open source under MIT. The full pack has a LICENSE file; Mini declares MIT in its README and package manifest but does not yet have a LICENSE file.

Source: Prometheus Skill Pack LICENSE, retrieved 2026-10-12.
Source: Prometheus Skills Mini README, retrieved 2026-10-12.

## Do the Prometheus skill packages need a cloud account?

No account with KnowMe AI, LLC is needed. The skills are files installed into your coding assistant, and the services are optional. Any model your assistant uses needs that provider's own account.

Source: Prometheus Skill Pack README, retrieved 2026-10-12.

## Which Prometheus skill package should I install? (Skill Packages)

Mini if you work on Windows without Git Bash or WSL, or want the least setup. The full pack if you want broad language and domain guidance and optional native services on macOS or Linux. See [choosing full or mini](/skill-packages/prometheus-skill-packages-choosing-full-or-mini.md).

Source: Prometheus Skill Pack guide, platform and harness support, retrieved 2026-10-12.
Source: Prometheus Skills Mini README, retrieved 2026-10-12.

## Can I install both Prometheus skill packages?

Not in the same home directory. They share skill names and can hide each other. On a machine with the full pack, use Mini only inside The Boss application's own data directory.

Source: Prometheus Skills Mini README, retrieved 2026-10-12.

## What is Compass, which comes with The Boss next to Prometheus Skills Mini? (Skill Packages)

Compass turns source code into a graph of symbols, files and relationships that you and your agents can query: architecture maps, paths between symbols, change impact, and graphs pinned to past Git commits. It runs locally as one Rust binary on Windows, macOS and Linux, with no embeddings or model credentials. It is MIT or Apache-2.0 licensed and is a fork of crabbuild/compass with Windows support.

Source: The Boss website, retrieved 2026-10-12.
