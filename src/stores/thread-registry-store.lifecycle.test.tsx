/**
 * P0-3 reproduction: does a thread leave the ephemeral state, and so appear
 * in the sidebar list, after a completed exchange? This drives the real
 * pipeline (landing registers -> intent store -> useChatRuntime ->
 * useMessageStream -> SSE -> onComplete -> markPersisted) with only the
 * network and PGlite faked.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

vi.mock("@/lib/db/pglite", () => ({
	getDbInstance: () => ({
		insertMessage: vi.fn().mockResolvedValue(undefined),
		upsertThread: vi.fn().mockResolvedValue(undefined),
		touchThread: vi.fn().mockResolvedValue(undefined),
		getMessages: vi.fn().mockResolvedValue([]),
		deleteMessages: vi.fn().mockResolvedValue(undefined),
	}),
}));

const { useChatRuntime } = await import("@/features/chat/use-chat-runtime");

const THREAD = "33333333-4444-4555-8666-777777777777";
const SSE_DELTA =
	'event: agui.message.delta\ndata: {"kind":"message","phase":"delta","request_id":"r1","delta":{"text":"Hello"}}\n\n';
const SSE_DONE = 'event: agui.done\ndata: {"kind":"done","request_id":"r1"}\n\n';

let fetchMock: FetchMock;

function visibleThreadIds(): string[] {
	// Same predicate the sidebar uses (left-sidebar.tsx visibleThreads).
	return Object.values(useThreadRegistryStore.getState().threads)
		.filter((t) => !t.isEphemeral)
		.map((t) => t.id);
}

beforeEach(() => {
	useChatMessageStore.getState().clearThread(THREAD);
	useThreadRegistryStore.setState({ threads: {}, activeThreadId: null });
	useChatIntentStore.setState({ pendingPrompt: null });
});
afterEach(() => fetchMock?.restore());

describe("thread promotion after a landing-composer exchange", () => {
	it.each([
		["agui.done", SSE_DELTA + SSE_DONE],
		["stream end with no terminator", SSE_DELTA],
	])("lists the thread once the reply completes (%s)", async (_name, raw) => {
		fetchMock = mockFetch({ "POST /api/chat/completion": () => ({ raw }) });

		// What landing-page.tsx handleSubmit does.
		useThreadRegistryStore.getState().registerThread(THREAD);
		useChatIntentStore.getState().setPendingPrompt("What is KnowMe?");
		expect(visibleThreadIds()).toEqual([]);

		const { wrapper } = createGraphTestHarness();
		await act(async () => {
			renderHook(() => useChatRuntime(THREAD), { wrapper });
		});

		await waitFor(() => expect(visibleThreadIds()).toEqual([THREAD]));
		expect(useThreadRegistryStore.getState().threads[THREAD]?.isEphemeral).toBe(false);
	});
});
