import { useUiStore } from "@/stores/ui-store"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * Distance the toaster clears from the top edge: the topbar's own height
 * (h-12 = 48px, `fixed` on mobile and `static`-but-still-first-in-a-
 * non-scrolling page on desktop — 48px at every breakpoint either way) plus
 * a comfortable margin.
 *
 * Toasts sit top-center, not near an edge, because the bottom of the
 * viewport is never a safe zone here: the composer is always sticky at the
 * bottom of the thread (`enhanced-thread.tsx`'s `ThreadPrimitive.
 * ViewportFooter`) and grows with a multi-line draft (up to `max-h-48`), and
 * below 768px the mobile bottom nav (`h-14`, `mobile-nav.tsx`) sits under
 * that too — a bottom-anchored offset would have to keep growing to stay
 * clear of both. The topbar's height is fixed and identical at every
 * breakpoint (320/768/1024/1440), so a single top offset clears it
 * everywhere without touching the composer or the nav at all. This also
 * matches the "quiet, non-blocking" notice from design decision 6
 * (chat-persistence-durability) and the KnowMe brand standard's guidance
 * that status is conveyed without sitting on top of the primary
 * interaction zone (docs/design/chat-surfaces.md's composer treatment).
 */
const TOAST_TOP_OFFSET = "4rem"

const Toaster = ({ ...props }: ToasterProps) => {
  // Follow the app's own theme store (the app does not use next-themes).
  const theme = useUiStore((s) => s.theme)

  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={{ top: TOAST_TOP_OFFSET }}
      mobileOffset={{ top: TOAST_TOP_OFFSET }}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        // Flat 2.0 (KnowMe UI/UX standard §3.3/§4.2): no border, no shadow,
        // no blur. Sonner's default "styled" chrome bakes a 1px border and
        // a box-shadow into its own stylesheet with no CSS-variable escape
        // hatch for either — `unstyled` is the only way to remove them
        // rather than fight a losing specificity battle with Tailwind
        // utility classes. Every surface and text colour below is a KnowMe
        // token, never a raw palette class or hex value.
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-lg bg-raised px-4 py-3 font-ui text-sm text-fg",
          title: "font-medium text-fg",
          description: "text-fg-secondary",
          icon: "mt-0.5 size-4 shrink-0 text-fg-secondary",
          actionButton:
            "rounded-md bg-primary px-3 py-1.5 font-ui text-xs font-semibold text-primary-foreground",
          cancelButton:
            "rounded-md bg-hover px-3 py-1.5 font-ui text-xs font-semibold text-fg-secondary",
          closeButton: "border-0 bg-transparent text-fg-secondary hover:text-fg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
