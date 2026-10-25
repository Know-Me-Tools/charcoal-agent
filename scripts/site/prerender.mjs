// Build-time prerender of the public site's crawlable routes (change site-seo-prerender).
//
// The site is a client-rendered SPA, so a request that does not run JavaScript sees an empty
// shell. After `vite build` (see the `site-prerender` plugin in vite.config.ts) this module
// writes, for `/`, `/products` and each `/products/<slug>`, an `index.html` whose head carries the
// same title, description, canonical and social text the SPA sets at run time (usePageHead) and
// whose `#root` carries the page's text as plain semantic HTML. React replaces `#root` when the
// bundle mounts, so a visitor still gets the SPA; a crawler reads the text.
//
// Every visitor-facing string comes from the copy modules the SPA already renders from
// (content/site/products.ts, products-copy.ts, directory.ts, directory-copy.ts). The only
// strings written here are markup. Nothing is hard-coded copy.
//
// Also written:
//   _shell.html   the untouched SPA shell. The server serves it for client routes (/threads/...) and
//                 for the 404 page, so those never flash the home page's text (static_files.rs).
//   sitemap.xml   `/`, `/products` and every product slug.
//
// Functions are pure and exported for src/test/prerender.test.ts and scripts/site/check-prerender.mjs.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = path.join(REPO_ROOT, "content/site");

/** The shell kept next to the prerendered home page; see the header comment. */
export const SHELL_FILE = "_shell.html";

const escapeHtml = (text) =>
	String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Loads the plain-data content modules (Node strips their type annotations). */
export async function loadContent() {
	const load = async (file, name) => {
		const mod = await import(pathToFileURL(path.join(CONTENT, file)).href);
		if (!mod[name]) throw new Error(`${file} does not export ${name}`);
		return mod[name];
	};
	return {
		pages: await load("products.ts", "PRODUCT_PAGES"),
		productsCopy: await load("products-copy.ts", "PRODUCTS_COPY"),
		directory: await load("directory.ts", "DIRECTORY"),
		directoryCopy: await load("directory-copy.ts", "DIRECTORY_COPY"),
	};
}

// ---- head ------------------------------------------------------------------------------------

function setMeta(html, attr, key, content) {
	const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
	const existing = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`);
	return existing.test(html) ? html.replace(existing, () => tag) : html.replace("</head>", () => `    ${tag}\n  </head>`);
}

function setHead(html, { title, description, canonical }) {
	let out = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(title)}</title>`);
	out = setMeta(out, "name", "description", description);
	out = setMeta(out, "property", "og:title", title);
	out = setMeta(out, "property", "og:description", description);
	out = setMeta(out, "property", "og:url", canonical);
	out = setMeta(out, "name", "twitter:title", title);
	out = setMeta(out, "name", "twitter:description", description);
	const link = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
	const existing = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/;
	return existing.test(out) ? out.replace(existing, () => link) : out.replace("</head>", () => `    ${link}\n  </head>`);
}

function readTag(html, pattern, label) {
	const match = pattern.exec(html);
	if (!match) throw new Error(`prerender: the shell has no ${label}`);
	return match[1];
}

// ---- body ------------------------------------------------------------------------------------

const statusOf = (data, entry) => data.directoryCopy.statuses[entry.status];

function entryItem(data, entry) {
	const versions = entry.versionLines.map((line) => `<span>${escapeHtml(line)}</span>`).join(" ");
	return (
		`<li><strong>${escapeHtml(entry.name)}</strong> <span>${escapeHtml(statusOf(data, entry))}</span> ` +
		`${versions} <span>${escapeHtml(entry.summary)}</span></li>`
	);
}

function leadItem(data, lead) {
	const href = `/products/${encodeURIComponent(lead.slug)}`;
	const rows = lead.entries.length === 1 ? lead.entries[0] : null;
	const status = rows ? ` <span>${escapeHtml(statusOf(data, rows))}</span>` : "";
	return `<li><a href="${href}">${escapeHtml(lead.title)}</a>${status} <span>${escapeHtml(lead.summary)}</span></li>`;
}

function homeBody(data, title) {
	const { directory, directoryCopy, productsCopy } = data;
	const families = directory.families
		.map(
			(family) =>
				`<section><h3>${escapeHtml(family.name)}</h3><p>${escapeHtml(family.line)}</p>` +
				`<ul>${family.leads.map((lead) => leadItem(data, lead)).join("")}</ul></section>`,
		)
		.join("");
	return (
		`<main><h1>${escapeHtml(title)}</h1>` +
		`<section><h2>${escapeHtml(directoryCopy.heading)}</h2>` +
		`<p>${escapeHtml(directoryCopy.lead.replace("{total}", String(directory.total)))}</p>` +
		`<p><a href="/products">${escapeHtml(productsCopy.seeAll)}</a></p>${families}</section></main>`
	);
}

