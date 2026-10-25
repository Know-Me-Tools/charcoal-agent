# Modernize or harden an existing tool or service (Solutions)

A visitor asks: "We have an older tool that people are afraid to change. How do we modernize it, or make it faster, without breaking it?" The portfolio offers process tools and one proposed skill. It states no result from using any of them on an older tool. Status tags on this page: [shipped] means the facts file records a published release or package. [planned] means source without a release, a prototype, a specification or a design, and is never described here as available.

Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Modernize or harden a tool: the products that help (Solutions)

- Rust performance engineering skill [planned, review edition]: a portable skill proposal for prevention, audit, diagnosis and bounded repair of Rust services. Six modules cover workflow evidence, runtime ownership, versioned streaming adapters, database use, scheduler selection and source provenance. An optional helper checks aggregate PostgreSQL connection budgets. See [Rust performance engineering skill](/rust-performance-skill/rust-performance-skill.md).
- KnowMe Project Management [planned, source only]: a skill that sets up a new project or converts an existing one, detecting which it is and what type, then stating its plan before it runs.
- Prometheus Skill Pack [shipped], release v1.13.0, and Skills Mini [shipped], release v1.12.1: a repeatable way to plan, assign, implement and keep lessons.
- Phase Exit [planned, preview]: decides whether a stage is complete from evidence checked against a contract the team adopted.

Source: KnowMe and Prometheus portfolio, Edition 3, entries dated 25 October 2026 (address of Edition 3 not yet confirmed), retrieved 2026-10-25.
Source: know-me-project-management README, retrieved 2026-10-25.
Source: Prometheus Skill Pack README, retrieved 2026-10-25.
Source: Phase Exit README, retrieved 2026-10-25.

## Modernize or harden a tool: how the products fit together (Solutions)

- The skill packages with Project Management: the Project Management README lists skills it needs, such as kbd-init and agent-team-creator. This combination is [planned], because Project Management has no release.
- Phase Exit with the Universal Agent Runtime: Phase Exit's README says the preview was published for use in a UAR release phase. This combination is [planned].
- The portfolio groups these as tools that support building and governing the work. It calls such groupings architectural intent.

Source: know-me-project-management README, retrieved 2026-10-25.
Source: Phase Exit README, retrieved 2026-10-25.
Source: KnowMe and Prometheus portfolio, Edition 2, retrieved 2026-10-25.

## Modernize or harden a tool: what is not stated (Solutions)

- No source shows any of these used to modernize an older test tool or any other legacy tool.
- The Rust performance skill's edition says it is not installed, and that no production performance improvement is established. Real database, provider and proxy integration, realistic load and scheduler benchmarks are unverified.
- A copied skill does not prove a given coding assistant can run it.
- This page does not describe client engagements or client research.

Source: KnowMe and Prometheus portfolio, Edition 3, entries dated 25 October 2026 (address of Edition 3 not yet confirmed), retrieved 2026-10-25.
Source: Prometheus Skill Pack README, retrieved 2026-10-25.

## Modernize or harden a tool: start here (Solutions)

Write down the tool's current behavior and one change you want. Install Skills Mini or the full pack per its README, and ask the KnowMe agent for the Rust performance skill's status if your service is in Rust.
