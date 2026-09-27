# KnowMe flagship product brief (starting point for marketing and content; the product repo remains the source of truth)

Compiled 2026-09-27 from the flagship repo, `/Users/gqadonis/Projects/know-me/know-me-system`, and the brand folder, `/Users/gqadonis/Projects/know-me/branding`. Owner: km-cmo. Every claim cites its source. Re-check the source before using a claim, because product details change.

## What it is and who it's for
- "A sovereign personal AI platform" that runs models on the user's own hardware by default. Repo headline: "Personal intelligence, on your device." (`README.md`; `docs/knowme-functional-spec.html` §01). The product vision is one app with the same workflow on phone, tablet and desktop; today only desktop is working (see the status table). Say "desktop" when describing what exists now.
- Audience: "individuals who want AI leverage without surrendering their data". Four personas: Knowledge Worker, Privacy-Conscious Professional (attorney, therapist, physician, journalist), Builder, and Cross-Device Power User. (spec §03; journeys in `docs/knowme-moodboard-user-journeys.html`)

## Shipped vs specified (check this before any claim)
Status comes from `docs/implementation-roadmap.md` (lines 14–30) and `README.md` (lines 31–33, 108–110). Do not use the functional spec for status.

| Capability | Status | May marketing say it exists today? |
|---|---|---|
| Rust core, desktop app, on-device inference (engines per README) | **Working** | Yes, within what README states |
| Hands tile UI | **Partial**: UI exists, scheduler and policy execution not wired | No. "Coming" wording only, with operator approval |
| Hands system (scheduled agents) | **Skeleton**: domain model real, UAR scheduler wiring stubbed | No |
| BossFang / OFP peer sync | **Skeleton**: model real, QUIC gossip and CRDT merge stubbed | No |
| Plugin system and marketplace | **Skeleton**: manifest and WIT contract real, Wasmtime host, fetcher and signature verification stubbed | No |
| Mobile agent runtime | Compile-verified, not certified on a physical device | No device claims |

Anything marked "No" may appear only as roadmap intent ("planned"), never as a feature, and only after the operator approves the wording.

## Capabilities and platforms (as specified; see status above)
- **Eight tiles:** Chat, Hands, Image, Audio, Prompt Lab, Skills, Models, Settings. (spec §04)
- **Hands:** unsupervised, scheduled agents. There are six templates: Researcher, Inbox Triage, Code Watcher, Market Pulse, Daily Journal, Reading List. (spec §04, §06)
- **Plugins and sync:** plugins extend the app without touching its core. Devices sync peer-to-peer and encrypted through the user's own BossFang server. (spec §07–08)
- **Platforms:**
  - Desktop (macOS, Windows, Linux; Tauri plus React) is the working app today.
  - iOS and Android (Flutter) are specified, and their agent runtime is compile-verified only. Mobile inference is on the roadmap for months 8–10.
  - Marketing may say mobile is "planned", with operator-approved wording, but never that it is available. (`README.md`; `docs/implementation-roadmap.md`)
- **Status, don't overclaim:** the mobile agent runtime is compile-verified but not yet certified on a physical device. (`README.md`; `docs/reports/embedded-uar-flutter-assessment.md`; `docs/platform-support.md`, last device check 2026-07-18)
- **Warning:** the functional spec's engine names (mistral.rs, llama.cpp) are out of date. The current engines are llama-cpp-2/MLX on desktop, MLX-Swift on iOS and LiteRT-LM on Android. Check every technical claim against `README.md` and `versions.toml`, not the spec.

## Differentiators, in the product's own words (spec §02, "The four commitments")
1. "Sovereignty is structural, not configurable." In their words: "there is no 'private mode' because there is no other mode." Cloud calls need explicit policy approval.
2. Knowledge-Driven Development: a local knowledge graph that the user owns.
3. "Compile-time over query-time": fast, predictable, auditable behaviour.
4. "The user owns the substrate": everything can be exported.
- There will deliberately be no hosted "KnowMe Cloud" tier. (spec §11) Competitor landscape: `docs/competitive-analysis-2026-07-16.md`.

## Pricing (spec §10; **decided by the operator only**, and not publishable while it depends on skeleton features)
- **Free, $0:** all eight tiles, on-device models, one Hand, no sync.
- **KnowMe, $20/month:** adds cloud models, up to 10 Hands, sync to one BossFang, and the plugin marketplace.
- **KnowMe Pro, $200/month:** adds a licensed local Qwen 35B model, unlimited Hands, multi-instance BossFang sync, priority plugin signing, and an air-gap deployment guide and support. The spec calls this the "load-bearing" tier. Air-gap *mode* itself is available at any tier through the Cedar deny policy, so don't sell air-gap as Pro-only. (spec lines 1654, 1700)
- **Warning:** the $20 and $200 tiers are defined by Hands, sync and the marketplace, which are skeleton only (see the status table). Publish no tier or price copy until the operator decides the launch pricing.

## Brand and messaging
- **Brand Guide v1.0:** `branding/knowme-brand-guide.html`. Template: `branding/knowme-brand-template.html`. Logos: `branding/logos/`. Email signatures: `branding/signature/`. Social share images: `know-me-system/docs/og/`.
- **Taglines (Brand Guide §11). Use each only in its stated context:**

| Tagline | Context | Tone |
|---|---|---|
| "AI that understands you." | Primary, all contexts | Personal, warm, direct |
| "Your personal intelligence." | Product marketing | Aspirational, confident |
| "Deeply personal AI." | Hero blocks, tagline-only | Intimate, distinctive |
| "Know yourself. Grow yourself." | Campaigns, long-form | Action-oriented, growth |
| "Intelligence, intimate." | Premium, presentations | Minimal, architectural |
- **Core Promise:** "KnowMe doesn't feel like software. It feels like a system that was built for exactly you — because it was."
- **Character:** "warm but never casual, personal but never sentimental."
- **Long-form source material (24 Sep 2026):** `docs/knowme-company-of-one.html`, `docs/knowme-build-your-bench.html`.

## Launch
- The only launch plan is the 18-month roadmap in spec §11:
  - months 1–2: public launch, with the Free and $20 tiers
  - months 3–4: the Pro tier
  - months 5–7: the marketplace, at plugins.know-me.tools
  - months 6–8: multi-instance sync
  - months 8–10: mobile inference
  - months 15–18: Enterprise
- It gives no dates or channels.
- **Gaps:** no content calendar, editorial plan or campaign plan exists anywhere yet. the root `README.md` (line 159) references a "business-model" strategy folder that does not exist.

## Related products (relationship unverified until checked)
- UAR (Universal Agent Runtime), BossFang/LibreFang, "The Boss" (Cherry Studio based), OpenDesign, flint-gate, and the KnowMe Builder (`docs/knowme-builder-extensibility-spec.md`).
- Sibling folders: `know-me-app`, `knowledge-gateway`, `charcoal-agent` (this site), `knowtes`, `boss-landing-spot`.
