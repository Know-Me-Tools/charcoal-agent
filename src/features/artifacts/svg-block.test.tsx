import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SvgBlock, SVG_SIZE_CAP_BYTES } from "./svg-block";

const SAFE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
/** The UI's own icons are decorative svgs (aria-hidden); model svg content never is. */
const MODEL_SVG = "svg:not([aria-hidden='true'])";
const HOSTILE =
	'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script>' +
	'<image href="https://evil.example/x.png"/><a href="https://evil.example"><rect width="5" height="5"/></a></svg>';

function stubClipboard(clipboard: Partial<Clipboard> | undefined) {
	Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
}

afterEach(() => {
	stubClipboard(undefined);
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("SvgBlock preview", () => {
	it("renders the svg only as an img with a data:image/svg+xml url", () => {
		const { container } = render(<SvgBlock source={SAFE} />);
		const img = screen.getByRole("img", { name: "SVG diagram" });
		const src = img.getAttribute("src") ?? "";
		expect(src.startsWith("data:image/svg+xml")).toBe(true);
		expect(decodeURIComponent(src.slice(src.indexOf(",") + 1))).toBe(SAFE);
		expect(container.querySelector(MODEL_SVG)).toBeNull();
	});

	it("renders a hostile svg only as an img src: no script, iframe, object, embed or svg element", () => {
		const { container } = render(<SvgBlock source={HOSTILE} />);
		expect(container.querySelector("script")).toBeNull();
		expect(container.querySelector("iframe")).toBeNull();
		expect(container.querySelector("object")).toBeNull();
		expect(container.querySelector("embed")).toBeNull();
		expect(container.querySelector(MODEL_SVG)).toBeNull();
		expect(container.querySelector("a[href*='evil.example'], image")).toBeNull();
		expect(container.querySelector("[onload]")).toBeNull();
		expect(container.innerHTML).not.toContain("<script");
		const img = container.querySelector("img");
		expect(img?.getAttribute("src")?.startsWith("data:image/svg+xml")).toBe(true);
	});

	it("accepts an XML prolog before the svg element", () => {
		render(<SvgBlock source={`<?xml version="1.0"?>\n${SAFE}`} />);
		expect(screen.getByRole("img", { name: "SVG diagram" })).toBeTruthy();
	});

	it("toggles to the source view and back", () => {
		render(<SvgBlock source={SAFE} />);
		fireEvent.click(screen.getByRole("button", { name: "Source" }));
		expect(screen.queryByRole("img", { name: "SVG diagram" })).toBeNull();
		expect(screen.getByRole("region", { name: /code/i })).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Preview" }));
		expect(screen.getByRole("img", { name: "SVG diagram" })).toBeTruthy();
	});
});

describe("SvgBlock size cap", () => {
	it("shows source only with a note when over 256 KB", () => {
		const big = `<svg xmlns="http://www.w3.org/2000/svg"><!--${"x".repeat(SVG_SIZE_CAP_BYTES)}--></svg>`;
		render(<SvgBlock source={big} />);
		expect(screen.queryByRole("img", { name: "SVG diagram" })).toBeNull();
		expect(screen.getByText(/too large to preview/i)).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Preview" })).toBeNull();
		expect(screen.getByRole("button", { name: "Copy SVG source" })).toBeTruthy();
	});
});

describe("SvgBlock copy and download", () => {
	it("copies exactly the source", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubClipboard({ writeText });
		render(<SvgBlock source={SAFE} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Copy SVG source" }));
		});
		expect(writeText).toHaveBeenCalledWith(SAFE);
	});

	it("has one copy button in source view", () => {
		render(<SvgBlock source={SAFE} />);
		fireEvent.click(screen.getByRole("button", { name: "Source" }));
		expect(screen.getAllByRole("button", { name: /^copy/i })).toHaveLength(1);
	});

	it("downloads a Blob of type image/svg+xml named diagram.svg and revokes the URL later", () => {
		vi.useFakeTimers();
		const blobs: Blob[] = [];
		const createObjectURL = vi.fn((blob: Blob) => {
			blobs.push(blob);
			return "blob:test-url";
		});
		const revokeObjectURL = vi.fn();
		vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
		let downloaded = "";
		const click = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(function (this: HTMLAnchorElement) {
				downloaded = this.download;
			});
		render(<SvgBlock source={SAFE} />);
		fireEvent.click(screen.getByRole("button", { name: "Download SVG" }));
		expect(blobs).toHaveLength(1);
		expect(blobs[0].type).toBe("image/svg+xml");
		expect(downloaded).toBe("diagram.svg");
		expect(revokeObjectURL).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1500);
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
		click.mockRestore();
	});
});

describe("SvgBlock fallback", () => {
	it("falls back to a plain code block for content that is not an svg element", () => {
		const { container } = render(<SvgBlock source={"<div>not svg</div>"} />);
		expect(screen.queryByRole("img", { name: "SVG diagram" })).toBeNull();
		expect(container.querySelector("img")).toBeNull();
		expect(screen.getByRole("region", { name: /code/i })).toBeTruthy();
	});
});
