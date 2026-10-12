# Plan-stage research 04: product source inventory (public-safe summary)

Source: read-only inventory of the operator's six product directories and the two skill packages on 2026-10-12 (model output). This repository is public, so this file holds only what is already public or is a pointer. The detailed hazard findings (confidential material, credentials, internal analyses, licence gaps, unreleased-feature status) are in a local-only, gitignored file, `.prometheus/knowledge-evidence/product-hazards.md`, and each content task works from the product repositories directly.

## Products, as already described publicly
- **Universal Agent Runtime** (version 1.0.0): a Rust runtime for governed agent execution, model routing, AG-UI streaming, A2UI, MCP tools, retrieval and policy; MIT code licence.
- **Surreal Memory Server** (version 1.10.2): a Rust memory service (knowledge graph, scoped memories, hybrid search, task streams; MCP and REST). Licence statement to be checked at write time (task 10.3).
- **BossFang**: an agent operating system in Rust (SurrealDB storage, Surreal Memory and UAR connections are BossFang additions over upstream LibreFang); MIT.
- **The Boss** (version 2.2.36): an Electron desktop AI workspace derived from Cherry Studio; AGPL-3.0; current release offers Windows x64 and macOS Apple Silicon installers.
- **KnowMe**: a personal AI platform built for on-device operation; no public release yet. Status and claims are established per claim in task 9.1 (untracked table).
- **PatientGPT and the prior-authorization workbench**: gated by the operator's consent decision (task 11.0); nothing is written until then.
- **Skill packages**: a full pack (1.12.2) and a mini pack (1.12.1), both described as MIT in package metadata; counts to be stated from each package's own index.

## Existing live KB statements the sources contradict (basis for change 13)
1. "Desktop app available now on macOS, Windows and Linux" is unsupported by the source repositories.
2. "Mobile not certified on a physical device" is out of date.
3. The Boss platforms and installer sizes are out of date (see above).
4. Company name differs between the live site ("KnowMe AI, LLC") and the source documents ("KnowMe, LLC").
5. Wording that implies zero cloud use for every tier is unsupported; the existing "design intent, not guarantee" framing is correct and should be kept.
