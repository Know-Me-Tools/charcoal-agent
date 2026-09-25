/**
 * Shiki themes for code wells (docs/design/chat-surfaces.md §7.7, §13).
 *
 * Shiki palettes are designed for their own backgrounds, but the code well is
 * always `bg-code`. These two were chosen because every token colour they use
 * reaches 4.5:1 on `--km-code` in their theme, except comments, which are
 * replaced with the faint text token. `src/styles/tokens.test.ts` loads the
 * themes from the installed Shiki and checks every colour, so a Shiki upgrade
 * that changes a palette fails the test instead of the axe run.
 */
export const SYNTAX_THEMES = {
  light: "github-light-high-contrast",
  dark: "github-dark-dimmed",
} as const;

/** Comment colours, replaced with `--km-fg-faint` (4.5:1+ on `--km-code`, tested). */
const FAINT = "var(--km-fg-faint)";

/**
 * Pass as `colorReplacements` to `codeToHtml`. Keyed by theme name, so each
 * map applies only to its own theme. Values are CSS variables, so no colour is
 * defined outside tokens.css.
 */
export const SYNTAX_COLOR_REPLACEMENTS: Record<string, Record<string, string>> = {
  [SYNTAX_THEMES.light]: { "#66707b": FAINT },
  [SYNTAX_THEMES.dark]: { "#768390": FAINT },
};
