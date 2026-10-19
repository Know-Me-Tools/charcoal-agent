/**
 * A one-shot signal from `DbProvider` to the app-root notice component
 * (`src/components/common/persistence-notices.tsx`) that the local database
 * was deleted and recreated because it could not be read.
 *
 * `DbProvider` raises it before the notice component has mounted (the
 * component sits inside the provider's ready tree), so it is latched and
 * handed to the first subscriber, once — the same hand-off the write queue
 * uses for a failure reported before any subscriber exists. It lives only in
 * memory: the reset happens in one page load, and the next load opens the
 * new database normally, so there is nothing to persist.
 */
type ResetListener = () => void;

const listeners = new Set<ResetListener>();
let latched = false;

export function announceDbReset(): void {
  if (listeners.size === 0) {
    latched = true;
    return;
  }
  for (const listener of listeners) listener();
}

export function subscribeDbReset(listener: ResetListener): () => void {
  listeners.add(listener);
  if (latched) {
    latched = false;
    listener();
  }
  return () => {
    listeners.delete(listener);
  };
}
