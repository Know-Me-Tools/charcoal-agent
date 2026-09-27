/**
 * Flat 2.0 guard for the application shell (app-shell spec; KnowMe UI/UX
 * standard §3.3, §4.2). Regions separate by fill only, text is never below
 * 12px, and colour comes from KnowMe tokens, never the raw Tailwind palette.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SHELL_DIRS = ["src/components/layout", "src/components/common"];
const SHELL_PRIMITIVES = [
  "src/components/ui/dialog.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/sonner.tsx",
];

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

/**
 * Flat 2.0 guard for the chat surfaces (chat-surfaces-flat2 spec; KnowMe
 * UI/UX standard §3.3, §7.5, §7.7). Same bans as the shell, plus three
 * chat-only bans the design doc calls out explicitly: no hex colour, no
 * literal `bg-white`/`text-white`/`bg-black` fills, and no opacity modifier
 * on a text colour (`text-fg/70` etc. — de-emphasis comes from a named
 * token like `text-fg-secondary`, never from opacity).
 */
const CHAT_FIXED_FILES = [
  "src/components/assistant-ui/enhanced-thread.tsx",
  "src/components/assistant-ui/enhanced-markdown-text.tsx",
  "src/components/assistant-ui/tooltip-icon-button.tsx",
  "src/components/assistant-ui/attachment.tsx",
];
const CHAT_GLOB_DIRS = ["src/features/chat/components", "src/features/artifacts"];

const CHAT_RULES: Array<{ name: string; pattern: RegExp }> = [
  { name: "hex colour", pattern: /#[0-9a-fA-F]{6}\b/g },
  { name: "literal white/black fill", pattern: /(?<![\w-])(?:bg-white|text-white|bg-black)(?![\w-])/g },
  { name: "opacity text colour", pattern: /(?<![\w-])text-[\w-]+\/\d{1,3}(?![\w-])/g },
];

/**
 * Known false positive: the "border" shell rule matches `border-separate`
 * and `border-spacing-*` because they start with the literal text
 * "border", but these are CSS table-layout keywords, not visible strokes.
 * `enhanced-markdown-text.tsx` renders Markdown tables with
 * `border-separate border-spacing-0`; that pair is excluded here only, so
 * the shell's own "border" rule (used above) is unchanged.
 */
const TABLE_LAYOUT_EXCEPTIONS = [/^border-separate$/, /^border-spacing-\S+$/];

function chatSurfaceFiles(): string[] {
  const globbed = CHAT_GLOB_DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
      .map((f) => join(dir, f)),
  );
  return [...CHAT_FIXED_FILES, ...globbed];
}

function chatViolationsIn(source: string): string[] {
  const code = stripComments(source);
  return [...RULES, ...CHAT_RULES].flatMap(({ name, pattern }) =>
    [...code.matchAll(pattern)]
      .filter((m) => !TABLE_LAYOUT_EXCEPTIONS.some((exception) => exception.test(m[0])))
      .map((m) => `${name}: ${m[0]}`),
  );
}

describe("Flat 2.0 chat-only guard rules", () => {
  it.each([
    "#3b82f6",
    "bg-[#1a2b3c]",
    "bg-white",
    "text-white",
    "bg-black",
    "dark:bg-white",
    "text-fg/70",
    "text-danger-text/50",
  ])("flags %s", (cls) => {
    expect(chatViolationsIn(`<div className="${cls}" />`)).not.toEqual([]);
  });

  it.each([
    "bg-ember-soft text-cyan-text",
    "border-separate border-spacing-0",
    "text-fg-secondary text-faint",
    "bg-canvas",
  ])("allows %s", (cls) => {
    expect(chatViolationsIn(`<table className="${cls}" />`)).toEqual([]);
  });

  it("still flags real borders alongside the table-layout exception", () => {
    expect(chatViolationsIn('<div className="border-b border-separate border-spacing-0" />')).toEqual([
      "border: border-b",
    ]);
  });
});

describe("Flat 2.0 chat surfaces", () => {
  for (const file of chatSurfaceFiles()) {
    it(`${file} has no borders, shadows, blur, sub-12px text, raw palette colours, hex, literal white/black fills or opacity text colour`, () => {
      expect(chatViolationsIn(readFileSync(file, "utf8"))).toEqual([]);
    });
  }
});

/**
 * Flat 2.0 guard for the public brand pages (landing, About, not-found) and
 * the shared site chrome (specs/brand-pages/spec.md: "Flat 2.0 on the brand
 * pages"; design.md decision 10). Reuses the chat-only rule set (hex,
 * bg-white/text-white/bg-black, opacity text colour) plus a `gradient` rule:
 * design.md decision 1 retires every S2 gradient ("--ember-bright" as a
 * "gradient tip", `.btn-primary` hover) and the spec bans a `background-image`
 * containing "gradient" outright.
 */
const BRAND_PAGE_FIXED_FILES = [
  "src/pages/landing-page.tsx",
  "src/pages/about-page.tsx",
  "src/pages/NotFound.tsx",
];

const GRADIENT_RULE = {
  name: "gradient",
  pattern:
    /(?<![\w-])(?:bg-gradient-[\w-]+|bg-linear-[\w-]+|from-[\w./-]+|via-[\w./-]+|to-[\w./-]+|bg-\[[^\]]*gradient[^\]]*\])/g,
};

function brandPageFiles(): string[] {
  const globbed = readdirSync("src/components/site")
    // .ts too: shared class strings (ember-cta.ts) must meet the same rules.
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join("src/components/site", f));
  return [...BRAND_PAGE_FIXED_FILES, ...globbed];
}

function brandPageViolationsIn(source: string): string[] {
  const code = stripComments(source);
  return [...RULES, ...CHAT_RULES, GRADIENT_RULE].flatMap(({ name, pattern }) =>
    [...code.matchAll(pattern)]
      .filter((m) => !TABLE_LAYOUT_EXCEPTIONS.some((exception) => exception.test(m[0])))
      .map((m) => `${name}: ${m[0]}`),
  );
}

describe("Flat 2.0 gradient rule", () => {
  it.each(["bg-gradient-to-r", "bg-linear-to-br", "from-ember to-ember-2", "bg-[linear-gradient(to_right,red,blue)]"])(
    "flags %s",
    (cls) => {
      expect(brandPageViolationsIn(`<div className="${cls}" />`)).not.toEqual([]);
    },
  );

  it.each(["bg-ember text-primary-foreground", "bg-canvas text-fg", "bg-band"])("allows %s", (cls) => {
    expect(brandPageViolationsIn(`<div className="${cls}" />`)).toEqual([]);
  });
});

describe("Flat 2.0 brand pages", () => {
  for (const file of brandPageFiles()) {
    it(`${file} has no borders, shadows, blur, sub-12px text, raw palette colours, hex, literal white/black fills, opacity text colour or gradients`, () => {
      expect(brandPageViolationsIn(readFileSync(file, "utf8"))).toEqual([]);
    });
  }

  it("covers the brand pages and every site-chrome component", () => {
    expect(brandPageFiles()).toEqual(
      expect.arrayContaining([
        "src/pages/landing-page.tsx",
        "src/pages/about-page.tsx",
        "src/pages/NotFound.tsx",
        "src/components/site/site-header.tsx",
        "src/components/site/site-footer.tsx",
      ]),
    );
  });
});
