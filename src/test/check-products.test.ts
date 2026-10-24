/**
 * site-product-pages: the drift check behind content/site/products.ts. The real
 * data must pass, and each way a page can drift from the facts file or the
 * generated directory must fail. The mutations below are the ones named in
 * docs/content/reviews/site-product-pages.md.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateProducts } from "../../scripts/site/check-products.mjs";
import { DIRECTORY } from "../../content/site/directory";
import { DIRECTORY_COPY } from "../../content/site/directory-copy";
import { PRODUCT_PAGES, type ProductPageCopy } from "../../content/site/products";
import { PRODUCTS_COPY } from "../../content/site/products-copy";

const ROOT = resolve(__dirname, "../..");
const FACTS_FILE = join(ROOT, "docs/knowledge-source/product-facts.json");
const facts = JSON.parse(readFileSync(FACTS_FILE, "utf8"));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = Record<string, any>;

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
function check(pages: unknown[], overrides: Record<string, unknown> = {}) {
	return validateProducts({
		doc: facts,
		copy: DIRECTORY_COPY,
		directory: DIRECTORY,
		pages,
		productsCopy: PRODUCTS_COPY,
		...overrides,
	});
}
/** The pages with `change` applied to the page of `slug`. */
function mutate(slug: string, change: (page: Page) => void): unknown[] {
	const pages = clone(PRODUCT_PAGES) as unknown as Page[];
	change(pages.find((p) => p.slug === slug) as Page);
	return pages;
}

describe("the real product pages", () => {
	it("are the ten pages of decision D-005, in order, and pass the check", () => {
		expect(PRODUCT_PAGES.map((p) => p.slug)).toEqual([
			"the-boss",
			"bossfang",
			"universal-agent-runtime",
			"surreal-memory-server",
			"prometheus-skill-pack",
			"flint-platform",
			"prometheus-entity-management",
			"parking-lot",
			"knowme",
			"locus",
		]);
		expect(check(PRODUCT_PAGES)).toEqual([]);
	});

	it("keep to the length limits of the brief", () => {
		for (const page of PRODUCT_PAGES as ProductPageCopy[]) {
			expect(page.name.length).toBeLessThanOrEqual(32);
			expect(page.lead.split(/\s+/).length).toBeLessThanOrEqual(25);
			expect(page.facts.length).toBeGreaterThanOrEqual(3);
			expect(page.facts.length).toBeLessThanOrEqual(5);
			for (const fact of page.facts) {
				expect(fact.label.split(/\s+/).length).toBeLessThanOrEqual(3);
				expect(fact.value.split(/\s+/).length).toBeLessThanOrEqual(20);
			}
			expect(page.questions.length).toBeGreaterThanOrEqual(2);
			expect(page.questions.length).toBeLessThanOrEqual(4);
			for (const q of page.questions) expect(q.length).toBeLessThanOrEqual(70);
		}
	});

	it("hold no status, version or date field and no release-tag URL", () => {
		for (const page of PRODUCT_PAGES) {
			expect(Object.keys(page).sort()).toEqual(["facts", "lead", "name", "questions", "rows", "slug", "sources"]);
		}
	});
});

