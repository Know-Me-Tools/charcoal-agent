import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
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
import { MARKDOWN_REHYPE_PLUGINS } from "./markdown-rehype-plugins";

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
 * up (the exported `MARKDOWN_REHYPE_PLUGINS` list itself — no
 * re-implementing it) through plain `react-markdown` directly instead of assistant-ui's
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
			rehypePlugins={MARKDOWN_REHYPE_PLUGINS}		>
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
 * site-reply-content-hardening 3.1. A remote image fires a request the
 * moment it renders, so its URL is a channel out of the chat to a third
 * party; only the site's own hosts (know-me.tools and its subdomains) and
 * same-origin relative paths may load. A link to a host that is not on the
 * explicit reviewed list renders as text that shows its destination, the
 * way citation cards do (operator decisions 2 and 3).
 */
const EVIL_IMAGE = "https://evil.example/p.png";

describe("EnhancedMarkdownText — remote images", () => {
	it("renders no <img> for a markdown image on a third-party host", () => {
		const html = renderMarkdown(`![x](${EVIL_IMAGE})`);
		expect(html).not.toContain("<img");
		expect(html).not.toContain(EVIL_IMAGE);
	});

	it("renders no <img> for a raw <img> on a third-party host", () => {
		const html = renderMarkdown(`<img src="${EVIL_IMAGE}" alt="x">`);
		expect(html).not.toContain("<img");
		expect(html).not.toContain(EVIL_IMAGE);
	});

	it("renders no <source srcset> on a third-party host inside <picture>", () => {
		const html = renderMarkdown(
			`<picture><source srcset="${EVIL_IMAGE} 1x"><img src="/logo.png" alt="logo"></picture>`,
		);
		expect(html).not.toContain(EVIL_IMAGE);
	});

	it("rejects a lookalike host that only contains the own host as a label", () => {
		const html = renderMarkdown("![x](https://know-me.tools.evil.example/p.png)");
		expect(html).not.toContain("<img");
	});

	it("rejects plain http: even on the own host", () => {
		const html = renderMarkdown("![x](http://know-me.tools/p.png)");
		expect(html).not.toContain("<img");
	});

	it("keeps the alt text of a blocked image as plain text", () => {
		const html = renderMarkdown(`![A product screenshot](${EVIL_IMAGE})`);
		expect(html).toContain("A product screenshot");
	});

	it("still renders an image on the own host", () => {
		const html = renderMarkdown("![x](https://know-me.tools/p.png)");
		expect(html).toContain('<img src="https://know-me.tools/p.png"');
	});

	it("still renders an image on a subdomain of the own host", () => {
		const html = renderMarkdown("![x](https://cdn.know-me.tools/p.png)");
		expect(html).toContain('<img src="https://cdn.know-me.tools/p.png"');
	});

	it("still renders a same-origin relative image path", () => {
		const html = renderMarkdown("![x](/images/p.png)");
		expect(html).toContain('<img src="/images/p.png"');
	});

	it("treats a backslash path that browsers read as protocol-relative as remote", () => {
		const html = renderMarkdown('<img src="/\\evil.example/p.png" alt="x">');
		expect(html).not.toContain("<img");
	});
});

describe("EnhancedMarkdownText — reply links", () => {
	it("shows a link to a non-allowlisted host as text that includes the destination, not an <a href>", () => {
		const html = renderMarkdown("[label](https://evil.example/x)");
		expect(html).not.toMatch(/<a[^>]*href=/);
		expect(html).toContain("label (https://evil.example/x)");
	});

	it("shows a raw <a> to a non-allowlisted host the same way", () => {
		const html = renderMarkdown('<a href="https://evil.example/x">label</a>');
		expect(html).not.toMatch(/<a[^>]*href=/);
		expect(html).toContain("label (https://evil.example/x)");
	});

	it("shows an autolinked non-allowlisted URL once, as text", () => {
		const html = renderMarkdown("See https://evil.example/x today.");
		expect(html).not.toMatch(/<a[^>]*href=/);
		expect(html.match(/https:\/\/evil\.example\/x/g)).toHaveLength(1);
	});

	it("renders a link to an allowlisted host as a safe anchor", () => {
		const html = renderMarkdown("[KnowMe](https://know-me.tools/about)");
		expect(html).toMatch(/<a[^>]*href="https:\/\/know-me\.tools\/about"/);
		expect(html).toMatch(/<a[^>]*target="_blank"/);
		expect(html).toMatch(/<a[^>]*rel="noopener noreferrer"/);
	});

	it("does not treat a subdomain of an allowlisted link host as allowlisted", () => {
		const html = renderMarkdown("[x](https://docs.know-me.tools/a)");
		expect(html).not.toMatch(/<a[^>]*href=/);
		expect(html).toContain("x (https://docs.know-me.tools/a)");
	});

	it("rejects userinfo on an allowlisted host", () => {
		const html = renderMarkdown("[x](https://know-me.tools@evil.example/a)");
		expect(html).not.toMatch(/<a[^>]*href=/);
	});

	it("shows mailto: as text, never as a live link", () => {
		const html = renderMarkdown("[Email us](mailto:someone@evil.example)");
		expect(html).not.toMatch(/<a[^>]*href=/);
		expect(html).toContain("Email us (mailto:someone@evil.example)");
	});

	it("shows an autolinked email address once, as text", () => {
		const html = renderMarkdown("Write to hello@know-me.tools.");
		expect(html).not.toMatch(/<a[^>]*href=/);
		expect(html.match(/hello@know-me\.tools/g)).toHaveLength(1);
	});

	it("keeps same-page footnote links working", () => {
		const html = renderMarkdown("Claim[^1].\n\n[^1]: Source.");
		expect(html).toMatch(/<a[^>]*href="#user-content-fn-1"/);
	});
});

describe("EnhancedMarkdownText — dangerous schemes stay blocked", () => {
	it("never produces a javascript: href from markdown or raw HTML", () => {
		const html = renderMarkdown('[a](javascript:alert(1)) <a href="javascript:alert(2)">b</a>');
		expect(html).not.toMatch(/href="javascript:/i);
	});

	it("never produces a data: href", () => {
		const html = renderMarkdown('<a href="data:text/html,<script>alert(1)</script>">x</a>');
		expect(html).not.toMatch(/href="data:/i);
	});

	it("never produces a data: image src", () => {
		const html = renderMarkdown('<img src="data:image/png;base64,iVBORw0KGgo=" alt="x">');
		expect(html).not.toMatch(/src="data:/i);
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
