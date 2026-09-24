import { vi } from "vitest";

/** `raw` sends text as-is (e.g. an SSE stream); otherwise `body` is JSON-encoded. */
type MockResponse = { status?: number; body?: unknown; raw?: string };

/** Handlers may be async to hold a response open (e.g. to observe optimistic UI). */
export type MockHandler = (req: {
  method: string;
  path: string;
  body: unknown;
}) => MockResponse | Promise<MockResponse>;

export interface FetchMock {
  calls: Array<{ method: string; path: string; body: unknown }>;
  restore: () => void;
}

/**
 * Route `fetch` by "METHOD /path" (absolute or relative URLs). Unknown routes
 * return 501 so a test never silently depends on the network.
 */
export function mockFetch(routes: Record<string, MockHandler>): FetchMock {
  const calls: FetchMock["calls"] = [];
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.toString(), "http://localhost");
    const method = (init?.method ?? "GET").toUpperCase();
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const req = { method, path: url.pathname, body };
    calls.push(req);
    const handler = routes[`${method} ${url.pathname}`];
    const res = handler ? await handler(req) : { status: 501, body: { error: "unmocked" } };
    const status = res.status ?? 200;
    const text = res.raw ?? (res.body === undefined ? "" : JSON.stringify(res.body));
    return new Response(text, { status, headers: { "content-type": "application/json" } });
  });
  return { calls, restore: () => spy.mockRestore() };
}