describe("the check fails when a page drifts", () => {
	it("names a slug that is not a directory tile", () => {
		expect(check(mutate("locus", (p) => (p.slug = "no-such-product"))).join("\n")).toMatch(/no directory tile has this slug/);
	});

	it("names a facts row that is not public", () => {
		const hidden = facts.rows.find((r: { publication: string }) => r.publication !== "public");
		expect(check(mutate("locus", (p) => (p.rows = [hidden.id]))).join("\n")).toMatch(/not a public facts row/);
	});

	it("names a facts row that is not in the facts file", () => {
		expect(check(mutate("locus", (p) => (p.rows = ["ghost"]))).join("\n")).toMatch(/not in the facts file/);
	});

	it("covers different rows than the directory tile", () => {
		expect(check(mutate("flint-platform", (p) => (p.rows = ["gate", "forge"]))).join("\n")).toMatch(/differ from the directory tile's rows/);
	});

	it("is missing for a directory tile", () => {
		expect(check(PRODUCT_PAGES.filter((p) => p.slug !== "parking-lot")).join("\n")).toMatch(/directory tile "parking-lot" has no product page/);
	});

	it("carries its own status or version field", () => {
		expect(check(mutate("the-boss", (p) => (p.status = "released"))).join("\n")).toMatch(/unknown field "status"/);
		expect(check(mutate("the-boss", (p) => (p.version = "v9.9.9"))).join("\n")).toMatch(/unknown field "version"/);
	});

	it("writes a version number or a date into a fact or the lead", () => {
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = "Version 2.2.41 shipped."))).join("\n")).toMatch(/version number or a date/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = "Updated 24 Oct 2026."))).join("\n")).toMatch(/version number or a date/);
		expect(check(mutate("the-boss", (p) => (p.lead = "Release v2.2.41 of a desktop workspace."))).join("\n")).toMatch(/lead carries a version/);
	});

	it("links a release tag, which carries a version", () => {
		const pages = mutate("the-boss", (p) => (p.sources[1].url = "https://github.com/Prometheus-AGS/the-boss/releases/tag/v2.2.41"));
		expect(check(pages).join("\n")).toMatch(/release-tag URL/);
	});

	it("links a private repository, or has no sources while its repository is public", () => {
		const pages = mutate("knowme", (p) => (p.sources = [{ label: "Locus", url: "https://github.com/Know-Me-Tools/locus" }]));
		expect(check(pages).join("\n")).toMatch(/private repository/);
		expect(check(mutate("knowme", (p) => (p.sources = []))).join("\n")).toMatch(/no sources, but not every row's repository is private/);
	});

	it("links something that is not https", () => {
		const pages = mutate("the-boss", (p) => (p.sources[0].url = "http://the-boss.know-me.tools"));
		expect(check(pages).join("\n")).toMatch(/https URL/);
	});

	it("breaks a copy limit", () => {
		expect(check(mutate("the-boss", (p) => (p.lead = `${p.lead} ${"word ".repeat(10)}`.trim() + "."))).join("\n")).toMatch(/lead is \d+ words/);
		expect(check(mutate("the-boss", (p) => (p.lead = "One sentence here. Then another sentence."))).join("\n")).toMatch(/one sentence/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].label = "A very long label"))).join("\n")).toMatch(/label must be 1 to 3 words/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = "word ".repeat(21).trim()))).join("\n")).toMatch(/value is 21 words/);
		expect(check(mutate("the-boss", (p) => p.facts.push(...p.facts))).join("\n")).toMatch(/10 facts, need 3 to 5/);
		expect(check(mutate("the-boss", (p) => (p.facts = p.facts.slice(0, 2)))).join("\n")).toMatch(/2 facts, need 3 to 5/);
		expect(check(mutate("the-boss", (p) => (p.questions = [p.questions[0]]))).join("\n")).toMatch(/1 questions, need 2 to 4/);
		expect(check(mutate("the-boss", (p) => (p.name = "N".repeat(33)))).join("\n")).toMatch(/name is over 32/);
	});

	it("restates the lead in a fact", () => {
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = p.lead))).join("\n")).toMatch(/restates the lead/);
	});

	it("has a fact with no traceable source", () => {
		expect(check(mutate("the-boss", (p) => (p.facts[0].source = "the-boss/nope.md"))).join("\n")).toMatch(/not a file under docs\/knowledge-source/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].source = "facts:uar"))).join("\n")).toMatch(/not one of the page's rows/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].source = ""))).join("\n")).toMatch(/no source/);
	});

	it("words a question against the rules", () => {
		expect(check(mutate("the-boss", (p) => (p.questions[1] = "How do I install it?"))).join("\n")).toMatch(/pronouns|display name/);
		expect(check(mutate("the-boss", (p) => (p.questions[1] = "Is The Boss the best workspace?"))).join("\n")).toMatch(/superlatives/);
		expect(check(mutate("the-boss", (p) => (p.questions[1] = "How do I install The Boss"))).join("\n")).toMatch(/must end with "\?"/);
		expect(check(mutate("the-boss", (p) => (p.questions[1] = `How do I install The Boss ${"x".repeat(60)}?`))).join("\n")).toMatch(/over 70 characters/);
		expect(check(mutate("the-boss", (p) => (p.questions[0] = "Something else about The Boss?"))).join("\n")).toMatch(/first question must be the directory tile's question/);
	});

	it("claims a price, compliance or certification, or uses a banned word", () => {
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = "Pricing starts low."))).join("\n")).toMatch(/price, compliance or certification/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = "Certified for hospitals."))).join("\n")).toMatch(/price, compliance or certification/);
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = "A seamless workspace."))).join("\n")).toMatch(/banned word/);
		expect(check(PRODUCT_PAGES, { productsCopy: { ...PRODUCTS_COPY, listLead: "GDPR compliant." } }).join("\n")).toMatch(/price, compliance/);
	});

	it("names a withheld term or a row that is not public", () => {
		const term = facts.withheldTerms[0];
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = `Runs on ${term}.`))).join("\n")).toMatch(/withheld term/);
		const hidden = facts.rows.find((r: { publication: string }) => r.publication !== "public");
		expect(check(mutate("the-boss", (p) => (p.facts[0].value = `Works with ${hidden.name}.`))).join("\n")).toMatch(/not public/);
	});

	it("describes a design-stage product in a way that sounds available", () => {
		expect(check(mutate("locus", (p) => (p.lead = "A private assistant for your day."))).join("\n")).toMatch(/does not say so/);
	});
});

describe("the CLI", () => {
	const script = join(ROOT, "scripts/site/check-products.mjs");
	const run = (args: string[]) => {
		const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd: ROOT });
		return { status: r.status, output: `${r.stdout}${r.stderr}` };
	};

	it("exits 0 on the committed pages", () => {
		const r = run([]);
		expect(r.status).toBe(0);
		expect(r.output).toContain("OK 10 product pages");
	});

	it("exits 1 and names the problem when a page names a slug that is not a tile", () => {
		const text = readFileSync(join(ROOT, "content/site/products.ts"), "utf8").replace('slug: "locus"', 'slug: "no-such-product"');
		const file = join(mkdtempSync(join(tmpdir(), "products-")), "products.ts");
		writeFileSync(file, text);
		const r = run(["--pages", file]);
		expect(r.status).toBe(1);
		expect(r.output).toMatch(/no directory tile has this slug/);
	});
});
