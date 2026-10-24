/** site-product-pages: the header's "Products" link (site build only), current on /products. */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PRODUCTS_COPY } from "../../../content/site/products-copy";
import { SiteHeader } from "./site-header";

function renderAt(path: string) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<SiteHeader />
		</MemoryRouter>,
	);
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("header Products link", () => {
	it("points to /products and is the current page there", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt("/products");
		const link = screen.getByRole("link", { name: PRODUCTS_COPY.navLabel });
		expect(link.getAttribute("href")).toBe("/products");
		expect(link.getAttribute("aria-current")).toBe("page");
		expect(link.className).toContain("bg-ember-soft");
		expect(link.className).toContain("h-11");
	});

	it("is not marked current on the home page or on a product page", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		for (const path of ["/", "/products/the-boss"]) {
			const { unmount } = renderAt(path);
			expect(screen.getByRole("link", { name: PRODUCTS_COPY.navLabel }).getAttribute("aria-current")).toBeNull();
			unmount();
		}
	});

	it("comes after the lockup and before the Ask entry", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt("/");
		const order = [...document.querySelectorAll("header a, header button")].map((el) => el.getAttribute("aria-label") ?? el.textContent);
		expect(order.indexOf(PRODUCTS_COPY.navLabel)).toBeGreaterThan(0);
		expect(order.indexOf(PRODUCTS_COPY.navLabel)).toBeLessThan(order.indexOf("Ask the concierge"));
	});

	it("is not on the app build", () => {
		renderAt("/");
		expect(screen.queryByRole("link", { name: PRODUCTS_COPY.navLabel })).toBeNull();
	});
});
