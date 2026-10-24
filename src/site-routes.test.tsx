/** site-product-pages: the product routes exist on the site build only. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { siteRoutes } from "./site-routes";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("siteRoutes", () => {
	it("adds /products and /products/:slug on the site build", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		expect(siteRoutes().map((r) => r.path)).toEqual(["/products", "/products/:slug"]);
	});

	it("adds nothing on the app build, so those paths reach the not-found route", () => {
		expect(siteRoutes()).toEqual([]);
	});
});
