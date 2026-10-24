/**
 * The version line(s) of an entry, derived by the directory generator. Each
 * " · " segment is unbreakable so a line wraps between segments and never
 * inside a date (docs/design/product-directory.md section 2.4).
 */
export function VersionLines({ lines }: { lines: string[] }) {
	return (
		<>
			{lines.map((line) => (
				<span key={line} className="block font-mono text-xs leading-normal text-faint">
					{line.split(" · ").map((segment, index) => (
						<span key={segment}>
							{index > 0 && " · "}
							<span className="whitespace-nowrap">{segment}</span>
						</span>
					))}
				</span>
			))}
		</>
	);
}
