import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useCloseWithLayout } from "./use-close-with-layout";

function Harness({ setOpen }: { setOpen: (open: boolean) => void }) {
  useCloseWithLayout(setOpen);
  return null;
}

describe("useCloseWithLayout", () => {
  it("closes synchronously on unmount — no window for a fast remount to read stale state", () => {
    const setOpen = vi.fn();
    const { unmount } = render(
      <MemoryRouter initialEntries={["/threads/abc"]}>
        <Harness setOpen={setOpen} />
      </MemoryRouter>,
    );
    setOpen.mockClear(); // discard the mount-effect's call

    unmount();

    // Declarative behavior: unmounting always resets the flag. This alone
    // doesn't prove the fix for e2e/shell.spec.ts's "sheets close when
    // their layout goes away" flake, which was a *timing* race — a plain
    // useEffect cleanup is a deferred passive effect, scheduled
    // asynchronously in a real browser, so a second rapid remount (two
    // setViewportSize calls back to back, no settle in between) could read
    // stale "still open" state before that deferred cleanup ran. jsdom's
    // `act()` wrapping (used by `render`/`unmount` here) flushes passive
    // effects synchronously, which is exactly why this assertion cannot
    // distinguish useEffect from useLayoutEffect — the sync-vs-async
    // cleanup timing that matters is only observable against a real
    // browser event loop. That was verified empirically: `--repeat-each 20
    // --workers=1` against the shipped useLayoutEffect fix (see the task
    // report/commit message for the numbers).
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
