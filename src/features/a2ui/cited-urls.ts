import { createContext, useContext } from "react";

const NO_URLS: ReadonlySet<string> = new Set();

/**
 * The thread's server-minted web citation URLs, for the A2UI `Text`. The
 * catalog is created once per surface and cannot see the thread, so the
 * surface block provides the set here. With none (or outside a thread) no
 * URL in a card is ever a link.
 */
const CitedUrlsContext = createContext<ReadonlySet<string>>(NO_URLS);

export const CitedUrlsProvider = CitedUrlsContext.Provider;

export function useCitedUrls(): ReadonlySet<string> {
  return useContext(CitedUrlsContext);
}
