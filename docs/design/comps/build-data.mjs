// Comp data generator for docs/design/product-directory.md.
//
// Reads docs/knowledge-source/product-facts.json, applies the status rule
// (brief part 2) and the family map (brief part 3), and writes:
//   docs/design/comps/directory-data.js          (data the HTML comps render)
//   docs/design/product-directory-status-map.md  (appendix table, regenerated)
//
// This is design tooling, not the production directory script. The build
// script in site-home-directory must implement the same rules; the appendix
// table is the expected output it is checked against.
//
//   node docs/design/comps/build-data.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const facts = JSON.parse(fs.readFileSync(path.join(repo, "docs/knowledge-source/product-facts.json"), "utf8"));

// ---------------------------------------------------------------- status rule
export const STATUSES = {
	released: { label: "Released", tone: "success", icon: "circle-check", rank: 1 },
	prerelease: { label: "Pre-release", tone: "warning", icon: "tag", rank: 2 },
	development: { label: "In development", tone: "neutral", icon: "hammer", rank: 3 },
	prototype: { label: "Prototype", tone: "neutral", icon: "flask-conical", rank: 4 },
	design: { label: "Design only", tone: "neutral", icon: "pencil-ruler", rank: 5 },
	assessment: { label: "Under assessment", tone: "neutral", icon: "circle-question-mark", rank: 6 },
};

/** First matching step wins. Returns [statusKey, step] so the appendix can show why. */
function statusOf(row) {
	const kind = row.version.kind;
	const s = row.portfolioStatus;
	if (kind === "stable" || kind === "registry") return ["released", "S1"];
	if (kind === "manifest") return ["prerelease", "S2"];
	if (/under assessment|status unresolved|needs? confirmation|uncertain/i.test(s)) return ["assessment", "S3"];
	if (/^existing/i.test(s)) return ["development", "S4"];
	if (/prototype|synthetic|\bMVP\b|starter/i.test(s)) return ["prototype", "S5"];
	if (/^(design|specification|architecture|published|service and economics design|research published|public review edition|pre-implementation)/i.test(s))
		return ["design", "S6"];
	return ["development", "S7"];
}

// ---------------------------------------------------------------- version line
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function date(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return `${d} ${MONTHS[m - 1]} ${y}`;
}
/** One or two lines of mono metadata. Never a version the facts file does not hold. */
function versionLines(row) {
	const v = row.version;
	switch (v.kind) {
		case "stable": {
			const lines = [`${v.value} · ${date(v.date)}`];
			if (v.preRelease) lines.push(`${v.preRelease.value} pre-release · ${date(v.preRelease.date)}`);
			return lines;
		}
		case "registry":
			return [`${v.value} on crates.io · ${date(v.date)}`];
		case "tag":
			return /^v\d/.test(v.value) ? [`Tag ${v.value} · no release`] : [`Build tag, no version · ${date(v.date)}`];
		case "manifest":
			return [`${v.value} pre-release`];
		case "untagged":
			return [`No tagged release · last commit ${date(v.lastCommit)}`];
		default:
			return ["No release recorded"];
	}
}

// ---------------------------------------------------------------- families
export const FAMILIES = [
	{ slug: "applications", name: "Applications", line: "Apps and clients a person uses directly." },
	{ slug: "agents-and-memory", name: "Agents and memory", line: "Runtimes, agent systems and memory services." },
	{ slug: "platform", name: "Platform and infrastructure", line: "Identity, data, realtime and hosting services." },
	{ slug: "developer-tools", name: "Developer tools and skills", line: "Libraries, skills and tools for building with agents." },
	{ slug: "integrations", name: "Integrations", line: "Work that connects to software outside the portfolio." },
	{ slug: "services-and-research", name: "Services and research", line: "Service designs, capabilities and research directions." },
];

