/**
 * Brand voice, tagline and FAQ-rendering guard for the landing, About and
 * not-found content modules (specs/brand-pages/spec.md: "Approved taglines
 * only", "Brand voice in page copy", "Landing page document structure";
 * task 1.2 content modules; design.md decision 10 and 3).
 *
 * JSX is written with `React.createElement` rather than `<tag>` syntax so
 * this file can stay a plain `.ts` module, per task 3.1's file name.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPROVED_TAGLINES } from "../../content/brand/taglines";
import { ABOUT_CONTENT } from "../../content/site/about";
import type { LandingContent, LandingSection } from "../../content/site/landing";
import { LANDING_CONTENT } from "../../content/site/landing";
import { NOT_FOUND_CONTENT } from "../../content/site/not-found";

// Brand Guide v1.0 §02 voice rules (design.md "Binding sources"; the spec's
// "Brand voice in page copy" requirement). Independent of the grep command in
// tasks.md 1.2, which only scans `content/` — this walks the parsed content
// objects so a mistake in string composition (e.g. template interpolation)
// is caught too, not just the literal source text.
const BANNED_WORDS = /revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge|charcoal/i;

/** Recursively collects every string value out of a plain content object. */
function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

describe("Approved taglines only", () => {
  it("the landing headline is a member of APPROVED_TAGLINES", () => {
    expect(APPROVED_TAGLINES).toContain(LANDING_CONTENT.headline);
  });

  it("the headline is exactly the primary tagline", () => {
    // design.md decision 2: "AI that understands you." is the primary
    // tagline and the only one used as the hero h1 in this change.
    expect(LANDING_CONTENT.headline).toBe("AI that understands you.");
  });

  it("has no retired slogans in src, content or index.html", () => {
    // Mirrors the spec's "Retired slogans are gone" scenario, which greps
    // src, content and index.html for the two retired slogan strings. This
    // file's own file name is excluded, the same way `brand-naming.test.ts`
    // excludes itself — the slogan strings appear here only as the literal
    // pattern under test, not as page copy, and `git ls-files` would
    // otherwise match this file against its own docstring once committed.
    const RETIRED_SLOGANS = /AI that knows|OS that learns you/i;
    const out = execFileSync("git", ["ls-files", "--", "src", "content", "index.html"], {
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    });
    const files = out.split("\n").filter((f) => f && f !== "src/test/brand-copy.test.ts");
    const offending = files.filter((file) => RETIRED_SLOGANS.test(readFileSync(file, "utf8")));
    expect(offending).toEqual([]);
  });
});

describe("Brand voice in page copy", () => {
  const modules: Record<string, unknown> = {
    landing: LANDING_CONTENT,
    about: ABOUT_CONTENT,
    "not-found": NOT_FOUND_CONTENT,
  };

  for (const [name, content] of Object.entries(modules)) {
    it(`${name} content has no "!" and no banned or "charcoal" word`, () => {
      const strings = collectStrings(content);
      expect(strings.length).toBeGreaterThan(0);
      for (const s of strings) {
        expect(s.includes("!"), `"!" found in: ${s}`).toBe(false);
        expect(BANNED_WORDS.test(s), `banned word found in: ${s}`).toBe(false);
      }
    });
  }
});

/**
 * FAQ items render as question headings (spec scenario under "Landing page
 * document structure"). The landing page has no extracted, presentational
 * section component — FAQ rendering lives inline in `landing-page.tsx` — so
 * this exercises the real component with fixture content substituted for the
 * content module, per design.md decision 10 ("renders a fixture FAQ
 * section"). Using `vi.doMock` + a dynamic import (rather than the static
 * `LANDING_CONTENT` import above) keeps this isolated to these two tests.
 */
describe("FAQ items render as question headings", () => {
  afterEach(() => {
    vi.doUnmock("../../content/site/landing");
    vi.resetModules();
  });

  const baseFixture: LandingContent = {
    ...LANDING_CONTENT,
  };

  function sectionWith(faq: LandingSection["faq"]): LandingSection {
    return {
      id: "fixture",
      label: "Fixture",
      heading: "Fixture section heading",
      body: ["Fixture body paragraph."],
      faq,
    };
  }

  async function renderLandingWith(sections: LandingSection[]) {
    vi.resetModules();
    vi.doMock("../../content/site/landing", () => ({
      LANDING_CONTENT: { ...baseFixture, sections },
    }));
    const { default: LandingPage } = await import("../pages/landing-page");
    render(createElement(MemoryRouter, null, createElement(LandingPage)));
  }

  it("two FAQ items render two h3 elements, each followed by its answer", async () => {
    await renderLandingWith([
      sectionWith([
        { question: "Fixture question one?", answer: "Fixture answer one." },
        { question: "Fixture question two?", answer: "Fixture answer two." },
      ]),
    ]);

    const region = screen.getByRole("region", { name: "Fixture section heading" });
    const headings = within(region).getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["Fixture question one?", "Fixture question two?"]);
    expect(within(region).getByText("Fixture answer one.")).toBeInTheDocument();
    expect(within(region).getByText("Fixture answer two.")).toBeInTheDocument();
  });

  it("zero FAQ items render no h3 in that section", async () => {
    await renderLandingWith([sectionWith(undefined)]);

    const region = screen.getByRole("region", { name: "Fixture section heading" });
    expect(within(region).queryAllByRole("heading", { level: 3 })).toEqual([]);
  });

  it("an empty FAQ array also renders no h3", async () => {
    await renderLandingWith([sectionWith([])]);

    const region = screen.getByRole("region", { name: "Fixture section heading" });
    expect(within(region).queryAllByRole("heading", { level: 3 })).toEqual([]);
  });
});
