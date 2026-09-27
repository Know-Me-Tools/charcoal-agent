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
    // src, content and index.html for the two retired slogan strings. The
    // strings are built from parts so this file never contains them, which
    // keeps the spec's repo-wide grep clean without excluding this file.
    const RETIRED_SLOGANS = new RegExp(["AI that " + "knows", "OS that " + "learns you"].join("|"), "i");
    const out = execFileSync("git", ["ls-files", "--", "src", "content", "index.html"], {
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    });
    const files = out.split("\n").filter(Boolean);
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

  it("two FAQ items render two h3 elements, each immediately followed by its own answer", async () => {
    await renderLandingWith([
      sectionWith([
        { question: "Fixture question one?", answer: "Fixture answer one." },
        { question: "Fixture question two?", answer: "Fixture answer two." },
      ]),
    ]);

    const region = screen.getByRole("region", { name: "Fixture section heading" });
    const headings = within(region).getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["Fixture question one?", "Fixture question two?"]);
    // W7 (brand-fidelity-audit design.md decision 1): the prior version of
    // this test only checked that both answers were present *somewhere* in
    // the region, which would still pass if the answers were swapped or
    // both rendered under the same question. Assert each answer is the
    // heading's own next sibling, so a swap or a mis-paired render fails.
    const answers = ["Fixture answer one.", "Fixture answer two."];
    headings.forEach((heading, i) => {
      const sibling = heading.nextElementSibling;
      expect(sibling, `heading ${i} ("${heading.textContent}") has no next sibling`).not.toBeNull();
      expect(sibling?.textContent).toBe(answers[i]);
    });
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

/**
 * landing W6 (design.md decision 1) / task 1.2: `splitHeadline` (inline,
 * unexported, in landing-page.tsx) used to repeat the last word for a
 * two-word tagline — it rendered the ember word once as part of a two-word
 * lead line AND again in the ember span. Today only the primary tagline
 * ("AI that understands you.") is ever rendered, so the two-word case
 * ("Intelligence, intimate.") is latent — this loops every approved
 * tagline through the real component so a bug there is caught immediately
 * if that tagline is ever chosen, rather than the next time someone edits
 * `content/site/landing.ts`.
 *
 * `splitHeadline` itself isn't exported, so this renders LandingPage with
 * each tagline substituted as the headline (the same `vi.doMock` pattern as
 * the FAQ describe above) and asserts the h1's rendered text reconstructs
 * the source string exactly, whitespace-normalized. A duplicated ember word
 * (the W6 bug) or a dropped lead word would both fail this equality.
 */
describe("splitHeadline renders every approved tagline with no repeated or dropped word", () => {
  afterEach(() => {
    vi.doUnmock("../../content/site/landing");
    vi.resetModules();
  });

  async function renderLandingWithHeadline(headline: string) {
    vi.resetModules();
    vi.doMock("../../content/site/landing", () => ({
      LANDING_CONTENT: { ...LANDING_CONTENT, headline },
    }));
    const { default: LandingPage } = await import("../pages/landing-page");
    render(createElement(MemoryRouter, null, createElement(LandingPage)));
  }

  it.each(APPROVED_TAGLINES)("%s renders as the h1 text, unchanged", async (headline) => {
    await renderLandingWithHeadline(headline);
    const h1 = screen.getByRole("heading", { level: 1 });
    const rendered = (h1.textContent ?? "").replace(/\s+/g, " ").trim();
    expect(rendered).toBe(headline);
  });
});
