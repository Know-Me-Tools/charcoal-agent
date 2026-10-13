/**
 * site-web-search toggle (operator amendment): web search is OFF by default,
 * persisted per visitor in localStorage as a convenience only. The page must
 * work when storage throws.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "knowme-site-web-search";

async function load() {
  vi.resetModules();
  return import("./web-search-preference-store");
}

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
  vi.stubEnv("VITE_SITE_WEB_SEARCH", "1");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("web search preference store", () => {
  it("is off by default and requests no body field", async () => {
    const { useWebSearchPreferenceStore, webSearchRequestField } = await load();
    expect(useWebSearchPreferenceStore.getState().enabled).toBe(false);
    expect(webSearchRequestField()).toEqual({});
  });

  it("sends web_search: true only when on", async () => {
    const { useWebSearchPreferenceStore, webSearchRequestField } = await load();
    useWebSearchPreferenceStore.getState().setEnabled(true);
    expect(webSearchRequestField()).toEqual({ web_search: true });
    useWebSearchPreferenceStore.getState().setEnabled(false);
    expect(webSearchRequestField()).toEqual({});
    expect("web_search" in webSearchRequestField()).toBe(false);
  });

  it("sends no field without the web search build flag, even when the stored choice is on", async () => {
    vi.stubEnv("VITE_SITE_WEB_SEARCH", "");
    const { useWebSearchPreferenceStore, webSearchRequestField } = await load();
    useWebSearchPreferenceStore.getState().setEnabled(true);
    expect(webSearchRequestField()).toEqual({});
    vi.stubEnv("VITE_SITE_WEB_SEARCH", "true");
    expect(webSearchRequestField()).toEqual({});
  });

  it("persists the choice for the next visit", async () => {
    const first = await load();
    first.useWebSearchPreferenceStore.getState().setEnabled(true);
    expect(localStorage.getItem(KEY)).toBe("1");

    const second = await load();
    expect(second.useWebSearchPreferenceStore.getState().enabled).toBe(true);

    second.useWebSearchPreferenceStore.getState().setEnabled(false);
    const third = await load();
    expect(third.useWebSearchPreferenceStore.getState().enabled).toBe(false);
  });

  it("treats an unexpected stored value as off", async () => {
    localStorage.setItem(KEY, "yes please");
    const { useWebSearchPreferenceStore } = await load();
    expect(useWebSearchPreferenceStore.getState().enabled).toBe(false);
  });

  it("works when localStorage throws on read and write", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const { useWebSearchPreferenceStore, webSearchRequestField } = await load();
    expect(useWebSearchPreferenceStore.getState().enabled).toBe(false);
    expect(() => useWebSearchPreferenceStore.getState().setEnabled(true)).not.toThrow();
    expect(useWebSearchPreferenceStore.getState().enabled).toBe(true);
    expect(webSearchRequestField()).toEqual({ web_search: true });
  });
});
