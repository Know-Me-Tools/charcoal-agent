import { cn } from "@/lib/utils";

/** Brand Guide v1.0 minimum size (favicon scale). */
const MIN_SIZE = 16;

interface KnowMeMarkProps {
  /** Rendered width/height in px; clamped to the 16px brand minimum. */
  size?: number;
  /** Accessible name. Omit when the mark sits beside visible "KnowMe" text. */
  label?: string;
  className?: string;
}

/**
 * The KnowMe "Conviction" monogram: a rounded K stem, two curved arms and the
 * ember node at the joint. The body follows `currentColor`; the node always
 * uses the ember token (the brand guide forbids recoloring it). No glow in UI
 * chrome.
 */
export function KnowMeMark({ size = 28, label, className }: KnowMeMarkProps) {
  const px = Math.max(MIN_SIZE, size);
  return (
    <svg
      viewBox="0 0 200 200"
      width={px}
      height={px}
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
    >
      <g transform="translate(50, 38)">
        <rect x="0" y="0" width="20" height="124" rx="10" fill="currentColor" />
        <path
          d="M 16,62 C 26,52 44,32 62,18 C 72,10 80,8 84,14 C 86,18 82,24 76,28 C 60,40 40,56 28,66 C 22,70 18,68 16,64 Z"
          fill="currentColor"
        />
        <path
          d="M 16,62 C 26,72 44,92 62,106 C 72,114 80,116 84,110 C 86,106 82,100 76,96 C 60,84 40,68 28,58 C 22,54 18,56 16,60 Z"
          fill="currentColor"
        />
        <circle cx="18" cy="62" r="10" fill="var(--km-ember)" />
      </g>
    </svg>
  );
}
