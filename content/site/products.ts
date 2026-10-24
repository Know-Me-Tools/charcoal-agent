/**
 * DRAFT, pending operator approval (record in `docs/content/reviews/site-product-pages.md`).
 *
 * The hand-written copy of the ten product pages: for each, the name, one
 * lead sentence, three to five key facts (each traceable to a knowledge page
 * or the facts row), two to four lead questions and the sources.
 *
 * What is NOT here, on purpose: the status, the version line and the "Checked"
 * date. A page reads them from the generated directory
 * (`content/site/directory.ts`, built from `docs/knowledge-source/product-facts.json`),
 * so they cannot drift. No fact may carry a version number or a date.
 *
 * `node scripts/site/check-products.mjs` (CI) fails when a page names a slug
 * or a facts row that is not public or not in the directory, when a limit
 * below is broken, when a source file does not exist, when a link is not an
 * https URL, or when the copy makes a pricing, compliance or certification
 * claim.
 *
 * Limits (docs/design/product-directory.md section 4.1): name at most 32
 * characters; lead at most 25 words; a fact label at most 3 words and its
 * value at most 20 words and never a restatement of the lead; 2 to 4
 * questions of at most 70 characters, worded by section 5.2 (ends with "?",
 * names the product by its display name, no pronoun, no superlative, no
 * claim); the first question is the directory tile's question. A source link
 * must resolve publicly: a private repository is left out, not linked
 * (`gh api repos/<owner>/<repo> --jq .private`). A proposed or design-stage
 * product is never described in the present tense as available.
 *
 * Plain data only (type declarations only, no runtime imports) so Node can
 * load this file directly, without a build step, from the check script.
 */

export interface ProductFact {
	/** At most 3 words. */
	label: string;
	/** At most 20 words; no version number, no date. */
	value: string;
	/**
	 * Where the fact comes from: a path under `docs/knowledge-source/`
	 * (for example `the-boss/the-boss.md`) or `facts:<id>` for a facts row.
	 */
	source: string;
}

export interface ProductSource {
	label: string;
	/** An https URL that resolves without signing in. */
	url: string;
}

export interface ProductPageCopy {
	/** The page and directory-tile slug: /products/<slug>. */
	slug: string;
	/** Equals the directory tile's title. At most 32 characters. */
	name: string;
	/** Facts-file row ids this page covers (the directory tile's rows). */
	rows: string[];
	/** One sentence, at most 25 words. */
	lead: string;
	facts: ProductFact[];
	/** 2 to 4 questions; the first is the directory tile's question. */
	questions: string[];
	/** May be empty only when every public source is a private repository. */
	sources: ProductSource[];
}

