/** site-product-pages 1.3: title, description, canonical and Open Graph, set on mount and put back on unmount. */
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { usePageHead } from "./use-page-head";

function Probe({ title }: { title: string }) {
	usePageHead({ title, description: `About ${title}`, canonical: `https://example.test/${title}` });
	return null;
}
const content = (selector: string) => document.head.querySelector(selector)?.getAttribute("content") ?? null;

beforeEach(() => {
	document.head.innerHTML = `<title>Original</title><meta name="description" content="Original description"><meta property="og:title" content="Original og">`;
});
afterEach(() => {
	document.head.innerHTML = "";
});

describe("usePageHead", () => {
	it("sets the title, description, canonical and social tags", () => {
		render(<Probe title="The Boss" />);
		expect(document.title).toBe("The Boss");
		expect(content('meta[name="description"]')).toBe("About The Boss");
		expect(content('meta[property="og:title"]')).toBe("The Boss");
		expect(content('meta[property="og:description"]')).toBe("About The Boss");
		expect(content('meta[property="og:url"]')).toBe("https://example.test/The Boss");
		expect(content('meta[name="twitter:title"]')).toBe("The Boss");
		expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://example.test/The Boss");
	});

	it("puts back what was there, and removes what it added, on unmount", () => {
		const { unmount } = render(<Probe title="The Boss" />);
		unmount();
		expect(document.title).toBe("Original");
		expect(content('meta[name="description"]')).toBe("Original description");
		expect(content('meta[property="og:title"]')).toBe("Original og");
		expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
		expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
	});

	it("follows a change of page", () => {
		const { rerender } = render(<Probe title="One" />);
		rerender(<Probe title="Two" />);
		expect(document.title).toBe("Two");
		expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
	});
});
