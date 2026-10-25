// Check for the prerendered routes (change site-seo-prerender).
//
//   node scripts/site/check-prerender.mjs                 render every route in memory from the content
//                                                         modules and index.html; exit 1 on any problem (CI runs this)
//   node scripts/site/check-prerender.mjs --dist <dir>    also check the files a site build wrote into <dir>
//   node scripts/site/check-prerender.mjs --url <base>    ask a running server (no JavaScript: plain HTTP GET)
//                                                         and check status, head and text of every route, a 404 for an
//                                                         unknown product, and sitemap.xml
//
// What it guards: each of `/`, `/products` and the ten `/products/<slug>` carries, in the first
// response, its <title>, meta description, canonical, h1, and (a product page) its lead, status
// label, every fact, every question and every source; sitemap.xml lists all of them; robots.txt
// names the sitemap. The expected text is read from the same content modules the SPA renders from.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SHELL_FILE, loadContent, renderPage, renderSitemap, routesFor } from "./prerender.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ROBOTS = path.join(REPO_ROOT, "public/robots.txt");

const decode = (s) =>
	s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const textOf = (html) => decode(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

function between(html, pattern) {
	const m = pattern.exec(html);
	return m ? decode(m[1]) : null;
}

/** Problems with one response body for one route; `[]` means it fits. */
export function checkPage(html, route, data) {
	const errors = [];
	const where = `${route.url}`;
	const root = /<div id="root">([\s\S]*?<\/main>)<\/div>/.exec(html)?.[1] ?? "";
	const text = textOf(root);
	const want = (label, ok) => ok || errors.push(`${where}: ${label}`);

	want(`<title> is not "${route.head.title}"`, between(html, /<title>([\s\S]*?)<\/title>/) === route.head.title);
	want("meta description is missing or wrong", between(html, /<meta\s+name="description"\s+content="([^"]*)"/) === route.head.description);
	want(`canonical is not ${route.head.canonical}`, between(html, /<link\s+rel="canonical"\s+href="([^"]*)"/) === route.head.canonical);
	want("og:url is missing or wrong", between(html, /<meta\s+property="og:url"\s+content="([^"]*)"/) === route.head.canonical);
	want("no <h1> in the first response", /<h1>[\s\S]+?<\/h1>/.test(root));
	want("the body has fewer than 40 words", text.split(" ").length >= 40);

	const page = data.pages.find((p) => route.url === `/products/${p.slug}`);
	if (page) {
		const lead = data.directory.families.flatMap((f) => f.leads).find((l) => l.slug === page.slug);
		const h1 = between(root, /<h1>([\s\S]*?)<\/h1>/);
		want(`<h1> is not "${page.name}"`, h1 === page.name);
		for (const needle of [page.lead, ...page.facts.map((f) => f.value), ...page.questions, ...page.sources.map((s) => s.label)])
			want(`the text lacks "${needle}"`, text.includes(needle));
		for (const entry of lead.entries) want(`the text lacks the status "${data.directoryCopy.statuses[entry.status]}"`, text.includes(data.directoryCopy.statuses[entry.status]));
		for (const source of page.sources) want(`no link to ${source.url}`, root.includes(`href="${source.url}"`));
	} else if (route.url === "/products") {
		want("the text lacks the lead", text.includes(data.productsCopy.listLead));
		for (const p of data.pages) want(`no link to /products/${p.slug}`, root.includes(`href="/products/${p.slug}"`) && text.includes(p.name));
	} else {
		for (const p of data.pages) want(`no link to /products/${p.slug}`, root.includes(`href="/products/${p.slug}"`));
	}
	return errors;
}

/** Problems with a sitemap body. */
export function checkSitemap(xml, routes) {
	return routes
		.filter((r) => !xml.includes(`<loc>${r.head.canonical}</loc>`))
		.map((r) => `sitemap.xml: lacks ${r.head.canonical}`);
}

export function checkRobots(text, origin) {
	return text.split(/\r?\n/).includes(`Sitemap: ${origin}/sitemap.xml`) ? [] : [`robots.txt: no "Sitemap: ${origin}/sitemap.xml" line`];
}

function option(argv, name) {
	const i = argv.indexOf(name);
	return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
}

export async function main(argv, io = { out: (m) => console.log(m), err: (m) => console.error(m) }) {
	const data = await loadContent();
	const shell = readFileSync(path.join(REPO_ROOT, "index.html"), "utf8");
	const routes = routesFor(data, shell);
	const errors = [];

	// In memory: what a build would write.
	for (const route of routes) errors.push(...checkPage(renderPage(shell, route), route, data));
	errors.push(...checkSitemap(renderSitemap(routes, data), routes));
	errors.push(...checkRobots(readFileSync(ROBOTS, "utf8"), data.productsCopy.siteOrigin));

	const dist = option(argv, "--dist");
	if (dist) {
		const root = path.resolve(dist);
		for (const route of routes) {
			const file = path.join(root, route.file);
			if (!existsSync(file)) errors.push(`${route.url}: ${route.file} was not written to ${root}`);
			else errors.push(...checkPage(readFileSync(file, "utf8"), route, data));
		}
		const kept = path.join(root, SHELL_FILE);
		if (!existsSync(kept)) errors.push(`${SHELL_FILE} was not written`);
		else if (/<h1>/.test(readFileSync(kept, "utf8"))) errors.push(`${SHELL_FILE} carries prerendered text; it must be the empty shell`);
		const map = path.join(root, "sitemap.xml");
		if (!existsSync(map)) errors.push("sitemap.xml was not written");
		else errors.push(...checkSitemap(readFileSync(map, "utf8"), routes));
	}

	const base = option(argv, "--url");
	if (base) {
		const get = async (p) => {
			const res = await fetch(new URL(p, base), { redirect: "manual" });
			return { status: res.status, body: await res.text() };
		};
		for (const route of routes) {
			const { status, body } = await get(route.url);
			if (status !== 200) errors.push(`${route.url}: status ${status}, want 200`);
			else errors.push(...checkPage(body, route, data));
		}
		const unknown = await get("/products/no-such-product");
		if (unknown.status !== 404) errors.push(`/products/no-such-product: status ${unknown.status}, want 404`);
		const map = await get("/sitemap.xml");
		if (map.status !== 200) errors.push(`/sitemap.xml: status ${map.status}, want 200`);
		else errors.push(...checkSitemap(map.body, routes));
		const robots = await get("/robots.txt");
		errors.push(...checkRobots(robots.body, data.productsCopy.siteOrigin));
		const thread = await get("/threads/00000000-0000-4000-8000-000000000000");
		if (thread.status !== 200) errors.push(`/threads/<id>: status ${thread.status}, want 200 (client route)`);
		else if (/<h1>/.test(thread.body)) errors.push("/threads/<id>: serves prerendered text instead of the empty shell");
	}

	if (errors.length) {
		for (const e of errors) io.err(`check-prerender: ${e}`);
		return 1;
	}
	io.out(`OK ${routes.length} routes carry title, description, canonical and text${dist ? `; ${dist} checked` : ""}${base ? `; ${base} checked` : ""}`);
	return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.exit(await main(process.argv.slice(2)));
}
