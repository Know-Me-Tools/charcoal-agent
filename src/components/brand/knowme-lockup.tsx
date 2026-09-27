import { cn } from "@/lib/utils";
import { KnowMeMark } from "./knowme-mark";
import { KnowMeWordmark } from "./knowme-wordmark";

/** Wordmark lockup spec (Wordmark System v1.0): icon px, type size, gap. */
const VARIANTS = {
  nav: { mark: 28, text: "text-lg", gap: "gap-2.5" },
  footer: { mark: 24, text: "text-base", gap: "gap-2" },
  hero: { mark: 56, text: "text-[2.25rem]", gap: "gap-4" },
} as const;

export type KnowMeLockupVariant = keyof typeof VARIANTS;

interface KnowMeLockupProps {
  variant?: KnowMeLockupVariant;
  className?: string;
}

/** Mark + wordmark with one accessible name, sized per the brand lockup spec. */
export function KnowMeLockup({ variant = "nav", className }: KnowMeLockupProps) {
  const v = VARIANTS[variant];
  return (
    <span
      role="img"
      aria-label="KnowMe"
      className={cn("inline-flex items-center text-fg", v.gap, className)}
    >
      <KnowMeMark size={v.mark} />
      <KnowMeWordmark decorative className={v.text} />
    </span>
  );
}
