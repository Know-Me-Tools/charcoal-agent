import { vi } from "vitest";

export type MockHandler = (req: { method: string; path: string; body: unknown }) => {
  status?: number;
  body?: unknown;
};

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
    const res = handler ? handler(req) : { status: 501, body: { error: "unmocked" } };
    const status = res.status ?? 200;
    const text = res.body === undefined ? "" : JSON.stringify(res.body);
    return new Response(text, { status, headers: { "content-type": "application/json" } });
  });
  return { calls, restore: () => spy.mockRestore() };
}
