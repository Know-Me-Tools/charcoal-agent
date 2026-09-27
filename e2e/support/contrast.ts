/**
 * WCAG contrast ratio between two rendered colours (`getComputedStyle` values,
 * `rgb()`/`rgba()`), not token names. Mirrors the relative-luminance formula
 * `src/styles/tokens.test.ts` uses for the static token file, applied to the
 * browser's actual used colour so a class mismatch or specificity bug is
 * caught at runtime, not only where the token was defined.
 */

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function parseRgb(value: string): [number, number, number] {
  const match = /rgba?\(([^)]+)\)/.exec(value);
  if (!match) throw new Error(`Not an rgb()/rgba() colour: ${value}`);
  const [r, g, b] = match[1].split(",").map((n) => parseFloat(n.trim()));
  return [r, g, b];
}

/** Ratio between two `getComputedStyle` colour strings, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(parseRgb(a)), relativeLuminance(parseRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
