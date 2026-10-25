import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RenderGuard } from "./render-guard";

function Boom(): never {
	throw new Error("secret raw message");
}

describe("RenderGuard", () => {
	afterEach(() => vi.restoreAllMocks());

	it("renders children when nothing throws", () => {
		render(
			<RenderGuard lang="svg" source="x">
				<p>fine</p>
			</RenderGuard>,
		);
		expect(screen.getByText("fine")).toBeInTheDocument();
	});

	it("shows the source and the given label when a child throws, without the raw message", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		render(
			<RenderGuard lang="svg" source="<svg/>" label="Could not show">
				<Boom />
			</RenderGuard>,
		);
		expect(screen.getByText("Could not show")).toBeInTheDocument();
		expect(screen.getByText("<svg/>")).toBeInTheDocument();
		expect(screen.queryByText(/secret raw message/)).not.toBeInTheDocument();
	});

	it("shows only the source when no label is given", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		render(
			<RenderGuard lang="ts" source="const a = 1">
				<Boom />
			</RenderGuard>,
		);
		expect(screen.getByText("const a = 1")).toBeInTheDocument();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("logs a fixed field list with no source or message text", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		render(
			<RenderGuard lang="html" source="<b>private</b>">
				<Boom />
			</RenderGuard>,
		);
		expect(warn).toHaveBeenCalledWith("[render-failure]", {
			kind: "render-exception",
			lang: "html",
			messageLength: "secret raw message".length,
		});
	});
});
