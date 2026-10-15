import { useEffect } from "react";
import { getDbInstance } from "@/lib/db/pglite";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

/**
 * True when this browser's local database holds at least one saved (non-ephemeral)
 * conversation. The front page is outside the app shell, which is what normally
 * loads the stored threads, so this reads them once when the registry has not
 * been hydrated yet. A failed read counts as no history: the link just stays hidden.
 */
export function useHasSavedChats(): boolean {
	const hydrated = useThreadRegistryStore((s) => s.hydrated);
	const initFromDb = useThreadRegistryStore((s) => s.initFromDb);
	const hasSaved = useThreadRegistryStore((s) =>
		Object.values(s.threads).some((t) => !t.isEphemeral),
	);

	useEffect(() => {
		if (hydrated) return;
		let cancelled = false;
		try {
			getDbInstance()
				.getThreads()
				.then((threads) => {
					if (!cancelled) initFromDb(threads);
				})
				.catch(() => {});
		} catch {
			// Database not open (for example in a test): no history to show.
		}
		return () => {
			cancelled = true;
		};
	}, [hydrated, initFromDb]);

	return hasSaved;
}
