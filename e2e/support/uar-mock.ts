/**
 * In-browser Universal Agent Runtime mock. Intercepts every backend path the UI
 * calls — relative (`/api/...` via the Vite proxy) or absolute (when a local
 * `.env` sets VITE_UAR_BASE_URL) — and answers from fixtures. Unknown paths get
 * a 501 and are recorded so tests can fail on accidental network use.
 */
import type { Page, Route } from "@playwright/test";
import {
  agentsResponse,
  providersResponse,
  runResponse,
  namespaceSettingsResponse,
  sessionsResponse,
  skillsResponse,
  userSettingsResponse,
} from "../fixtures/uar-data";
import { TITLE_RESPONSE, toSseBody } from "../fixtures/sse";

type Handler = (route: Route, match: RegExpMatchArray) => Promise<void>;
interface RouteDef {
  method: string;
  pattern: RegExp;
  handle: Handler;
}

/** Allow cross-origin reads when the app targets an absolute VITE_UAR_BASE_URL. */
const CORS = { "access-control-allow-origin": "*" };

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, headers: CORS, contentType: "application/json", body: JSON.stringify(body) });

const empty = (route: Route) => route.fulfill({ status: 200, headers: CORS, body: "" });

const ROUTES: RouteDef[] = [
  { method: "GET", pattern: /^\/(healthz|readyz)$/, handle: (r) => empty(r) },
  { method: "GET", pattern: /^\/api\/agents$/, handle: (r) => json(r, agentsResponse) },
  { method: "PATCH", pattern: /^\/api\/agents\/[^/]+$/, handle: (r) => json(r, agentsResponse.runtime_agents?.[0]) },
  { method: "DELETE", pattern: /^\/api\/agents\/[^/]+$/, handle: (r) => json(r, {}) },
  { method: "POST", pattern: /^\/api\/compiler\/compile$/, handle: (r) => json(r, { ok: true }) },
  { method: "GET", pattern: /^\/api\/providers$/, handle: (r) => json(r, providersResponse) },
  { method: "POST", pattern: /^\/api\/providers$/, handle: (r) => json(r, providersResponse) },
  {
    method: "GET",
    pattern: /^\/api\/providers\/([^/]+)\/models$/,
    handle: (r, m) => json(r, providersResponse.providers.find((p) => p.id === m[1])?.models ?? []),
  },
  {
    method: "GET",
    pattern: /^\/api\/providers\/([^/]+)$/,
    handle: (r, m) => {
      const p = providersResponse.providers.find((x) => x.id === m[1]);
      return p ? json(r, p) : json(r, { error: "not found" }, 404);
    },
  },
  { method: "PUT", pattern: /^\/api\/providers\/[^/]+$/, handle: (r) => json(r, providersResponse.providers[0]) },
  { method: "DELETE", pattern: /^\/api\/providers\/[^/]+$/, handle: (r) => json(r, {}) },
  { method: "POST", pattern: /^\/api\/providers\/[^/]+\/default$/, handle: (r) => json(r, {}) },
  { method: "GET", pattern: /^\/api\/skills$/, handle: (r) => json(r, skillsResponse) },
  { method: "POST", pattern: /^\/api\/skills$/, handle: (r) => json(r, skillsResponse[0]) },
  { method: "POST", pattern: /^\/api\/skills\/refresh$/, handle: (r) => json(r, { refreshed: true }) },
  { method: "POST", pattern: /^\/api\/skills\/[^/]+\/toggle$/, handle: (r) => json(r, skillsResponse[0]) },
  { method: "DELETE", pattern: /^\/api\/skills\/[^/]+$/, handle: (r) => json(r, {}) },
  { method: "GET", pattern: /^\/api\/sessions$/, handle: (r) => json(r, sessionsResponse) },
  { method: "POST", pattern: /^\/api\/sessions$/, handle: (r) => json(r, sessionsResponse[0]) },
  {
    method: "GET",
    pattern: /^\/api\/sessions\/([^/]+)$/,
    handle: (r, m) => json(r, { ...sessionsResponse[0], id: m[1], messages: [] }),
  },
  { method: "DELETE", pattern: /^\/api\/sessions\/[^/]+$/, handle: (r) => json(r, {}) },
  { method: "POST", pattern: /^\/api\/uar\/runs$/, handle: (r) => json(r, runResponse) },
  { method: "POST", pattern: /^\/api\/uar\/runs\/[^/]+\/artifact-response$/, handle: (r) => json(r, { ok: true }) },
  { method: "GET", pattern: /^\/api\/uar\/user\/settings$/, handle: (r) => json(r, userSettingsResponse) },
  { method: "PUT", pattern: /^\/api\/uar\/user\/settings$/, handle: (r) => json(r, userSettingsResponse) },
  { method: "GET", pattern: /^\/api\/uar\/settings\/[^/]+$/, handle: (r) => json(r, namespaceSettingsResponse) },
  { method: "PUT", pattern: /^\/api\/uar\/settings\/[^/]+$/, handle: (r) => json(r, namespaceSettingsResponse) },
  {
    method: "POST",
    pattern: /^\/api\/chat\/completion$/,
    handle: (route) => {
      const body = route.request().postDataJSON() as { stream?: boolean } | null;
      if (body?.stream === false) return json(route, TITLE_RESPONSE);
      return route.fulfill({
        status: 200,
        headers: { ...CORS, "content-type": "text/event-stream", "cache-control": "no-cache" },
        body: toSseBody(),
      });
    },
  },
];

export interface UarMock {
  /** Backend requests that had no fixture (method + path). */
  unmocked: string[];
}

/** Paths the mock owns; anything else (Vite assets, fonts) passes through untouched. */
const BACKEND_PATH = /^\/(api\/|healthz$|readyz$)/;

export async function installUarMock(page: Page): Promise<UarMock> {
  const mock: UarMock = { unmocked: [] };

  await page.route(
    (url) => BACKEND_PATH.test(url.pathname),
    async (route) => {
      const req = route.request();
      const { pathname } = new URL(req.url());
      const method = req.method();
      if (method === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "*",
            "access-control-allow-headers": "*",
          },
        });
      }
      for (const def of ROUTES) {
        if (def.method !== method) continue;
        const match = pathname.match(def.pattern);
        if (match) return def.handle(route, match);
      }
      mock.unmocked.push(`${method} ${pathname}`);
      return json(route, { error: `No e2e fixture for ${method} ${pathname}` }, 501);
    },
  );

  return mock;
}
