/**
 * Session-level prompt-caching toggle.
 *
 * This hook manages the per-session `prompt_caching_enabled` override that is
 * sent with every chat request. `undefined` means "let the server decide"
 * (user → agent → global hierarchy). `true`/`false` explicitly overrides.
 *
 * State is stored in localStorage so the preference survives page refreshes.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "charcoal:prompt_caching_enabled";

type CachingState = boolean | undefined;

function readStorage(): CachingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // localStorage unavailable — fall through
  }
  return undefined;
}

function writeStorage(value: CachingState): void {
  try {
    if (value === undefined) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch {
    // ignore
  }
}

export interface UsePromptCachingReturn {
  /** Current session override. `undefined` = inherit from server hierarchy. */
  promptCachingEnabled: CachingState;
  /** Set the session override. Pass `undefined` to clear (inherit). */
  setPromptCachingEnabled: (value: CachingState) => void;
  /** Toggle between `true` and `false`. If currently `undefined`, sets `true`. */
  togglePromptCaching: () => void;
}

export function usePromptCaching(): UsePromptCachingReturn {
  const [state, setState] = useState<CachingState>(readStorage);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    writeStorage(state);
  }, [state]);

  const setPromptCachingEnabled = useCallback((value: CachingState) => {
    setState(value);
  }, []);

  const togglePromptCaching = useCallback(() => {
    setState((prev) => {
      if (prev === undefined) return true;
      return !prev;
    });
  }, []);

  return { promptCachingEnabled: state, setPromptCachingEnabled, togglePromptCaching };
}
