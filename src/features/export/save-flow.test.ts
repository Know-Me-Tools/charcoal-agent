import { describe, expect, it, vi } from "vitest";
import { chooseSavePath, runSave, type SaveCapabilities, type SaveEnv, type SaveOutcome } from "./save-flow";

const FILE = new File(["# x"], "knowme-x-20261015.md", { type: "text/markdown" });

function abortError(): Error {
	const e = new Error("cancelled");
	e.name = "AbortError";
	return e;
}

interface Row {
	name: string;
	caps: SaveCapabilities;
	share?: () => Promise<void>;
	download?: () => void;
	path: ReturnType<typeof chooseSavePath>;
	outcome: SaveOutcome;
	shareCalls: number;
	downloadCalls: number;
}

const rows: Row[] = [
	{
		name: "canShare yes: share succeeds",
		caps: { canShareFile: true, canAnchorDownload: true },
		share: () => Promise.resolve(),
		path: "share",
		outcome: { kind: "saved", via: "share" },
		shareCalls: 1,
		downloadCalls: 0,
	},
	{
		name: "canShare no, anchor yes: download",
		caps: { canShareFile: false, canAnchorDownload: true },
		path: "download",
		outcome: { kind: "saved", via: "download" },
		shareCalls: 0,
		downloadCalls: 1,
	},
	{
		name: "share rejects with AbortError: cancelled, no download",
		caps: { canShareFile: true, canAnchorDownload: true },
		share: () => Promise.reject(abortError()),
		path: "share",
		outcome: { kind: "cancelled" },
		shareCalls: 1,
		downloadCalls: 0,
	},
	{
		name: "share throws synchronously with AbortError: cancelled",
		caps: { canShareFile: true, canAnchorDownload: true },
		share: () => {
			throw abortError();
		},
		path: "share",
		outcome: { kind: "cancelled" },
		shareCalls: 1,
		downloadCalls: 0,
	},
	{
		name: "share rejects with another error: falls to download",
		caps: { canShareFile: true, canAnchorDownload: true },
		share: () => Promise.reject(new Error("NotAllowedError")),
		path: "share",
		outcome: { kind: "saved", via: "download" },
		shareCalls: 1,
		downloadCalls: 1,
	},
	{
		name: "share fails and anchor unsupported: fallback",
		caps: { canShareFile: true, canAnchorDownload: false },
		share: () => Promise.reject(new Error("boom")),
		path: "share",
		outcome: { kind: "fallback" },
		shareCalls: 1,
		downloadCalls: 0,
	},
	{
		name: "neither route exists: fallback without trying anything",
		caps: { canShareFile: false, canAnchorDownload: false },
		path: "fallback",
		outcome: { kind: "fallback" },
		shareCalls: 0,
		downloadCalls: 0,
	},
	{
		name: "download throws: fallback",
		caps: { canShareFile: false, canAnchorDownload: true },
		download: () => {
			throw new Error("blocked");
		},
		path: "download",
		outcome: { kind: "fallback" },
		shareCalls: 0,
		downloadCalls: 1,
	},
];

describe("save flow", () => {
	it.each(rows)("$name", async (row) => {
		const share = vi.fn(row.share ?? (() => Promise.resolve()));
		const download = vi.fn(row.download ?? (() => undefined));
		const env: SaveEnv = { share, download };

		expect(chooseSavePath(row.caps)).toBe(row.path);
		const outcome = await runSave(FILE, row.caps, env);

		expect(outcome).toEqual(row.outcome);
		expect(share).toHaveBeenCalledTimes(row.shareCalls);
		expect(download).toHaveBeenCalledTimes(row.downloadCalls);
	});

	it("starts the share synchronously, before any await (the iOS gesture rule)", () => {
		const share = vi.fn(() => new Promise<void>(() => undefined));
		void runSave(FILE, { canShareFile: true, canAnchorDownload: true }, { share, download: vi.fn() });
		// No microtask has run yet: the call must already have happened.
		expect(share).toHaveBeenCalledTimes(1);
		expect(share).toHaveBeenCalledWith(FILE);
	});

	it("starts the download synchronously when sharing is unavailable", () => {
		const download = vi.fn();
		void runSave(FILE, { canShareFile: false, canAnchorDownload: true }, { share: vi.fn(), download });
		expect(download).toHaveBeenCalledTimes(1);
	});
});
