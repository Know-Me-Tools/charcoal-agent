/**
 * DRAFT, pending operator approval (record in `docs/content/reviews/site-home-directory.md`).
 *
 * The hand-written copy of the home page product directory: the section
 * heading and lead, the six family names and lines, the six status labels,
 * the display name, family and one-line summary of each public portfolio
 * entry, and the ten lead questions.
 *
 * `scripts/site/build-directory.mjs` combines this file with
 * `docs/knowledge-source/product-facts.json` and writes
 * `content/site/directory.ts`. Status, version line and the order of entries
 * come from the facts file and the rules in docs/design/product-directory.md;
 * only the words below are written by hand. The script's `--check` fails when
 * a public facts row has no entry here, when an entry names an id that is not
 * a public facts row, and when the generated file is out of date.
 *
 * Rules every string follows (docs/design/product-directory.md sections 3 and
 * 5.2): a summary is one line of at most 90 characters and never reads
 * stronger than the row's `portfolioStatus` (a proposed or design-only entry
 * is never in the present tense as available); a question ends in "?" and is
 * at most 70 characters; no price, no certification or compliance claim, no
 * client name, none of the facts file's `withheldTerms`, and none of
 * "seamless", "cutting-edge", "leverage", "utilize", "synergy".
 *
 * Plain data only (no enums, no runtime imports) so Node can load this file
 * directly, without a build step, from the generator script.
 */

export type DirectoryStatus =
	| "released"
	| "prerelease"
	| "development"
	| "prototype"
	| "design"
	| "assessment";

export interface DirectoryFamilyCopy {
	slug: string;
	name: string;
	line: string;
}

export interface DirectoryEntryCopy {
	/** Display name. */
	name: string;
	/** A slug from `families`. */
	family: string;
	/** One line, at most 90 characters. */
	summary: string;
}

export interface DirectoryLeadCopy {
	/** The product page slug (the page ships in a later change; the tile does not link yet). */
	slug: string;
	family: string;
	title: string;
	/** Facts-row ids shown in this tile, in display order. */
	rows: string[];
	/** The tile's ask chip: the visitor's first message. At most 70 characters. */
	question: string;
	/** Tile summary; required when the tile covers more than one row. */
	summary?: string;
}

export interface DirectoryCopy {
	heading: string;
	/** `{total}` is replaced by the number of public entries. */
	lead: string;
	/** `{n}` is replaced by the number of entries in the family. */
	statusMixLabel: string;
	/** `{n}` and `{family}` are replaced. */
	showMoreTemplate: string;
	showFewer: string;
	/** The index-row ask chip's prompt. `{name}` is replaced by the display name. */
	rowPromptTemplate: string;
	families: DirectoryFamilyCopy[];
	/** The label shown in each status badge. */
	statuses: Record<DirectoryStatus, string>;
	entries: Record<string, DirectoryEntryCopy>;
	leads: DirectoryLeadCopy[];
}

