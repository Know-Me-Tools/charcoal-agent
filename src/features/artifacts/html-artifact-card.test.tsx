import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HtmlArtifactCard } from "./html-artifact-card";
import { PREVIEW_CSP } from "./preview-document";
import { PREVIEW_NOTE_CONTENT } from "../../../content/site/preview-note";

const CODE = "<p>hello</p>";

/**
 * Task 3.5 decision (option 1): the site's enforcing CSP blocks scripts in
 * the preview frame, so the site build tells the visitor; the app build (no
 * such header) does not.
 */
describe("HtmlArtifactCard — scripts note", () => {
  const NOTE = PREVIEW_NOTE_CONTENT.scriptsBlocked;
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["a script element", "<p>hi</p><SCRIPT>document.title = 'x'</SCRIPT>"],
    ["an inline event handler", '<button onclick="go()">Go</button>'],
    ["a javascript: URL", '<a href=" JavaScript:alert(1)">open</a>'],
  ])("shows the note on the site build for %s", (_label, code) => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
    render(<HtmlArtifactCard code={code} language="html" />);

    const note = screen.getByText(NOTE);
    expect(note).toBeVisible();
    expect(document.querySelector("iframe")?.getAttribute("aria-describedby")).toBe(note.id);
  });

  it("shows no note for static HTML on the site build", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
    render(<HtmlArtifactCard code={'<p style="color:red">hello</p><a href="/x">x</a>'} language="html" />);

    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    expect(document.querySelector("iframe")?.hasAttribute("aria-describedby")).toBe(false);
  });

  it("shows no note on the app build, where previews run scripts", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    render(<HtmlArtifactCard code="<script>1</script><p>hi</p>" language="html" />);

    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });

  it("keeps the note in the full-screen preview", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
    render(<HtmlArtifactCard code="<script>1</script><p>hi</p>" language="html" />);

    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(NOTE)).toBeInTheDocument();
  });
});

/**
 * CRITICAL 2 (adversarial review): `allow-same-origin` combined with
 * `allow-scripts` lets model-authored HTML run scripts that share the app's
 * own origin — it can read the app's IndexedDB/PGlite data, ride the app's
 * UAR session headers, and drop its own sandbox by rewriting the iframe. The
 * inline and full-screen iframes must both carry exactly `sandbox="allow-scripts"`
 * (no same-origin, no forms, no popups, no top navigation).
 */
describe("HtmlArtifactCard — iframe sandboxing", () => {
  it("the inline preview iframe's sandbox attribute is exactly allow-scripts", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("sandbox")).toBe("allow-scripts");
  });

  it("the full-screen preview iframe's sandbox attribute is exactly allow-scripts", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    const iframes = document.querySelectorAll("iframe");
    for (const iframe of Array.from(iframes)) {
      expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
    }
  });

  it("does not offer Open in new tab (blob: URL at the app origin, no noopener)", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    expect(screen.queryByRole("button", { name: /open in new tab/i })).not.toBeInTheDocument();
  });

  it("blanks the inline iframe while full screen is open, so it stops running", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    // Two iframes existing simultaneously means the inline one is still live.
    const iframes = document.querySelectorAll("iframe");
    expect(iframes).toHaveLength(1);
  });

  it("the full-screen dialog shows only one close control (the toolbar's Exit full screen)", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    expect(screen.getAllByRole("button", { name: /exit full screen|^close$/i })).toHaveLength(1);
  });
});

/**
 * site-reply-content-hardening 3.3: both preview frames load the model's code
 * through `toPreviewDocument`, so the isolating CSP meta is in the srcdoc.
 */
describe("HtmlArtifactCard — isolating CSP in the preview document", () => {
  function expectIsolated(iframe: Element | null) {
    const srcdoc = iframe?.getAttribute("srcdoc") ?? "";
    const doc = new DOMParser().parseFromString(srcdoc, "text/html");
    const meta = doc.head.firstElementChild;
    expect(meta?.getAttribute("http-equiv")).toBe("Content-Security-Policy");
    expect(meta?.getAttribute("content")).toBe(PREVIEW_CSP);
    expect(doc.body.innerHTML).toBe(CODE);
  }

  it("the inline preview's srcdoc carries the policy", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    expectIsolated(document.querySelector("iframe"));
  });

  it("the full-screen preview's srcdoc carries the policy", () => {
    render(<HtmlArtifactCard code={CODE} language="html" />);

    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));

    expectIsolated(document.querySelector("iframe"));
  });
});