// The ten product pages (decision D-005). `rows` are facts ids shown inside the lead tile.
export const PAGES = [
	{ slug: "the-boss", family: "applications", title: "The Boss", rows: ["boss"], question: "What can I do with The Boss today?" },
	{ slug: "knowme", family: "applications", title: "KnowMe", rows: ["knowme"], question: "What is KnowMe, and when can I use it?" },
	{ slug: "locus", family: "applications", title: "Locus", rows: ["locus"], question: "What is Locus meant to do?" },
	{ slug: "universal-agent-runtime", family: "agents-and-memory", title: "Universal Agent Runtime", rows: ["uar"], question: "What does the Universal Agent Runtime do?" },
	{ slug: "bossfang", family: "agents-and-memory", title: "BossFang", rows: ["bossfang"], question: "How is BossFang different from The Boss?" },
	{ slug: "surreal-memory-server", family: "agents-and-memory", title: "Surreal Memory Server", rows: ["memory"], question: "How does the Surreal Memory Server store agent memory?" },
	{ slug: "flint-platform", family: "platform", title: "Flint platform", rows: ["gate", "forge", "fabric"], question: "What are Flint Gate, Forge and Realtime Fabric?", summary: "An auth proxy, a data and edge-compute plane and a realtime event spine." },
	{ slug: "prometheus-skill-pack", family: "developer-tools", title: "Prometheus Skill Pack", rows: ["skills", "mini"], question: "What is in the Prometheus Skill Pack?", summary: "Reusable development skills and workflows, in a full pack and a portable Mini edition." },
	{ slug: "prometheus-entity-management", family: "developer-tools", title: "Prometheus Entity Management", rows: ["pem"], question: "What problem does Prometheus Entity Management solve?" },
	{ slug: "parking-lot", family: "developer-tools", title: "Parking Lot", rows: ["parking"], question: "When would I use Parking Lot?" },
];

// Display name, family and a one-line summary DRAFT per public row. The summary
// drafts are the creative director's placeholders for layout, derived only from
// the row's own `summary`; km-chief-content-officer owns the final text.
const MAP = {
	boss: ["The Boss", "applications", "A desktop workspace for conversations, agents, tools and projects, built on Cherry Studio."],
	knowme: ["KnowMe", "applications", "Personal intelligence: private memory, user-controlled inference and agent workflows."],
	locus: ["Locus", "applications", "A proposed owner-controlled private assistant with durable state and selective memory."],
	concierge: ["KnowMe Concierge", "applications", "The chat client behind this site, with streamed agent replies and local threads."],
	meet: ["Know Meet", "applications", "An agentic meeting experience across assistants, messages, calendar and notes."],
	studio: ["Prometheus Studio", "applications", "A cross-platform AI development workspace with a local database and IPFS."],
	documind: ["DocuMind", "applications", "Document and knowledge workflows with an operator console."],
	realtor: ["KnowMe realtor assistant", "applications", "A real-estate assistant with a lightweight CRM and follow-up workflows."],
	flint: ["Flint AI Code Companion", "applications", "An AI-assisted code-generation concept, with its process specifications."],
	uar: ["Universal Agent Runtime", "agents-and-memory", "A shared agent runtime used by several applications, including this site's concierge."],
	bossfang: ["BossFang", "agents-and-memory", "A Rust agent operating system, separate from The Boss desktop workspace."],
	memory: ["Surreal Memory Server", "agents-and-memory", "Agent memory: scoped memories, a knowledge graph and hybrid search."],
	knowledge: ["Prometheus Knowledge", "agents-and-memory", "Markdown knowledge records, prompt snapshots and memory reconciliation."],
	"knowledge-gateway": ["Knowledge Gateway", "agents-and-memory", "Federated access to document sources through shared adapters and MCP tools."],
	synaxis: ["Synaxis", "agents-and-memory", "A proposed durable messaging, orchestration and shared memory service."],
	numen: ["Numen", "agents-and-memory", "Proposed governed orchestration and portable execution across hosts."],
	"numen-enclave": ["Numen Enclave", "agents-and-memory", "An architecture that keeps private data and inference in the owner's domain."],
	praxis: ["KnowMe Praxis", "agents-and-memory", "A specification for agentic container and system architecture."],
	tranquil: ["Tranquil", "agents-and-memory", "A Rust personal-data-server direction for Parlour, with private agent jobs."],
	gate: ["Flint Gate", "platform", "An authentication and authorization proxy for streaming AI workloads."],
	forge: ["Flint Forge", "platform", "Data and edge compute: REST and GraphQL access and signed WASM edge functions."],
	fabric: ["Flint Realtime Fabric", "platform", "A durable event spine with media, CRDT and federation transports."],
	mesh: ["Flint Agent Mesh", "platform", "A design for identity, encryption, delivery and discovery across an agent mesh."],
	sync: ["Prometheus Entity Sync", "platform", "Rust database synchronization with browser, Flutter and native SDKs."],
	demos: ["Demo hosting platform", "platform", "Proposed hosting for packaged demos with agent, data and runtime bindings."],
	skills: ["Prometheus Skill Pack", "developer-tools", "Reusable development skills, workflows, research and team tools."],
	mini: ["Prometheus Skills Mini", "developer-tools", "Portable process, team, research and UI guidance with Node entry points."],
	pem: ["Prometheus Entity Management", "developer-tools", "A reactive entity graph for web, mobile, desktop and local-first apps."],
	parking: ["Parking Lot", "developer-tools", "A Rust library for bounded background work whose results outlive the request."],
	genui: ["gen_ui", "developer-tools", "A shared Rust application core with thin web, desktop and Flutter surfaces."],
	"native-agent": ["Native agent creator", "developer-tools", "Rust templates and deployment patterns for native, container and WASM agents."],
	"phase-exit": ["Phase Exit", "developer-tools", "Evidence-based completion decisions checked against an adopted contract."],
	setup: ["KnowMe Project Management", "developer-tools", "Repeatable setup and conversion for code, processes, research and docs."],
	docforge: ["HTMX Doc Forge", "developer-tools", "Branded publications, SVG explanations and IPFS publishing workflows."],
	"rust-performance-skill": ["Rust performance skill", "developer-tools", "A review edition of a skill for auditing and repairing Rust service performance."],
	refiner: ["Artifact Refiner", "developer-tools", "Document refinement and teaching workflows used across the skills."],
	tune: ["Prometheus Tune", "developer-tools", "Proposed skills for datasets, fine-tuning, quantization and evaluation."],
	logos: ["Logos", "developer-tools", "A harness-health dashboard prototype with its own design system."],
	light: ["Light Creator", "developer-tools", "An artifact-generation and component-preview workflow."],
	companion: ["Companion", "developer-tools", "A possible shared workspace to follow agents' progress, approvals and blockers."],
	decision: ["Know Decision", "developer-tools", "Planned local decision models with Act, Review and Escalate outcomes."],
	ipfs: ["IPFS Sync for Obsidian", "integrations", "An Obsidian plugin for content-addressed sync across the memory ecosystem."],
	poppy: ["KnowMe integration with Poppy", "integrations", "A support and recovery design using the external Personal Agent Protocol."],
	inference: ["Inference forks", "integrations", "Inference and provider-routing fork work on candle-vllm and liter-llm."],
	"candle-vllm": ["Candle-VLLM fork", "integrations", "A fork of Candle-VLLM that serves inference through Parking Lot."],
	dot: ["KnowMe dot", "services-and-research", "A proposed shared control plane with per-user memory for replaceable workers."],
	operator: ["The Operator Service", "services-and-research", "Service packaging and an operating model for persistent AI-assisted work."],
	voice: ["Authentic Digital Twin", "services-and-research", "A personal-voice and communication-coaching design with supporting skills."],
	pulse: ["Prometheus Pulse", "services-and-research", "A status-persona feed capability designed into Locus."],
	lampas: ["Lampas", "services-and-research", "Research into hardware, inference and a persistent operator."],
	knowtes: ["Knowtes", "services-and-research", "A notes workspace whose purpose and status are still being confirmed."],
	kaia: ["Kaia", "services-and-research", "A direction for agent assurance and a developer companion."],
};

