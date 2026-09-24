import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * A sheet's open flag must not outlive the layout that shows it: close it when
 * the route changes and when the sheet unmounts (e.g. the window widens), so it
 * never reopens on its own later.
 */
export function useCloseWithLayout(setOpen: (open: boolean) => void): void {
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);
  useEffect(() => () => setOpen(false), [setOpen]);
}
