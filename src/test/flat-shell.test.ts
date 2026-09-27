/**
 * Flat 2.0 guard for the application shell (app-shell spec; KnowMe UI/UX
 * standard §3.3, §4.2). Regions separate by fill only, text is never below
 * 12px, and colour comes from KnowMe tokens, never the raw Tailwind palette.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
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
  {
    name: "raw palette colour",
    pattern:
      /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:zinc|gray|slate|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  },
];

/**
 * "Text under 12px" (brand-fidelity-audit design.md decision 3, landing S2):
 * the old rule was a single regex matching only `text-[Npx]` with N in 0-11,
 * which missed `rem`/`em` arbitrary sizes entirely (`text-[0.7rem]` never
 * matched). A regex alone can't do the numeric comparison a `rem`/`em`
 * threshold needs, so this captures the value and unit and compares in JS:
 * `px` is a hit below 12, `rem`/`em` are a hit below 0.75 (constraints.md
 * "rem sizes under 12px are caught").
 */
const TEXT_SIZE_PATTERN = /text-\[([0-9]+(?:\.[0-9]+)?)(px|rem|em)\]/g;

function textUnder12pxViolations(code: string): string[] {
  const hits: string[] = [];
  for (const m of code.matchAll(TEXT_SIZE_PATTERN)) {
    const value = Number.parseFloat(m[1]);
    const unit = m[2];
    const isViolation = unit === "px" ? value < 12 : value < 0.75;
    if (isViolation) hits.push(`text under 12px: ${m[0]}`);
  }
  return hits;
}

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
  return [
    ...RULES.flatMap(({ name, pattern }) => [...code.matchAll(pattern)].map((m) => `${name}: ${m[0]}`)),
    ...textUnder12pxViolations(code),
  ];
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
    "text-[0.7rem]",
    "text-[0.5em]",
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
    "text-[0.75rem] text-[0.8rem] text-[1em]",
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
  return [
    ...[...RULES, ...CHAT_RULES].flatMap(({ name, pattern }) =>
      [...code.matchAll(pattern)]
        .filter((m) => !TABLE_LAYOUT_EXCEPTIONS.some((exception) => exception.test(m[0])))
        .map((m) => `${name}: ${m[0]}`),
    ),
    ...textUnder12pxViolations(code),
  ];
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
  return [
    ...[...RULES, ...CHAT_RULES, GRADIENT_RULE].flatMap(({ name, pattern }) =>
      [...code.matchAll(pattern)]
        .filter((m) => !TABLE_LAYOUT_EXCEPTIONS.some((exception) => exception.test(m[0])))
        .map((m) => `${name}: ${m[0]}`),
    ),
    ...textUnder12pxViolations(code),
  ];
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

/**
 * Flat 2.0 guard for the app pages behind the shell (app-pages spec;
 * design.md decision 2: bg-band grouping, filled borderless inputs,
 * row-fill separation instead of rules, tokens instead of raw palette, no
 * sub-12px text). Reuses the shell's RULES set plus the gradient rule (task
 * 3.1: "using RULES plus the gradient rule") — no hex/white-black/opacity
 * bans here, since those are chat- and brand-page-only conventions the
 * app-pages spec does not impose.
 */
const APP_PAGE_FILES = [
  "src/pages/threads-page.tsx",
  "src/pages/agents-page.tsx",
  "src/pages/agent-detail-page.tsx",
  "src/pages/providers-page.tsx",
  "src/pages/skills-page.tsx",
  "src/pages/appearance-page.tsx",
  "src/pages/user-settings-page.tsx",
  "src/pages/settings-page.tsx",
];

function appPageViolationsIn(source: string): string[] {
  const code = stripComments(source);
  return [
    ...[...RULES, GRADIENT_RULE].flatMap(({ name, pattern }) =>
      [...code.matchAll(pattern)].map((m) => `${name}: ${m[0]}`),
    ),
    ...textUnder12pxViolations(code),
  ];
}

