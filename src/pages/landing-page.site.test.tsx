/**
 * The public site's front page (integration gate 08, B1). On the site build
 * `/` rendered the app landing, with claims a visitor can't rely on: skills
 * to attach, an "Open app" link, and a Tauri desktop app. The site build now
 * renders `SITE_LANDING_CONTENT` (DRAFT); the app build is unchanged.
 */
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPROVED_TAGLINES } from "../../content/brand/taglines";
import { LANDING_CONTENT } from "../../content/site/landing";
import { SITE_LANDING_CONTENT } from "../../content/site/landing-site";
import LandingPage from "./landing-page";

const SITE_AGENT = "knowme-site";

/** Claims the site build must not make (PRODUCT.md constraints, gate B1). */
const FORBIDDEN_ON_SITE =
	/open app|tauri|skills? you can attach|extending what it can do|pricing|price|\$\d|gdpr|hipaa|soc ?2|certified|compliant|guarantee/i;

function renderLanding() {
	return render(
		<MemoryRouter>
			<LandingPage />
		</MemoryRouter>,
	);
}

function collectStrings(value: unknown): string[] {
	if (typeof value === "string") return [value];
	if (Array.isArray(value)) return value.flatMap(collectStrings);
	if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
	return [];
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("landing page on the site build", () => {
	it("makes none of the app landing's claims and has no 'Open app' link", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		expect(document.body.textContent).not.toMatch(FORBIDDEN_ON_SITE);
		expect(screen.queryByRole("link", { name: /open app/i })).toBeNull();
		for (const section of LANDING_CONTENT.sections) {
			expect(screen.queryByRole("heading", { name: section.heading })).toBeNull();
		}
	});

	it("has the approved tagline as its h1 and the site value line", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const h1 = screen.getByRole("heading", { level: 1 });
		expect((h1.textContent ?? "").replace(/\s+/g, " ").trim()).toBe(SITE_LANDING_CONTENT.headline);
		expect(screen.getByText(SITE_LANDING_CONTENT.valueLine)).toBeInTheDocument();
	});

	it("keeps the composer, with the site placeholder", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		expect(screen.getByRole("textbox", { name: SITE_LANDING_CONTENT.composer.placeholder })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: SITE_LANDING_CONTENT.composer.sendLabel })).toBeInTheDocument();
	});

	it("renders at most three sections, each named by its own h2", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		expect(SITE_LANDING_CONTENT.sections.length).toBeLessThanOrEqual(3);
		for (const section of SITE_LANDING_CONTENT.sections) {
			const region = screen.getByRole("region", { name: section.heading });
			expect(within(region).getByRole("heading", { level: 2 })).toHaveTextContent(section.heading);
		}
	});

	it("links to The Boss download in a new tab and says KnowMe is not yet released", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const region = screen.getByRole("region", { name: "The Boss is available now." });
		const link = within(region).getByRole("link", { name: /the-boss\.know-me\.tools/ });
		expect(link).toHaveAttribute("href", "https://the-boss.know-me.tools");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
		expect(region).toHaveTextContent(/KnowMe itself is not yet released/);
	});
});

describe("site landing content module", () => {
	it("uses an approved tagline, verbatim", () => {
		expect(APPROVED_TAGLINES).toContain(SITE_LANDING_CONTENT.headline);
		expect(SITE_LANDING_CONTENT.headline).toBe("AI that understands you.");
	});

	it("has no '!', no banned word and no forbidden claim", () => {
		const banned = /revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge|charcoal/i;
		for (const s of collectStrings(SITE_LANDING_CONTENT)) {
			expect(s.includes("!"), s).toBe(false);
			expect(banned.test(s), s).toBe(false);
			expect(FORBIDDEN_ON_SITE.test(s), s).toBe(false);
		}
	});
});

describe("landing page on the app build", () => {
	it("is unchanged: app copy, its sections and the 'Open app' link", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "");
		renderLanding();
		expect(screen.getByText(LANDING_CONTENT.valueLine)).toBeInTheDocument();
		for (const section of LANDING_CONTENT.sections) {
			expect(screen.getByRole("region", { name: section.heading })).toBeInTheDocument();
		}
		expect(screen.getByRole("link", { name: LANDING_CONTENT.nav.openAppLabel })).toHaveAttribute("href", "/threads");
		expect(screen.queryByText(SITE_LANDING_CONTENT.valueLine)).toBeNull();
	});
});
