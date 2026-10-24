/**
 * site-product-pages: the ten product pages and the not-found path. Every
 * page is rendered and its status, version and checked line are compared with
 * the generated directory, never with a string typed here.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkedLine } from "@/components/site/products/product-data";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { AI_DISCLOSURE_CONTENT } from "../../content/site/ai-disclosure";
import { DIRECTORY } from "../../content/site/directory";
import { DIRECTORY_COPY } from "../../content/site/directory-copy";
import { NOT_FOUND_CONTENT } from "../../content/site/not-found";
import { PRODUCT_PAGES } from "../../content/site/products";
import { PRODUCTS_COPY } from "../../content/site/products-copy";
import ProductPage from "./product-page";

vi.mock("@/lib/route-chunks", () => ({ prefetchThreadRoutes: vi.fn() }));

const LEADS = DIRECTORY.families.flatMap((family) => family.leads);

function Path() {
	return <p data-testid="path">{useLocation().pathname}</p>;
}

function renderAt(path: string) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route path="/products/:slug" element={<ProductPage />} />
				<Route path="*" element={<Path />} />
			</Routes>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
});

afterEach(() => {
	vi.unstubAllEnvs();
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe.each(PRODUCT_PAGES.map((page) => [page.slug, page] as const))("/products/%s", (slug, page) => {
	const lead = LEADS.find((l) => l.slug === slug);

	it("shows the name, the lead and a breadcrumb that ends on this page", () => {
		renderAt(`/products/${slug}`);
		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(page.name);
		expect(screen.getByText(page.lead)).toBeTruthy();
		const crumbs = screen.getByRole("navigation", { name: PRODUCTS_COPY.breadcrumbLabel });
		expect(within(crumbs).getByRole("link", { name: PRODUCTS_COPY.breadcrumbRoot }).getAttribute("href")).toBe("/products");
		expect(crumbs.querySelector('[aria-current="page"]')?.textContent).toBe(page.name);
	});

	it("shows each row's status as text and its version lines exactly as the directory has them", () => {
		renderAt(`/products/${slug}`);
		const plate = document.querySelector<HTMLElement>("[data-product-plate]");
		expect(plate).not.toBeNull();
		const text = plate?.textContent ?? "";
		const badges = [...(plate?.querySelectorAll<HTMLElement>("[data-status]") ?? [])];
		expect(badges).toHaveLength(lead?.entries.length ?? -1);
		lead?.entries.forEach((entry, index) => {
			expect(badges[index].textContent).toBe(DIRECTORY_COPY.statuses[entry.status]);
			expect(badges[index].dataset.status).toBe(entry.status);
			for (const line of entry.versionLines) expect(text.replace(/\s+/g, " ")).toContain(line);
		});
		expect(text).toContain(checkedLine(lead?.entries ?? []));
	});

	it("has 3 to 5 key facts, from the copy, in a definition list", () => {
		renderAt(`/products/${slug}`);
		const region = screen.getByRole("region", { name: PRODUCTS_COPY.factsHeading });
		const terms = [...region.querySelectorAll("dt")].map((el) => el.textContent);
		const values = [...region.querySelectorAll("dd")].map((el) => el.textContent);
		expect(terms).toEqual(page.facts.map((f) => f.label));
		expect(values).toEqual(page.facts.map((f) => f.value));
		expect(terms.length).toBeGreaterThanOrEqual(3);
		expect(terms.length).toBeLessThanOrEqual(5);
	});

	it("offers each question as a chip with its full text, and the inline composer", () => {
		renderAt(`/products/${slug}`);
		const ask = screen.getByRole("region", { name: PRODUCTS_COPY.questionsHeading });
		const chips = within(ask)
			.getAllByRole("button")
			.filter((b) => b.getAttribute("type") !== "submit")
			.map((b) => b.textContent);
		expect(chips).toEqual(page.questions);
		const field = within(ask).getByRole("textbox", { name: PRODUCTS_COPY.composerPlaceholder.replace("{name}", page.name) });
		expect(field.getAttribute("placeholder")).toBe(`Ask about ${page.name}`);
		expect(within(ask).getByText(AI_DISCLOSURE_CONTENT.label)).toBeTruthy();
		expect(within(ask).getByText(AI_DISCLOSURE_CONTENT.sensitiveDataHint)).toBeTruthy();
	});

	it("keeps the heading levels in order: one h1, then h2 sections", () => {
		renderAt(`/products/${slug}`);
		const levels = screen.getAllByRole("heading").map((h) => Number(h.tagName.slice(1)));
		expect(levels.filter((l) => l === 1)).toHaveLength(1);
		expect(levels[0]).toBe(1);
		expect(levels.every((l) => l <= 2)).toBe(true);
	});

	it("lists only public sources, each opening in a new tab; none means no Sources section", () => {
		renderAt(`/products/${slug}`);
		const region = screen.queryByRole("region", { name: PRODUCTS_COPY.sourcesHeading });
		if (page.sources.length === 0) {
			expect(region).toBeNull();
			return;
		}
		const links = within(region as HTMLElement).getAllByRole("link");
		expect(links.map((a) => a.getAttribute("href"))).toEqual(page.sources.map((s) => s.url));
		for (const a of links) {
			expect(a.getAttribute("rel")).toContain("noopener");
			expect(a.textContent).toContain(PRODUCTS_COPY.opensInNewTab);
		}
	});

	it("sets the title, description and canonical for this page", () => {
		renderAt(`/products/${slug}`);
		expect(document.title).toBe(`${page.name} · KnowMe AI, LLC`);
		expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(page.lead);
		expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(document.title);
		expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
			`${PRODUCTS_COPY.siteOrigin}/products/${slug}`,
		);
	});

	it("opens a thread whose first message is the pressed question", () => {
		renderAt(`/products/${slug}`);
		fireEvent.click(screen.getByRole("button", { name: page.questions[1] }));
		expect(screen.getByTestId("path").textContent).toMatch(/^\/threads\//);
		expect(useChatIntentStore.getState().pendingPrompt).toBe(page.questions[1]);
	});
});

describe("product pages with several rows", () => {
	it.each(["flint-platform", "prometheus-skill-pack"])("%s lists each row with its own badge and no group badge", (slug) => {
		renderAt(`/products/${slug}`);
		const lead = LEADS.find((l) => l.slug === slug);
		const items = document.querySelectorAll("[data-product-plate] li[data-directory-entry]");
		expect([...items].map((i) => (i as HTMLElement).dataset.directoryEntry)).toEqual(lead?.entries.map((e) => e.id));
		expect(document.querySelectorAll("[data-product-plate] [data-status]")).toHaveLength(lead?.entries.length ?? -1);
	});
});

describe("Locus, a design-stage product", () => {
	it("says it is proposed and never describes it as available", () => {
		renderAt("/products/locus");
		const text = document.querySelector("main")?.textContent ?? "";
		expect(text).toContain("Design only");
		expect(text).toMatch(/proposed/i);
		expect(text).not.toMatch(/available now|you can use|download/i);
	});
});

describe("an unknown slug", () => {
	it("renders the not-found page", () => {
		renderAt("/products/no-such-product");
		expect(screen.getByRole("heading", { level: 1, name: NOT_FOUND_CONTENT.heading })).toBeTruthy();
		expect(screen.queryByRole("region", { name: PRODUCTS_COPY.questionsHeading })).toBeNull();
		expect(screen.getByText("/products/no-such-product")).toBeTruthy();
	});

	it("does not treat a slug of another case or a trailing variant as a product", () => {
		renderAt("/products/The-Boss");
		expect(screen.getByRole("heading", { level: 1, name: NOT_FOUND_CONTENT.heading })).toBeTruthy();
	});
});
