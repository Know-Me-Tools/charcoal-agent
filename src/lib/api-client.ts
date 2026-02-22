/**
 * Optional bearer token for authenticated UAR deployments.
 * Set VITE_UAR_API_KEY in your .env file.
 */
const UAR_API_KEY = (import.meta.env.VITE_UAR_API_KEY as string | undefined) ?? "";

// ---------------------------------------------------------------------------
// Active session tracker
// ---------------------------------------------------------------------------

/**
 * The UUID session ID for the currently active thread.
 *
 * The UAR associates all conversation state (messages, memory, tool context)
 * with a session ID. This must be a stable UUID created once per thread and
 * sent as `X-UAR-Session-ID` on EVERY request while that thread is active.
 *
 * Set by `setActiveSessionId` when a thread page mounts; cleared on unmount.
 * Stored as a module-level variable so it is accessible to both the api helper
 * and the raw `fetch` calls in use-message-stream / use-thread-naming.
 */
let _activeSessionId: string | null = null;

/** Call this when the user enters a thread. The ID must be a stable UUID. */
export function setActiveSessionId(id: string): void {
  _activeSessionId = id;
}

/** Call this when the user leaves a thread (component unmount). */
export function clearActiveSessionId(): void {
  _activeSessionId = null;
}

/** Read the current session ID (e.g. for raw fetch calls outside the api helper). */
export function getActiveSessionId(): string | null {
  return _activeSessionId;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const UAR_BASE_URL = (import.meta.env.VITE_UAR_BASE_URL as string | undefined) ?? "";

/**
 * Build a request URL.
 *
 * All API traffic is routed through the Vite dev-server proxy (or a production
 * reverse proxy) when using relative paths.
 * If a VITE_UAR_BASE_URL is provided to the client build, it will prepend it
 * to hit the remote server directly, which requires CORS headers on the remote.
 */
function buildUrl(path: string): string {
  let relativePath = path;
  if (
    !path.startsWith("/api") &&
    !path.startsWith("/health") &&
    !path.startsWith("/ready")
  ) {
    relativePath = `/api${path}`;
  }

  if (UAR_BASE_URL) {
    // Strip trailing slashes to accurately build the URL
    const baseUrl = UAR_BASE_URL.replace(/\/$/, "");
    return `${baseUrl}${relativePath}`;
  }

  return relativePath;
}

/**
 * Merge base headers (auth + content-type + session) with caller-supplied overrides.
 *
 * Precedence (lowest → highest):
 *   1. Content-Type: application/json
 *   2. X-UAR-Session-ID from _activeSessionId (when a thread is active)
 *   3. Authorization Bearer token (from VITE_UAR_API_KEY)
 *   4. `extra` — caller overrides (e.g. ephemeral session IDs for title gen)
 */
function buildHeaders(extra: HeadersInit = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(_activeSessionId ? { "X-UAR-Session-ID": _activeSessionId } : {}),
    ...(extra as Record<string, string>),
  };
  if (UAR_API_KEY) {
    headers["Authorization"] = `Bearer ${UAR_API_KEY}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = buildUrl(path);

  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// JWT detection helper
// ---------------------------------------------------------------------------

/** True when VITE_UAR_API_KEY is a JWT Bearer token (starts with "ey"). */
export function isJwtConfigured(): boolean {
  return UAR_API_KEY.startsWith("ey");
}

/**
 * Exported for use outside the api helper (e.g. SSE streams that use fetch directly).
 * Builds the full URL and injects auth headers.
 */
export { buildUrl, buildHeaders };
