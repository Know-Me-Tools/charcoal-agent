/**
 * Fill, hover, press and keyboard-focus classes shared by the page's two
 * ember-filled CTAs: the landing hero send control and the not-found home
 * link (docs/design/brand-pages.md, section 9). Kept in one place so their
 * state colours cannot drift apart. Sizing classes (height, padding, gap
 * to neighbours) are layered on at each call site, since they differ by
 * placement.
 *
 * These controls are plain elements, not the `Button` primitive: `Button`
 * carries an unconditional `outline-none` that stops a keyboard-focus
 * outline from painting in Tailwind 4 (brand-pages.md section 5.1).
 */
export const EMBER_CTA =
	"inline-flex items-center gap-2 rounded-lg font-ui text-sm font-semibold bg-ember text-primary-foreground transition-hover hover:bg-ember-hover active:translate-y-px focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";
