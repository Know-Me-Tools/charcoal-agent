/**
 * Contrast guarantees for the KnowMe tokens (brand-theme spec, decision D-007).
 * Parses src/styles/tokens.css so a token edit cannot silently regress AA.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(resolve(__dirname, "tokens.css"), "utf8");

function block(selector: string): Record<string, string> {
  const match = new RegExp(`(^|\\n)${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`).exec(CSS);
  if (!match) throw new Error(`No ${selector} block in tokens.css`);
  const vars: Record<string, string> = {};
  for (const [, name, value] of match[2].matchAll(/--(km-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[name] = value.toLowerCase();
  }
  return vars;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ["km-canvas", "km-chrome", "km-surface", "km-raised", "km-hover", "km-muted"];
const TEXT = [
  "km-fg",
  "km-fg-secondary",
  "km-fg-faint",
  "km-ember-text",
  "km-cyan-text",
  "km-success-text",
  "km-warning-text",
  "km-danger-text",
];
const LABELS_ON_FILLS: Array<[label: string, fill: string]> = [
  ["km-on-ember", "km-ember"],
  ["km-on-danger", "km-danger"],
];
const AA = 4.5;

describe.each([
  ["light", ":root"],
  ["dark", ".dark"],
])("%s theme tokens", (_theme, selector) => {
  const tokens = block(selector);

  it("defines every surface, text and fill token", () => {
    for (const name of [...SURFACES, ...TEXT, ...LABELS_ON_FILLS.flat()]) {
      expect(tokens[name], name).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(TEXT)("%s reaches 4.5:1 on every surface", (text) => {
    for (const surface of SURFACES) {
      const ratio = contrast(tokens[text], tokens[surface]);
      expect(ratio, `${text} on ${surface} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA);
    }
  });

  it.each(LABELS_ON_FILLS)("%s reaches 4.5:1 on %s", (label, fill) => {
    const ratio = contrast(tokens[label], tokens[fill]);
    expect(ratio, `${label} on ${fill} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA);
  });

  it("keeps the brand canvas and text anchors", () => {
    expect(tokens["km-canvas"]).toBe(selector === ".dark" ? "#0b0f14" : "#f7f7f8");
    expect(tokens["km-fg"]).toBe(selector === ".dark" ? "#e8edf3" : "#0b0f14");
  });
});
