/**
 * Flat 2.0 guard for the application shell (app-shell spec; KnowMe UI/UX
 * standard §3.3, §4.2). Regions separate by fill only, text is never below
 * 12px, and colour comes from KnowMe tokens, never the raw Tailwind palette.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SHELL_DIRS = ["src/components/layout", "src/components/common"];
const SHELL_PRIMITIVES = ["src/components/ui/dialog.tsx", "src/components/ui/select.tsx", "src/components/ui/sheet.tsx"];

/** Files not restyled yet. Each is expected to fail; remove it once it passes. */
const PENDING = new Set<string>([]);

const RULES: Array<{ name: string; pattern: RegExp }> = [
  // border, border-t, border-l-[3px], border-border… but not border-0 / border-transparent
  { name: "border", pattern: /(?<![\w-])border(?!-0\b|-transparent\b)(?:-[\w[\]/.:%-]+)?(?![\w-])/g },
  { name: "divider", pattern: /(?<![\w-])divide-[\w-]+/g },
  { name: "shadow", pattern: /(?<![\w-])(?:drop-)?shadow(?:-[\w[\]/.-]+)?(?![\w-])/g },
  { name: "blur", pattern: /backdrop-blur[\w-]*/g },
  { name: "ring outline", pattern: /(?<![\w-])ring-1\b/g },
  { name: "line texture", pattern: /grid-overlay/g },
  { name: "text under 12px", pattern: /text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g },
  {
    name: "raw palette colour",
    pattern:
      /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:zinc|gray|slate|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  },
];

function shellFiles(): string[] {
  const inDirs = SHELL_DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
      .map((f) => join(dir, f)),
  );
  return [...inDirs, ...SHELL_PRIMITIVES];
}

/** Comments may describe what is banned; only code is checked. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function violationsIn(source: string): string[] {
  const code = stripComments(source);
  return RULES.flatMap(({ name, pattern }) => [...code.matchAll(pattern)].map((m) => `${name}: ${m[0]}`));
}

describe("Flat 2.0 guard rules", () => {
  it.each([
    "border-b border-border",
    "hover:border-primary/30",
    "border-l-[3px]",
    "divide-y",
    "shadow-xl",
    "drop-shadow-md",
    "backdrop-blur-xs",
    "ring-1 ring-foreground/10",
    "grid-overlay",
    "text-[10px]",
    "text-[11.5px]",
    "bg-green-400",
    "dark:text-zinc-300",
  ])("flags %s", (cls) => {
    expect(violationsIn(`<div className="${cls}" />`)).not.toEqual([]);
  });

  it.each([
    "border-0",
    "border-transparent",
    "bg-ember-soft text-cyan-text",
    "text-xs text-[12px] text-[13px]",
    "focus-cue outline-none ring-ring",
    "bg-scrim bg-muted-surface",
  ])("allows %s", (cls) => {
    expect(violationsIn(`<div className="${cls}" />`)).toEqual([]);
  });

  it("ignores comments that name banned treatments", () => {
    expect(violationsIn("/* never a shadow or border */\n// no divide-y here\nconst a = 1;")).toEqual([]);
  });
});

describe("Flat 2.0 application shell", () => {
  for (const file of shellFiles()) {
    const check = PENDING.has(file) ? it.fails : it;
    check(`${file} has no borders, shadows, blur, sub-12px text or raw palette colours`, () => {
      expect(violationsIn(readFileSync(file, "utf8"))).toEqual([]);
    });
  }

  it("keeps every PENDING entry pointing at a real shell file", () => {
    const files = new Set(shellFiles());
    expect([...PENDING].filter((f) => !files.has(f))).toEqual([]);
  });
});