function productsBody(data) {
	const { directory, directoryCopy, productsCopy } = data;
	const families = directory.families
		.map(
			(family) =>
				`<section><h2>${escapeHtml(family.name)}</h2><p>${escapeHtml(family.line)}</p><ul>` +
				family.leads.map((lead) => leadItem(data, lead)).join("") +
				family.rest.map((entry) => entryItem(data, entry)).join("") +
				"</ul></section>",
		)
		.join("");
	const labels = Object.entries(productsCopy.labelDefinitions)
		.map(([status, text]) => `<dt>${escapeHtml(directoryCopy.statuses[status])}</dt><dd>${escapeHtml(text)}</dd>`)
		.join("");
	return (
		`<main><h1>${escapeHtml(productsCopy.listHeading)}</h1><p>${escapeHtml(productsCopy.listLead)}</p>` +
		`${families}<section><h2>${escapeHtml(productsCopy.labelsHeading)}</h2><dl>${labels}</dl></section></main>`
	);
}

function productBody(data, page) {
	const { directory, directoryCopy, productsCopy } = data;
	const lead = directory.families.flatMap((f) => f.leads).find((l) => l.slug === page.slug);
	const plate = lead.entries
		.map((entry) =>
			lead.entries.length === 1
				? `<p><span>${escapeHtml(statusOf(data, entry))}</span> ${entry.versionLines.map((l) => `<span>${escapeHtml(l)}</span>`).join(" ")}</p>`
				: `<ul>${entryItem(data, entry)}</ul>`,
		)
		.join("");
	const facts = page.facts
		.map((fact) => `<dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd>`)
		.join("");
	const questions = page.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("");
	const sources = page.sources.length
		? `<section><h2>${escapeHtml(productsCopy.sourcesHeading)}</h2><ul>` +
			page.sources
				.map((s) => `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`)
				.join("") +
			"</ul></section>"
		: "";
	return (
		`<main><nav aria-label="${escapeHtml(productsCopy.breadcrumbLabel)}"><a href="/products">` +
		`${escapeHtml(productsCopy.breadcrumbRoot)}</a> / <span>${escapeHtml(page.name)}</span></nav>` +
		`<h1>${escapeHtml(page.name)}</h1><p>${escapeHtml(page.lead)}</p>${plate}` +
		`<section><h2>${escapeHtml(productsCopy.factsHeading)}</h2><dl>${facts}</dl></section>` +
		`<section><h2>${escapeHtml(productsCopy.questionsHeading)}</h2><ul>${questions}</ul></section>` +
		`${sources}</main>`
	);
}

// ---- routes ----------------------------------------------------------------------------------

/**
 * The routes to prerender: `file` is the path under the web root, `url` the public path.
 * @returns {{ url: string, file: string, head: { title: string, description: string, canonical: string }, body: string }[]}
 */
export function routesFor(data, shell) {
	const { pages, productsCopy } = data;
	const origin = productsCopy.siteOrigin;
	const shellTitle = readTag(shell, /<title>([\s\S]*?)<\/title>/, "<title>");
	const shellDescription = readTag(shell, /<meta\s+name="description"\s+content="([^"]*)"/, "description");
	const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
	const homeTitle = unescape(shellTitle);

	const routes = [
		{
			url: "/",
			file: "index.html",
			head: { title: homeTitle, description: unescape(shellDescription), canonical: `${origin}/` },
			body: homeBody(data, homeTitle),
		},
		{
			url: "/products",
			file: "products/index.html",
			head: {
				title: productsCopy.listTitle,
				description: productsCopy.listDescription,
				canonical: `${origin}/products`,
			},
			body: productsBody(data),
		},
	];
	for (const page of pages) {
		routes.push({
			url: `/products/${page.slug}`,
			file: `products/${page.slug}/index.html`,
			head: {
				title: productsCopy.titleTemplate.replace("{name}", page.name),
				description: page.lead,
				canonical: `${origin}/products/${page.slug}`,
			},
			body: productBody(data, page),
		});
	}
	return routes;
}

/** The shell with one route's head and text filled in. */
export function renderPage(shell, route) {
	const withHead = setHead(shell, route.head);
	if (!/<div id="root"><\/div>/.test(withHead)) throw new Error("prerender: the shell has no empty #root");
	return withHead.replace('<div id="root"></div>', () => `<div id="root">${route.body}</div>`);
}

export function renderSitemap(routes, data) {
	const lastmod = data.directory.checked;
	const urls = routes
		.map((r) => `  <url><loc>${escapeHtml(r.head.canonical)}</loc><lastmod>${lastmod}</lastmod></url>`)
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Writes the prerendered pages, `_shell.html` and `sitemap.xml` into a built web root.
 * Safe to run twice: the second run reads the saved shell, not the prerendered home page.
 */
export async function prerenderDist(distDir, log = console.log) {
	const shellPath = path.join(distDir, SHELL_FILE);
	const indexPath = path.join(distDir, "index.html");
	if (!existsSync(shellPath) && !existsSync(indexPath)) throw new Error(`prerender: ${distDir} has no index.html`);
	const shell = readFileSync(existsSync(shellPath) ? shellPath : indexPath, "utf8");
	const data = await loadContent();
	const routes = routesFor(data, shell);

	writeFileSync(shellPath, shell);
	for (const route of routes) {
		const target = path.join(distDir, route.file);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(target, renderPage(shell, route));
	}
	writeFileSync(path.join(distDir, "sitemap.xml"), renderSitemap(routes, data));
	log(`prerender: ${routes.length} pages, ${SHELL_FILE} and sitemap.xml written to ${distDir}`);
	return routes;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	const dist = process.argv[2] ? path.resolve(process.argv[2]) : path.join(REPO_ROOT, "dist");
	await prerenderDist(dist);
}
