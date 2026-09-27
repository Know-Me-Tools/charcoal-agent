# Appearance checks

These are Playwright recipes that check what users see. Run them on every route at 320 and 1440 in both themes.

## Sibling overlap

```ts
const overlaps = await page.evaluate(() => {
  const bad: string[] = [];
  for (const row of document.querySelectorAll("main *")) {
    const kids = [...row.children].filter((k) => (k as HTMLElement).offsetParent !== null);
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 1 && y > 1 && getComputedStyle(kids[j]).position === "static") bad.push(`${kids[i].tagName}/${kids[j].tagName}`);
    }
  }
  return bad;
});
expect(overlaps).toEqual([]);
```

Exclude intentional stacking, such as absolute badges or thumbs inside a switch, by position or data attribute.

## Clipping inside containers

```ts
const clipped = await page.evaluate(() =>
  [...document.querySelectorAll("main *")]
    .filter((el) => { const s = getComputedStyle(el); return s.overflowX === "hidden" || s.overflowX === "clip"; })
    .filter((el) => el.scrollWidth > el.clientWidth + 1)
    .filter((el) => !/truncate|line-clamp/.test((el as HTMLElement).className))
    .map((el) => el.tagName + "." + (el as HTMLElement).className.split(" ")[0]));
expect(clipped).toEqual([]);
```

Deliberate truncation, with an ellipsis and the full text available, is allowed. Say so explicitly.

## Visible fills

For each element whose background differs from `transparent`, compare it with the nearest ancestor that has a background. Fail if the two are equal, or below a ΔL* of about 1.8. Run it in both themes.

## Control state

For each `[role="switch"]`, check the thumb's box lies inside the track's box, and that the checked and unchecked renders differ in something besides colour (position).
