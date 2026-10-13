# Prometheus skill packages status and licence

## Who makes the Prometheus skill packages and what licence they use

Prometheus AGS makes both the full Prometheus Skill Pack and Prometheus Skills Mini. Both are MIT licensed, and each repository has a LICENSE file.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.
Source: Prometheus Skill Pack LICENSE, retrieved 2026-10-13.
Source: Prometheus Skills Mini LICENSE, retrieved 2026-10-13.

## How many skills the Prometheus skill packages have

Counted by listing the skill folders in the repository on 2026-10-13. The full pack, version 1.12.2 in its `skill-system.json`, has 120 skills in its `skills/<category>/<skill>/` folders, each with a SKILL.md; two of them are imported from other repositories. With nested helper skills it has 404 SKILL.md files in total, not counting installed dependencies. Mini, version 1.12.1 in its `package.json`, has 100 skills in its `skills/<name>/` folders.

Source: Prometheus Skill Pack skill-system manifest, retrieved 2026-10-13.
Source: Prometheus Skills Mini package manifest, retrieved 2026-10-13.

## Status of the full pack in the Prometheus skill packages

The full pack's `skill-system.json` gives release version 1.12.2; treat that as the source version, not a tested release. Its README does not select a release. Support depends on the release, the host machine and the entry point, and a successful install does not prove that every requested service works.

Source: Prometheus Skill Pack skill-system manifest, retrieved 2026-10-13.
Source: Prometheus Skill Pack README, retrieved 2026-10-13.

## Status of Mini in the Prometheus skill packages

Mini's `package.json` gives version 1.12.1; treat that as the source version, not a tested release. Mini's source and documentation were published for review on 2026-10-05. The note says this is a source publication, not a release. The owner plans to resume testing once the code base has stabilised. Its source targets Windows, macOS and Linux with Node 22 or later; acceptance on real installed coding assistants is still pending on each of the three.

Source: Prometheus Skills Mini package manifest, retrieved 2026-10-13.
Source: Prometheus Skills Mini source publication note, 2026-10-05, retrieved 2026-10-13.
Source: Prometheus Skills Mini maintenance and platform limits, retrieved 2026-10-13.

## Prometheus skill packages licences

The full Prometheus Skill Pack is MIT licensed and has a LICENSE file. Prometheus Skills Mini is MIT licensed (LICENSE file in the repository). Its package manifest and README also say MIT. Skills imported into either package keep their own licences.

Source: Prometheus Skill Pack LICENSE, retrieved 2026-10-13.
Source: Prometheus Skills Mini LICENSE, retrieved 2026-10-13.
Source: Prometheus Skills Mini package manifest, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.
Source: Prometheus Skill Pack README, retrieved 2026-10-13.
