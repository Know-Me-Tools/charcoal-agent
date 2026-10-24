import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useStartChat } from "./use-start-chat";

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

function setup() {
	return renderHook(() => ({ start: useStartChat(), path: useLocation().pathname }), { wrapper });
}

afterEach(() => {
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe("useStartChat", () => {
	it("registers an ephemeral thread, queues the trimmed prompt and opens the thread", () => {
		const { result } = setup();
		let id = "";
		act(() => {
			id = result.current.start("  What is the Boss?  ");
		});
		expect(result.current.path).toBe(`/threads/${id}`);
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
		expect(useChatIntentStore.getState().pendingPrompt).toBe("What is the Boss?");
		expect(useThreadRegistryStore.getState().threads[id]?.isEphemeral).toBe(true);
	});

	it("opens an empty thread, with nothing queued, when there is no prompt", () => {
		const { result } = setup();
		act(() => {
			result.current.start();
		});
		expect(result.current.path).toMatch(/^\/threads\//);
		expect(useChatIntentStore.getState().pendingPrompt).toBeNull();
		act(() => {
			result.current.start("   ");
		});
		expect(useChatIntentStore.getState().pendingPrompt).toBeNull();
	});
});
