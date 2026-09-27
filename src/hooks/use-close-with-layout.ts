import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * A sheet's open flag must not outlive the layout that shows it: close it when
 * the route changes and when the sheet unmounts (e.g. the window widens), so it
 * never reopens on its own later.
 *
 * Uses `useLayoutEffect`, not `useEffect`, deliberately. The host component
 * (e.g. `MobileSidebarDrawer`) is conditionally mounted based on a
 * `useMediaQuery`/`useSyncExternalStore` breakpoint, and that hook's
 * external-store updates are synchronous by design (to stay tear-free).
 * `useEffect` cleanups are ordinary *passive* effects, scheduled
 * asynchronously after paint — so on a rapid resize back and forth (e.g.
 * two `setViewportSize` calls with no settle point in between), the
 * component can unmount and remount again before its first instance's
 * passive cleanup has run, and the new instance reads the still-stale
 * (open) flag. `useLayoutEffect` cleanups run synchronously as part of the
 * same commit that removes the component, closing that window entirely.
 */
export function useCloseWithLayout(setOpen: (open: boolean) => void): void {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);
  useLayoutEffect(() => () => setOpen(false), [setOpen]);
}
