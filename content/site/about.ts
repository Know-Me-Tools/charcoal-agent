/**
 * Row labels for the About page's flat fact rows.
 */
export interface AboutRowLabels {
	version: string;
	runtimeStatus: string;
	runtimeEndpoint: string;
	agent: string;
}

export interface AboutContent {
	heading: string;
	/**
	 * D-004 explanation: KnowMe is the product; the KnowMe agent runs on a
	 * Universal Agent Runtime instance. Names both terms.
	 */
	explanation: string;
	rows: AboutRowLabels;
	/**
	 * The Agent row's value. Kept verbatim: e2e/brand.spec.ts asserts this
	 * exact string.
	 */
	agentValue: string;
	legalLine: string;
}

export const ABOUT_CONTENT: AboutContent = {
	heading: "About KnowMe",
	explanation:
		"KnowMe is the product you're using. It talks with you through the KnowMe agent, which runs on a Universal Agent Runtime instance.",
	rows: {
		version: "Version",
		runtimeStatus: "Runtime status",
		runtimeEndpoint: "Runtime endpoint",
		agent: "Agent",
	},
	agentValue: "KnowMe on the Universal Agent Runtime",
	legalLine: "© 2026 KnowMe AI, LLC",
};
