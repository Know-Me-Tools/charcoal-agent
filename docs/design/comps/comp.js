/*
 * Render helpers for the static comps (docs/design/product-directory.md).
 * Not application code: it exists so the three comps share one markup source
 * and render the generated directory-data.js. ?theme=dark switches theme.
 */
(function () {
	const params = new URLSearchParams(location.search);
	if (params.get("theme") === "dark") document.documentElement.classList.add("dark");

	const esc = (s) =>
		String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

	function icon(name, cls = "") {
		const node = window.ICONS[name];
		const inner = node
			.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}/>`)
			.join("");
		return `<svg class="icon ${cls}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">${inner}</svg>`;
	}

	// The KnowMe "Conviction" mark, same geometry as src/components/brand/knowme-mark.tsx.
	function mark(size) {
		return `<svg viewBox="27 34 132 132" width="${size}" height="${size}" aria-hidden="true" focusable="false"><g transform="translate(50, 38)"><rect x="0" y="0" width="20" height="124" rx="10" fill="currentColor"/><path d="M 16,62 C 26,52 44,32 62,18 C 72,10 80,8 84,14 C 86,18 82,24 76,28 C 60,40 40,56 28,66 C 22,70 18,68 16,64 Z" fill="currentColor"/><path d="M 16,62 C 26,72 44,92 62,106 C 72,114 80,116 84,110 C 86,106 82,100 76,96 C 60,84 40,68 28,58 C 22,54 18,56 16,60 Z" fill="currentColor"/><circle cx="18" cy="62" r="10" fill="var(--km-ember)"/></g></svg>`;
	}
	function lockup(variant = "nav") {
		const size = variant === "footer" ? 24 : 28;
		return `<span class="lockup lockup--${variant}" role="img" aria-label="KnowMe">${mark(size)}<span class="word" aria-hidden="true">Know<span class="me">Me</span></span></span>`;
	}

	function header({ current = "", askHint = "" } = {}) {
		const isDark = document.documentElement.classList.contains("dark");
		return `
<a class="sr-only" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap row">
  <a href="home-directory.html" class="focus-cue" style="border-radius:.625rem;padding:.25rem;margin-inline:-.25rem">${lockup("nav")}</a>
  <nav class="nav-group" aria-label="Site">
    <a href="products.html" class="nav-link hover focus-cue only-sm" ${current === "products" ? 'aria-current="page"' : ""}>Products</a>
    <a href="#ask" class="ask-entry hover focus-cue" aria-label="Ask the concierge" ${askHint ? `data-hint="${askHint}"` : ""}>${icon("message-circle")}<span class="label">Ask the concierge</span></a>
    <button type="button" class="icon-btn hover focus-cue" aria-label="${isDark ? "Switch to light theme" : "Switch to dark theme"}">${icon(isDark ? "sun" : "moon")}</button>
  </nav>
</div></header>`;
	}

	function footer() {
		return `<footer class="site-footer"><div class="wrap row">${lockup("footer")}<p class="legal">© 2026 KnowMe AI, LLC · v2.4.0</p></div></footer>`;
	}

	function badge(statusKey) {
		const s = window.DIRECTORY.statuses[statusKey];
		return `<span class="badge badge--${s.tone}">${icon(s.icon)}${esc(s.label)}</span>`;
	}
	function version(lines) {
		// Each " · " segment is unbreakable, so a line wraps between segments, never inside a date.
		return lines
			.map((l) => `<span class="version">${l.split(" · ").map((seg) => `<span class="nw">${esc(seg)}</span>`).join(" · ")}</span>`)
			.join("");
	}
	function askChip(question, { short = false, name = "" } = {}) {
		if (short) {
			return `<button type="button" class="ask-chip ask-chip--short hover focus-cue" aria-label="Ask the concierge: ${esc(question)}">${icon("message-circle")}Ask</button>`;
		}
		return `<button type="button" class="ask-chip hover focus-cue">${icon("message-circle")}<span>${esc(question)}</span></button>`;
	}

	// The arrow travels with the last word, so a wrapped title never strands it.
	function titleWithArrow(title) {
		const words = title.split(" ");
		const last = words.pop();
		return `${words.length ? esc(words.join(" ")) + " " : ""}<span class="nw">${esc(last)}${icon("arrow-right")}</span>`;
	}

	function tile(page) {
		const multi = page.entries.length > 1;
		const first = page.entries[0];
		const metaBlock = multi
			? `<ul class="components">${page.entries
					.map(
						(e) =>
							`<li><span class="cname">${esc(e.name)}</span>${badge(e.status)}${version(e.versionLines)}</li>`,
					)
					.join("")}</ul>`
			: `<div class="meta">${badge(first.status)}${version(first.versionLines)}</div>`;
		const summary = multi ? page.summary || first.summary : first.summary;
		return `<article class="tile" aria-labelledby="t-${page.slug}">
  <h4 id="t-${page.slug}"><a href="product-the-boss.html" class="focus-cue">${titleWithArrow(page.title)}</a></h4>
  ${metaBlock}
  <p class="summary">${esc(summary)}</p>
  ${askChip(page.question)}
</article>`;
	}

	function entry(e) {
		return `<li class="entry">
  <div class="main">
    <div class="top"><span class="name">${esc(e.name)}</span>${badge(e.status)}</div>
    <p class="summary">${esc(e.summary)}</p>
  </div>
  <p class="ver">${version(e.versionLines)}</p>
  ${askChip(e.prompt, { short: true })}
</li>`;
	}

	function family(f, { collapse = true, headingLevel = 3 } = {}) {
		const visible = collapse && f.rest.length > 3 ? f.rest.slice(0, 2) : f.rest;
		const hidden = f.rest.length - visible.length;
		const statuses = window.DIRECTORY.statuses;
		const mix = f.mix
			.map(([k, n]) => `<li>${icon(statuses[k].icon)}${esc(statuses[k].label)} <span class="n">${n}</span></li>`)
			.join("");
		const leads = f.pages.length
			? `<div class="leads n${f.pages.length}">${f.pages.map(tile).join("")}</div>`
			: "";
		const index = f.rest.length
			? `<div class="index"><ul>${visible.map(entry).join("")}</ul>${
					hidden
						? `<button type="button" class="more hover focus-cue" aria-expanded="false">${icon("chevron-down")}Show ${hidden} more in ${esc(f.name)}</button>`
						: ""
				}</div>`
			: "";
		return `<section class="family" aria-labelledby="f-${f.slug}" id="${f.slug}">
  <div class="family-head">
    <h${headingLevel} id="f-${f.slug}">${esc(f.name)}<span class="count">${f.count}</span></h${headingLevel}>
    <p class="line">${esc(f.line)}</p>
    <ul class="mix" aria-label="Status of the ${f.count} entries">${mix}</ul>
  </div>
  <div class="family-body">${leads}${index}</div>
</section>`;
	}

	window.Comp = { esc, icon, lockup, header, footer, badge, version, askChip, tile, entry, family };
})();
