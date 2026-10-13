import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/** Dynamic-import target: carries KaTeX's JS and CSS out of the entry/thread chunk. */
export { rehypeKatex };
