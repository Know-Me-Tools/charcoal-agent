import { beforeEach, describe, expect, it } from "vitest";
import { UI_STORAGE_KEY, useUiStore } from "./ui-store";

describe("ui-store persistence", () => {
  beforeEach(() => localStorage.clear());

  it("persists only theme and font size; panel and sheet flags stay per session", () => {
    const store = useUiStore.getState();
    store.setContextSheetOpen(true);
    store.setMobileSidebarOpen(true);
    store.toggleRightPanel();
    store.setTheme("light");

    const saved = JSON.parse(localStorage.getItem(UI_STORAGE_KEY) ?? "{}") as { state?: Record<string, unknown> };
    expect(Object.keys(saved.state ?? {}).sort()).toEqual(["fontSize", "theme"]);
  });
});
