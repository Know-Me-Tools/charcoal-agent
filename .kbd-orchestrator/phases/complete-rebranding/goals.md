# Goals

- Adopt the official KnowMe AI, LLC brand from /Users/gqadonis/Projects/know-me/know-me-system/docs (brand guidelines, templates, icons, logo SVGs) as the single source of truth
- Replace the color system (Tailwind + CSS custom-property tokens, light and dark themes) with the KnowMe brand palette
- Adopt KnowMe typography (font families, weights, type scale) across the app
- Replace all logos, favicon, app icons (web public/ and src-tauri/icons) and product naming with official KnowMe marks
- Restyle every surface — landing page, app shell (sidebar, topbar, context panel, mobile nav), threads/chat, agents, settings pages, and chat content blocks — to match KnowMe look-and-feel, mood, spacing, radius, elevation and motion standards
- Retheme shadcn/ui primitives and assistant-ui components via tokens rather than per-component overrides
- Verify brand fidelity visually at 320/768/1024/1440 in both themes and keep build, tests, lint and WCAG contrast passing
- (Operator-added 2026-09-23) Modernize the UI stack the rebrand is built on: Tailwind 4, latest shadcn/ui on Base UI, latest assistant-ui, and replace TanStack Query with the latest @prometheus-ags/prometheus-entity-management entity graph (including its components where they fit)
