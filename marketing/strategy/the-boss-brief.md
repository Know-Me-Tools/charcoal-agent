# The Boss product brief (starting point for marketing and content; the product repo remains the source of truth)

Compiled 2026-09-30 from `/Users/gqadonis/Projects/prometheus/the-boss` and its public GitHub releases (`Prometheus-AGS/the-boss`, visibility PUBLIC). Owner: km-cmo. Every claim cites its source. Re-check the source before using a claim, because product details change.

**Read this first:** the local checkout is on a feature branch 55 commits behind `origin/main`. All file citations below were read from `origin/main` (`git show origin/main:<file>`, head `879c515a9f`, 2026-09-29) unless marked otherwise. Release facts come from `RELEASES.md` on `origin/main` and from `gh release view` on the public repo.

## What it is and who it's for
- "An AI desktop workspace for conversations, agents, tools, and project work." (`README.md`, headline)
- "The Boss is the Know Me Tools desktop workspace built on Cherry Studio. It brings multi-provider AI conversations, agent sessions, workspace tools, knowledge and document workflows together with Prometheus integration." (`README.md` line 17)
- It is an Electron desktop application with a shared React renderer. (`PRODUCT.md`, "Platform")
- Audience: "Developers and technical operators who use The Boss as their daily AI workspace and need to administer local agent runtimes, project tools, models, memory, and supporting services without leaving the application." (`PRODUCT.md`, "Users")
- Purpose: "the operator-facing administration surface for the Universal Agent Runtime and its integrations." (`PRODUCT.md`, "Purpose")
- `package.json` description: "The Boss — an agent studio for people who ship." (`package.json`, `description`)

## Shipped vs specified (check this before any claim)
Status comes from `RELEASES.md`, `release-manifest.json`, the GitHub release notes, `README.md` and OpenSpec task checkboxes under `openspec/changes/`. Do not use the internal assessment or planning files for status.

| Capability | Status | Evidence | May marketing say it exists today? |
|---|---|---|---|
| Desktop app, Windows x64 and macOS Apple Silicon | **Released** (v2.2.3–v2.2.7 installers listed with checksums) | `RELEASES.md` | Yes, as "available for Windows and macOS (Apple Silicon)" |
| macOS Intel and Windows ARM64 | **Released** from v2.2.6/v2.2.7 | `RELEASES.md` (v2.2.7 table) | Yes, name the version |
| Linux (AppImage, deb, rpm; x64 and arm64) | **Last released in v2.1.3**, not in any 2.2.x release | `RELEASES.md` (v2.1.3 table); v2.2.0 lists Linux as "Pending platforms" | No current Linux claim |
| v2.2.8 (latest GitHub release, 2026-09-29) | Published on GitHub; not yet recorded in `RELEASES.md` | `gh release view v2.2.8`: assets for win x64/arm64 and mac arm64/x64 | Yes for the four platforms, but cite checksums from `RELEASES.md` only once recorded |
| Code signing | macOS builds "Developer ID (notarized)"; **all Windows installers unsigned** | `RELEASES.md` "Signing" column | Do not say "signed" for Windows. Expect SmartScreen warnings |
| Installed Windows acceptance | **Pending** | `docs/contrib/the-boss-release.md` line 133 | No "tested on Windows" claim |
| Multi-provider conversations, agent sessions, MCP tools, skills, knowledge and document workflows | **In source and in the app** (inherited from Cherry Studio plus fork work) | `README.md` "Workspace capabilities" | Yes, in README wording |
| Bundled Universal Agent Runtime sidecar ("uar-enabled" profile) | **Released** from v2.2.0 | `release-manifest.json` (`features.uar: true`); release notes v2.2.0–v2.2.8 | Yes: "ships with the Universal Agent Runtime" |
| 97 mini skills incl. 40 UI/UX catalog entries, ten-role project team routing | **In source**; README warns this merged after 2.2.2 and a merge "does not establish that the 2.2.2 installers contain them" | `README.md` "UI/UX skills and project teams" | Only for a release whose notes confirm it; not verified in this brief |
| Skills bundling, binary shipping, Docker services, MCP server presets (OpenSpec `prometheus-001/002/004/005`) | **Unreconciled**: task lists are unticked (0 of 15, 0 of 9, 0 of 8, 0 of 10), yet release notes say "managed services" and "the complete Prometheus skill payload" | `openspec/changes/prometheus-00*/tasks.md`; release notes v2.2.3–v2.2.8 | Not until the product owner reconciles the two |
| Settings and doctor (`prometheus-003`) | 14 of 16 tasks ticked | `openspec/changes/prometheus-003-settings-and-doctor/tasks.md` | Only with product-owner confirmation |

