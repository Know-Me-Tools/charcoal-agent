/**
 * The public site's front page (integration gate 08, B1). On the site build
 * `/` rendered the app landing, with claims a visitor can't rely on: skills
 * to attach, an "Open app" link, and a Tauri desktop app. The site build now
 * renders `SITE_LANDING_CONTENT` (DRAFT); the app build is unchanged.
 */
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_DISCLOSURE_CONTENT } from "../../content/site/ai-disclosure";
import { APPROVED_TAGLINES } from "../../content/brand/taglines";
import { LANDING_CONTENT } from "../../content/site/landing";
import { SITE_LANDING_CONTENT } from "../../content/site/landing-site";
import { HISTORY_LINK_CONTENT } from "../../content/site/history-link";
import { RESUME_CHAT_CONTENT } from "../../content/site/resume-chat";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import type { LocalThread } from "@/types";
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

function thread(id: string, isEphemeral: boolean, updatedAt = "2026-10-01T00:00:00.000Z"): LocalThread {
	return {
		id,
		title: "t",
		isEphemeral,
		createdAt: "2026-10-01T00:00:00.000Z",
		updatedAt,
	} as LocalThread;
}

afterEach(() => {
	vi.unstubAllEnvs();
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe("history link on the site build", () => {
	it("is hidden when this browser has no saved conversation", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		expect(screen.queryByRole("link", { name: HISTORY_LINK_CONTENT.label })).toBeNull();
	});

	it("is hidden when the only thread is still ephemeral", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", true) }, hydrated: true });
		renderLanding();
		expect(screen.queryByRole("link", { name: HISTORY_LINK_CONTENT.label })).toBeNull();
	});

	it("links to the conversation list when a saved conversation exists", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", false) }, hydrated: true });
		renderLanding();
		const link = screen.getByRole("link", { name: HISTORY_LINK_CONTENT.label });
		expect(link.getAttribute("href")).toBe("/threads");
	});
});

describe("resume-chat button on the site build", () => {
	const queryResume = () => screen.queryByRole("link", { name: RESUME_CHAT_CONTENT.label });

	it("is absent when this browser has no saved conversation", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: {}, hydrated: true });
		renderLanding();
		expect(queryResume()).toBeNull();
	});

	it("is absent when the only thread is an unsaved draft", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", true) }, hydrated: true });
		renderLanding();
		expect(queryResume()).toBeNull();
	});

	it("is absent until the saved chats have been read", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", false) }, hydrated: false });
		renderLanding();
		expect(queryResume()).toBeNull();
	});

	it("links straight to the one saved conversation", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", false) }, hydrated: true });
		renderLanding();
		expect(screen.getByRole("link", { name: RESUME_CHAT_CONTENT.label }).getAttribute("href")).toBe("/threads/a");
	});

	it("links to the saved conversation updated last, ignoring drafts", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({
			threads: {
				old: thread("old", false, "2026-10-01T00:00:00.000Z"),
				newest: thread("newest", false, "2026-10-09T00:00:00.000Z"),
				mid: thread("mid", false, "2026-10-05T00:00:00.000Z"),
				draft: thread("draft", true, "2026-10-18T00:00:00.000Z"),
			},
			hydrated: true,
		});
		renderLanding();
		expect(screen.getByRole("link", { name: RESUME_CHAT_CONTENT.label }).getAttribute("href")).toBe("/threads/newest");
	});

	it("leaves the header link to the conversation list in place", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", false) }, hydrated: true });
		renderLanding();
		expect(screen.getByRole("link", { name: HISTORY_LINK_CONTENT.label }).getAttribute("href")).toBe("/threads");
	});

	it("is 44 px high at least and keyboard-focusable with the shared focus cue", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		useThreadRegistryStore.setState({ threads: { a: thread("a", false) }, hydrated: true });
		renderLanding();
		const link = screen.getByRole("link", { name: RESUME_CHAT_CONTENT.label });
		expect(link).toHaveClass("min-h-11", "focus-cue");
	});

	it("is not rendered on the app build, which has its own 'Open app' link", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "");
		useThreadRegistryStore.setState({ threads: { a: thread("a", false) }, hydrated: true });
		renderLanding();
		expect(queryResume()).toBeNull();
	});
});

describe("resume-chat content module", () => {
	it("has no '!', no banned word and no forbidden claim", () => {
		const banned = /revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge/i;
		for (const s of collectStrings(RESUME_CHAT_CONTENT)) {
			expect(s.includes("!"), s).toBe(false);
			expect(banned.test(s), s).toBe(false);
			expect(FORBIDDEN_ON_SITE.test(s), s).toBe(false);
		}
	});
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

	it("offers the web-search toggle in the first composer only when web search is enabled", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		vi.stubEnv("VITE_SITE_WEB_SEARCH", "");
		const { unmount } = renderLanding();
		expect(screen.queryByRole("button", { name: /search the web/i })).toBeNull();
		unmount();
		vi.stubEnv("VITE_SITE_WEB_SEARCH", "1");
		renderLanding();
		const toggle = screen.getByRole("button", { name: /search the web/i });
		expect(toggle).toHaveAttribute("aria-pressed", "false");
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

	it("shows the approved AI disclosure and sensitive-data hint beside the composer (P0-2)", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const form = screen.getByRole("textbox", { name: SITE_LANDING_CONTENT.composer.placeholder }).closest("form");
		const label = screen.getByText(AI_DISCLOSURE_CONTENT.label);
		const hint = screen.getByText(AI_DISCLOSURE_CONTENT.sensitiveDataHint);
		expect(label).toHaveClass("font-mono", "text-xs", "text-faint");
		expect(hint).toHaveClass("font-mono", "text-xs", "text-faint");
		// Under the form, not inside it, and in the same column as the form.
		expect(form?.contains(label)).toBe(false);
		expect(form?.parentElement?.contains(label)).toBe(true);
		expect(form?.compareDocumentPosition(label)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});

	it("does not repeat the lockup in the hero (P2-4)", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const hero = screen.getByRole("region", { name: SITE_LANDING_CONTENT.headline });
		expect(within(hero).queryByRole("img", { name: "KnowMe" })).toBeNull();
	});

	it("keeps the eyebrow on the hero only (P2-5)", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		expect(screen.getByText(SITE_LANDING_CONTENT.eyebrow)).toBeInTheDocument();
		for (const section of SITE_LANDING_CONTENT.sections) {
			expect(screen.queryByText(section.label)).toBeNull();
		}
	});

	it("never breaks the domain link at its hyphen (P2-3)", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const link = screen.getByRole("link", { name: /the-boss\.know-me\.tools/ });
		expect(link).toHaveClass("whitespace-nowrap");
	});

	it("lets the composer take the full column at tablet width (P2-8)", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		renderLanding();
		const form = screen.getByRole("textbox", { name: SITE_LANDING_CONTENT.composer.placeholder }).closest("form");
		expect(form?.parentElement).not.toHaveClass("md:max-w-xl");
	});
});

describe("site landing content module", () => {
	it("uses an approved tagline, verbatim", () => {
		expect(APPROVED_TAGLINES).toContain(SITE_LANDING_CONTENT.headline);
		expect(SITE_LANDING_CONTENT.headline).toBe("AI that understands you.");
	});

	it("has no '!', no banned word and no forbidden claim", () => {
		const banned = /revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge/i;
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
		// The disclosure is a site-build addition; the app build is unchanged.
		expect(screen.queryByText(AI_DISCLOSURE_CONTENT.label)).toBeNull();
		for (const section of LANDING_CONTENT.sections) {
			expect(screen.getByText(section.label)).toBeInTheDocument();
		}
	});
});
