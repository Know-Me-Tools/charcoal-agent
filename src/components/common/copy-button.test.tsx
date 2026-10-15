import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

// jsdom exposes no clipboard; each test stubs (or deliberately omits) one.
function stubClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

afterEach(() => {
  stubClipboard(undefined);
  vi.useRealTimers();
});

describe("CopyButton — icon variant", () => {
  it("names its block, copies the given text and announces 'Copied'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyButton text={"<p>hi</p>"} label="Copy code" />);

    const button = screen.getByRole("button", { name: "Copy code" });
    // 32 px from 768 px, 44 px below — the web-search toggle's max-md pattern.
    expect(button.className).toContain("size-8");
    expect(button.className).toContain("max-md:size-11");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledWith("<p>hi</p>");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    // The accessible name is the aria-label and does not change with state.
    expect(screen.getByRole("button", { name: "Copy code" })).toBe(button);
    // State is not colour alone: the icon swaps to the success check.
    expect(button.querySelector("svg")?.classList.contains("text-success-text")).toBe(true);
  });

  it("shows 'Couldn't copy' on a rejected write and calls selectFallback", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const selectFallback = vi.fn();
    render(<CopyButton text="x" label="Copy code" selectFallback={selectFallback} />);

    const button = screen.getByRole("button", { name: "Copy code" });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy");
    expect(selectFallback).toHaveBeenCalledOnce();
    expect(button.querySelector("svg")?.classList.contains("text-danger-text")).toBe(true);
  });
});

describe("CopyButton — labeled variant", () => {
  it("shows Copy, then Copied, and resets after 2.5 s", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyButton variant="labeled" text="graph LR" label="Copy diagram source" />);

    const button = screen.getByRole("button", { name: "Copy diagram source" });
    expect(button.textContent).toBe("Copy");
    // 32 px from 768 px, 44 px below.
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("max-md:min-h-11");

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button.textContent).toBe("Copied");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    act(() => vi.advanceTimersByTime(2500));
    expect(button.textContent).toBe("Copy");
  });

  it("shows 'Couldn't copy' when the clipboard API is absent, without throwing", async () => {
    stubClipboard(undefined);
    const selectFallback = vi.fn();
    render(<CopyButton variant="labeled" text="x" label="Copy code" selectFallback={selectFallback} />);

    const button = screen.getByRole("button", { name: "Copy code" });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(button.textContent).toBe("Couldn't copy");
    expect(selectFallback).toHaveBeenCalledOnce();
  });

  it("activates with Enter and Space", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // userEvent.setup() installs its own navigator.clipboard stub, so the
    // mock must go in after setup or it is shadowed.
    const user = userEvent.setup();
    stubClipboard(writeText);
    render(<CopyButton variant="labeled" text="x" label="Copy code" />);

    screen.getByRole("button", { name: "Copy code" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenCalledWith("x");
  });
});
