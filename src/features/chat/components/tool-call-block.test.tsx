import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolCallBlockWrapper } from "./tool-call-block";

// assistant-ui's own `normalizePartStatus` (node_modules/@assistant-ui/core/
// dist/utils/normalizePartStatus.js) hardcodes a tool-call part's `status` to
// `{ type: "complete" }` whenever `result !== undefined`, regardless of
// `isError`. `use-chat-runtime.ts` already sets `isError: block.status ===
// "failed"` on the converted tool-call part (see @assistant-ui/core's
// `ToolCallMessagePart.isError`), so the wrapper — not `status.type` — is the
// only place that can still surface a failed tool call as "Failed".
describe("ToolCallBlockWrapper", () => {
	it("shows the Failed pill when isError is true, even though status.type is complete", () => {
		render(
			<ToolCallBlockWrapper
				toolName="sync_contacts"
				args={{}}
				result={{ success: false }}
				status={{ type: "complete" }}
				isError
			/>,
		);

		expect(screen.getByText("Failed")).toBeInTheDocument();
		expect(screen.queryByText("Completed")).not.toBeInTheDocument();
	});

	it("still shows the Completed pill when isError is not set", () => {
		render(
			<ToolCallBlockWrapper
				toolName="lookup_weather"
				args={{}}
				result={{ ok: true }}
				status={{ type: "complete" }}
			/>,
		);

		expect(screen.getByText("Completed")).toBeInTheDocument();
	});

	it("still shows the Running pill while the call is in progress", () => {
		render(<ToolCallBlockWrapper toolName="lookup_weather" args={{}} status={{ type: "running" }} />);

		expect(screen.getByText("Running")).toBeInTheDocument();
	});
});
