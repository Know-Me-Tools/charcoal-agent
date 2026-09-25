import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * `EnhancedCodeBlock`'s "is this a fenced block, not inline code" check
 * (`useIsMarkdownCodeBlock()` from `@assistant-ui/react-markdown`) normally
 * reads that package's own internal `PreContext`, which isn't publicly
 * exported. Mocked directly instead — enough to exercise
 * `EnhancedCodeBlock`'s own routing logic in isolation, without needing the
 * full markdown pipeline or a `<pre>` ancestor.
 */
vi.mock("@assistant-ui/react-markdown", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@assistant-ui/react-markdown")>();
	return {
		...actual,
		useIsMarkdownCodeBlock: () => true,
	};
});

vi.mock("@/features/artifacts/mermaid-block", () => ({
	MermaidBlock: ({ source }: { source: string }) => (
		<div data-testid="mermaid-block">{source}</div>
	),
}));
vi.mock("@/features/artifacts/shiki-code-block", () => ({
	ShikiCodeBlock: ({ code, language }: { code: string; language?: string }) => (
		<div data-testid="shiki-code-block" data-language={language}>
			{code}
		</div>
	),
}));

import { EnhancedCodeBlock } from "./enhanced-markdown-text";
import { MARKDOWN_SANITIZE_SCHEMA } from "./markdown-sanitize-schema";

/**
 * Review round 3 BLOCK (both reviewers): `rehypeRaw` turned embedded raw
 * HTML into real hast elements with no sanitizer, so a model-authored
 * message could inject <iframe>, <form>, <style>, <script>, event-handler
 * attributes, and javascript: URLs straight into the app. Fixed with
 * rehype-sanitize (pinned 6.0.0), a schema built from hast-util-sanitize's
 * `defaultSchema`, ordered rehypeRaw -> [rehypeSanitize, schema] ->
 * [rehypeKatex, { strict: false }] so raw HTML is cleaned before KaTeX
 * generates its own trusted markup.
 *
 * These tests drive the *exact* plugin chain `EnhancedMarkdownText` wires
 * up (same imports, same order, same exported schema — no re-implementing
 * it) through plain `react-markdown` directly instead of assistant-ui's
 * `MarkdownTextPrimitive` wrapper. `MarkdownTextPrimitive` is exactly
 * `ReactMarkdown` plus assistant-ui's streaming/smoothing context
 * (`node_modules/@assistant-ui/react-markdown/src/primitives/MarkdownText.tsx`
 * imports `ReactMarkdown` and forwards `remarkPlugins`/`rehypePlugins`/
 * `components` straight through), so this is a faithful proxy for the real
 * rendering pipeline — it just skips the smoothing context, which requires
 * a live AssistantRuntimeProvider unrelated to what's under test here.
 */
function renderMarkdown(markdown: string): string {
	return renderToStaticMarkup(
		<ReactMarkdown
			remarkPlugins={[remarkGfm, remarkMath]}
			rehypePlugins={[rehypeRaw, [rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA], [rehypeKatex, { strict: false }]]}
		>
			{markdown}
		</ReactMarkdown>,
	);
}

describe("EnhancedMarkdownText — HTML sanitization", () => {
	it("strips <iframe> entirely", () => {
		const html = renderMarkdown('Before <iframe src="https://evil.example"></iframe> after');
		expect(html).not.toContain("<iframe");
	});

	it("strips <form> (and leaves no submittable input behind)", () => {
		const html = renderMarkdown(
			'Before <form action="https://evil.example"><input name="x" type="text"></form> after',
		);
		expect(html).not.toContain("<form");
		expect(html).not.toMatch(/type="text"/);
	});

	it("strips <style> so it never applies as a stylesheet", () => {
		const html = renderMarkdown("Before <style>body{display:none}</style> after");
		expect(html).not.toContain("<style");
	});

	it("strips event-handler attributes like onerror from <img>", () => {
		const html = renderMarkdown('<img src="x" onerror="alert(1)">');
		expect(html).not.toContain("onerror");
		expect(html).not.toContain("alert(1)");
	});

	it("strips javascript: URLs from <a href>", () => {
		const html = renderMarkdown('<a href="javascript:alert(1)">x</a>');
		expect(html).not.toContain("javascript:");
	});

	it("still allows <sup> (citation markers)", () => {
		const html = renderMarkdown("footnote<sup>1</sup>");
		expect(html).toContain("<sup");
	});

	it("still allows <details><summary> (progressive disclosure)", () => {
		const html = renderMarkdown("<details><summary>Summary</summary>Body</details>");
		expect(html).toContain("<details");
		expect(html).toContain("<summary");
	});
});

describe("EnhancedMarkdownText — sanitized content still renders correctly", () => {
	it("still renders KaTeX for inline math", () => {
		const html = renderMarkdown(String.raw`Euler: $e^{i\pi}+1=0$`);
		expect(html).toContain("katex");
	});

	it("keeps a fenced ts code block's language class through sanitization", () => {
		const html = renderMarkdown("```ts\nconst x: number = 1;\n```");
		expect(html).toContain('class="language-ts"');
	});

	it("keeps a fenced mermaid code block's language class through sanitization", () => {
		const html = renderMarkdown("```mermaid\ngraph LR\n  A --> B\n```");
		expect(html).toContain('class="language-mermaid"');
	});
});

/**
 * `EnhancedCodeBlock` routes a fenced code block to Shiki or Mermaid based
 * on the `language-<lang>` class sanitization keeps intact above.
 */
function renderFencedCodeBlock(className: string, code: string) {
	return render(<EnhancedCodeBlock className={className}>{code}</EnhancedCodeBlock>);
}

describe("EnhancedCodeBlock — routing by sanitized language class", () => {
	it("routes a language-ts block to Shiki syntax highlighting", () => {
		renderFencedCodeBlock("language-ts", "const x: number = 1;");

		const block = screen.getByTestId("shiki-code-block");
		expect(block).toHaveAttribute("data-language", "ts");
	});

	it("routes a language-mermaid block to the Mermaid renderer", () => {
		renderFencedCodeBlock("language-mermaid", "graph LR\n  A --> B");

		expect(screen.getByTestId("mermaid-block")).toBeInTheDocument();
	});
});