export const DIRECTORY_COPY: DirectoryCopy = {
	heading: "What can I ask about?",
	lead: "{total} products and projects from KnowMe AI, LLC, each with the status its own source gives. Ask the concierge about any of them.",
	statusMixLabel: "Status of the {n} entries",
	showMoreTemplate: "Show {n} more in {family}",
	showFewer: "Show fewer",
	rowPromptTemplate: "Tell me about {name}. How far along is it?",

	families: [
		{ slug: "applications", name: "Applications", line: "Apps and clients a person uses directly." },
		{ slug: "agents-and-memory", name: "Agents and memory", line: "Runtimes, agent systems and memory services." },
		{
			slug: "platform",
			name: "Platform and infrastructure",
			line: "Identity, data, realtime and hosting services.",
		},
		{
			slug: "developer-tools",
			name: "Developer tools and skills",
			line: "Libraries, skills and tools for building with agents.",
		},
		{
			slug: "integrations",
			name: "Integrations",
			line: "Work that connects to software outside the portfolio.",
		},
		{
			slug: "services-and-research",
			name: "Services and research",
			line: "Service designs, capabilities and research directions.",
		},
	],

	statuses: {
		released: "Released",
		prerelease: "Pre-release",
		development: "In development",
		prototype: "Prototype",
		design: "Design only",
		assessment: "Under assessment",
	},

	entries: {
		// Applications
		boss: {
			name: "The Boss",
			family: "applications",
			summary: "A desktop workspace for conversations, agents, tools and projects.",
		},
		knowme: {
			name: "KnowMe",
			family: "applications",
			summary: "A personal intelligence app in progress: memory, your inference, agent workflows.",
		},
		locus: {
			name: "Locus",
			family: "applications",
			summary: "A proposed owner-controlled private assistant with durable state and selective memory.",
		},
		concierge: {
			name: "KnowMe Concierge",
			family: "applications",
			summary: "The chat client behind this site, with streamed agent replies and local threads.",
		},
		studio: {
			name: "Prometheus Studio",
			family: "applications",
			summary: "A cross-platform AI development workspace with a local database and IPFS.",
		},
		documind: {
			name: "DocuMind",
			family: "applications",
			summary: "A prototype for document and knowledge workflows, with an operator console.",
		},
		flint: {
			name: "Flint AI Code Companion",
			family: "applications",
			summary: "A prototype of AI-assisted code generation, with its process specifications.",
		},
		meet: {
			name: "Know Meet",
			family: "applications",
			summary: "A synthetic prototype of an agentic meeting experience; integrations unverified.",
		},
		realtor: {
			name: "KnowMe realtor assistant",
			family: "applications",
			summary: "A prototype real-estate assistant, demonstrated on synthetic data.",
		},

		// Agents and memory
		uar: {
			name: "Universal Agent Runtime",
			family: "agents-and-memory",
			summary: "An agent runtime that several of these applications depend on.",
		},
		bossfang: {
			name: "BossFang",
			family: "agents-and-memory",
			summary: "A Rust agent operating system, separate from The Boss desktop workspace.",
		},
		memory: {
			name: "Surreal Memory Server",
			family: "agents-and-memory",
			summary: "Agent memory: scoped memories, a knowledge graph and hybrid search.",
		},
		"knowledge-gateway": {
			name: "Knowledge Gateway",
			family: "agents-and-memory",
			summary: "Federated access to document sources through shared adapters and MCP tools.",
		},
		knowledge: {
			name: "Prometheus Knowledge",
			family: "agents-and-memory",
			summary: "Markdown knowledge records, prompt snapshots and memory reconciliation.",
		},
		tranquil: {
			name: "Tranquil",
			family: "agents-and-memory",
			summary: "A Rust personal-data-server direction for Parlour; private agent jobs are designed.",
		},
		praxis: {
			name: "KnowMe Praxis",
			family: "agents-and-memory",
			summary: "A specification for agentic container and system architecture.",
		},
		numen: {
			name: "Numen",
			family: "agents-and-memory",
			summary: "Proposed governed orchestration and portable execution across hosts.",
		},
		"numen-enclave": {
			name: "Numen Enclave",
			family: "agents-and-memory",
			summary: "A proposed architecture for keeping private data and inference in the owner's domain.",
		},
		synaxis: {
			name: "Synaxis",
			family: "agents-and-memory",
			summary: "A proposed durable messaging, orchestration and shared memory service.",
		},

		// Platform and infrastructure
		gate: {
			name: "Flint Gate",
			family: "platform",
			summary: "An authentication and authorization proxy for streaming AI workloads.",
		},
		forge: {
			name: "Flint Forge",
			family: "platform",
			summary: "Data and edge compute: REST and GraphQL access and signed WASM edge functions.",
		},
		fabric: {
			name: "Flint Realtime Fabric",
			family: "platform",
			summary: "A durable event spine with media, CRDT and federation transports.",
		},
		demos: {
			name: "Demo hosting platform",
			family: "platform",
			summary: "An early scaffold for hosting packaged demos; bindings are still design.",
		},
		sync: {
			name: "Prometheus Entity Sync",
			family: "platform",
			summary: "Rust database synchronization with browser, Flutter and native SDKs.",
		},
		mesh: {
			name: "Flint Agent Mesh",
			family: "platform",
			summary: "A design for identity, encryption, delivery and discovery across an agent mesh.",
		},

		// Developer tools and skills
		skills: {
			name: "Prometheus Skill Pack",
			family: "developer-tools",
			summary: "Reusable development skills, workflows, research and team tools.",
		},
		mini: {
			name: "Prometheus Skills Mini",
			family: "developer-tools",
			summary: "Portable process, team, research and UI guidance with Node entry points.",
		},
		pem: {
			name: "Prometheus Entity Management",
			family: "developer-tools",
			summary: "A reactive entity graph for web, mobile, desktop and local-first apps.",
		},
		parking: {
			name: "Parking Lot",
			family: "developer-tools",
			summary: "A Rust library for bounded background work whose results outlive the request.",
		},
		"rust-performance-skill": {
			name: "Rust performance skill",
			family: "developer-tools",
			summary: "A review edition of a skill for auditing and repairing Rust service performance.",
		},
		refiner: {
			name: "Artifact Refiner",
			family: "developer-tools",
			summary: "Document refinement and teaching workflows used across the skills.",
		},
		genui: {
			name: "gen_ui",
			family: "developer-tools",
			summary: "A shared Rust application core with thin web, desktop and Flutter surfaces.",
		},
		docforge: {
			name: "HTMX Doc Forge",
			family: "developer-tools",
			summary: "Branded publications, SVG explanations and IPFS publishing workflows.",
		},
		setup: {
			name: "KnowMe Project Management",
			family: "developer-tools",
			summary: "Repeatable setup and conversion for code, processes, research and docs.",
		},
		"native-agent": {
			name: "Native agent creator",
			family: "developer-tools",
			summary: "Rust templates and deployment patterns for native, container and WASM agents.",
		},
		"phase-exit": {
			name: "Phase Exit",
			family: "developer-tools",
			summary: "A preview of evidence-based completion decisions against an adopted contract.",
		},
		companion: {
			name: "Companion",
			family: "developer-tools",
			summary: "A prototype shared workspace for following agents' progress, approvals and blockers.",
		},
		logos: {
			name: "Logos",
			family: "developer-tools",
			summary: "A harness-health dashboard prototype with its own design system.",
		},
		decision: {
			name: "Know Decision",
			family: "developer-tools",
			summary: "Planned local decision models with Act, Review and Escalate outcomes.",
		},
		tune: {
			name: "Prometheus Tune",
			family: "developer-tools",
			summary: "Proposed skills for datasets, fine-tuning, quantization and evaluation.",
		},
		light: {
			name: "Light Creator",
			family: "developer-tools",
			summary: "An artifact-generation and component-preview workflow.",
		},

		// Integrations
		ipfs: {
			name: "IPFS Sync for Obsidian",
			family: "integrations",
			summary: "An Obsidian plugin for content-addressed sync across the memory ecosystem.",
		},
		"candle-vllm": {
			name: "Candle-VLLM fork",
			family: "integrations",
			summary: "A fork of Candle-VLLM that serves inference through Parking Lot.",
		},
		inference: {
			name: "Inference fork work",
			family: "integrations",
			summary: "Inference and provider-routing fork work on candle-vllm and liter-llm.",
		},
		poppy: {
			name: "KnowMe integration with Poppy",
			family: "integrations",
			summary: "A support and recovery design using the external Personal Agent Protocol.",
		},

		// Services and research
		dot: {
			name: "KnowMe dot",
			family: "services-and-research",
			summary: "A proposed shared control plane with per-user memory for replaceable workers.",
		},
		voice: {
			name: "Authentic Digital Twin",
			family: "services-and-research",
			summary: "A personal-voice and communication-coaching design, with supporting skills.",
		},
		lampas: {
			name: "Lampas",
			family: "services-and-research",
			summary: "Research into hardware, inference and a persistent operator.",
		},
		pulse: {
			name: "Prometheus Pulse",
			family: "services-and-research",
			summary: "A status-persona feed capability designed into Locus.",
		},
		operator: {
			name: "The Operator Service",
			family: "services-and-research",
			summary: "A proposed service packaging and operating model for persistent AI-assisted work.",
		},
		kaia: {
			name: "Kaia",
			family: "services-and-research",
			summary: "A direction for agent assurance and a developer companion.",
		},
		knowtes: {
			name: "Knowtes",
			family: "services-and-research",
			summary: "A notes workspace whose purpose and status are still being confirmed.",
		},
	},

	leads: [
		{
			slug: "the-boss",
			family: "applications",
			title: "The Boss",
			rows: ["boss"],
			question: "What can I do with The Boss today?",
		},
		{
			slug: "knowme",
			family: "applications",
			title: "KnowMe",
			rows: ["knowme"],
			question: "What is KnowMe, and can I use it yet?",
		},
		{
			slug: "locus",
			family: "applications",
			title: "Locus",
			rows: ["locus"],
			question: "What is Locus meant to do?",
		},
		{
			slug: "universal-agent-runtime",
			family: "agents-and-memory",
			title: "Universal Agent Runtime",
			rows: ["uar"],
			question: "What does the Universal Agent Runtime do?",
		},
		{
			slug: "bossfang",
			family: "agents-and-memory",
			title: "BossFang",
			rows: ["bossfang"],
			question: "How is BossFang different from The Boss?",
		},
		{
			slug: "surreal-memory-server",
			family: "agents-and-memory",
			title: "Surreal Memory Server",
			rows: ["memory"],
			question: "How does the Surreal Memory Server store agent memory?",
		},
		{
			slug: "flint-platform",
			family: "platform",
			title: "Flint platform",
			rows: ["gate", "forge", "fabric"],
			question: "What are Flint Gate, Forge and Realtime Fabric?",
			summary: "An auth proxy, a data and edge-compute plane and a realtime event spine.",
		},
		{
			slug: "prometheus-skill-pack",
			family: "developer-tools",
			title: "Prometheus Skill Pack",
			rows: ["skills", "mini"],
			question: "What is in the Prometheus Skill Pack?",
			summary: "Reusable development skills and workflows, in a full pack and a portable Mini edition.",
		},
		{
			slug: "prometheus-entity-management",
			family: "developer-tools",
			title: "Prometheus Entity Management",
			rows: ["pem"],
			question: "What problem does Prometheus Entity Management solve?",
		},
		{
			slug: "parking-lot",
			family: "developer-tools",
			title: "Parking Lot",
			rows: ["parking"],
			question: "When would I use Parking Lot?",
		},
	],
};