export const PRODUCT_PAGES: ProductPageCopy[] = [
	{
		slug: "the-boss",
		name: "The Boss",
		rows: ["boss"],
		lead: "An open-source AI desktop workspace for macOS and Windows, with conversations, agent sessions, tools and project work in one application.",
		facts: [
			{
				label: "Built on",
				value: "Cherry Studio, the open-source client, extended by KnowMe AI, LLC.",
				source: "the-boss/the-boss.md",
			},
			{
				label: "Platforms",
				value: "macOS 12 or later and Windows 10 or later. Linux is not offered.",
				source: "the-boss/the-boss.md",
			},
			{
				label: "Includes",
				value: "Release installers include the Universal Agent Runtime and BossFang as programs that run beside it.",
				source: "the-boss/the-boss.md",
			},
			{
				label: "Get it",
				value: "A download page and GitHub releases; no account is required.",
				source: "the-boss/the-boss.md",
			},
			{
				label: "Releases",
				value: "Features in the current source are not always in the released installers.",
				source: "facts:boss",
			},
		],
		questions: [
			"What can I do with The Boss today?",
			"How do I install The Boss?",
			"How is The Boss different from BossFang?",
		],
		sources: [
			{ label: "The Boss download page", url: "https://the-boss.know-me.tools" },
			{ label: "Releases on GitHub", url: "https://github.com/Prometheus-AGS/the-boss/releases" },
		],
	},
	{
		slug: "bossfang",
		name: "BossFang",
		rows: ["bossfang"],
		lead: "A Rust agent operating system for running AI agents with tools, memory and messaging, separate from The Boss desktop workspace.",
		facts: [
			{
				label: "Forked from",
				value: "LibreFang, an open-source project; upstream changes are merged in over time.",
				source: "bossfang/bossfang-overview.md",
			},
			{
				label: "Changes",
				value: "Where data is stored, how memory works and how it reaches models through the Universal Agent Runtime.",
				source: "bossfang/bossfang-overview.md",
			},
			{
				label: "Runtime link",
				value: "Connects to an existing Universal Agent Runtime and never starts one; documented as not yet built or tested.",
				source: "bossfang/bossfang-status-and-licence.md",
			},
			{
				label: "Licence",
				value: "MIT, with copyright held by the LibreFang contributors.",
				source: "bossfang/bossfang-status-and-licence.md",
			},
			{
				label: "Install",
				value: "No tested end-user install path is established yet.",
				source: "bossfang/bossfang-status-and-licence.md",
			},
		],
		questions: [
			"How is BossFang different from The Boss?",
			"How is BossFang different from LibreFang?",
			"How does BossFang connect to the Universal Agent Runtime?",
		],
		sources: [
			{ label: "Source repository", url: "https://github.com/GQAdonis/librefang" },
			{ label: "Sidecar builds on GitHub", url: "https://github.com/GQAdonis/librefang/releases" },
		],
	},
	{
		slug: "universal-agent-runtime",
		name: "Universal Agent Runtime",
		rows: ["uar"],
		lead: "A Rust server that runs AI agents: it calls models, runs tools under a policy and streams results to a user interface.",
		facts: [
			{
				label: "Portfolio note",
				value: "The portfolio lists work as stopped and runtime qualification as not established; the repository shows newer releases.",
				source: "facts:uar",
			},
			{
				label: "Clients",
				value: "Clients reach it over HTTP and server-sent events; every action is checked and recorded.",
				source: "universal-agent-runtime/universal-agent-runtime-overview.md",
			},
			{
				label: "Used by",
				value: "The Boss bundles it, KnowMe is built on it and the agent on this site runs on it.",
				source: "universal-agent-runtime/universal-agent-runtime-overview.md",
			},
			{
				label: "Support levels",
				value: "Its support matrix marks each feature Stable, Preview or Experimental; only Stable rows are backed by release checks.",
				source: "universal-agent-runtime/universal-agent-runtime-status-and-licence.md",
			},
			{
				label: "Licence",
				value: "MIT for the code; the documentation is CC-BY-4.0.",
				source: "universal-agent-runtime/universal-agent-runtime-status-and-licence.md",
			},
		],
		questions: [
			"What does the Universal Agent Runtime do?",
			"Which products run on the Universal Agent Runtime?",
			"What do Stable and Preview mean for the Universal Agent Runtime?",
		],
		sources: [
			{ label: "Source repository", url: "https://github.com/Prometheus-AGS/universal-agent-runtime" },
			{ label: "Releases on GitHub", url: "https://github.com/Prometheus-AGS/universal-agent-runtime/releases" },
			{
				label: "Product support matrix",
				url: "https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/docs/product-support-matrix.md",
			},
		],
	},
	{
		slug: "surreal-memory-server",
		name: "Surreal Memory Server",
		rows: ["memory"],
		lead: "A memory service for AI agents, written in Rust on SurrealDB, with a knowledge graph, scoped memories and hybrid search.",
		facts: [
			{
				label: "Reached through",
				value: "MCP, over stdio or HTTP, and a REST API.",
				source: "surreal-memory-server/surreal-memory-server-overview.md",
			},
			{
				label: "Writes",
				value: "Go through a durable operation ledger, so a caller can confirm what was stored after a timeout or restart.",
				source: "surreal-memory-server/surreal-memory-server-overview.md",
			},
			{
				label: "Used by",
				value: "BossFang uses its library; the Universal Agent Runtime's optional memory system and The Boss connect to it.",
				source: "surreal-memory-server/surreal-memory-server-overview.md",
			},
			{
				label: "Published as",
				value: "Source published for review; the owner's note says it is not a release.",
				source: "surreal-memory-server/surreal-memory-server-status-and-licence.md",
			},
			{
				label: "Licence",
				value: "MIT, with Prometheus AGS as copyright holder.",
				source: "surreal-memory-server/surreal-memory-server-status-and-licence.md",
			},
		],
		questions: [
			"How does the Surreal Memory Server store agent memory?",
			"Which products use the Surreal Memory Server?",
			"How is the Surreal Memory Server run?",
		],
		sources: [
			{ label: "Source repository", url: "https://github.com/Prometheus-AGS/surreal-memory-server" },
			{ label: "Tags on GitHub", url: "https://github.com/Prometheus-AGS/surreal-memory-server/tags" },
		],
	},
	{
		slug: "prometheus-skill-pack",
		name: "Prometheus Skill Pack",
		rows: ["skills", "mini"],
		lead: "Two packages of reusable skills for AI coding assistants: the full Prometheus Skill Pack and the smaller, portable Prometheus Skills Mini.",
		facts: [
			{
				label: "A skill is",
				value: "A packaged set of instructions an AI coding assistant can load for a kind of task.",
				source: "skill-packages/prometheus-skill-packages-overview.md",
			},
			{
				label: "Full pack",
				value: "Covers many languages and domains and can add native services for durable memory, model routing and research.",
				source: "skill-packages/prometheus-skill-packages-overview.md",
			},
			{
				label: "Mini",
				value: "Process, team, research and UI skills; needs Node 22 or later and Git and runs on Windows, macOS and Linux.",
				source: "skill-packages/prometheus-skill-packages-choosing-full-or-mini.md",
			},
			{
				label: "Install",
				value: "Do not install both in the same home: they share skill names, so one can hide the other.",
				source: "skill-packages/prometheus-skill-packages-choosing-full-or-mini.md",
			},
		],
		questions: [
			"What is in the Prometheus Skill Pack?",
			"Should I choose Prometheus Skill Pack or Prometheus Skills Mini?",
			"How do I install Prometheus Skills Mini?",
		],
		sources: [
			{ label: "Skill Pack repository", url: "https://github.com/Prometheus-AGS/prometheus-skill-system" },
			{ label: "Skills Mini repository", url: "https://github.com/Prometheus-AGS/prometheus-skills-mini" },
		],
	},
	{
		slug: "flint-platform",
		name: "Flint platform",
		rows: ["gate", "forge", "fabric"],
		lead: "Flint Gate, Forge and Realtime Fabric: an auth proxy for streaming AI traffic, a data and edge-compute plane, and a realtime event spine.",
		facts: [
			{
				label: "Flint Gate",
				value: "Authenticates, authorizes and enriches requests, and can validate AG-UI events.",
				source: "flint-gate/flint-gate.md",
			},
			{
				label: "Flint Forge",
				value: "Quarry offers REST and GraphQL over Postgres, Anvil adds extensions and Kiln runs signed WebAssembly edge functions.",
				source: "flint-forge/flint-forge.md",
			},
			{
				label: "Realtime Fabric",
				value: "A durable event spine on Apache Iggy, with separate transports for media, peer CRDT sync and federation.",
				source: "flint-realtime-fabric/flint-realtime-fabric.md",
			},
			{
				label: "How they fit",
				value: "Forge's README says it sits behind Gate and uses the Fabric; design statements, not proof of a deployment.",
				source: "flint-forge/flint-forge.md",
			},
		],
		questions: [
			"What are Flint Gate, Forge and Realtime Fabric?",
			"How does Flint Gate handle streaming AI traffic?",
			"What do Quarry, Anvil and Kiln do in Flint Forge?",
		],
		sources: [
			{ label: "Flint Gate repository", url: "https://github.com/Know-Me-Tools/flint-gate" },
			{ label: "Flint Forge repository", url: "https://github.com/Know-Me-Tools/flint-forge" },
			{ label: "Realtime Fabric repository", url: "https://github.com/Prometheus-AGS/flint-realtime-fabric" },
		],
	},
	{
		slug: "prometheus-entity-management",
		name: "Prometheus Entity Management",
		rows: ["pem"],
		lead: "A normalized, reactive entity graph for web, mobile, desktop and local-first apps, with generated-UI integration.",
		facts: [
			{
				label: "Also called",
				value: "entity-graph.",
				source: "prometheus-entity-management/prometheus-entity-management.md",
			},
			{
				label: "How it works",
				value: "Each entity lives once at a type and id address, so one write updates every view of it.",
				source: "prometheus-entity-management/prometheus-entity-management.md",
			},
			{
				label: "Packages",
				value: "Published as npm packages, with a Flutter package on pub.dev and a DevTools extension as a developer-mode ZIP.",
				source: "prometheus-entity-management/prometheus-entity-management.md",
			},
			{
				label: "Version records",
				value: "The version shown is the latest GitHub release; older portfolio snapshots list other numbers.",
				source: "prometheus-entity-management/prometheus-entity-management.md",
			},
		],
		questions: [
			"What problem does Prometheus Entity Management solve?",
			"Which platforms does Prometheus Entity Management support?",
			"How does Prometheus Entity Management keep views in step?",
		],
		sources: [
			{ label: "Source repository", url: "https://github.com/Prometheus-AGS/prometheus-entity-management" },
			{ label: "Releases on GitHub", url: "https://github.com/Prometheus-AGS/prometheus-entity-management/releases" },
		],
	},
	{
		slug: "parking-lot",
		name: "Parking Lot",
		rows: ["parking"],
		lead: "A Rust library for resource-aware background work, bounded execution and collecting results after the request that started them has returned.",
		facts: [
			{
				label: "How it works",
				value: "Each task declares a cost; a pool starts it when the cost fits free capacity and parks it otherwise.",
				source: "prometheus-parking-lot/prometheus-parking-lot.md",
			},
			{
				label: "Ordering",
				value: "Parked tasks start by priority, then in submission order; a task costing more than the pool's capacity is rejected.",
				source: "prometheus-parking-lot/prometheus-parking-lot.md",
			},
			{
				label: "Durable mode",
				value: "Tasks can be parked in a Postgres or redb queue so accepted work survives a crash.",
				source: "prometheus-parking-lot/prometheus-parking-lot.md",
			},
			{
				label: "Registry",
				value: "Published on crates.io; registry publication is not runtime qualification.",
				source: "prometheus-parking-lot/prometheus-parking-lot.md",
			},
			{
				label: "Used by",
				value: "The Candle-VLLM Prometheus fork submits completion and streaming work through a pool.",
				source: "prometheus-parking-lot/prometheus-parking-lot.md",
			},
		],
		questions: [
			"When would I use Parking Lot?",
			"How does Parking Lot decide which task starts next?",
			"Can Parking Lot keep work across a crash?",
		],
		sources: [
			{ label: "crates.io", url: "https://crates.io/crates/prometheus_parking_lot" },
			{ label: "Source repository", url: "https://github.com/Prometheus-AGS/prometheus-parking-lot-rs" },
		],
	},
	{
		slug: "knowme",
		name: "KnowMe",
		rows: ["knowme"],
		lead: "A personal AI platform from KnowMe AI, LLC that is still in development and has not been publicly released.",
		facts: [
			{
				label: "Design intent",
				value: "One application for phone, tablet and desktop, with models designed to run on your own hardware.",
				source: "knowme/knowme-overview.md",
			},
			{
				label: "Platforms",
				value: "Being built for macOS, Windows, Linux, iOS and Android from one codebase; none is publicly released.",
				source: "knowme/knowme-platforms-and-status.md",
			},
			{
				label: "Built with",
				value: "Tauri and React on desktop, and Flutter on phones.",
				source: "knowme/knowme-platforms-and-status.md",
			},
			{
				label: "Download",
				value: "The desktop app available to download is The Boss, which is not an edition of KnowMe.",
				source: "knowme/knowme-platforms-and-status.md",
			},
		],
		questions: [
			"What is KnowMe, and can I use it yet?",
			"Is KnowMe the same as The Boss?",
			"Which devices is KnowMe being built for?",
		],
		sources: [{ label: "Source repository", url: "https://github.com/Know-Me-Tools/know-me-system" }],
	},
	{
		slug: "locus",
		name: "Locus",
		rows: ["locus"],
		lead: "A proposed owner-controlled private assistant, still at the design stage, with no working Locus to use.",
		facts: [
			{
				label: "Also called",
				value: "Private Dot.",
				source: "locus/locus.md",
			},
			{
				label: "Proposed to",
				value: "Keep durable state, use selective memory and run work on replaceable execution workers.",
				source: "facts:locus",
			},
			{
				label: "What exists",
				value: "A documentation-first specification, a design kit and a local capture wrapper with tests; no Locus runtime.",
				source: "locus/locus.md",
			},
			{
				label: "Unfinished",
				value: "Book rendering, the full PDF and publication of the Book to IPFS.",
				source: "locus/locus.md",
			},
		],
		questions: ["What is Locus meant to do?", "How far along is Locus?", "What is the Book of Locus?"],
		// The repository is private (`gh api repos/Know-Me-Tools/locus --jq .private` is true), so nothing is linked.
		sources: [],
	},
];