export const askPrompt = (name) => `What is ${name}, and how far along is it?`;

// ---------------------------------------------------------------- build
const publicRows = facts.rows.filter((r) => r.publication === "public");
const missing = publicRows.filter((r) => !MAP[r.id]).map((r) => r.id);
const extra = Object.keys(MAP).filter((id) => !publicRows.some((r) => r.id === id));
if (missing.length || extra.length) {
	throw new Error(`map drift: missing ${missing.join(",") || "none"}; not public ${extra.join(",") || "none"}`);
}

const pageOf = Object.fromEntries(PAGES.flatMap((p) => p.rows.map((id) => [id, p.slug])));
const entries = publicRows.map((r) => {
	const [name, family, summary] = MAP[r.id];
	const [status, step] = statusOf(r);
	const tooLong = summary.length > 90;
	if (tooLong) throw new Error(`summary over 90 characters: ${r.id} (${summary.length})`);
	return {
		id: r.id,
		name,
		family,
		summary,
		status,
		step,
		versionLines: versionLines(r),
		kind: r.version.kind,
		page: pageOf[r.id] ?? null,
		prompt: askPrompt(name),
		factsFamily: r.family,
		portfolioStatus: r.portfolioStatus,
	};
});

const byRank = (a, b) => STATUSES[a.status].rank - STATUSES[b.status].rank || a.name.localeCompare(b.name);
const families = FAMILIES.map((f) => {
	const pages = PAGES.filter((p) => p.family === f.slug).map((p) => ({
		...p,
		entries: p.rows.map((id) => entries.find((e) => e.id === id)),
	}));
	const rest = entries.filter((e) => e.family === f.slug && !e.page).sort(byRank);
	const all = entries.filter((e) => e.family === f.slug);
	const mix = Object.keys(STATUSES)
		.map((k) => [k, all.filter((e) => e.status === k).length])
		.filter(([, n]) => n > 0);
	return { ...f, count: all.length, pages, rest, mix };
});

