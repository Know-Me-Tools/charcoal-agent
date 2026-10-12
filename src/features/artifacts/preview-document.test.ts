import { describe, expect, it } from "vitest";
import { PREVIEW_CSP, toPreviewDocument } from "./preview-document";

/**
 * site-reply-content-hardening 3.3. A `srcdoc` frame inherits the page's
 * CSP; the preview adds its own, stricter one so model-written HTML cannot
 * load remote resources or connect anywhere. A CSP meta only applies when it
 * is in `<head>` and only to what follows it, so it must be the first thing
 * in the head the browser actually builds — and it must not push anything in
 * front of a leading doctype, or the document drops into quirks mode.
 *
 * Assertions parse the output the way the frame will (DOMParser) instead of
 * comparing strings, because what matters is the document the browser builds.
 */
function parse(html: string): Document {
	return new DOMParser().parseFromString(html, "text/html");
}

function firstHeadElement(doc: Document): Element | null {
	return doc.head.firstElementChild;
}

function expectOurPolicyFirst(output: string): Document {
	const doc = parse(output);
	const first = firstHeadElement(doc);
	expect(first?.tagName).toBe("META");
	expect(first?.getAttribute("http-equiv")).toBe("Content-Security-Policy");
	expect(first?.getAttribute("content")).toBe(PREVIEW_CSP);
	return doc;
}

describe("toPreviewDocument", () => {
	it("uses the isolating policy", () => {
		expect(PREVIEW_CSP).toBe(
			"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:",
		);
	});

	it("keeps a leading doctype first, stays in standards mode, and puts the meta first in <head>", () => {
		const output = toPreviewDocument(
			"<!DOCTYPE html><html><head><title>t</title></head><body><p>x</p></body></html>",
		);
		expect(output.startsWith("<!DOCTYPE html>")).toBe(true);
		const doc = expectOurPolicyFirst(output);
		expect(doc.compatMode).toBe("CSS1Compat");
		expect(doc.title).toBe("t");
		expect(doc.body.innerHTML).toBe("<p>x</p>");
	});

	it("keeps a legacy doctype's public and system identifiers", () => {
		const doctype =
			'<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';
		const output = toPreviewDocument(`${doctype}<html><body>x</body></html>`);
		expect(output.startsWith(doctype)).toBe(true);
		expect(parse(output).compatMode).toBe("CSS1Compat");
	});

	it("matches an uppercase doctype and uppercase tags", () => {
		const output = toPreviewDocument(
			'<!DOCTYPE HTML><HTML LANG="en"><HEAD><TITLE>t</TITLE></HEAD><BODY>x</BODY></HTML>',
		);
		expect(output.toLowerCase().startsWith("<!doctype html>")).toBe(true);
		const doc = expectOurPolicyFirst(output);
		expect(doc.compatMode).toBe("CSS1Compat");
		expect(doc.documentElement.getAttribute("lang")).toBe("en");
	});

	it("creates a <head> when the document has none, after <html> and after the doctype", () => {
		for (const source of ["<!DOCTYPE html><html><body>x</body></html>", "<!DOCTYPE html><body>x</body>"]) {
			const output = toPreviewDocument(source);
			expect(output.startsWith("<!DOCTYPE html>")).toBe(true);
			const doc = expectOurPolicyFirst(output);
			expect(doc.compatMode).toBe("CSS1Compat");
			expect(doc.body.textContent).toBe("x");
		}
	});

	it("does not add a doctype to a full document that had none", () => {
		const output = toPreviewDocument("<html><body>x</body></html>");
		expect(output.startsWith("<html>")).toBe(true);
		expectOurPolicyFirst(output);
	});

	it("wraps a fragment in a standards-mode document", () => {
		const output = toPreviewDocument("<p>hello</p>");
		expect(output.startsWith("<!DOCTYPE html>")).toBe(true);
		const doc = expectOurPolicyFirst(output);
		expect(doc.compatMode).toBe("CSS1Compat");
		expect(doc.body.innerHTML).toBe("<p>hello</p>");
	});

	it("does not mistake <header> for <head>", () => {
		const doc = expectOurPolicyFirst(toPreviewDocument("<header>h</header><p>x</p>"));
		expect(doc.body.querySelector("header")?.textContent).toBe("h");
	});

	it("keeps a model-supplied CSP meta after ours, so ours still applies", () => {
		const output = toPreviewDocument(
			'<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src *"></head><body>x</body></html>',
		);
		const doc = expectOurPolicyFirst(output);
		const metas = doc.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
		expect(metas).toHaveLength(2);
		expect(metas[1].getAttribute("content")).toBe("default-src *");
	});

	it("is not fooled by a <head> tag inside a comment or after body content", () => {
		for (const source of [
			"<!-- <head> --><!DOCTYPE html><html><body>x</body></html>",
			"<p>x</p><head><title>late</title></head>",
		]) {
			expectOurPolicyFirst(toPreviewDocument(source));
		}
	});

	it("keeps inline scripts in place after the policy meta", () => {
		const output = toPreviewDocument("<!DOCTYPE html><html><head><script>1</script></head><body></body></html>");
		const doc = expectOurPolicyFirst(output);
		expect(doc.head.querySelector("script")?.textContent).toBe("1");
	});
});
