/**
 * The SVG a visitor saves with "Download" is opened later as a standalone file,
 * where (unlike the `<img>` preview on the page) scripts run and links load. The
 * source is untrusted model output, so the saved copy drops what could run or
 * reach out: script-like elements, event attributes, and any reference that is
 * not a same-document `#fragment`. "Copy SVG source" is not changed: it copies
 * what the visitor sees.
 *
 * A source that is not well-formed XML is returned unchanged: a browser shows an
 * error for such an `.svg` instead of running it.
 */
const BLOCKED_ELEMENTS = ["script", "foreignObject", "iframe", "object", "embed", "audio", "video", "canvas"];
/** `url(...)` that does not point at a `#fragment`. */
const EXTERNAL_URL = /url\(\s*(?!['"]?#)[^)]*\)/gi;

export function sanitizeSvgForDownload(source: string): string {
	if (typeof DOMParser === "undefined") return source;
	const doc = new DOMParser().parseFromString(source, "image/svg+xml");
	const root = doc.documentElement;
	if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length > 0) return source;

	for (const name of BLOCKED_ELEMENTS) {
		for (const el of Array.from(doc.getElementsByTagNameNS("*", name))) el.remove();
	}
	for (const el of Array.from(doc.getElementsByTagName("*"))) {
		for (const attr of Array.from(el.attributes)) {
			const name = attr.name.toLowerCase();
			const isReference = name === "href" || name === "xlink:href" || name.endsWith(":href");
			if (name.startsWith("on") || (isReference && !attr.value.trim().startsWith("#"))) {
				el.removeAttribute(attr.name);
			} else if (EXTERNAL_URL.test(attr.value)) {
				el.setAttribute(attr.name, attr.value.replace(EXTERNAL_URL, "none"));
			}
			EXTERNAL_URL.lastIndex = 0;
		}
		if (el.localName === "style" && el.textContent) {
			el.textContent = el.textContent.replace(/@import[^;]*;?/gi, "").replace(EXTERNAL_URL, "none");
		}
	}
	return new XMLSerializer().serializeToString(doc);
}
