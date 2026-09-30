import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteAgentId, isSiteBuild } from "./use-site-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("use-site-config", () => {
  it("returns undefined and false when VITE_SITE_AGENT_ID is unset", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    expect(getSiteAgentId()).toBeUndefined();
    expect(isSiteBuild()).toBe(false);
  });

  it("returns the trimmed agent id and true when VITE_SITE_AGENT_ID is set", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", " knowme-site ");
    expect(getSiteAgentId()).toBe("knowme-site");
    expect(isSiteBuild()).toBe(true);
  });

  it("treats a whitespace-only value as unset", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "   ");
    expect(getSiteAgentId()).toBeUndefined();
    expect(isSiteBuild()).toBe(false);
  });
});