describe("Flat 2.0 app pages", () => {
  for (const file of APP_PAGE_FILES) {
    it(`${file} has no borders, shadows, blur, sub-12px text, raw palette colours or gradients`, () => {
      expect(appPageViolationsIn(readFileSync(file, "utf8"))).toEqual([]);
    });
  }

  it("covers every in-scope app page", () => {
    expect(APP_PAGE_FILES).toEqual([
      "src/pages/threads-page.tsx",
      "src/pages/agents-page.tsx",
      "src/pages/agent-detail-page.tsx",
      "src/pages/providers-page.tsx",
      "src/pages/skills-page.tsx",
      "src/pages/appearance-page.tsx",
      "src/pages/user-settings-page.tsx",
      "src/pages/settings-page.tsx",
    ]);
  });
});

/**
 * Repo-wide Flat 2.0 guard (brand-fidelity-audit design.md decision 3):
 * RULES plus the gradient rule over every non-test `src/**\/*.{ts,tsx}` file,
 * including `src/components/ui/`, which none of the per-area describes above
 * scan. A hit that is fixed is simply gone from the source; anything left is
 * allowlisted here with a reason (constraints.md "Flat 2.0 source rules
 * cover the whole repo").
 *
 * Each entry's `reason` falls into one of three buckets (design.md decision
 * 3): "comment" text a stripped-comment regex still caught (none currently —
 * the two prior comment hits in agent-detail-page.tsx and providers-page.tsx
 * were removed by task 1.1); an "unreachable"/"no call site" state or
 * component nothing in the app triggers, with the grep that proves it; or a
 * hit that does render, allowlisted as a numbered follow-up (F-n) and listed
 * as a known defect in docs/qa/brand-fidelity-audit.md — km-frontend-engineer
 * owns fixing it, since it lives under src/components/ui/ or
 * src/components/assistant-ui/, outside km-qa-engineer's owned paths.
 */
