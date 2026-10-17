/**
 * Zip writer for the bundle. Loaded with a dynamic `import()` so fflate costs
 * the landing and thread chunks nothing. Files are added one at a time and the
 * loop yields to the main thread whenever a slice has run longer than
 * `SLICE_MS`, so a few hundred conversations do not freeze the page. No network:
 * the library is part of the app bundle.
 */
import type { BundleFile } from "./okf-bundle";

/** Longest the loop runs before it lets the browser paint and handle input. */
export const SLICE_MS = 8;
/** Deflate level: a good ratio on text at modest cost. */
const LEVEL = 6;

export interface ZipOptions {
	/** Modification time written into every entry, so the same input gives the same zip. */
	mtime: Date;
	/** Called after each file with the number done and the total. */
	onProgress?: (done: number, total: number) => void;
}

const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The zip as bytes. Rejects if the library reports an error. */
export async function zipFiles(files: readonly BundleFile[], options: ZipOptions): Promise<Uint8Array<ArrayBuffer>> {
	const { Zip, ZipDeflate, strToU8 } = await import("fflate");
	const chunks: Uint8Array[] = [];
	let failure: Error | null = null;
	const zip = new Zip((error, chunk) => {
		if (error) failure = error;
		else chunks.push(chunk);
	});

	let sliceStart = performance.now();
	for (const [index, file] of files.entries()) {
		const entry = new ZipDeflate(file.path, { level: LEVEL });
		entry.mtime = options.mtime;
		zip.add(entry);
		entry.push(strToU8(file.content), true);
		if (failure) throw failure;
		options.onProgress?.(index + 1, files.length);
		if (performance.now() - sliceStart >= SLICE_MS) {
			await nextTask();
			sliceStart = performance.now();
		}
	}
	zip.end();
	if (failure) throw failure;

	const size = chunks.reduce((sum, c) => sum + c.length, 0);
	const out = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.length;
	}
	return out;
}
