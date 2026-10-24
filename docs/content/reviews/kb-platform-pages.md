# Review record: kb-platform-pages

Phase `usefulness-update`. Author: km-content-creator. Sixteen concept pages, one per platform portfolio entry, registered in the build manifest, with six eval questions appended (none critical).

## Pages and status wording
Each first paragraph and "Status and version" section quotes the portfolio's status in its own words. Versions come from `{{v:<id>}}` placeholders. Entries with no repository say "no repository was identified" and carry no number. The inference forks entry is an umbrella and says so.

- Flint AI Code Companion / PMPO, Flint Agent Mesh: specification and prototype only; stated as not delivered.
- Flint Gate: existing implementation, production qualification not independently audited; no tagged release.
- Flint Forge: the README "v1.0-ready" source claim (not an audit) and the stable GitHub release v1.0.0 are stated separately.
- Flint Realtime Fabric: README reports phase-18 scope complete; deferred items listed from the README.
- Flint core infrastructure: existing source, deployment not audited. Hosting, addresses and cluster details deliberately omitted.
- Prometheus Entity Management: v4.1.1 stable; the portfolio's warning that version records differ is kept.
- Prometheus Entity Sync: existing implementation and prototype.
- gen_ui: implemented modules plus specification; no repository; "platform acceptance remains specific".
- Prometheus Parking Lot: registry 0.3.0; the Candle-VLLM caveat (earlier 0.1.0 revision) is stated.
- DocuMind: prototype; Core/Pro boundary stated as unresolved, not resolved.
- Knowledge Gateway: graph-discovery completeness unverified; the page rests on the portfolio line only.
- Prometheus Knowledge: tag v1.11.0, "a git tag without a GitHub release".
- Demo hosting platform: proposed; scaffold; the historical server implemented only a health route.
- Inference forks and Candle-VLLM: fork work; Parking Lot 0.1.0 pinned at 32b481d; no live Numen integration verified.

## Sources
Portfolio Edition 2 (IPFS) for every page. Read-only README reads for Flint Gate, Flint Forge, Flint Realtime Fabric, Flint core infrastructure, Entity Management, Entity Sync, Parking Lot, Prometheus Knowledge, demos and Candle-VLLM (the first 3,000 to 3,800 characters of each). Registry and release URLs come from the facts file.

## Not verified
- Only the opening of each README was read; later sections may qualify what is stated.
- No repository was found for Flint AI Code Companion, Agent Mesh, gen_ui, DocuMind or Knowledge Gateway, so those pages rest on the portfolio line alone and are short.
- The liter-llm fork has no version or detail in any source read; the inference page says so.
- Entity Management's npm package count and dates are README statements; the registry was not queried.

## Left out
- Fabric README's "independent re-audit found zero CRITICAL and zero HIGH": a self-reported audit claim, too strong to repeat.
- Infrastructure README hostnames, addresses, cluster, identity-provider and database details (withheld).
- Any inferred relationship. Only relationships a README states appear, labelled as design, not proof of integration.

## Review status
Author self-review only. The content officer's AI pre-review and the operator's approval are still required. Nothing reaches the concierge until the operator seeds the KB.

## Pre-review fixes (km-chief-content-officer, PASS WITH FIXES)
Applied: Forge status in paragraph one (README v1.0-ready, v1.0.0 release, neither an audit); Candle-VLLM Numen wording (portfolio direction only, no live integration verified); Gate names "a session from an identity service" (Postgres storage of routes is stated in its README); core infrastructure first chunk says configuration code, not a running service, and the Gate/Quarry/Fabric mapping is stated in the flint-infra README; bullets open with the product name; Parking Lot "Registry publication is not runtime qualification"; DocuMind "one personal post"; gen_ui "partly implemented"; Flint AI Code Companion "a visitor cannot try it yet"; inference forks says liter-llm has no further detail.
README spot-check against full READMEs (Gate, Fabric, Entity Sync, Knowledge, Entity Management, Parking Lot, Candle-VLLM, demos, Forge, infra): one sentence changed, Fabric "full media forwarding" to the README's "full sovereign SFU media". All other claims were found in the READMEs.
