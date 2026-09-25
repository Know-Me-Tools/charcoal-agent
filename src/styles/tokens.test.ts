/**
 * Contrast guarantees for the KnowMe tokens (brand-theme spec, decision D-007).
 * Parses src/styles/tokens.css so a token edit cannot silently regress AA.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { bundledThemes, type ThemeRegistrationRaw } from "shiki";
import { describe, expect, it } from "vitest";
import { SYNTAX_COLOR_REPLACEMENTS, SYNTAX_THEMES } from "./syntax-theme";

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

/** CIELAB lightness (D65), 0 to 100. Used for fill-to-fill separation. */
function lightness(hex: string): number {
  const y = luminance(hex);
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (y * 24389) / 27;
}

const SURFACES = [
  "km-canvas",
  "km-chrome",
  "km-surface",
  "km-raised",
  "km-hover",
  "km-muted",
  "km-composer",
];
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
  // Status pills: tone text on its soft fill.
  ["km-success-text", "km-success-soft"],
  ["km-warning-text", "km-warning-soft"],
  ["km-danger-text", "km-danger-soft"],
  ["km-cyan-text", "km-cyan-soft"],
  // Chat surfaces (docs/design/chat-surfaces.md): user message on ember-soft,
  // thinking and citations on cyan-soft, code labels and source on code.
  ["km-fg", "km-ember-soft"],
  ["km-fg", "km-cyan-soft"],
  ["km-fg-secondary", "km-cyan-soft"],
  ["km-fg-faint", "km-cyan-soft"],
  ["km-fg", "km-code"],
  ["km-fg-secondary", "km-code"],
  // Line numbers and (via SYNTAX_COLOR_REPLACEMENTS) comments.
  ["km-fg-faint", "km-code"],
];
// Fills that must read as separate surfaces with no border (Flat 2.0), as a
// CIELAB lightness step. Calibrated on the chat-surfaces-flat2 captures: steps
// of 1.25 (dark code well on canvas) and 1.31 (light composer on canvas) read
// as one surface; the light code well on canvas, 1.83, reads as its own.
const FILL_STEPS: Array<[a: string, b: string, where: string]> = [
  ["km-composer", "km-canvas", "composer at rest on the thread"],
  ["km-composer", "km-raised", "composer rest to focus"],
  ["km-code", "km-canvas", "code well in a message"],
  ["km-code", "km-surface", "code well inside a card"],
  ["km-code", "km-raised", "code body under its header row"],
];
const MIN_FILL_STEP = 1.8;
// Authored HTML previews assume a white page: the browser default text
// (black) and the lightest grey that passes AA on white must stay legible.
const AUTHORED_TEXT_ON_ARTIFACT_CANVAS = ["#000000", "#767676"];
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

  it.each(FILL_STEPS)("%s separates from %s (%s)", (a, b) => {
    const step = Math.abs(lightness(tokens[a]) - lightness(tokens[b]));
    expect(step, `${a} vs ${b} = ${step.toFixed(2)} L*`).toBeGreaterThanOrEqual(MIN_FILL_STEP);
  });

  it("keeps authored text legible on the artifact canvas", () => {
    for (const text of AUTHORED_TEXT_ON_ARTIFACT_CANVAS) {
      const ratio = contrast(text, tokens["km-artifact-canvas"]);
      expect(ratio, `${text} on km-artifact-canvas = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA);
    }
  });

  it("keeps the brand canvas and text anchors", () => {
    expect(tokens["km-canvas"]).toBe(selector === ".dark" ? "#0b0f14" : "#f7f7f8");
    expect(tokens["km-fg"]).toBe(selector === ".dark" ? "#e8edf3" : "#0b0f14");
  });
});

/** Every token colour the code-well Shiki theme can paint on `bg-code`. */
async function syntaxColors(theme: string, faint: string): Promise<Map<string, string>> {
  const raw = (await bundledThemes[theme as keyof typeof bundledThemes]()).default as ThemeRegistrationRaw;
  const replacements = SYNTAX_COLOR_REPLACEMENTS[theme] ?? {};
  const colors = new Map<string, string>();
  const add = (color: string | undefined, scope: string) => {
    if (!color) return;
    const hex = color.toLowerCase();
    const replaced = replacements[hex];
    colors.set(replaced ? faint : hex, replaced ? `${scope} (replaced by km-fg-faint)` : scope);
  };
  add(raw.fg ?? raw.colors?.["editor.foreground"], "default foreground");
  for (const rule of raw.tokenColors ?? raw.settings ?? []) {
    // Rules with their own background (diff and markup highlights) are not painted on bg-code.
    if (rule.settings.background) continue;
    add(rule.settings.foreground, [rule.scope ?? "root"].flat().join(", "));
  }
  return colors;
}

describe.each([
  ["light", ":root", SYNTAX_THEMES.light],
  ["dark", ".dark", SYNTAX_THEMES.dark],
])("%s code-well syntax colours", (_theme, selector, shikiTheme) => {
  const tokens = block(selector);

  it("replaces only colours the theme actually uses", async () => {
    const raw = (await bundledThemes[shikiTheme]()).default as ThemeRegistrationRaw;
    const used = JSON.stringify(raw).toLowerCase();
    for (const from of Object.keys(SYNTAX_COLOR_REPLACEMENTS[shikiTheme] ?? {})) {
      expect(used, `${shikiTheme} uses ${from}`).toContain(`"${from}"`);
    }
  });

  it(`every ${shikiTheme} colour reaches 4.5:1 on km-code`, async () => {
    const colors = await syntaxColors(shikiTheme, tokens["km-fg-faint"]);
    expect(colors.size).toBeGreaterThan(5);
    for (const [color, scope] of colors) {
      const ratio = contrast(color, tokens["km-code"]);
      expect(ratio, `${color} (${scope}) on km-code = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA);
    }
  });
});
