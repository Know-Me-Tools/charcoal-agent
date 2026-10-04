import { describe, expect, it } from "vitest";
import { resolveRuntimeEndpointDisplay } from "./utils";

/**
 * About page "Runtime endpoint" row (openspec/changes/about-endpoint-truth):
 * when the build has no VITE_UAR_BASE_URL baked in, requests actually go
 * through the same-origin proxy (Vite dev proxy, or the production nginx
 * site proxy), so the label shown must be the real same-origin target, not
 * a guessed default like "http://localhost:6565".
 */
describe("resolveRuntimeEndpointDisplay", () => {
  it("returns the configured base URL when one is set", () => {
    expect(resolveRuntimeEndpointDisplay("https://uar.know-me.tools", "https://know-me.tools")).toBe(
      "https://uar.know-me.tools",
    );
  });

  it("falls back to the same-origin /api target when unset", () => {
    expect(resolveRuntimeEndpointDisplay(undefined, "https://know-me.tools")).toBe(
      "https://know-me.tools/api",
    );
  });

  it("treats a blank configured value the same as unset", () => {
    expect(resolveRuntimeEndpointDisplay("   ", "http://localhost:8080")).toBe(
      "http://localhost:8080/api",
    );
  });

  it("strips a trailing slash from the origin before appending /api", () => {
    expect(resolveRuntimeEndpointDisplay(undefined, "http://localhost:8080/")).toBe(
      "http://localhost:8080/api",
    );
  });
});
