import { create } from "zustand";
import { isWebSearchEnabled } from "@/hooks/use-site-config";

/**
 * The visitor's "Search the web" choice (site build only, off by default).
 *
 * Persisted in localStorage as a per-viewer convenience only: every access is
 * wrapped, a blocked or full store never breaks the page, and the in-memory
 * value still works for the rest of the visit. Nothing else reads this key.
 */
export const WEB_SEARCH_STORAGE_KEY = "knowme-site-web-search";

const ON = "1";
const OFF = "0";

function readStored(): boolean {
  try {
    return localStorage.getItem(WEB_SEARCH_STORAGE_KEY) === ON;
  } catch {
    return false;
  }
}

function writeStored(enabled: boolean): void {
  try {
    localStorage.setItem(WEB_SEARCH_STORAGE_KEY, enabled ? ON : OFF);
  } catch {
    // Storage is blocked or full: the choice lasts for this visit only.
  }
}

interface WebSearchPreferenceState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useWebSearchPreferenceStore = create<WebSearchPreferenceState>()((set) => ({
  enabled: readStored(),
  setEnabled: (enabled) => {
    writeStored(enabled);
    set({ enabled });
  },
}));

/**
 * The request-body field for the current choice, read when a message is sent.
 * `{ web_search: true }` only on the site build with the toggle on; otherwise
 * an empty object, so the field is omitted rather than sent as `false`.
 */
export function webSearchRequestField(): { web_search: true } | Record<string, never> {
  return isWebSearchEnabled() && useWebSearchPreferenceStore.getState().enabled ? { web_search: true } : {};
}
