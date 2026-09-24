import { cn } from "@/lib/utils";

interface KnowMeWordmarkProps {
  className?: string;
  /** Hide from assistive tech when a parent (e.g. the lockup) already names it. */
  decorative?: boolean;
}

/**
 * "Know" + ember "Me" in Space Grotesk 700 with the brand's tight tracking.
 * Read as one word by assistive technology (not "Know Me").
 */
export function KnowMeWordmark({ className, decorative = false }: KnowMeWordmarkProps) {
  return (
    <span
      data-slot="knowme-wordmark"
      aria-label={decorative ? undefined : "KnowMe"}
      aria-hidden={decorative ? "true" : undefined}
      className={cn("font-display font-bold leading-none tracking-[-0.03em]", className)}
    >
      <span aria-hidden="true">Know</span>
      <span aria-hidden="true" className="text-ember">
        Me
      </span>
    </span>
  );
}
