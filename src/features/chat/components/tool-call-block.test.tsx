import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolCallBlock, ToolCallBlockWrapper } from "./tool-call-block";

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

// site-chat-offline-states, FR-11 client case: agui.tool_call.denied always
// renders as "Blocked by policy", never "Running" and never silently
// dropped. Routed through `ToolCallBlock` directly (the `__denied__`
// pseudo-tool-call in enhanced-thread.tsx), not `ToolCallBlockWrapper` — see
// its own test above for why "failed" needs the wrapper's isError override;
// "denied" is a status this app invents, so there is no assistant-ui
// part-status ambiguity to resolve here.
describe("ToolCallBlock — denied status", () => {
	it("shows the Blocked by policy pill, not Failed or Running", () => {
		render(
			<ToolCallBlock
				toolName="activate_skill"
				args={{}}
				result="Tool calls are disabled for this agent."
				status="denied"
			/>,
		);

		expect(screen.getByText("Blocked by policy")).toBeInTheDocument();
		expect(screen.queryByText("Failed")).not.toBeInTheDocument();
		expect(screen.queryByText("Running")).not.toBeInTheDocument();
	});

	it("shows the policy reason as the expanded Reason, not JSON-formatted", async () => {
		const user = userEvent.setup();
		render(
			<ToolCallBlock
				toolName="activate_skill"
				args={{}}
				result="Tool calls are disabled for this agent."
				status="denied"
			/>,
		);

		await user.click(screen.getByRole("button", { expanded: false }));

		expect(screen.getByText("Reason")).toBeInTheDocument();
		expect(screen.getByText("Tool calls are disabled for this agent.")).toBeInTheDocument();
	});
});
