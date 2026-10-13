# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who arrive at know-me.tools from a product-specific link: the operator's articles on Medium and LinkedIn, and other marketing links tied to one of the products. They are curious or evaluating, often have read a short piece about one product, and want to know what it is, whether it fits them and what is available now. They do not start with a product in mind to buy; they decide how deep to go. Primary audience detail beyond this (individuals who value privacy versus professionals) is not confirmed.

## Product Purpose

know-me.tools is the front door to the KnowMe AI, LLC products. It gives selective, minimal content about each product and puts a concierge chat in front of the visitor as the way to get whatever depth they want ("selective discovery"). The concierge answers from a curated knowledge base and cites its sources; it is read-only and cannot act for the visitor. Success: a visitor finds out what they came to learn, goes deeper by asking, and leaves knowing which product (if any) is theirs and where to get it. Using the chat is itself the demonstration: the site runs on the same platform and architecture it describes.

## Positioning

KnowMe's truthful claim: the customer helps build their own product through use; the assistants and agents are designed to adjust to the person. Data stays under the person's control: local sovereignty of data, decentralised and secure data management, and no dependence on any single LLM vendor. This is stated as design intent, not as a guarantee. The operator wants little more said on the site, because more products are coming and the concierge exists to help visitors navigate them.

## Operating Context

- Visitors are remembered through the conversations stored locally in the browser (PGlite), whether or not they are logged in; the experience is customised from that local data, and nothing about it is sent anywhere to do so.
- The site chat has no tools beyond rendering an answer card; it retrieves from a knowledge base and cites sources. It is not an account, checkout or support system.
- Nothing is bought on this site. Each paid offering will have its own site; business models are undecided and depend on feedback from this site.
- The Boss, the desktop app, is free, open source and downloadable now from the-boss.know-me.tools. The operator states it embeds the Universal Agent Runtime, BossFang and the Surreal Memory Server (to be verified against its repository before publication).

## Capabilities and Constraints

- Constraints the site must respect: no pricing, no availability claims beyond what is documented, no compliance or certification claims, no stronger privacy promise than the product backs, no client names.
- The AI nature of every answer and every generated card must be visible to the visitor; the knowledge base is the only source of product facts.
- Terminology: "KnowMe AI, LLC" is the legal name; products are KnowMe, The Boss, BossFang, Universal Agent Runtime, Surreal Memory Server and the Prometheus skill packages. Company and product facts come from the knowledge base, not from the model's own knowledge.
- Undecided: business models; the later products; the wording of the AI disclosure (draft pending approval).

## Brand Commitments

- Existing, binding identity: the KnowMe brand tokens and "Flat 2.0" system in `src/styles/tokens.css` and `docs/design/`, and the approved tagline "AI that understands you." Preserve it; this phase refines surfaces within it.
- The voice is direct and execution-first, without marketing language (see `AGENTS.md` communication rules).

## Evidence on Hand

- A curated knowledge base under `content/knowledge/` (to be expanded in this phase from the products' own documentation) and OKF source documents under `docs/knowledge-source/`.
- The Boss download page at the-boss.know-me.tools.
- Absent, and not to be fabricated: testimonials, customer names, benchmarks, pricing, usage numbers.

## Product Principles

1. Selective discovery: say little, let the visitor pull depth through the concierge.
2. The experience is the proof: the chat itself shows the platform working.
3. Truth over reach: every product claim is supported by the product's own documentation or is phrased as design intent.
4. Local first: what the site learns about a visitor stays on their device.
5. The model is labelled as a model: generated content is always marked as such.

## Accessibility & Inclusion

WCAG 2.2 AA is the standard the repository already enforces (contrast pairs in tests, keyboard and reduced-motion requirements, no text under 12 px). Visitors on phones (320 px and up) are expected, since many arrive from social links.
