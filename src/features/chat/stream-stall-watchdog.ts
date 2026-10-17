/**
 * Detects a reply stream that has stopped delivering bytes.
 *
 * Observed on an iPhone (2026-10-17): the server had finished a reply minutes
 * earlier while the page still showed "streaming", a spinner and the Stop
 * button, with no error and no way out. A `reader.read()` on a connection that
 * silently stopped never resolves or rejects. The site's server sends a
 * keep-alive comment at least every 10 s, so 45 s with no bytes at all means
 * the connection is dead, not that the model is thinking. Used on the site
 * build only: a direct UAR connection sends no keep-alives and may be quiet
 * for a long time.
 */

/** No bytes for this long means the connection is dead (the server beats every 10 s). */
export const STALL_AFTER_MS = 45_000;
export const STALL_CHECK_EVERY_MS = 5_000;

export interface StallWatchdog {
  /** Bytes arrived, or the page came back to the foreground and deserves a fresh window. */
  touch(): void;
  stop(): void;
}

export function startStallWatchdog(
  onStall: () => void,
  options: { now?: () => number; stallAfterMs?: number; checkEveryMs?: number } = {},
): StallWatchdog {
  const now = options.now ?? Date.now;
  const stallAfterMs = options.stallAfterMs ?? STALL_AFTER_MS;
  let lastBytesAt = now();
  let fired = false;
  const timer = setInterval(() => {
    if (!fired && now() - lastBytesAt > stallAfterMs) {
      fired = true;
      clearInterval(timer);
      onStall();
    }
  }, options.checkEveryMs ?? STALL_CHECK_EVERY_MS);
  return {
    touch() {
      lastBytesAt = now();
    },
    stop() {
      clearInterval(timer);
    },
  };
}
