/**
 * WCAG 2.x A/AA scan (including color contrast) of every route in both themes.
 * Report-only by default so current known violations don't block unrelated
 * work; AXE_STRICT=1 fails on any violation (enabled by brand-fidelity-audit).
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { openRoute, seedTheme } from "./support/page-helpers";
import { APP_ROUTES, THEMES, VIEWPORT_HEIGHT } from "./support/routes";

const STRICT = process.env.AXE_STRICT === "1";

/**
 * Logotypes have no contrast requirement (WCAG 1.4.3 exception). The KnowMe
 * wordmark's ember "Me" is fixed by the brand guide and exposed as one named
 * image ("KnowMe"), so its text is left out of the colour-contrast rule only.
 */
const LOGOTYPE = "[data-slot='knowme-wordmark']";

type AxeViolation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

async function withoutLogotypeContrast(page: Page, violations: AxeViolation[]): Promise<AxeViolation[]> {
  const filtered: AxeViolation[] = [];
  for (const violation of violations) {
    if (violation.id !== "color-contrast") {
      filtered.push(violation);
      continue;
    }
    const inLogotype = await page.evaluate(
      ({ selectors, logotype }) =>
        selectors.map((selector) => document.querySelector(selector)?.closest(logotype) != null),
      { selectors: violation.nodes.map((n) => String(n.target[0])), logotype: LOGOTYPE },
    );
    const nodes = violation.nodes.filter((_, i) => !inLogotype[i]);
    if (nodes.length > 0) filtered.push({ ...violation, nodes });
  }
  return filtered;
}
const REPORT_DIR = path.resolve("test-results/a11y");
const WIDTH = 1440;

interface ViolationSummary {
  route: string;
  theme: string;
  rule: string;
  impact: string | null;
  nodes: number;
  help: string;
}

for (const route of APP_ROUTES) {
  for (const theme of THEMES) {
    test(`a11y › ${route.name} › ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: WIDTH, height: VIEWPORT_HEIGHT });
      await seedTheme(page, theme);
      await openRoute(page, route);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const found = await withoutLogotypeContrast(page, results.violations);

      const violations: ViolationSummary[] = found.map((v) => ({
        route: route.name,
        theme,
        rule: v.id,
        impact: v.impact ?? null,
        nodes: v.nodes.length,
        help: v.help,
      }));

      fs.mkdirSync(REPORT_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(REPORT_DIR, `${route.name}__${theme}.json`),
        JSON.stringify({ route: route.name, theme, violations, raw: found }, null, 2),
      );
      await testInfo.attach("axe-violations", {
        body: JSON.stringify(violations, null, 2),
        contentType: "application/json",
      });

      if (STRICT) {
        expect(
          violations,
          violations.map((v) => `${v.rule} (${v.impact}, ${v.nodes} nodes)`).join("; "),
        ).toEqual([]);
      }
    });
  }
}
