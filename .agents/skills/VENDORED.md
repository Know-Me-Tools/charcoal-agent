# Vendored skills

Copied from public repos after reading each SKILL.md and scanning for scripts and injected instructions (2026-09-25). Update by re-copying from the pinned commit; don't edit in place.

| Skill | Source | Commit | License |
|---|---|---|---|
| `ai-seo` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `seo-audit` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `schema` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `site-architecture` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `copywriting` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `copy-editing` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `content-strategy` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `product-marketing` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `analytics` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `ab-testing` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `cro` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `launch` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `competitors` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `customer-research` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `marketing-psychology` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `vercel-react-best-practices` | https://github.com/vercel-labs/agent-skills | 063bee9 | MIT |
| `web-design-guidelines` | https://github.com/vercel-labs/agent-skills | 063bee9 | MIT |
| `vercel-composition-patterns` | https://github.com/vercel-labs/agent-skills | 063bee9 | MIT |
| `vercel-react-view-transitions` | https://github.com/vercel-labs/agent-skills | 063bee9 | MIT |
| `writing-guidelines` | https://github.com/vercel-labs/agent-skills | 063bee9 | MIT |
| `web-quality-audit` | https://github.com/addyosmani/web-quality-skills | afa8da9 | MIT |
| `core-web-vitals` | https://github.com/addyosmani/web-quality-skills | afa8da9 | MIT |
| `accessibility` | https://github.com/addyosmani/web-quality-skills | afa8da9 | MIT |
| `best-practices` | https://github.com/addyosmani/web-quality-skills | afa8da9 | MIT |
| `gsap-core` | https://github.com/greensock/gsap-skills | aed9cfd | MIT |
| `gsap-react` | https://github.com/greensock/gsap-skills | aed9cfd | MIT |
| `gsap-scrolltrigger` | https://github.com/greensock/gsap-skills | aed9cfd | MIT |
| `gsap-timeline` | https://github.com/greensock/gsap-skills | aed9cfd | MIT |
| `gsap-performance` | https://github.com/greensock/gsap-skills | aed9cfd | MIT |
| `pricing` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `marketing-plan` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `marketing-ideas` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `public-relations` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `social` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `emails` | https://github.com/coreyhaines31/marketingskills | 5b2c000 | MIT |
| `obviously-awesome` | https://github.com/wondelai/skills | c172996 | MIT |
| `crossing-the-chasm` | https://github.com/wondelai/skills | c172996 | MIT |
| `storybrand-messaging` | https://github.com/wondelai/skills | c172996 | MIT |
| `made-to-stick` | https://github.com/wondelai/skills | c172996 | MIT |
| `campaign-plan` | https://github.com/anthropics/knowledge-work-plugins (`marketing/skills/`) | da38ec1 | Apache-2.0 |
| `brand-review` | https://github.com/anthropics/knowledge-work-plugins (`marketing/skills/`) | da38ec1 | Apache-2.0 |
| `knowme-brand-standard` | authored in this repo (2026-09-25) | — | project |
| `agent-led-marketing-site` | authored in this repo (2026-09-25) | — | project |
| `humanizer` | https://github.com/blader/humanizer | 8b3a178 | MIT |

Notes (2026-09-27):
- `campaign-plan` and `brand-review` link to `../../CONNECTORS.md`, and `emails` links to `../../tools/…`. Those are upstream files that are not vendored, so the links are dead. Don't go looking for connectors; the skills fall back to asking the user.
- `campaign-plan` and `brand-review` are Apache-2.0. Keep this record of the licence with any redistribution.
- `marketing-plan` writes to `~/marketing-plans/` by default. Agents write inside their owned path instead.
