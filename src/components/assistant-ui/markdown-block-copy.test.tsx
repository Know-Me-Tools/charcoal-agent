import { act, fireEvent, render, screen } from "@testing-library/react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMarkdownRehypePlugins } from "./markdown-rehype-plugins";
import { MarkdownImage, MarkdownSpan, MarkdownTable } from "./markdown-block-copy";

const PLUGINS = buildMarkdownRehypePlugins(rehypeKatex);

function renderMarkdown(markdown: string) {
  return render(
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={PLUGINS}
      components={{ table: MarkdownTable, span: MarkdownSpan, img: MarkdownImage }}
    >
      {markdown}
    </ReactMarkdown>,
  );
}

function stubClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
}

afterEach(() => {
  stubClipboard(undefined);
  vi.unstubAllGlobals();
});

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
};

describe("table copy", () => {
  it("copies the table as GitHub markdown", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    renderMarkdown("| a | b |\n| - | - |\n| 1 | x\\|y |\n");
    await click("Copy table");
    expect(writeText).toHaveBeenCalledWith("| a | b |\n| --- | --- |\n| 1 | x\\|y |");
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Copied")).toBe(true);
  });

  it("is keyboard reachable as a real button", () => {
    renderMarkdown("| a |\n| - |\n| 1 |\n");
    expect(screen.getByRole("button", { name: "Copy table" }).tagName).toBe("BUTTON");
  });
});

describe("math copy", () => {
  it("gives display math a button that copies the TeX annotation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    renderMarkdown("$$\nx^2 + y^2\n$$");
    await click("Copy math");
    expect(writeText).toHaveBeenCalledWith("x^2 + y^2");
  });

  it("gives inline math no button", () => {
    renderMarkdown("Euler: $e^{i\\pi}+1=0$ is neat.");
    expect(document.querySelector(".katex")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("image copy", () => {
  const SRC = "/images/p.png";

  it("copies the image as PNG through ClipboardItem when supported", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write, writeText: vi.fn() });
    class FakeClipboardItem {
      constructor(public items: Record<string, Blob>) {}
    }
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    const png = new Blob(["x"], { type: "image/png" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => png }));
    renderMarkdown(`![alt](${SRC})`);
    await click("Copy image");
    expect(write).toHaveBeenCalledOnce();
    expect((write.mock.calls[0][0][0] as FakeClipboardItem).items["image/png"]).toBe(png);
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Copied image")).toBe(true);
  });

  it("copies the URL and says so when ClipboardItem is unsupported", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    vi.stubGlobal("ClipboardItem", undefined);
    renderMarkdown(`![alt](${SRC})`);
    await click("Copy image");
    expect(writeText).toHaveBeenCalledWith(SRC);
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Copied image link")).toBe(true);
  });

  it("falls back to the URL when the image bytes cannot be read", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write: vi.fn(), writeText });
    vi.stubGlobal("ClipboardItem", class {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("cors")));
    render(<MarkdownImage src="https://know-me.tools/p.png" alt="p" />);
    await click("Copy image");
    expect(writeText).toHaveBeenCalledWith("https://know-me.tools/p.png");
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Copied image link")).toBe(true);
  });

  it("gives no button to an image the reply policy removed", () => {
    renderMarkdown("![evil alt](https://evil.example/p.png)");
    expect(document.querySelector("img")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
