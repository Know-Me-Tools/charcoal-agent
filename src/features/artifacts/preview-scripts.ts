/**
 * Does model-written HTML try to run script? Used to tell site visitors that
 * scripts do not run in previews: the site's enforcing CSP blocks inline
 * scripts, inline event handlers and `javascript:` URLs inside the `srcdoc`
 * preview frame (task 3.5 browser proof, decision option 1).
 *
 * The code is parsed the way the frame parses it (as `toPreviewDocument`
 * does), so case, attribute quoting and odd placement do not matter.
 */
export function hasPreviewScripts(code: string): boolean {
  const doc = new DOMParser().parseFromString(code, "text/html");
  if (doc.querySelector("script")) return true;
  for (const element of Array.from(doc.querySelectorAll("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      // `data-*` values are inert strings; the browser never runs them.
      if (name.startsWith("data-")) continue;
      if (name.startsWith("on")) return true;
      if (isJavascriptUrl(attribute.value)) return true;
    }
  }
  return false;
}

/**
 * Browsers strip leading/trailing C0 controls and spaces and remove tabs and
 * newlines anywhere in a URL before reading its scheme, so `java\tscript:`
 * is still a `javascript:` URL.
 */
function isJavascriptUrl(value: string): boolean {
  const normalized = value
    // eslint-disable-next-line no-control-regex
    .replace(/^[\u0000- ]+/, "")
    .replace(/[\t\n\r]/g, "")
    .toLowerCase();
  return normalized.startsWith("javascript:");
}
