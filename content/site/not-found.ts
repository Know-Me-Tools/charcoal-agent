export interface NotFoundContent {
	heading: string;
	body: string;
	ctaLabel: string;
}

export const NOT_FOUND_CONTENT: NotFoundContent = {
	heading: "Page not found",
	body: "The page you're looking for doesn't exist, or it moved.",
	ctaLabel: "Back to KnowMe",
};
