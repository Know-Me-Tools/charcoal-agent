import { KnowMeLockup } from "@/components/brand";
import { StatusBadge } from "@/components/common/status-badge";
import { useHealth } from "@/hooks/use-health";
import { ABOUT_CONTENT } from "../../content/site/about";

const UAR_BASE = (import.meta.env.VITE_UAR_BASE_URL as string | undefined) ?? "http://localhost:6565";

interface AboutRowProps {
	label: string;
	children: React.ReactNode;
}

/** One flat fact row: a label and its value, on the shared `bg-band` fill. */
function AboutRow({ label, children }: AboutRowProps) {
	return (
		<div className="grid gap-1 rounded-lg bg-band px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-4">
			<dt className="font-ui text-sm text-fg-secondary">{label}</dt>
			<dd className="min-w-0 break-all font-mono text-sm text-fg">{children}</dd>
		</div>
	);
}

export default function AboutPage() {
	const { data: health } = useHealth();

	return (
		<div className="max-w-xl">
			<span aria-hidden="true" className="block">
				<KnowMeLockup variant="nav" />
			</span>
			<h1 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] text-fg">
				{ABOUT_CONTENT.heading}
			</h1>
			<p className="mt-3 max-w-[60ch] font-body text-[0.9375rem] leading-[1.7] text-fg-secondary">
				{ABOUT_CONTENT.explanation}
			</p>

			<dl className="mt-8 space-y-2">
				<AboutRow label={ABOUT_CONTENT.rows.version}>{__APP_VERSION__}</AboutRow>
				<AboutRow label={ABOUT_CONTENT.rows.runtimeStatus}>
					<StatusBadge status={health?.status === "ok" ? "connected" : "disconnected"} />
				</AboutRow>
				<AboutRow label={ABOUT_CONTENT.rows.runtimeEndpoint}>{UAR_BASE}</AboutRow>
				<AboutRow label={ABOUT_CONTENT.rows.agent}>{ABOUT_CONTENT.agentValue}</AboutRow>
			</dl>

			<p className="mt-8 font-mono text-xs text-faint">{ABOUT_CONTENT.legalLine}</p>
		</div>
	);
}
