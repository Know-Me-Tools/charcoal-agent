import { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";

/**
 * Sanitization schema for model-authored markdown (review round 3 BLOCK,
 * both reviewers): `rehypeRaw` (in `enhanced-markdown-text.tsx`) turns raw
 * HTML embedded in markdown into real hast elements — with no sanitizer
 * that lets an assistant message inject `<iframe>`, `<form>`, `<style>`,
 * `<script>`, event-handler attributes (`onerror`, …) and `javascript:`
 * URLs straight into the app's own origin.
 *
 * Starts from `defaultSchema` (GitHub's own sanitization rules, via
 * `hast-util-sanitize`) and only extends what the markdown renderer needs:
 *
 *   - `code`'s `className` already allows `/^language-./` (fenced-code
 *     language, e.g. `language-ts`, `language-mermaid`, `language-html`,
 *     read by `EnhancedCodeBlock` to route to Shiki / Mermaid /
 *     `HtmlArtifactCard`) and, per GitHub's schema, `language-math` (what
 *     `remark-math` emits). It does NOT by default allow the literal
 *     `math-inline` / `math-display` classes that `remark-math` also puts
 *     on the same `<code>` element and that `rehype-katex` (which runs
 *     after sanitization) reads to pick inline vs. display mode — verified
 *     against this project's installed `mdast-util-math`, which emits
 *     `<code class="language-math math-inline">` for `$…$` and
 *     `<pre><code class="language-math math-display">` for `$$…$$`, not
 *     the `<span class="math math-inline">` shape some rehype-katex/
 *     rehype-sanitize docs examples use for older math-node conventions.
 *     IMPORTANT: this must stay a single `['className', ...]` definition —
 *     hast-util-sanitize's `findDefinition` returns the *first* match for a
 *     given attribute name per tag, so a second separate `['className', …]`
 *     entry for `code` would silently never be consulted.
 *   - `href` protocols are narrowed from the default
 *     (`http`, `https`, `irc`, `ircs`, `mailto`, `xmpp`) to just
 *     `http`, `https`, `mailto` — no `javascript:` (never allowed by
 *     default either way), and no irc/xmpp schemes this app has no use for.
 *
 * Everything else (no `iframe`/`form`/`style`/`script`/`object`/`embed`, no
 * `on*` attributes, `<sup>`/`<details>`/`<summary>` allowed) is already
 * GitHub's default behavior — confirmed by reading
 * `node_modules/hast-util-sanitize/lib/schema.js` and by
 * `enhanced-markdown-text.test.tsx`.
 *
 * Kept in its own module (not colocated in `enhanced-markdown-text.tsx`)
 * because it's a plain object, not a component — exporting it alongside
 * components there defeats `react-refresh/only-export-components`'s
 * `allowConstantExport` fast path (that option covers primitive constants,
 * not objects), so it flagged a lint warning until it was moved out.
 */
export const MARKDOWN_SANITIZE_SCHEMA: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [["className", /^language-./, "math-inline", "math-display"]],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
};
