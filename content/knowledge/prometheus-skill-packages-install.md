# Installing the Prometheus skill packages

## Before installing a Prometheus skill package (Skill Packages)

Pick one package per home directory: Mini must not go into a home that already has the full pack. Keep the source checkout somewhere permanent, because installed plugins can point back to it.

Source: Prometheus Skills Mini README, retrieved 2026-10-12.
Source: Prometheus Skill Pack README, retrieved 2026-10-12.

## Installing the full Prometheus Skill Pack (Skill Packages)

Clone `https://github.com/Prometheus-AGS/prometheus-skill-system`, run `npm ci`, then run `./install.sh --profile skills --targets detected --dry-run` to see the plan, and the same command without `--dry-run` to install. The installer shows which coding assistants it found and what it will change before you confirm. Check the result with `./install.sh --verify --targets detected --non-interactive`.

Source: Prometheus Skill Pack README, retrieved 2026-10-12.

## Full Prometheus Skill Pack targets and services (Skill Packages)

If no coding assistant is detected, name targets such as `claude`, `codex`, `opencode`, `kimi-code` or `minimax`; the authoritative list is in the pack's `skill-system.json`. The skills profile does not build binaries or start services. The `full` profile adds native services on macOS and Linux only, and needs Bash 4 or later, not the Bash 3.2 that ships with macOS.

Source: Prometheus Skill Pack skill catalog, retrieved 2026-10-12.
Source: Prometheus Skill Pack README, retrieved 2026-10-12.
Source: Prometheus Skill Pack guide, installation, retrieved 2026-10-12.

## Installing Prometheus Skills Mini (Skill Packages)

Clone `https://github.com/Prometheus-AGS/prometheus-skills-mini`, run `npm ci`, then `node scripts/doctor.mjs --human` to check your setup. On a machine without the full pack, `node scripts/doctor.mjs --fix copy-skills` copies Mini's skills into your home's `.agents/skills` and `.claude/skills`, keeps any files you changed, and never deletes extra files. Claude and Codex plugin packages are a separate route, registered through each assistant's own marketplace flow.

Source: Prometheus Skills Mini README, retrieved 2026-10-12.

## Updating or removing a Prometheus skill package (Skill Packages)

The full pack updates with `npm run update` from a clean checkout, can roll back to the previous skill generation, and has an uninstall command that removes only the files it owns. Mini has no automatic rollback or blanket uninstall: you remove its registration and the copies listed in its installation receipts.

Source: Prometheus Skill Pack README, retrieved 2026-10-12.
Source: Prometheus Skills Mini README, retrieved 2026-10-12.
