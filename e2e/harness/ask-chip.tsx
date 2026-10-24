/**
 * Browser-only harness for the ask chip (site-ask-concierge). No page mounts a
 * chip yet (the directory and product pages are later changes), so this page
 * does: one chip on a bare route, next to the app's real thread route, so a
 * click runs the real path (useStartChat -> intent store -> thread page ->
 * chat runtime -> mocked UAR). Served by the Vite dev server for Playwright;
 * not part of the production build (only index.html is built).
 */
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@/index.css";
import { AskChip } from "@/components/site/ask-chip";
import { DbProvider } from "@/lib/db/db-provider";
import { loadAppShell, loadThreadDetailPage } from "@/lib/route-chunks";

export const HARNESS_PROMPT = "What is The Boss, and how far along is it?";

const router = createBrowserRouter([
	{
		path: "/e2e/harness/ask-chip.html",
		element: (
			<main className="bg-canvas p-8">
				<AskChip prompt={HARNESS_PROMPT} />
			</main>
		),
	},
	{
		lazy: async () => ({ Component: (await loadAppShell()).default }),
		children: [
			{
				path: "/threads/:id",
				lazy: async () => ({ Component: (await loadThreadDetailPage()).default }),
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<DbProvider>
		<RouterProvider router={router} />
	</DbProvider>,
);
