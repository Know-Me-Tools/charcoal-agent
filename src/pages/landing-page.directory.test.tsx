/**
 * site-home-directory: the directory sits on the site build's front page,
 * after the hero, and leaves every operator-approved section as it was.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DIRECTORY_COPY } from "../../content/site/directory-copy";
import { SITE_LANDING_CONTENT } from "../../content/site/landing-site";
import { AI_DISCLOSURE_CONTENT } from "../../content/site/ai-disclosure";
import LandingPage from "./landing-page";

vi.mock("@/lib/route-chunks", () => ({ prefetchThreadRoutes: vi.fn() }));

const SITE_AGENT = "knowme-site";

function renderLanding() {
	return render(
		<MemoryRouter>
			<LandingPage />
		</MemoryRouter>,
	);
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("landing page on the site build", () => {
	it("shows the directory between the hero and the approved sections", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
		expect(headings).toEqual([
			DIRECTORY_COPY.heading,
			...SITE_LANDING_CONTENT.sections.map((s) => s.heading),
		]);
		const hero = screen.getByRole("heading", { level: 1 });
		const directory = screen.getByRole("heading", { level: 2, name: DIRECTORY_COPY.heading });
		expect(hero.compareDocumentPosition(directory) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("keeps the hero, composer, AI disclosure and every approved section", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(SITE_LANDING_CONTENT.headline);
		expect(screen.getByRole("textbox", { name: SITE_LANDING_CONTENT.composer.placeholder })).toBeTruthy();
		expect(screen.getByText(AI_DISCLOSURE_CONTENT.label)).toBeTruthy();
		for (const section of SITE_LANDING_CONTENT.sections) {
			expect(screen.getByRole("heading", { level: 2, name: section.heading })).toBeTruthy();
			for (const paragraph of section.body) expect(screen.getByText(paragraph)).toBeTruthy();
		}
	});
});

describe("landing page on the app build", () => {
	it("has no directory", () => {
		renderLanding();
		expect(screen.queryByRole("heading", { name: DIRECTORY_COPY.heading })).toBeNull();
		expect(document.querySelector("[data-directory-entry]")).toBeNull();
	});
});
