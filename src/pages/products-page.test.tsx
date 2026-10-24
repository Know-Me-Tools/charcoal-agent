/**
 * site-product-pages: /products. The family filter keeps the selection in the
 * URL, the result line follows it, and every entry stays in the HTML.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DIRECTORY } from "../../content/site/directory";
import { DIRECTORY_COPY } from "../../content/site/directory-copy";
import { PRODUCTS_COPY } from "../../content/site/products-copy";
import ProductsPage from "./products-page";

vi.mock("@/lib/route-chunks", () => ({ prefetchThreadRoutes: vi.fn() }));

function Search() {
	const location = useLocation();
	return <p data-testid="search">{location.search}</p>;
}

function renderAt(path = "/products") {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Search />
			<Routes>
				<Route path="/products" element={<ProductsPage />} />
			</Routes>
		</MemoryRouter>,
	);
}

const family = DIRECTORY.families[2];
const familyCount = family.leads.reduce((n, l) => n + l.entries.length, 0) + family.rest.length;
const filterButton = (name: string) =>
	within(screen.getByRole("group", { name: PRODUCTS_COPY.filterGroupLabel })).getByRole("button", {
		name: new RegExp(`^${name}`),
	});
const status = () => screen.getByRole("status").textContent;
const showing = (n: number) =>
	PRODUCTS_COPY.resultTemplate.replace("{n}", String(n)).replace("{total}", String(DIRECTORY.total));

beforeEach(() => {
	vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
});
afterEach(() => {
	vi.unstubAllEnvs();
});

describe("/products", () => {
	it("starts on All: every entry in the HTML, the status line says so", () => {
		const { container } = renderAt();
		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PRODUCTS_COPY.listHeading);
		expect(status()).toBe(showing(DIRECTORY.total));
		expect(filterButton(PRODUCTS_COPY.filterAll).getAttribute("aria-pressed")).toBe("true");
		const ids = new Set([...container.querySelectorAll<HTMLElement>("[data-directory-entry]")].map((e) => e.dataset.directoryEntry));
		expect(ids.size).toBe(DIRECTORY.total);
	});

	it("shows family headings as h2 and tile titles as h3, with nothing collapsed", () => {
		renderAt();
		const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
		for (const f of DIRECTORY.families) expect(h2.some((t) => t?.startsWith(f.name))).toBe(true);
		expect(screen.queryByRole("button", { name: /^Show \d+ more/ })).toBeNull();
		expect(document.querySelectorAll("[hidden]").length).toBe(0);
	});

	it("writes ?family= when a family is pressed, updates the line, hides the others and keeps them in the HTML", () => {
		const { container } = renderAt();
		const button = filterButton(family.name);
		fireEvent.click(button);
		expect(screen.getByTestId("search").textContent).toBe(`?family=${family.slug}`);
		expect(status()).toBe(showing(familyCount));
		expect(button.getAttribute("aria-pressed")).toBe("true");
		expect(filterButton(PRODUCTS_COPY.filterAll).getAttribute("aria-pressed")).toBe("false");
		const sections = [...container.querySelectorAll<HTMLElement>("section[id][aria-labelledby]")].filter((s) =>
			DIRECTORY.families.some((f) => f.slug === s.id),
		);
		expect(sections).toHaveLength(DIRECTORY.families.length);
		for (const section of sections) expect(section.hidden).toBe(section.id !== family.slug);
	});

	it("keeps focus on the pressed button, and All clears the parameter", () => {
		renderAt();
		const button = filterButton(family.name);
		button.focus();
		fireEvent.click(button);
		expect(document.activeElement).toBe(filterButton(family.name));
		fireEvent.click(filterButton(PRODUCTS_COPY.filterAll));
		expect(screen.getByTestId("search").textContent).toBe("");
		expect(status()).toBe(showing(DIRECTORY.total));
	});

	it("reads the selection from the URL, and treats an unknown value as All", () => {
		renderAt(`/products?family=${family.slug}`);
		expect(status()).toBe(showing(familyCount));
		expect(filterButton(family.name).getAttribute("aria-pressed")).toBe("true");
	});

	it("treats an unknown family as All", () => {
		renderAt("/products?family=nonsense");
		expect(status()).toBe(showing(DIRECTORY.total));
		expect(filterButton(PRODUCTS_COPY.filterAll).getAttribute("aria-pressed")).toBe("true");
	});

	it("announces the result line politely and shows a count on every filter button", () => {
		renderAt();
		expect(screen.getByRole("status")).toBeTruthy();
		const group = screen.getByRole("group", { name: PRODUCTS_COPY.filterGroupLabel });
		const buttons = within(group).getAllByRole("button");
		expect(buttons).toHaveLength(DIRECTORY.families.length + 1);
		for (const b of buttons) expect(b.textContent).toMatch(/\d+$/);
	});

	it("ends with the labels key: all six labels and their definitions", () => {
		renderAt();
		const key = document.getElementById("labels") as HTMLElement;
		expect(within(key).getByRole("heading", { level: 2 }).textContent).toBe(PRODUCTS_COPY.labelsHeading);
		for (const [statusKey, label] of Object.entries(DIRECTORY_COPY.statuses)) {
			const badge = key.querySelector(`[data-status="${statusKey}"]`);
			expect(badge?.textContent).toBe(label);
			expect(key.textContent).toContain(PRODUCTS_COPY.labelDefinitions[statusKey as keyof typeof PRODUCTS_COPY.labelDefinitions]);
		}
	});

	it("links every tile title to its product page", () => {
		renderAt();
		for (const lead of DIRECTORY.families.flatMap((f) => f.leads)) {
			const link = document.querySelector<HTMLAnchorElement>(`[data-directory-lead="${lead.slug}"] a`);
			expect(link?.getAttribute("href")).toBe(`/products/${lead.slug}`);
			expect(link?.textContent).toBe(lead.title);
		}
	});
});
