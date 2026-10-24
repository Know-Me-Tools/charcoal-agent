/** The header entry: present on non-thread site pages, absent on a thread, one control. */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Topbar } from "@/components/layout/topbar";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { ASK_CONCIERGE_CONTENT } from "../../../content/site/ask-concierge";
import { SiteHeader } from "./site-header";

vi.mock("@/hooks/use-health", () => ({ useHealth: () => ({ isLoading: false, data: { status: "ok" } }) }));
vi.mock("@/hooks/use-agents", () => ({ useAgents: () => ({ data: [] }) }));

const NAME = ASK_CONCIERGE_CONTENT.headerLabel;
const THREAD = "/threads/11111111-1111-4111-8111-111111111111";

function renderAt(path: string, element = <Topbar />) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route path="*" element={element} />
			</Routes>
		</MemoryRouter>,
	);
}

afterEach(() => {
	vi.unstubAllEnvs();
	document.body.innerHTML = "";
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe("Ask the concierge header entry (site build)", () => {
	it("is in the site header on a non-thread page, once, 44px", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt("/", <SiteHeader />);
		const entry = screen.getAllByRole("button", { name: NAME });
		expect(entry).toHaveLength(1);
		expect(entry[0].className).toContain("h-11");
		expect(entry[0].className).toContain("min-w-11");
	});

	it("is in the top bar on /threads", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt("/threads");
		expect(screen.getAllByRole("button", { name: NAME })).toHaveLength(1);
	});

	it("is not shown on a thread page", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt(THREAD);
		expect(screen.queryByRole("button", { name: NAME })).toBeNull();
	});

	it("is not shown on the app build", () => {
		renderAt("/", <SiteHeader />);
		expect(screen.queryByRole("button", { name: NAME })).toBeNull();
	});

	it("opens a new empty thread when the page has no composer", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt("/threads");
		fireEvent.click(screen.getByRole("button", { name: NAME }));
		expect(useChatIntentStore.getState().pendingPrompt).toBeNull();
		expect(Object.keys(useThreadRegistryStore.getState().threads)).toHaveLength(1);
	});

	it("focuses the page's composer instead when there is one", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
		renderAt("/", <SiteHeader />);
		const field = document.createElement("textarea");
		field.setAttribute("data-ask-composer", "");
		field.scrollIntoView = vi.fn();
		document.body.append(field);
		fireEvent.click(screen.getByRole("button", { name: NAME }));
		expect(document.activeElement).toBe(field);
		expect(Object.keys(useThreadRegistryStore.getState().threads)).toHaveLength(0);
	});
});
