import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./sheet";

function Harness({ side }: { side?: "left" | "right" }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button />}>Open threads</SheetTrigger>
      <SheetContent side={side} closeLabel="Close threads">
        <SheetTitle>Threads</SheetTitle>
        <a href="#one">First thread</a>
      </SheetContent>
    </Sheet>
  );
}

describe("Sheet", () => {
  it("opens as a named dialog and closes on Escape, returning focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open threads" });

    await user.click(trigger);
    expect(await screen.findByRole("dialog", { name: "Threads" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("has a named close button", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open threads" }));
    await user.click(await screen.findByRole("button", { name: "Close threads" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("is flat: chrome surface on the chosen side, scrim instead of shadow or blur", async () => {
    const user = userEvent.setup();
    render(<Harness side="right" />);
    await user.click(screen.getByRole("button", { name: "Open threads" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-side", "right");
    expect(dialog.className).toMatch(/\bbg-chrome\b/);
    expect(dialog.className).not.toMatch(/shadow|ring-1|border/);
    const overlay = document.querySelector("[data-slot='sheet-overlay']");
    expect(overlay?.className).toMatch(/\bbg-scrim\b/);
    expect(overlay?.className).not.toMatch(/blur/);
  });
});
