/**
 * The policy every HTML preview frame runs under (site-reply-content-hardening
 * 3.3). A `srcdoc` frame inherits the page's CSP, and a meta CSP can only
 * tighten that: this one lets the model's inline scripts and styles run but
 * loads nothing from anywhere and connects nowhere (`default-src 'none'`
 * covers `connect-src`, fonts, frames and media); images only as `data:`.
 */
export const PREVIEW_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:";

// A tag that only a whole document (not a fragment) would contain.
const DOCUMENT_TAG = /<(?:!doctype|html|head|body)[\s>]/i;

/**
 * Turn model-written HTML into the `srcdoc` for a preview frame, with the
 * isolating CSP meta as the first element of `<head>`.
 *
 * The code is parsed the way the frame will parse it, the meta is put first
 * in the head the parser built, and the document is serialized again. Doing
 * it on the parsed document rather than by string search means a `<head>`
 * inside a comment, a late `<head>` after body content, `<header>`, or
 * uppercase tags cannot move the meta somewhere the browser would ignore it.
 *
 * Mode is preserved: a document's own doctype stays first (so it does not
 * fall into quirks mode); a fragment is wrapped in `<!DOCTYPE html>`; a full
 * document written without a doctype keeps having none.
 */
export function toPreviewDocument(code: string): string {
  const doc = new DOMParser().parseFromString(code, "text/html");

  const meta = doc.createElement("meta");
  meta.setAttribute("http-equiv", "Content-Security-Policy");
  meta.setAttribute("content", PREVIEW_CSP);
  doc.head.prepend(meta);

  const isFragment = !DOCUMENT_TAG.test(code);
  const doctype = doc.doctype ? serializeDoctype(doc.doctype) : isFragment ? "<!DOCTYPE html>" : "";
  return `${doctype}${doc.documentElement.outerHTML}`;
}

function serializeDoctype({ name, publicId, systemId }: DocumentType): string {
  if (publicId) return `<!DOCTYPE ${name} PUBLIC "${publicId}"${systemId ? ` "${systemId}"` : ""}>`;
  if (systemId) return `<!DOCTYPE ${name} SYSTEM "${systemId}">`;
  return `<!DOCTYPE ${name}>`;
}
