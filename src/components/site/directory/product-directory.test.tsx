/**
 * site-home-directory: the directory section on the home page. It renders the
 * public rows of the facts file and nothing else, shows each entry's status as
 * text, expands the collapsed rows, and every chip starts a chat with its
 * question.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/utils/start-chat-harness";
import { readStatusMap } from "@/test/utils/status-map";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { DIRECTORY } from "../../../../content/site/directory";
import { DIRECTORY_COPY } from "../../../../content/site/directory-copy";
import { ProductDirectory } from "./product-directory";

interface FactsRow {
	id: string;
	name: string;
	publication: string;
}
const rows = (JSON.parse(readFileSync(resolve(__dirname, "../../../../docs/knowledge-source/product-facts.json"), "utf8")) as {
	rows: FactsRow[];
}).rows;
const publicRows = rows.filter((r) => r.publication === "public");
const hiddenRows = rows.filter((r) => r.publication !== "public");
const appendix = readStatusMap();

afterEach(() => {
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

const cards = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>("[data-directory-entry]")];

describe("ProductDirectory entries", () => {
	it("renders one card for each public row and no other", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		const ids = cards(container).map((el) => el.dataset.directoryEntry);
		expect(ids).toHaveLength(publicRows.length);
		expect([...ids].sort()).toEqual(publicRows.map((r) => r.id).sort());
	});

	it("never renders a withheld or pending-consent row, its name or its count", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		const html = container.innerHTML.toLowerCase();
		for (const row of hiddenRows) {
			expect(html).not.toContain(row.name.toLowerCase());
			expect(cards(container).some((el) => el.dataset.directoryEntry === row.id)).toBe(false);
		}
		// The lead states the public count; the facts file holds 58.
		expect(container.textContent).toContain(`${publicRows.length} products and projects`);
		expect(container.textContent).not.toContain(String(rows.length));
	});

	it("shows each entry's status as text, as the design appendix has it", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		for (const expected of appendix) {
			const card = container.querySelector<HTMLElement>(`[data-directory-entry="${expected.id}"]`)!;
			expect(card, expected.id).toBeTruthy();
			expect(card.textContent, expected.id).toContain(expected.label);
			for (const line of expected.versionLine.split(" / ")) expect(card.textContent, expected.id).toContain(line);
		}
	});

	it("shows an icon with every status label, so status is never colour alone", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		const badges = [...container.querySelectorAll<HTMLElement>("[data-status]")];
		expect(badges).toHaveLength(publicRows.length);
		for (const badge of badges) {
			expect(badge.querySelector("svg[aria-hidden='true']")).not.toBeNull();
			expect(badge.textContent?.trim().length).toBeGreaterThan(0);
		}
	});

	it("has six families, ten tiles and a count that adds up", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		const headings = screen.getAllByRole("heading", { level: 3 });
		expect(headings.map((h) => h.textContent?.replace(/\s*\d+$/, ""))).toEqual(DIRECTORY_COPY.families.map((f) => f.name));
		expect(container.querySelectorAll("[data-directory-lead]")).toHaveLength(10);
		expect(screen.getByRole("heading", { level: 2, name: DIRECTORY_COPY.heading })).toBeTruthy();
	});

	it("does not link to product pages yet", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		expect(container.querySelectorAll("a")).toHaveLength(0);
		// The slug stays in the data for the product-pages change.
		expect(DIRECTORY.families.flatMap((f) => f.leads).every((l) => l.slug.length > 0)).toBe(true);
	});
});

describe("Show N more", () => {
	const collapsed = DIRECTORY.families.filter((f) => f.rest.length > 3);

	it("collapses a family with more than three index rows to two, with every row still in the HTML", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		expect(collapsed.length).toBeGreaterThan(0);
		for (const family of collapsed) {
			const section = container.querySelector<HTMLElement>(`section#${family.slug}`)!;
			const more = section.querySelector<HTMLElement>(`#directory-${family.slug}-more`)!;
			expect(more.hidden).toBe(true);
			expect(more.querySelectorAll("[data-directory-entry]")).toHaveLength(family.rest.length - 2);
			// All rows exist for crawlers; only two are visible to a reader.
			expect(section.querySelectorAll("li[data-directory-entry]").length).toBeGreaterThanOrEqual(family.rest.length);
		}
	});

	it("expands the rest and says Show fewer, keeping focus on the button", () => {
		renderWithRouter(<ProductDirectory />);
		const family = collapsed[0];
		const hiddenCount = family.rest.length - 2;
		const label = DIRECTORY_COPY.showMoreTemplate.replace("{n}", String(hiddenCount)).replace("{family}", family.name);
		const button = screen.getByRole("button", { name: label });
		expect(button.getAttribute("aria-expanded")).toBe("false");
		button.focus();
		fireEvent.click(button);
		expect(button.getAttribute("aria-expanded")).toBe("true");
		expect(button.textContent).toBe(DIRECTORY_COPY.showFewer);
		expect(document.getElementById(button.getAttribute("aria-controls")!)!.hidden).toBe(false);
		expect(document.activeElement).toBe(button);
		const section = document.getElementById(family.slug)!;
		const lastRow = family.rest[family.rest.length - 1];
		expect(within(section).getByText(lastRow.name)).toBeTruthy();
		fireEvent.click(button);
		expect(button.getAttribute("aria-expanded")).toBe("false");
	});
});

describe("ask chips", () => {
	it.each(DIRECTORY.families.flatMap((f) => f.leads))("the $title tile chip starts a chat with its lead question", (lead) => {
		const { container } = renderWithRouter(<ProductDirectory />);
		const tile = container.querySelector<HTMLElement>(`[data-directory-lead="${lead.slug}"]`)!;
		fireEvent.click(within(tile).getByRole("button", { name: lead.question }));
		expect(useChatIntentStore.getState().pendingPrompt).toBe(lead.question);
		expect(screen.getByTestId("path").textContent).toMatch(/^\/threads\/[0-9a-f-]{36}$/);
	});

	it("an index row chip says Ask, is named by its full question and starts a chat with it", () => {
		// The first row of the first family is visible without expanding.
		const entry = DIRECTORY.families[0].rest[0];
		renderWithRouter(<ProductDirectory />);
		expect(entry.prompt).toBe(`Tell me about ${entry.name}. How far along is it?`);
		const chip = screen.getByRole("button", { name: `Ask the concierge: ${entry.prompt}` });
		expect(chip.textContent).toBe("Ask");
		fireEvent.click(chip);
		expect(useChatIntentStore.getState().pendingPrompt).toBe(entry.prompt);
	});

	it("gives every public row an ask control", () => {
		const { container } = renderWithRouter(<ProductDirectory />);
		for (const card of cards(container)) {
			const own = card.querySelector("button[aria-label^='Ask the concierge:']");
			const tile = card.closest("[data-directory-lead]");
			expect(own ?? tile?.querySelector("button"), card.dataset.directoryEntry).toBeTruthy();
		}
	});
});

describe("status mix", () => {
	it("names each family's list and counts its labels from the appendix", () => {
		renderWithRouter(<ProductDirectory />);
		for (const family of DIRECTORY.families) {
			const ids = [...family.leads.flatMap((l) => l.entries), ...family.rest].map((e) => e.id);
			const list = within(document.getElementById(family.slug)!).getByRole("list", { name: DIRECTORY_COPY.statusMixLabel.replace("{n}", String(ids.length)) });
			const items = within(list).getAllByRole("listitem");
			const expected = new Map<string, number>();
			for (const id of ids) {
				const label = appendix.find((r) => r.id === id)!.label;
				expected.set(label, (expected.get(label) ?? 0) + 1);
			}
			expect(items).toHaveLength(expected.size);
			for (const item of items) {
				const label = [...expected.keys()].find((l) => item.textContent?.startsWith(l))!;
				expect(label, item.textContent ?? "").toBeTruthy();
				expect(item.textContent).toBe(`${label}${expected.get(label)}`);
			}
		}
	});
});
