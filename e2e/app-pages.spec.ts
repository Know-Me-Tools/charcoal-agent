/**
 * app-pages spec (openspec/changes/app-pages-flat2-entity-views): the
 * threads, agents, agent-detail, providers, skills, appearance and account
 * pages after the Flat 2.0 restyle. Covers every browser-dependent scenario
 * in specs/app-pages/spec.md: route rendering, token-based status with a
 * text cue, the 12px type floor, Flat 2.0 surfaces, visible keyboard focus,
 * D-004 settings copy, and entity CRUD continuity against the UAR mock.
 *
 * The static source guard (raw palette classes, sub-12px arbitrary sizes,
 * borders/shadows/blur/gradients in the page source) lives in
 * src/test/flat-shell.test.ts ("Flat 2.0 app pages"), per spec's "Source
 * guard covers the pages" scenario — not duplicated here.
 */
import { readdirSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { openRoute, seedTheme } from "./support/page-helpers";
import { APP_ROUTES, THEMES } from "./support/routes";

const IN_SCOPE_ROUTE_NAMES: readonly string[] = [
  "threads",
  "agents",
  "agent-new",
  "agent-detail",
  "settings-providers",
  "settings-skills",
  "settings-appearance",
  "settings-account",
];

const IN_SCOPE_ROUTES = APP_ROUTES.filter((r) => IN_SCOPE_ROUTE_NAMES.includes(r.name));
const SETTINGS_ROUTES = IN_SCOPE_ROUTES.filter((r) => r.path.startsWith("/settings/"));

/**
 * app-pages S1 (design.md decision 1): the old version of this check
 * compared `IN_SCOPE_ROUTE_NAMES` (the hardcoded constant above) against
 * itself, so it could never fail no matter what `src/pages/` contained.
 * Derive the expected list from the files on disk instead: every
 * `src/pages/*.tsx` file must be either mapped to the in-scope route
 * name(s) it renders, or excluded with a reason — a page added later
 * without being added to one of these two records fails this test.
 */
const PAGE_FILES_EXCLUDED: Record<string, string> = {
  "about-page.tsx": "covered by e2e/brand-pages.spec.ts (settings-about), not app-pages",
  "landing-page.tsx": "covered by e2e/brand-pages.spec.ts (landing), not app-pages",
  "NotFound.tsx": "covered by e2e/brand-pages.spec.ts (not-found), not app-pages",
  "thread-detail-page.tsx": "covered by e2e/chat-surfaces.spec.ts (thread), not app-pages",
  "settings-page.tsx": "the /settings layout wrapper (nav + Outlet), not a routed leaf page",
  "Index.tsx": "not referenced by any route in src/App.tsx (dead file, not a page)",
};

const PAGE_FILE_ROUTE_NAMES: Record<string, string[]> = {
  "threads-page.tsx": ["threads"],
  "agents-page.tsx": ["agents"],
  // one file serves two routes: the literal /agents/new path and /agents/:id.
  "agent-detail-page.tsx": ["agent-new", "agent-detail"],
  "providers-page.tsx": ["settings-providers"],
  "skills-page.tsx": ["settings-skills"],
  "appearance-page.tsx": ["settings-appearance"],
  "user-settings-page.tsx": ["settings-account"],
};

test("fixture covers all in-scope routes, derived from the files on disk", () => {
  const files = readdirSync("src/pages").filter((f) => f.endsWith(".tsx"));
  const unclassified = files.filter(
    (f) => !(f in PAGE_FILES_EXCLUDED) && !(f in PAGE_FILE_ROUTE_NAMES),
  );
  expect(
    unclassified,
    "every src/pages/*.tsx file must be excluded (with a reason) or mapped to in-scope route name(s)",
  ).toEqual([]);

  const derivedNames = Object.values(PAGE_FILE_ROUTE_NAMES).flat().sort();
  expect(derivedNames).toEqual([...IN_SCOPE_ROUTE_NAMES].sort());
  expect(IN_SCOPE_ROUTES.map((r) => r.name).sort()).toEqual(derivedNames);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Reads a KnowMe token's actual rendered colour on the current page. */
async function tokenColor(
  page: Page,
  name: string,
  prop: "backgroundColor" | "outlineColor" = "backgroundColor",
): Promise<string> {
  return page.evaluate(
    ({ varName, cssProp }) => {
      const probe = document.createElement("div");
      probe.style[cssProp as "backgroundColor" | "outlineColor"] = `var(${varName})`;
      document.body.append(probe);
      const value = getComputedStyle(probe)[cssProp as "backgroundColor" | "outlineColor"];
      probe.remove();
      return value;
    },
    { varName: name, cssProp: prop },
  );
}

/**
 * No visible element inside `main` (or, when a panel portals outside it —
 * the skill detail dialog — inside `rootSelector`) has a border width above
 * 0 with a non-transparent colour, a box-shadow other than `none`, a
 * backdrop-filter other than `none`, or a gradient background-image (spec:
 * "Nothing renders a border, shadow or blur").
 */
async function scanMainForFlatViolations(page: Page, rootSelector = "main"): Promise<string[]> {
  return page.evaluate((selector) => {
    const main = document.querySelector(selector);
    if (!main) return [`no ${selector} found`];
    const offenders: string[] = [];
    for (const el of [main, ...Array.from(main.querySelectorAll<HTMLElement>("*"))]) {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const label = `${el.tagName}.${Array.from(el.classList).join(".")}`;
      const bordered = (["top", "right", "bottom", "left"] as const).some((side) => {
        const width = parseFloat(s.getPropertyValue(`border-${side}-width`));
        const color = s.getPropertyValue(`border-${side}-color`);
        return width > 0 && color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
      });
      if (bordered) offenders.push(`border: ${label}`);
      if (s.boxShadow !== "none" && !el.matches(":focus-visible")) offenders.push(`shadow: ${label}`);
      if (s.backdropFilter && s.backdropFilter !== "none") offenders.push(`blur: ${label}`);
      if (s.backgroundImage && s.backgroundImage.includes("gradient")) offenders.push(`gradient: ${label}`);
    }
    return offenders;
  }, rootSelector);
}

/**
 * Every visible element with a non-empty direct text node has font-size
 * >= 12px, inside `main` (or `rootSelector`, for a portalled panel).
 */
async function scanMainForTinyText(page: Page, rootSelector = "main"): Promise<string[]> {
  return page.evaluate((selector) => {
    const main = document.querySelector(selector);
    if (!main) return [`no ${selector} found`];
    const offenders: string[] = [];
    for (const el of [main, ...Array.from(main.querySelectorAll<HTMLElement>("*"))]) {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const hasText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0,
      );
      if (hasText && parseFloat(s.fontSize) < 12) {
        offenders.push(`${s.fontSize}: "${(el.textContent ?? "").trim().slice(0, 40)}"`);
      }
    }
    return offenders;
  }, rootSelector);
}

/**
 * Tabs through the page starting from the top, recording every stop whose
 * focused element lands inside `main`. Stops once focus leaves `main` again
 * (having been inside it) or stalls on the same element twice — the two
 * "end of tab order" signals a real Tab sequence can produce, since headless
 * Chromium has no browser chrome to wrap focus into once the document runs out
 * of focusable elements.
 */
async function tabThroughMain(
  page: Page,
  rootSelector = "main",
  maxSteps = 200,
): Promise<{ stops: number; violations: string[]; sequence: string[] }> {
  const violations: string[] = [];
  const sequence: string[] = [];
  let stops = 0;
  let enteredMain = false;
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate((selector) => {
      const el = document.activeElement as HTMLElement | null;
      const main = document.querySelector(selector);
      if (!el || el === document.body || !main) return null;
      const inMain = main.contains(el);
      // Identity, not a class string: sibling controls often share every class
      // (inactive nav links), so compare the element itself via a marker.
      const revisit = el.dataset.e2eTabVisited === "1";
      el.dataset.e2eTabVisited = "1";
      const s = getComputedStyle(el);
      return {
        inMain,
        revisit,
        tag: `${el.tagName}#${el.id}.${Array.from(el.classList).join(".")}`,
        label: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`,
        outlineStyle: s.outlineStyle,
        outlineWidth: parseFloat(s.outlineWidth) || 0,
      };
    }, rootSelector);
    if (!info || !info.inMain) {
      sequence.push(info ? "(left main)" : "(no element)");
      if (enteredMain) break;
      continue;
    }
    if (info.revisit) {
      sequence.push(`(revisit) ${info.label}`);
      break; // focus stalled or wrapped back to a visited element
    }
    sequence.push(info.label);
    enteredMain = true;
    stops += 1;
    if (info.outlineStyle === "none" || info.outlineWidth < 2) {
      violations.push(`${info.tag}: outline-style=${info.outlineStyle} outline-width=${info.outlineWidth}`);
    }
  }
  return { stops, violations, sequence };
}

// ── Scenario: Every in-scope route renders against the mock ────────────────

test.describe("every in-scope route renders against the mock", () => {
  for (const route of IN_SCOPE_ROUTES) {
    for (const theme of THEMES) {
      test(`${route.name}: ready text visible, no uncaught error (${theme})`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));
        await page.setViewportSize({ width: 1440, height: 900 });
        await seedTheme(page, theme);
        await openRoute(page, route); // asserts route.readyText is visible
        expect(errors).toEqual([]);
      });
    }
  }
});

// ── Scenario: Flat 2.0 surfaces (border/shadow/blur/gradient + type floor) ──

test.describe("Flat 2.0 surfaces render with no borders, shadows, blur, gradients or sub-12px text", () => {
  for (const route of IN_SCOPE_ROUTES) {
    for (const theme of THEMES) {
      test(`${route.name} (${theme})`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await seedTheme(page, theme);
        await openRoute(page, route);
        const flatViolations = await scanMainForFlatViolations(page);
        const tinyText = await scanMainForTinyText(page);
        expect(flatViolations, "border/shadow/blur/gradient offenders").toEqual([]);
        expect(tinyText, "sub-12px text offenders").toEqual([]);
      });
    }
  }
});

// ── Scenario: Flat 2.0 and Tab-through cover opened panels (app-pages W1) ───
//
// The sweep above only ever sees each page's closed, default state. Several
// surfaces only exist once a user opens them: the expanded provider card
// and its models table, the "Add provider" form, the agent memory panel,
// and the skill detail dialog. The dialog renders through a portal
// (DialogPortal → document.body by default), outside <main>, so it needs
// its own root selector — scanMainForFlatViolations/scanMainForTinyText/
// tabThroughMain all default to "main" but take an explicit selector.

test.describe("Flat 2.0 and Tab-through cover opened panels", () => {
  test("settings-providers: the expanded card, its models table and the New Provider form", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const route = IN_SCOPE_ROUTES.find((r) => r.name === "settings-providers")!;
    await openRoute(page, route);

    await page.getByRole("button", { name: /Anthropic/ }).first().click();
    await expect(page.getByRole("button", { name: "Test", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add provider" }).click();
    await expect(page.getByLabel("Display name")).toBeVisible();

    expect(await scanMainForFlatViolations(page), "border/shadow/blur/gradient offenders").toEqual([]);
    expect(await scanMainForTinyText(page), "sub-12px text offenders").toEqual([]);
    const { violations } = await tabThroughMain(page);
    expect(violations, "focus-outline violations").toEqual([]);
  });

  test("agents: the memory settings panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const route = IN_SCOPE_ROUTES.find((r) => r.name === "agents")!;
    await openRoute(page, route);

    await agentCard(page, "Research Analyst").getByRole("button", { name: "Memory settings" }).click();
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();

    expect(await scanMainForFlatViolations(page), "border/shadow/blur/gradient offenders").toEqual([]);
    expect(await scanMainForTinyText(page), "sub-12px text offenders").toEqual([]);
    const { violations } = await tabThroughMain(page);
    expect(violations, "focus-outline violations").toEqual([]);
  });

  test("settings-skills: the skill detail dialog", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const route = IN_SCOPE_ROUTES.find((r) => r.name === "settings-skills")!;
    await openRoute(page, route);

    await page.getByRole("button", { name: "View configuration for Web Search" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    expect(
      await scanMainForFlatViolations(page, '[role="dialog"]'),
      "dialog border/shadow/blur/gradient offenders",
    ).toEqual([]);
    expect(await scanMainForTinyText(page, '[role="dialog"]'), "dialog sub-12px text offenders").toEqual([]);
  });
});

// ── Scenario: Grouped sections are distinct from the canvas in light theme ──

test("settings groups render on --km-band, distinct from the canvas (light theme)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedTheme(page, "light");
  for (const routeName of ["settings-providers", "settings-account"]) {
    const route = IN_SCOPE_ROUTES.find((r) => r.name === routeName)!;
    await openRoute(page, route);
    const band = await tokenColor(page, "--km-band");
    const canvas = await tokenColor(page, "--km-canvas");
    const groups = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return [];
      return Array.from(main.querySelectorAll<HTMLElement>('[class*="bg-band"]'))
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => getComputedStyle(el).backgroundColor);
    });
    expect(groups.length, `${routeName} should render at least one bg-band group`).toBeGreaterThan(0);
    for (const g of groups) {
      expect(g, `${routeName} group colour`).toBe(band);
      expect(g, `${routeName} group colour must differ from canvas`).not.toBe(canvas);
    }
  }
});

// ── Scenario: No horizontal scroll at 320 ───────────────────────────────────

test.describe("no horizontal scroll at 320px", () => {
  for (const route of IN_SCOPE_ROUTES) {
    for (const theme of THEMES) {
      test(`${route.name} (${theme})`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 });
        await seedTheme(page, theme);
        await openRoute(page, route);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(320);
      });
    }
  }
});

// ── Scenario: Tab-through shows an outline on every stop ────────────────────

test.describe("Tab-through shows a visible outline on every stop inside main", () => {
  for (const route of IN_SCOPE_ROUTES) {
    test(`${route.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await openRoute(page, route);
      const { stops, violations, sequence } = await tabThroughMain(page);
      await testInfo.attach(`${route.name}-tab-stops`, {
        body: JSON.stringify({ route: route.name, stops, violations, sequence }, null, 2),
        contentType: "application/json",
      });
      console.log(`[tab-through] ${route.name}: ${stops} focus stop(s) inside main: ${sequence.join(" | ")}`);
      expect(violations, `${route.name} focus-outline violations`).toEqual([]);
      expect(stops, `${route.name} should have at least one focusable stop inside main`).toBeGreaterThan(0);
    });
  }
});

// ── Scenario: Button primitive paints its outline ───────────────────────────

test("Button primitive paints a solid --ring outline on keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const route = IN_SCOPE_ROUTES.find((r) => r.name === "settings-skills")!;
  await openRoute(page, route);
  let found: { outlineStyle: string; outlineColor: string } | null = null;
  for (let i = 0; i < 80 && !found; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el.getAttribute("data-slot") !== "button") return null;
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineColor: s.outlineColor };
    });
    if (info) found = info;
  }
  expect(found, "no Button (data-slot=button) reached by Tab on /settings/skills").not.toBeNull();
  expect(found!.outlineStyle).toBe("solid");
  expect(found!.outlineColor).toBe(await tokenColor(page, "--ring", "outlineColor"));
});