describe("Flat 2.0 repo-wide (brand-fidelity-audit)", () => {
  interface AllowlistEntry {
    file: string;
    /** Exact "rule: token" string, as produced by the scan below. */
    match: string;
    reason: string;
  }

  const REPO_WIDE_ALLOWLIST: AllowlistEntry[] = [
    // ── table-layout properties, not borders (design.md decision 3, verbatim) ──
    {
      file: "src/components/assistant-ui/enhanced-markdown-text.tsx",
      match: "border: border-separate",
      reason: "table layout property, not a border (design.md decision 3)",
    },
    {
      file: "src/components/assistant-ui/enhanced-markdown-text.tsx",
      match: "border: border-spacing-0",
      reason: "table layout property, not a border (design.md decision 3)",
    },

    // ── paired with the same element's own -transparent variant: renders no
    // visible border regardless of which caller renders it ──
    {
      file: "src/components/ui/button.tsx",
      match: "border: border",
      reason:
        "paired with the base `border-transparent` on the same element; every variant but `outline` keeps the border transparent",
    },
    {
      file: "src/components/ui/switch.tsx",
      match: "border: border",
      reason: "paired with the base `border-transparent` on the same element; no variant overrides the colour",
    },
    {
      file: "src/components/ui/tabs.tsx",
      match: "border: border",
      reason: "paired with the base `border-transparent` on the same element; no variant overrides the colour",
    },
    {
      file: "src/components/ui/scroll-area.tsx",
      match: "border: border-t",
      reason: "paired with `border-t-transparent` on the same element; renders transparent",
    },
    {
      file: "src/components/ui/scroll-area.tsx",
      match: "border: border-t-transparent",
      reason: "explicit transparent border colour, not a visible border",
    },
    {
      file: "src/components/ui/scroll-area.tsx",
      match: "border: border-l",
      reason: "paired with `border-l-transparent` on the same element; renders transparent",
    },
    {
      file: "src/components/ui/scroll-area.tsx",
      match: "border: border-l-transparent",
      reason: "explicit transparent border colour, not a visible border",
    },

    // ── no call site: unreachable aria-invalid states (grep: no `aria-invalid`
    // anywhere under src/ outside these primitive definitions) ──
    {
      file: "src/components/ui/button.tsx",
      match: "border: border-destructive",
      reason: 'no call site: no app code sets aria-invalid on a Button (grep "aria-invalid" src/ finds none outside src/components/ui/)',
    },
    {
      file: "src/components/ui/button.tsx",
      match: "border: border-destructive/50",
      reason: "no call site: same aria-invalid state as border-destructive above",
    },
    {
      file: "src/components/ui/input.tsx",
      match: "border: border-destructive",
      reason: "no call site: no app code sets aria-invalid on an Input",
    },
    {
      file: "src/components/ui/input.tsx",
      match: "border: border-destructive/50",
      reason: "no call site: same aria-invalid state as border-destructive above",
    },
    {
      file: "src/components/ui/textarea.tsx",
      match: "border: border-destructive",
      reason: "no call site: no app code sets aria-invalid on a Textarea",
    },
    {
      file: "src/components/ui/textarea.tsx",
      match: "border: border-destructive/50",
      reason: "no call site: same aria-invalid state as border-destructive above",
    },
    {
      file: "src/components/ui/switch.tsx",
      match: "border: border-destructive",
      reason: "no call site: no app code sets aria-invalid on a Switch",
    },
    {
      file: "src/components/ui/switch.tsx",
      match: "border: border-destructive/50",
      reason: "no call site: same aria-invalid state as border-destructive above",
    },

    // ── no call site: the component itself is never rendered anywhere in src/
    // (grep: `<Card\b` under src/ finds nothing) ──
    {
      file: "src/components/ui/card.tsx",
      match: "border: border-b]:pb-",
      reason: "no call site: Card is unused in the app, and this is a `has-[.border-b]` selector hook, not a class the element itself carries",
    },
    {
      file: "src/components/ui/card.tsx",
      match: "border: border-t",
      reason: "no call site: Card/CardFooter is unused in the app",
    },
    {
      file: "src/components/ui/card.tsx",
      match: "ring outline: ring-1",
      reason: "no call site: Card is unused in the app",
    },

    // ── no call site: the only caller overrides the primitive's own default
    // border away, so it never renders one ──
    {
      file: "src/components/ui/alert.tsx",
      match: "border: border",
      reason: 'no call site renders it: the only usage (src/components/assistant-ui/enhanced-thread.tsx:572) passes className="...border-0...", which wins over the base `border` class',
    },
    {
      file: "src/components/ui/input.tsx",
      match: "border: border",
      reason:
        "no call site renders it: the only usage (src/features/chat/components/a2ui-artifact-block.tsx) passes FIELD_CLASSES, which starts with border-0 (follow-up F-3, km-frontend-engineer: fix the primitive's own default border)",
    },
    {
      file: "src/components/ui/input.tsx",
      match: "border: border-input",
      reason: "no call site renders it: same FIELD_CLASSES override as border above (follow-up F-3)",
    },
    {
      file: "src/components/ui/input.tsx",
      match: "border: border-ring",
      reason: "focus-visible border colour only; FIELD_CLASSES forces border-width to 0 via border-0, so no colour ever shows (follow-up F-3)",
    },
    {
      file: "src/components/ui/textarea.tsx",
      match: "border: border",
      reason:
        "no call site renders it: the only usage (src/features/chat/components/a2ui-artifact-block.tsx) passes FIELD_CLASSES, which starts with border-0 (follow-up F-3, km-frontend-engineer: fix the primitive's own default border)",
    },
    {
      file: "src/components/ui/textarea.tsx",
      match: "border: border-input",
      reason: "no call site renders it: same FIELD_CLASSES override as border above (follow-up F-3)",
    },
    {
      file: "src/components/ui/textarea.tsx",
      match: "border: border-ring",
      reason: "focus-visible border colour only; FIELD_CLASSES forces border-width to 0 via border-0, so no colour ever shows (follow-up F-3)",
    },

    // ── renders: known defects, not fixable within km-qa-engineer's owned
    // paths (src/components/ui/, src/components/error-boundary/ are
    // km-frontend-engineer's). Listed as follow-ups in
    // docs/qa/brand-fidelity-audit.md. ──
    {
      file: "src/components/ui/avatar.tsx",
      match: "border: border",
      reason:
        "renders: follow-up F-1 (km-frontend-engineer) — the after: ring shows on the chat thread avatar (src/components/assistant-ui/enhanced-thread.tsx:281), which does not override it; attachment.tsx's Avatar hides it with after:hidden",
    },
    {
      file: "src/components/ui/avatar.tsx",
      match: "border: border-border",
      reason: "renders: follow-up F-1 (km-frontend-engineer) — same call site as border above",
    },
    {
      file: "src/components/ui/button.tsx",
      match: "border: border-border",
      reason:
        'renders: follow-up F-2 (km-frontend-engineer) — the outline variant\'s border shows on ChatErrorBoundary.tsx:69\'s "Back to home" button',
    },
    {
      file: "src/components/ui/button.tsx",
      match: "border: border-input",
      reason: "renders: follow-up F-2 (km-frontend-engineer) — dark-mode outline variant, same call site as border-border above",
    },
  ];

  function repoWideFiles(): string[] {
    const out: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) {
          walk(p);
        } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
          out.push(p);
        }
      }
    };
    walk("src");
    return out;
  }

  function repoWideHits(code: string): string[] {
    return [
      ...[...RULES, GRADIENT_RULE].flatMap(({ name, pattern }) =>
        [...code.matchAll(pattern)].map((m) => `${name}: ${m[0]}`),
      ),
      ...textUnder12pxViolations(code),
    ];
  }

  it("every allowlist entry has a reason", () => {
    for (const entry of REPO_WIDE_ALLOWLIST) {
      expect(entry.reason.length, `${entry.file} — ${entry.match}`).toBeGreaterThan(0);
    }
  });

  it("passes: every repo-wide hit is fixed or on the allowlist", () => {
    const allowed = new Set(REPO_WIDE_ALLOWLIST.map((e) => `${e.file} — ${e.match}`));
    const unexpected: string[] = [];
    for (const file of repoWideFiles()) {
      const code = stripComments(readFileSync(file, "utf8"));
      for (const hit of repoWideHits(code)) {
        const key = `${file} — ${hit}`;
        if (!allowed.has(key)) unexpected.push(key);
      }
    }
    expect(unexpected).toEqual([]);
  });

  it("fails: shadow-md in a non-allowlisted src/components/ui file names that file", () => {
    // constraints.md "Repo-wide guard can fail": mirrors the mutation without
    // touching a real file, so this test is itself the regression guard.
    const mutated = 'className="rounded-lg shadow-md bg-card"';
    const hits = repoWideHits(mutated).map((h) => `src/components/ui/example.tsx — ${h}`);
    const allowed = new Set(REPO_WIDE_ALLOWLIST.map((e) => `${e.file} — ${e.match}`));
    expect(hits.some((h) => !allowed.has(h))).toBe(true);
  });

  it("keeps every allowlist entry pointing at a real, currently-present hit", () => {
    const files = new Set(repoWideFiles());
    const stale: string[] = [];
    for (const entry of REPO_WIDE_ALLOWLIST) {
      if (!files.has(entry.file)) {
        stale.push(`${entry.file} — file no longer scanned`);
        continue;
      }
      const code = stripComments(readFileSync(entry.file, "utf8"));
      if (!repoWideHits(code).includes(entry.match)) {
        stale.push(`${entry.file} — ${entry.match}`);
      }
    }
    expect(stale).toEqual([]);
  });
});
