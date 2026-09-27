/**
 * Behavior contract for the Base UI primitives (ui-primitives spec):
 * keyboard operation, focus management and exposed state. Focus trapping and
 * Select keyboard navigation need real layout and run in the browser instead
 * (e2e/primitives.spec.ts).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";
import { Switch } from "./switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

describe("Dialog", () => {
  function Harness() {
    return (
      <Dialog>
        <DialogTrigger render={<Button />}>Open settings</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Adjust options</DialogDescription>
          <input aria-label="Name" />
          <button type="button">Save</button>
        </DialogContent>
      </Dialog>
    );
  }

  it("closes on Escape and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open settings" });

    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("Tooltip", () => {
  it("appears when its trigger receives keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Copy" />}>C</TooltipTrigger>
          <TooltipContent>Copy message</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Copy" })).toHaveFocus();
    expect(await screen.findByText("Copy message")).toBeInTheDocument();
  });
});

describe("Switch", () => {
  it("toggles with Space and exposes its checked state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch aria-label="Prompt caching" onCheckedChange={(checked) => onChange(checked)} />);
    const sw = screen.getByRole("switch", { name: "Prompt caching" });
    expect(sw).toHaveAttribute("aria-checked", "false");

    sw.focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });
});

describe("Collapsible", () => {
  it("toggles its region and exposes the expanded state", async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger render={<Button />}>Reasoning</CollapsibleTrigger>
        <CollapsibleContent>Step by step</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Reasoning" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Step by step")).toBeVisible();
  });
});