fs.writeFileSync(
	path.join(here, "directory-data.js"),
	`/* Generated by build-data.mjs from docs/knowledge-source/product-facts.json (checked ${facts.checked}). Do not edit. */\n` +
		`window.DIRECTORY = ${JSON.stringify({ checked: facts.checked, total: entries.length, statuses: STATUSES, families }, null, 1)};\n`,
);

// ---------------------------------------------------------------- appendix
const counts = Object.fromEntries(Object.keys(STATUSES).map((k) => [k, entries.filter((e) => e.status === k).length]));
const famName = Object.fromEntries(FAMILIES.map((f) => [f.slug, f.name]));
const esc = (s) => s.replaceAll("|", "\\|");
const ordered = families.flatMap((f) => [...f.pages.flatMap((p) => p.entries), ...f.rest]);
const table = ordered
	.map(
		(e) =>
			`| \`${e.id}\` | ${esc(e.name)} | ${famName[e.family]} (${e.factsFamily}) | \`${e.kind}\` | ${esc(e.portfolioStatus)} | ${e.step} | **${STATUSES[e.status].label}** | ${esc(e.versionLines.join(" / "))} | ${e.page ? `/products/${e.page}` : ""} |`,
	)
	.join("\n");

const md = `# Product directory: status map (appendix)

Appendix to [product-directory.md](product-directory.md), part 2. Owner: km-creative-director.

Generated by \`node docs/design/comps/build-data.mjs\` from \`docs/knowledge-source/product-facts.json\` (checked ${facts.checked}). Do not edit the table by hand; change the facts file or the rule and regenerate. The site-home-directory build script must produce the same label, family and version line for every row, and its drift check compares against this table.

${entries.length} public rows. ${facts.rows.length - entries.length} rows (\`pending-consent\` or \`withheld\`) are excluded and never rendered (decisions D-009, D-011).

## The rule (first match wins)

| Step | Condition on the facts row | Label |
|---|---|---|
| S1 | \`version.kind\` is \`stable\` or \`registry\` | Released |
| S2 | \`version.kind\` is \`manifest\` (a pre-release manifest) | Pre-release |
| S3 | \`portfolioStatus\` contains "under assessment", "status unresolved", "need(s) confirmation" or "uncertain" | Under assessment |
| S4 | \`portfolioStatus\` starts with "Existing" | In development |
| S5 | \`portfolioStatus\` contains "prototype", "synthetic", "MVP" or "starter" | Prototype |
| S6 | \`portfolioStatus\` starts with "Design", "Specification", "Architecture", "Published", "Service and economics design", "Research published", "Public review edition" or "Pre-implementation" | Design only |
| S7 | anything else (source or fork work exists, no release) | In development |

Why this order: a release in the registry or on GitHub is the strongest evidence and wins (S1, S2, decision D-002). An explicit doubt in the portfolio beats any other wording (S3), so no row reads stronger than its source. "Existing ..." means code exists (S4). Only then do prototype and design words decide (S5, S6).

## Counts

| Label | Rows |
|---|---:|
${Object.entries(counts)
	.map(([k, n]) => `| ${STATUSES[k].label} | ${n} |`)
	.join("\n")}
| **Total** | **${entries.length}** |

## All ${entries.length} public rows

Order: family, then the product-page rows, then the rest by label rank and name (the order the directory renders). "Family" shows the display family, with the facts file's own family in brackets. The display names and the one-line summaries are drafts for km-chief-content-officer (product-directory.md part 5); the label and version line are derived and are not copy.

| id | Display name (draft) | Family (facts family) | Version kind | Portfolio status (facts) | Step | Label | Version line | Page |
|---|---|---|---|---|---|---|---|---|
${table}
`;
fs.writeFileSync(path.join(repo, "docs/design/product-directory-status-map.md"), md);

console.log(`entries ${entries.length}`, counts);
console.log(families.map((f) => `${f.name}: ${f.count} (${f.pages.length} pages, ${f.rest.length} rows)`).join("\n"));
