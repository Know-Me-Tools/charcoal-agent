import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusBadge } from "./status-badge";
import { UarStatus } from "./uar-status";

const health = vi.hoisted(() => ({ current: {} as { data?: { status: "ok" | "error" }; isLoading: boolean } }));
vi.mock("@/hooks/use-health", () => ({ useHealth: () => health.current }));

describe("UarStatus", () => {
  beforeEach(() => {
    health.current = { isLoading: false };
  });

  it.each([
    [{ isLoading: true }, "Checking", "text-warning-text"],
    [{ isLoading: false, data: { status: "ok" as const } }, "Connected", "text-success-text"],
    [{ isLoading: false, data: { status: "error" as const } }, "Offline", "text-danger-text"],
    [{ isLoading: false }, "Offline", "text-danger-text"],
  ])("shows a text label and status tone (%#)", (state, label, tone) => {
    health.current = state;
    render(<UarStatus />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(label);
    expect(status.querySelector(`.${tone}`)).not.toBeNull();
  });

  it("compact form keeps the label so status is not colour-only", () => {
    health.current = { isLoading: false, data: { status: "ok" } };
    render(<UarStatus compact />);
    expect(screen.getByRole("status")).toHaveTextContent("Connected");
    expect(screen.getByRole("status")).toHaveAccessibleName(/runtime connected/i);
  });
});

describe("StatusBadge", () => {
  it("is a 12px status pill on status tokens", () => {
    render(<StatusBadge status="enabled" />);
    const badge = screen.getByText("enabled");
    expect(badge.className).toMatch(/\btext-xs\b/);
    expect(badge.className).toMatch(/\brounded-pill\b/);
    expect(badge.className).toMatch(/\bbg-success-soft\b/);
  });
});
