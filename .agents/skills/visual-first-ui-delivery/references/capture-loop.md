# The capture-and-look loop

## One command per route set

Give the project a script that captures chosen routes at chosen widths and themes into a known folder, without comparing against goldens:

```ts
// e2e/capture.spec.ts: run with ROUTES=agents,settings-skills npx playwright test e2e/capture.spec.ts
const routes = (process.env.ROUTES ?? "").split(",").filter(Boolean);
for (const route of APP_ROUTES.filter((r) => routes.length === 0 || routes.includes(r.name))) {
  for (const width of [320, 1440]) for (const theme of ["light", "dark"] as const) {
    test(`${route.name} ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await seedTheme(page, theme);
      await openRoute(page, route); // waits for ready text, network idle and fonts
      await page.screenshot({ path: `test-results/look/${route.name}__${width}__${theme}.png`, fullPage: true });
    });
  }
}
```

Keep it separate from the golden suite, so a capture never fails on a pixel diff and nobody is tempted to "just update" a golden.

## Looking

- Open every image. For an AI agent, that means reading the image file.
- For each image, write one line: what's on screen, and anything wrong.
- Start at 320 in light. That's where overlap, clipping and invisible fills show up first.
- Compare against the brand reference for the page (tokens, type roles, lockup, one primary action), not against memory.

## Fixed position and full-page captures

Full-page screenshots paint `position: fixed` bars (bottom nav, toasts) mid-page. When content near the bottom matters, also take a viewport-only capture scrolled to the end.
