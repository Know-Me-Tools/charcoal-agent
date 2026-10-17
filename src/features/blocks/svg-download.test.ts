import { sanitizeSvgForDownload } from "./svg-download";

const NS = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';

describe("sanitizeSvgForDownload", () => {
	it("keeps a plain drawing", () => {
		const out = sanitizeSvgForDownload(`<svg ${NS} width="10" height="10"><rect x="1" y="1" width="8" height="8" fill="#336"/><text x="2" y="9">Hi</text></svg>`);
		expect(out).toContain("<rect");
		expect(out).toContain("Hi");
		expect(out).toContain('fill="#336"');
	});

	it("removes script, foreignObject and other active elements", () => {
		const out = sanitizeSvgForDownload(
			`<svg ${NS}><script>alert(1)</script><foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><form action="https://evil.example"/></div></foreignObject><rect width="5" height="5"/></svg>`,
		);
		expect(out).not.toMatch(/script|foreignObject|<form|alert/i);
		expect(out).toContain("<rect");
	});

	it("removes event attributes and every reference that is not a same-document fragment", () => {
		const out = sanitizeSvgForDownload(
			`<svg ${NS} onload="alert(1)"><image href="https://tracker.example/p.png"/><use xlink:href="https://evil.example/x.svg#a"/><use href="#ok"/><a xlink:href="javascript:alert(1)"><rect width="2" height="2" onclick="x()"/></a></svg>`,
		);
		expect(out).not.toMatch(/onload|onclick|tracker\.example|evil\.example|javascript:/i);
		expect(out).toContain('href="#ok"');
	});

	it("removes external url() values and @import, and keeps url(#fragment)", () => {
		const out = sanitizeSvgForDownload(
			`<svg ${NS}><defs><linearGradient id="g"/></defs><style>@import url(https://evil.example/a.css); .a{fill:url(#g)} .b{background:url(https://evil.example/x.png)}</style><rect style="fill:url(https://evil.example/x)" fill="url(#g)" width="2" height="2"/></svg>`,
		);
		expect(out).not.toMatch(/evil\.example|@import/i);
		expect(out).toContain("url(#g)");
	});

	it("returns a source that is not well-formed XML unchanged", () => {
		const broken = "<svg><rect></svg";
		expect(sanitizeSvgForDownload(broken)).toBe(broken);
	});
});