## Capabilities and platforms (as shipped; see status above)
- **Workspace capabilities**, verbatim list (`README.md`):
  - "Conversations and assistants across cloud and local model providers."
  - "Agent sessions with workspace context, MCP tools, skills, and approval boundaries."
  - "Knowledge, document, code, and Markdown workflows."
  - "Prometheus settings for packaged skills, workspace indexing, tools, and optional services."
  - "Shared renderer components, semantic design tokens, and light/dark themes."
- "Provider access and optional integrations require their own configuration." (`README.md`) Say so wherever providers are mentioned.
- **Platforms today:** Windows x64 and ARM64, macOS Apple Silicon and Intel (v2.2.7/v2.2.8). The "primary customer release targets are Windows x64 and Apple Silicon macOS." (`PRODUCT.md`) Linux has no 2.2.x installer.
- Installer sizes are large (roughly 410–625 MB per installer in v2.2.7). (`RELEASES.md`) Worth stating on any download page.
- Docs also describe a local HTTP API gateway, local models, browser use and observability (`docs/README.md` index). These are architecture references, not release claims; do not market them without a release note or product-owner confirmation.

## Differentiators, in the product's own words
- "The product combines a conversational AI workspace with supervised local runtime administration." (`PRODUCT.md`, "Positioning")
- "Its distinguishing behaviors are workspace isolation, explicit service ownership, packaged tools and skills, observable operations, and an inspectable difference between requested configuration and the configuration currently running." (`PRODUCT.md`, "Positioning")
- Design principle: "Keep every automated decision inspectable and reversible by the operator." (`PRODUCT.md`, principle 5)
- Character: "calm, precise, and utilitarian." (`PRODUCT.md`; `DESIGN.md` §1)
- Note: "distinguishing" is the product's own framing. No comparison against other tools has been verified for public use.

## Pricing and availability
- No price, tier or subscription is stated in the repo. Do not invent one; pricing is decided by the operator only.
- License: GNU Affero General Public License v3.0, derived from Cherry Studio. (`README.md` "Attribution and license"; `LICENSE`)

## Install / where to get it
- "Download the installer for your platform and architecture from The Boss releases" at `https://github.com/Prometheus-AGS/the-boss/releases`. (`README.md` "Get The Boss")
- README also links a website, `https://the-boss.know-me.tools`. (`README.md` header) Not checked in this brief.
- Older releases (v2.1.1–v2.1.2) were distributed through an IPFS gateway. Do not link those; use GitHub releases only.

## Relationship to KnowMe
- The README calls it "the Know Me Tools desktop workspace". (`README.md` line 17)
- It ships the Universal Agent Runtime as a sidecar (`release-manifest.json`). The KnowMe agent on this site also runs on the Universal Agent Runtime (`CLAUDE.md` in this repo). That shared runtime is the only verified technical link.
- The Boss is **not** KnowMe and is not built on know-me-system. Do not describe it as a KnowMe edition or tier, and do not transfer KnowMe's sovereignty or on-device claims to it (see warnings).

## Warnings: stale or risky sources
- **Privacy:** `PRIVACY.md` is still titled "Cherry Studio Privacy Policy" and describes default anonymous usage and crash collection. `docs/contrib/cherry-services-self-hosting.md` says the fork retains upstream-operated services (accounts, updates, provider metadata, diagnostics, analytics, Sentry). **Make no privacy, "no telemetry" or "local-only" claim for The Boss.**
- **Upstream text:** the GitHub repo description ("AI productivity studio with smart chat, autonomous agents, and 300+ assistants") and `package.json` `homepage`/`author` still point to Cherry Studio. Do not quote them as The Boss claims.
- **Version drift:** the local checkout's `RELEASES.md` stops at v2.2.3; `origin/main` has v2.2.7; GitHub has v2.2.8. Always cite the newest recorded release.
- **Internal material:** `.kbd-orchestrator/`, `.prometheus/` and handoff files were read for status only and are not quoted. Never quote them.

## Open questions for the operator
1. Official product name and styling: "The Boss" in docs vs `TheBoss` in `package.json`. Is there a tagline, and is "an agent studio for people who ship" approved?
2. Is The Boss a KnowMe AI, LLC product to be marketed on this site, or a Prometheus AGS product listed as related? README says "Know Me Tools"; the repo org is Prometheus-AGS.
3. Audience for this site: the product targets developers and technical operators. Should the site pitch it to them only?
4. Pricing: is it free (AGPL) with no paid tier, or is a paid offering planned?
5. Will Windows installers be signed, and when does installed Windows acceptance close?
6. Is Linux dropped, paused or pending for 2.2.x?
7. Status of skills bundling, Docker services and MCP presets: shipped (release notes) or open (OpenSpec tasks)?
8. Privacy: will the fork replace or disable the retained Cherry-operated analytics and diagnostics before we market it?
9. Is `the-boss.know-me.tools` live and the canonical link to use?