// ── Scenario: No Charcoal in rendered settings ──────────────────────────────

test.describe("no 'charcoal' text in settings", () => {
  for (const route of SETTINGS_ROUTES) {
    test(`${route.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await openRoute(page, route);
      const text = await page.evaluate(() => document.body.innerText);
      expect(text).not.toMatch(/charcoal/i);
    });
  }
});

// ── Scenario: Skill state is readable without colour, and toggles expose
// their state (app-pages spec "Skill toggles expose their state") ──────────

/**
 * The toggle is `role="switch" aria-checked={enabled}`, named
 * `"${skill.name}: enabled" | "${skill.name}: disabled"` (skills-page.tsx).
 * Escape `title` for the accessible-name regex — the fixture titles are
 * plain text today, but a title with regex metacharacters shouldn't break
 * this helper silently.
 */
function skillToggle(page: Page, title: string) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByRole("switch", { name: new RegExp(`^${escaped}: (enabled|disabled)$`) });
}

test("skill toggles report checked state as a switch, not colour alone, with the skill's title in the name", async ({
  page,
}) => {
  await page.goto("/settings/skills");
  const enabledToggle = skillToggle(page, "Web Search"); // fixture: enabled
  const disabledToggle = skillToggle(page, "Code Runner"); // fixture: disabled
  await expect(enabledToggle).toHaveAttribute("aria-checked", "true");
  await expect(disabledToggle).toHaveAttribute("aria-checked", "false");
  await expect(enabledToggle).toHaveAccessibleName(/Web Search/);
  await expect(disabledToggle).toHaveAccessibleName(/Code Runner/);
});

// ── Scenario: Skill details open in an accessible dialog (app-pages spec) ──

test("each skill's details control has a distinguishable accessible name containing its title", async ({ page }) => {
  await page.goto("/settings/skills");
  const webSearch = page.getByRole("button", { name: "View configuration for Web Search" });
  const codeRunner = page.getByRole("button", { name: "View configuration for Code Runner" });
  await expect(webSearch).toHaveCount(1);
  await expect(codeRunner).toHaveCount(1);
});

test("a skill's details dialog is a modal: role, focus moves in, Escape closes it, focus returns", async ({
  page,
}) => {
  await page.goto("/settings/skills");
  const opener = page.getByRole("button", { name: "View configuration for Web Search" });
  await opener.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Web Search" });
  await expect(dialog).toBeVisible();
  const focusedInside = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    return !!dlg && dlg.contains(document.activeElement);
  });
  expect(focusedInside, "focus should move inside the dialog when it opens").toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

// ── Scenario: Agent save confirmation is readable without colour ───────────

function agentCard(page: Page, name: string) {
  return page
    .locator("div")
    .filter({ has: page.getByText(name, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Memory settings" }) })
    .last();
}

test("agent memory save confirmation shows text styled with a status token, not colour alone", async ({
  page,
}) => {
  await page.goto("/agents");
  const card = agentCard(page, "Research Analyst");
  await card.getByRole("button", { name: "Memory settings" }).click();
  const patched = page.waitForResponse(
    (r) => r.request().method() === "PATCH" && /\/api\/agents\//.test(new URL(r.url()).pathname),
  );
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await patched;
  const saved = card.getByText("Saved", { exact: true });
  await expect(saved).toBeVisible();
  const cls = await saved.evaluate((el) => el.className);
  expect(cls, "confirmation must use a status token class").toMatch(/text-success-text/);
  expect(cls, "confirmation must not use a raw palette class").not.toMatch(
    /(?:bg|text|border|ring)-(?:zinc|gray|slate|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  );
});

// ── Scenario: Entity CRUD continuity ─────────────────────────────────────────

/** Records `${METHOD} ${pathname}` for every backend request matching one of `patterns`, in arrival order. */
function backendRequestLog(page: Page, patterns: RegExp[]): string[] {
  const log: string[] = [];
  page.on("request", (req) => {
    const entry = `${req.method()} ${new URL(req.url()).pathname}`;
    if (patterns.some((p) => p.test(entry))) log.push(entry);
  });
  return log;
}

test("provider create, update, default and delete hit the mock in order", async ({ page }) => {
  const log = backendRequestLog(page, [
    /^POST \/api\/providers$/,
    /^PUT \/api\/providers\/anthropic$/,
    /^POST \/api\/providers\/anthropic\/default$/,
    /^DELETE \/api\/providers\/anthropic$/,
  ]);

  await page.goto("/settings/providers");
  await expect(page.getByText("Anthropic").first()).toBeVisible();

  // Create
  await page.getByRole("button", { name: "Add provider" }).click();
  await page.getByLabel("Display name").fill("Test Provider");
  const created = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/providers",
  );
  await page.getByRole("button", { name: "Save provider" }).click();
  await created;

  // Update: expand Anthropic and toggle its enabled state.
  await page.getByRole("button", { name: /Anthropic/ }).first().click();
  const updated = page.waitForResponse(
    (r) => r.request().method() === "PUT" && new URL(r.url()).pathname === "/api/providers/anthropic",
  );
  await page.getByRole("button", { name: "Disable", exact: true }).click();
  await updated;

  // Set default
  const defaulted = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === "/api/providers/anthropic/default",
  );
  await page.getByRole("button", { name: "Set default", exact: true }).click();
  await defaulted;

  // Delete
  const deleted = page.waitForResponse(
    (r) => r.request().method() === "DELETE" && new URL(r.url()).pathname === "/api/providers/anthropic",
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await deleted;

  expect(log).toEqual([
    "POST /api/providers",
    "PUT /api/providers/anthropic",
    "POST /api/providers/anthropic/default",
    "DELETE /api/providers/anthropic",
  ]);
  // app-pages W2 (design.md decision 1): `toHaveCount(0)` resolves the
  // instant it observes 0 — it does not keep polling to see whether a count
  // that's 0 *right now* later becomes nonzero once React finishes
  // processing the awaited response. Give any error UI a chance to actually
  // mount before checking it isn't there.
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/error/i)).toHaveCount(0);
});

test("/agents/new renders create mode: heading and action read Create, not Edit or Save", async ({ page }) => {
  // app-pages spec "Create mode on /agents/new": the literal /agents/new
  // route (App.tsx) has no :id segment, so `useParams().id` is undefined —
  // agent-detail-page.tsx now treats that the same as id === "new".
  await page.goto("/agents/new");
  await expect(page.getByRole("heading", { name: "Create Agent" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create agent", exact: true })).toBeVisible();
  await expect(page.getByText("Edit Agent", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save agent", exact: true })).toHaveCount(0);
});

test("agent create from /agents/new hits the compiler mock", async ({ page }) => {
  const log = backendRequestLog(page, [/^POST \/api\/compiler\/compile$/]);

  await page.goto("/agents/new");
  await page.getByLabel("Name").fill("Test Agent");

  await page.getByRole("combobox").first().click();
  const modelsLoaded = page.waitForResponse((r) => r.url().includes("/api/providers/openai/models"));
  await page.getByRole("option", { name: "OpenAI" }).click();
  await modelsLoaded;

  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "GPT-5.2", exact: true }).click();

  const compiled = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/compiler/compile",
  );
  // app-pages W3 (design.md decision 1): the literal /agents/new route now
  // always renders create mode (agent-detail-page.tsx `isNew` fix), so the
  // button reads "Create agent" only — no longer either/or.
  await page.getByRole("button", { name: "Create agent", exact: true }).click();
  await compiled;

  expect(log).toEqual(["POST /api/compiler/compile"]);
  await page.waitForLoadState("networkidle"); // see W2 note above
  await expect(page.getByText(/error/i)).toHaveCount(0);
});

test("agent update from /agents saves memory settings via PATCH", async ({ page }) => {
  const log = backendRequestLog(page, [/^PATCH \/api\/agents\/research-analyst$/]);

  await page.goto("/agents");
  const card = agentCard(page, "Research Analyst");
  await card.getByRole("button", { name: "Memory settings" }).click();
  const patched = page.waitForResponse(
    (r) =>
      r.request().method() === "PATCH" &&
      new URL(r.url()).pathname === "/api/agents/research-analyst",
  );
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await patched;

  expect(log).toEqual(["PATCH /api/agents/research-analyst"]);
  await expect(card.getByText("Saved", { exact: true })).toBeVisible();
});

test("skill toggle and refresh hit the mock", async ({ page }) => {
  // `useSkillsSync` fires an unconditional POST /api/skills/refresh on mount
  // (src/hooks/use-skills-sync.ts step 3, "best-effort" rescan) before any
  // user interaction. Let that boot-time sync settle, then start the request
  // log, so it captures only the two calls this scenario triggers.
  await page.goto("/settings/skills");
  await expect(skillToggle(page, "Code Runner")).toHaveAttribute("aria-checked", "false");
  await page.waitForLoadState("networkidle");

  const log = backendRequestLog(page, [
    /^POST \/api\/skills\/code-runner\/toggle$/,
    /^POST \/api\/skills\/refresh$/,
  ]);

  const toggled = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/skills/code-runner/toggle",
  );
  await skillToggle(page, "Code Runner").click();
  await toggled;
  const refreshed = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/skills/refresh",
  );
  await page.getByRole("button", { name: "Rescan UAR" }).click();
  await refreshed;

  expect(log).toEqual(["POST /api/skills/code-runner/toggle", "POST /api/skills/refresh"]);
});
