/**
 * site-seo-prerender: a request that does not run JavaScript must see each public route's
 * title, description, canonical and text. The expected text is read from the content modules
 * the SPA renders from, and each way a prerendered page can lose it must fail the check.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkPage, checkRobots, checkSitemap, main } from "../../scripts/site/check-prerender.mjs";
import { SHELL_FILE, loadContent, prerenderDist, renderPage, renderSitemap, routesFor } from "../../scripts/site/prerender.mjs";
import { PRODUCT_PAGES } from "../../content/site/products";
import { PRODUCTS_COPY } from "../../content/site/products-copy";

const ROOT = resolve(__dirname, "../..");
const shell = readFileSync(join(ROOT, "index.html"), "utf8");

async function setup() {
	const data = await loadContent();
	return { data, routes: routesFor(data, shell) };
}

describe("routes", () => {
	it("are the home page, /products and the ten product pages", async () => {
		const { routes } = await setup();
		expect(routes.map((r) => r.url)).toEqual([
			"/",
			"/products",
			...PRODUCT_PAGES.map((p) => `/products/${p.slug}`),
		]);
		expect(routes).toHaveLength(12);
	});

	it("give each product page the head the SPA sets at run time", async () => {
		const { routes } = await setup();
		const boss = routes.find((r) => r.url === "/products/the-boss")!;
		expect(boss.head).toEqual({
			title: "The Boss · KnowMe AI, LLC",
			description: PRODUCT_PAGES[0].lead,
			canonical: "https://know-me.tools/products/the-boss",
		});
	});
});

describe("a prerendered page", () => {
	it("carries its title, description, canonical, lead, status and facts without JavaScript", async () => {
		const { data, routes } = await setup();
		for (const route of routes) {
			const html = renderPage(shell, route);
			expect(checkPage(html, route, data), route.url).toEqual([]);
		}
		const boss = renderPage(shell, routes.find((r) => r.url === "/products/the-boss")!);
		expect(boss).toContain("<title>The Boss · KnowMe AI, LLC</title>");
		expect(boss).toContain('<link rel="canonical" href="https://know-me.tools/products/the-boss" />');
		expect(boss).toContain(PRODUCT_PAGES[0].lead);
		expect(boss).toContain(PRODUCT_PAGES[0].facts[0].value);
	});

	it("keeps the bundle script tags and the theme script", async () => {
		const { routes } = await setup();
		const html = renderPage(shell, routes[2]);
		expect(html).toContain("knowme:ui");
		expect(html).toContain('src="/src/main.tsx"');
	});

	it("escapes text from the content modules", async () => {
		const { routes } = await setup();
		const route = { ...routes[2], body: "<main>x</main>", head: { ...routes[2].head, title: 'A "B" <c> & d' } };
		expect(renderPage(shell, route)).toContain("<title>A &quot;B&quot; &lt;c&gt; &amp; d</title>");
	});

	it("fails the check when the status, a fact, the canonical or the h1 is missing", async () => {
		const { data, routes } = await setup();
		const route = routes.find((r) => r.url === "/products/the-boss")!;
		const html = renderPage(shell, route);
		const mutations: [string, string][] = [
			["the status", html.replace(data.directoryCopy.statuses[data.directory.families[0].leads[0].entries[0].status], "")],
			["a fact", html.replace(PRODUCT_PAGES[0].facts[0].value, "")],
			["the canonical", html.replace(/<link rel="canonical"[^>]*>/, "")],
			["the h1", html.replace(/<h1>[\s\S]*?<\/h1>/, "")],
			["the title", html.replace(/<title>[\s\S]*?<\/title>/, "<title>x</title>")],
		];
		for (const [what, mutated] of mutations) {
			expect(checkPage(mutated, route, data), what).not.toEqual([]);
		}
		expect(checkPage(shell, route, data)).not.toEqual([]);
	});
});

describe("sitemap.xml and robots.txt", () => {
	it("lists /, /products and every slug", async () => {
		const { data, routes } = await setup();
		const xml = renderSitemap(routes, data);
		expect(checkSitemap(xml, routes)).toEqual([]);
		expect(xml).toContain(`<loc>${PRODUCTS_COPY.siteOrigin}/products</loc>`);
		for (const p of PRODUCT_PAGES) expect(xml).toContain(`<loc>${PRODUCTS_COPY.siteOrigin}/products/${p.slug}</loc>`);
		expect(checkSitemap(xml.replace("/products/bossfang", ""), routes)).not.toEqual([]);
	});

	it("is named by public/robots.txt", () => {
		expect(checkRobots(readFileSync(join(ROOT, "public/robots.txt"), "utf8"), PRODUCTS_COPY.siteOrigin)).toEqual([]);
		expect(checkRobots("User-agent: *\nAllow: /\n", PRODUCTS_COPY.siteOrigin)).not.toEqual([]);
	});
});

describe("prerenderDist", () => {
	it("writes the pages, the untouched shell and the sitemap, and can run twice", async () => {
		const dist = mkdtempSync(join(tmpdir(), "prerender-"));
		writeFileSync(join(dist, "index.html"), shell);
		await prerenderDist(dist, () => {});
		await prerenderDist(dist, () => {});
		expect(readFileSync(join(dist, SHELL_FILE), "utf8")).toBe(shell);
		expect(readFileSync(join(dist, "index.html"), "utf8")).toContain("<h1>");
		const errors: string[] = [];
		const code = await main(["--dist", dist], { out: () => {}, err: (m: string) => errors.push(m) });
		expect(errors).toEqual([]);
		expect(code).toBe(0);
	});

	it("is reported by the check when a page was not written", async () => {
		const dist = mkdtempSync(join(tmpdir(), "prerender-empty-"));
		writeFileSync(join(dist, "index.html"), shell);
		const errors: string[] = [];
		const code = await main(["--dist", dist], { out: () => {}, err: (m: string) => errors.push(m) });
		expect(code).toBe(1);
		expect(errors.join("\n")).toContain("products/the-boss/index.html was not written");
	});
});
