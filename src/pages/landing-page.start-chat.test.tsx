/** The landing composer starts a chat exactly as it did before useStartChat. */
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/utils/start-chat-harness";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { LANDING_CONTENT } from "../../content/site/landing";
import LandingPage from "./landing-page";

// Focusing a composer prefetches the thread route chunks; not under test here.
vi.mock("@/lib/route-chunks", () => ({ prefetchThreadRoutes: vi.fn() }));

afterEach(() => {
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe("landing composer", () => {
	it("registers an ephemeral thread, queues the prompt and navigates to it", () => {
		renderWithRouter(<LandingPage />);
		const composer = screen.getByRole("textbox", { name: LANDING_CONTENT.composer.placeholder });
		fireEvent.change(composer, { target: { value: "  Hello there  " } });
		fireEvent.submit(composer.closest("form")!);

		const path = screen.getByTestId("path").textContent ?? "";
		const id = path.replace("/threads/", "");
		expect(path).toMatch(/^\/threads\/[0-9a-f-]{36}$/);
		expect(useChatIntentStore.getState().pendingPrompt).toBe("Hello there");
		expect(useThreadRegistryStore.getState().threads[id]?.isEphemeral).toBe(true);
	});

	it("starts nothing on an empty submit and keeps the visitor on the page", () => {
		renderWithRouter(<LandingPage />);
		const composer = screen.getByRole("textbox", { name: LANDING_CONTENT.composer.placeholder });
		fireEvent.submit(composer.closest("form")!);
		expect(screen.getByTestId("path").textContent).toBe("/");
		expect(useChatIntentStore.getState().pendingPrompt).toBeNull();
		expect(document.activeElement).toBe(composer);
	});
});
