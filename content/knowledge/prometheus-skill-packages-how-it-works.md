# How the Prometheus skill packages work

## Using a skill from the Prometheus skill packages

After installation you open a project in your coding assistant and ask for a skill by name, for example asking `kbd-process-orchestrator` to plan a small feature, record its specification and acceptance criteria, and assign file ownership.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## The KBD workflow in the Prometheus skill packages

Both packages share skill names and the KBD workflow (KBD is the packages' name for the assess, plan, execute, reflect cycle). You assess the code as it is, plan changes small enough to finish, execute one change at a time, then reflect on what held. KBD keeps the identity of each change and task across sessions, so another session can pick up the work. Missing models or prerequisites stay visible in the task record instead of being reported as done. Mini can keep its specifications in OpenSpec or GitHub Spec Kit (two spec-file conventions for coding assistants) or in its own format.

Source: The Boss website, retrieved 2026-10-13.
Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## Agent teams in the Prometheus skill packages

Team skills create a team, give each role an owned set of paths, track tasks, and record a handoff before ownership moves. An exported team definition is a proposal; it does not start agents or prove that a coding assistant found them.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.

## Optional services in the Prometheus skill packages

The packages work without any service. The full pack can add a durable memory service (the Surreal Memory Server), a knowledge tool, the liter-llm model gateway, native research and signed execution records. Mini's optional container stack runs SurrealDB, the Surreal Memory Server and liter-llm on local interfaces. Lessons help a later session only if they were saved and are found again; running the cycle more times does not by itself improve it.

Source: Prometheus Skill Pack README, retrieved 2026-10-13.
Source: Prometheus Skills Mini README, retrieved 2026-10-13.
Source: Prometheus Skill Pack guide, introduction, retrieved 2026-10-13.
