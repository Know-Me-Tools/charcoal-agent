# Bundle baseline, 2026-10-12

Method: site-equivalent build into a scratch dir (dist/ untouched), sourcemaps on, then gzip of each emitted JS file and source-byte attribution from the entry chunk's sourcemap.

    VITE_SITE_AGENT_ID=knowme-site VITE_UAR_API_KEY= VITE_UAR_BASE_URL= \
      npx vite build --sourcemap --outDir <scratch> --emptyOutDir
    (built in 14.13s, main-branch tree at 42f4283)

Result (gzip kB): entry index-BJh_u9QK.js 668.7; wasm 224.9; emacs-lisp 191.5; a2ui-surface-block 142.7; cytoscape 138.2; mermaid core 136.7; treemap 104.6. index.html loads only the entry chunk eagerly. Budget 300 kB.

Entry chunk source bytes (pre-minify) by package: @base-ui/react 618; katex 594; react-dom 533; @electric-sql/pglite 392; react-router 378; @assistant-ui/core 360; entity-graph-react 301; parse5 269; @assistant-ui/react 234; entity-graph-core 143; micromark-core-commonmark 111; tailwind-merge 104 (kB).

Limits: source bytes are not gzip bytes, so the ranking is indicative. The predecessor's 684.81 kB figure used an unrecorded method; the 16 kB gap is unexplained. No Core Web Vitals baseline exists yet.
