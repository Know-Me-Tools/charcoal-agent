import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

/** Shows the router's current path so a test can read where a chat start navigated. */
function LocationProbe() {
	return <p data-testid="path">{useLocation().pathname}</p>;
}

/** Renders `ui` at `initialPath` with a catch-all route that exposes the current path. */
export function renderWithRouter(ui: ReactElement, initialPath = "/") {
	return render(
		<MemoryRouter initialEntries={[initialPath]}>
			{ui}
			<Routes>
				<Route path="*" element={<LocationProbe />} />
			</Routes>
		</MemoryRouter>,
	);
}
