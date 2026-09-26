import "@testing-library/jest-dom";

// `__APP_VERSION__` is a Vite `define` (vite.config.ts), not something
// vitest's own config provides (vitest.config.ts has no `define`; see
// AGENTS.md gotcha). Any component test that renders the site footer or the
// About page (both read this constant) needs a value or it ReferenceErrors.
// The literal value is irrelevant here — no unit test asserts it — real
// version display is verified against `package.json` in
// `e2e/brand-pages.spec.ts`, where the app runs under the real Vite define.
(globalThis as unknown as { __APP_VERSION__: string }).__APP_VERSION__ = "0.0.0-test";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom has no PointerEvent; Base UI dispatches pointer events for keyboard
// activation (e.g. Space on a switch, Enter on a select trigger).
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
    }
  }
  Object.defineProperty(window, "PointerEvent", { writable: true, value: PointerEventPolyfill });
}
