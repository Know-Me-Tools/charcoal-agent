import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { toast } from "sonner";
import { Toaster } from "./sonner";

const MESSAGE = "Couldn't save your latest messages on this device.";

afterEach(() => {
  // sonner's toast store is a module-level singleton — clear it between
  // tests so a toast raised in one test doesn't leak into the next.
  act(() => {
    toast.dismiss();
  });
});

describe("Toaster", () => {
  it("positions top-center, clear of the composer and the mobile bottom nav", async () => {
    render(<Toaster />);
    // The toaster root doesn't render at all with zero toasts (sonner
    // returns null) — raise one so the positioned <ol> mounts.
    act(() => {
      toast(MESSAGE, { id: "position-check" });
    });
    await screen.findByText(MESSAGE);

    const toaster = document.querySelector("[data-sonner-toaster]");
    expect(toaster).not.toBeNull();
    expect(toaster).toHaveAttribute("data-y-position", "top");
    expect(toaster).toHaveAttribute("data-x-position", "center");

    // Clears the topbar (h-12 = 48px) on every breakpoint, both when the
    // toaster falls under sonner's own >600px offset and its <=600px
    // "mobile" offset (320px included) — see sonner.tsx's TOAST_TOP_OFFSET
    // comment for why a bottom offset can't do this safely.
    const style = (toaster as HTMLElement).style;
    expect(style.getPropertyValue("--offset-top")).toBe("4rem");
    expect(style.getPropertyValue("--mobile-offset-top")).toBe("4rem");
  });

  it("renders a raised toast with no border, shadow or blur, and token text colour", async () => {
    render(<Toaster />);

    act(() => {
      toast(MESSAGE, { id: "knowme-persistence-failure" });
    });

    const text = await screen.findByText(MESSAGE);
    const toastEl = text.closest("[data-sonner-toast]");
    expect(toastEl).not.toBeNull();

    const className = (toastEl as HTMLElement).className;
    expect(className).toMatch(/\bbg-raised\b/);
    expect(className).toMatch(/\btext-fg\b/);
    expect(className).not.toMatch(/shadow/);
    expect(className).not.toMatch(/backdrop-blur/);
    expect(className).not.toMatch(/(?<![\w-])border(?!-0\b)(?:-[\w[\]/.:%-]+)?(?![\w-])/);

    // unstyled mode: sonner's own [data-styled=true] chrome (which bakes in
    // a 1px border and a box-shadow with no variable escape hatch) never
    // applies — our classNames are the only visual treatment.
    expect(toastEl).not.toHaveAttribute("data-styled", "true");
  });
});
